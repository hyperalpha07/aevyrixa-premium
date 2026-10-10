type OrderRow = {
  order_ref?: string;
  subtotal?: number | string | null;
  total?: number | string | null;
  delivery_charge?: number | string | null;
  discount_amount?: number | string | null;
  paid_amount?: number | string | null;
  due_amount?: number | string | null;
  refunded_amount?: number | string | null;
  currency_code?: string | null;
};

type LedgerSummary = {
  order_ref?: string | null;
  amount?: number | string | null;
  currency_code?: string | null;
  status?: string | null;
};

function amount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function calculatePayable(input: { subtotal: number | null; discount: number | null; deliveryCharge: number | null }) {
  if (input.subtotal === null) return null;
  return Math.max(0, input.subtotal - (input.discount ?? 0) + (input.deliveryCharge ?? 0));
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function main() {
  const base = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(
    `${base}/rest/v1/orders?select=order_ref,subtotal,total,delivery_charge,discount_amount,paid_amount,due_amount,refunded_amount,currency_code&order=created_at.desc&limit=1000`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase read failed with ${response.status}: ${await response.text()}`);
  }

  const rows = (await response.json()) as OrderRow[];
  const [paymentResponse, refundResponse] = await Promise.all([
    fetch(`${base}/rest/v1/finance_payment_transactions?select=order_ref,amount,currency_code,status&status=eq.recorded&limit=10000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }),
    fetch(`${base}/rest/v1/finance_refunds?select=order_ref,amount,currency_code,status&status=eq.recorded&limit=10000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }),
  ]);

  if (!paymentResponse.ok) {
    throw new Error(`Payment ledger read failed with ${paymentResponse.status}: ${await paymentResponse.text()}`);
  }
  if (!refundResponse.ok) {
    throw new Error(`Refund ledger read failed with ${refundResponse.status}: ${await refundResponse.text()}`);
  }

  const payments = (await paymentResponse.json()) as LedgerSummary[];
  const refunds = (await refundResponse.json()) as LedgerSummary[];
  const orderRefs = new Set(rows.map((row) => row.order_ref ?? "").filter(Boolean));
  const paymentTotals = new Map<string, number>();
  const refundTotals = new Map<string, number>();
  const ledgerCurrencies = new Map<string, Set<string>>();
  for (const row of payments) {
    const orderRef = row.order_ref ?? "";
    paymentTotals.set(orderRef, (paymentTotals.get(orderRef) ?? 0) + (amount(row.amount) ?? 0));
    if (row.currency_code) {
      const currencies = ledgerCurrencies.get(orderRef) ?? new Set<string>();
      currencies.add(row.currency_code);
      ledgerCurrencies.set(orderRef, currencies);
    }
  }
  for (const row of refunds) {
    const orderRef = row.order_ref ?? "";
    refundTotals.set(orderRef, (refundTotals.get(orderRef) ?? 0) + (amount(row.amount) ?? 0));
    if (row.currency_code) {
      const currencies = ledgerCurrencies.get(orderRef) ?? new Set<string>();
      currencies.add(row.currency_code);
      ledgerCurrencies.set(orderRef, currencies);
    }
  }

  const report = rows
    .map((row) => {
      const subtotal = amount(row.subtotal);
      const storedTotal = amount(row.total);
      const calculatedPayable = calculatePayable({
        subtotal,
        discount: amount(row.discount_amount),
        deliveryCharge: amount(row.delivery_charge),
      });
      const missingFields = [
        row.discount_amount == null ? "discount_amount" : "",
        row.paid_amount == null ? "paid_amount" : "",
        row.due_amount == null ? "due_amount" : "",
        row.refunded_amount == null ? "refunded_amount" : "",
        row.currency_code == null ? "currency_code" : "",
      ].filter(Boolean);
      const difference =
        storedTotal !== null && calculatedPayable !== null
          ? Number((storedTotal - calculatedPayable).toFixed(2))
          : null;
      const paymentLedger = paymentTotals.get(row.order_ref ?? "") ?? 0;
      const refundLedger = refundTotals.get(row.order_ref ?? "") ?? 0;
      const paidSnapshot = amount(row.paid_amount);
      const refundSnapshot = amount(row.refunded_amount);
      const paidLedgerDifference =
        paidSnapshot !== null ? Number((paidSnapshot - paymentLedger).toFixed(2)) : null;
      const refundLedgerDifference =
        refundSnapshot !== null ? Number((refundSnapshot - refundLedger).toFixed(2)) : null;
      const orderCurrencies = ledgerCurrencies.get(row.order_ref ?? "") ?? new Set<string>();
      if (row.currency_code) orderCurrencies.add(row.currency_code);
      const mixedCurrencies = orderCurrencies.size > 1;
      const refundExceedsPayment = refundLedger > paymentLedger + 0.01;

      return {
        order_ref: row.order_ref ?? "",
        stored_total: storedTotal,
        calculated_payable: calculatedPayable,
        difference,
        paid_snapshot: paidSnapshot,
        payment_ledger: paymentLedger,
        paid_ledger_difference: paidLedgerDifference,
        refund_snapshot: refundSnapshot,
        refund_ledger: refundLedger,
        refund_ledger_difference: refundLedgerDifference,
        refund_exceeds_payment: refundExceedsPayment ? "yes" : "",
        mixed_currencies: mixedCurrencies ? Array.from(orderCurrencies).join("|") : "",
        missing_fields: missingFields.join("|"),
      };
    })
    .filter((row) => row.difference !== 0 || row.paid_ledger_difference !== 0 || row.refund_ledger_difference !== 0 || row.refund_exceeds_payment || row.mixed_currencies || row.missing_fields);

  const orphanFinanceRefs = [...payments.map((row) => ({ kind: "payment", row })), ...refunds.map((row) => ({ kind: "refund", row }))]
    .filter((entry) => !orderRefs.has(entry.row.order_ref ?? ""))
    .map((entry) => ({
      order_ref: entry.row.order_ref ?? "",
      issue: `orphan_${entry.kind}_finance_reference`,
      amount: amount(entry.row.amount),
      currency_code: entry.row.currency_code ?? "",
    }));

  console.table(report);
  if (orphanFinanceRefs.length) console.table(orphanFinanceRefs);
  console.log(`Read-only audit complete. Checked ${rows.length} orders, ${payments.length} active payment rows, and ${refunds.length} active refund rows. Flagged ${report.length + orphanFinanceRefs.length}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
