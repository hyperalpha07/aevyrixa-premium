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

      return {
        order_ref: row.order_ref ?? "",
        stored_total: storedTotal,
        calculated_payable: calculatedPayable,
        difference,
        missing_fields: missingFields.join("|"),
      };
    })
    .filter((row) => row.difference !== 0 || row.missing_fields);

  console.table(report);
  console.log(`Read-only audit complete. Checked ${rows.length} orders. Flagged ${report.length}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
