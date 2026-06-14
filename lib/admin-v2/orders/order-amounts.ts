import { SITE_CURRENCY, formatCurrency } from "@/app/lib/currency";
import type { OrderRecord } from "@/app/lib/order-types";

export type AdminV2OrderAmounts = {
  subtotal: number | null;
  discount: number | null;
  deliveryCharge: number | null;
  total: number | null;
  paidAmount: number | null;
  dueAmount: number | null;
  refundAmount: number | null;
  currency: string;
  storedTotal: number | null;
  discrepancy: string | null;
};

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanAmount(value: unknown) {
  const amount = finiteNumber(value);
  return amount === null ? null : Math.max(0, amount);
}

function isClose(a: number, b: number) {
  return Math.abs(a - b) <= 1;
}

export function getAdminV2OrderAmounts(order: OrderRecord): AdminV2OrderAmounts {
  const subtotal = cleanAmount(order.totals?.subtotal);
  const deliveryCharge = cleanAmount(order.deliveryCharge);
  const storedTotal = cleanAmount(order.totalAmount);
  const discount = null;
  const checkoutTotal =
    subtotal === null ? storedTotal : subtotal + (deliveryCharge ?? 0);

  let total = storedTotal;
  let discrepancy: string | null = null;

  if (
    subtotal !== null &&
    storedTotal !== null &&
    checkoutTotal !== null &&
    !isClose(checkoutTotal, storedTotal)
  ) {
    discrepancy =
      "Stored order total differs from checkout payable calculation. Admin V2 displays checkout payable while preserving the stored total for audit.";
    total = checkoutTotal;
  } else if (total === null) {
    total = checkoutTotal;
  }

  const paidAmount = order.paymentStatus === "verified" ? total : null;
  const dueAmount =
    total !== null && paidAmount !== null ? Math.max(0, total - paidAmount) : null;
  const refundAmount = order.paymentStatus === "refunded" ? total : null;

  return {
    subtotal,
    discount,
    deliveryCharge,
    total,
    paidAmount,
    dueAmount,
    refundAmount,
    currency: SITE_CURRENCY,
    storedTotal,
    discrepancy,
  };
}

export function formatAdminV2Amount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? formatCurrency(value)
    : "Not provided";
}

export function warnAdminV2OrderAmountDiscrepancy(order: OrderRecord) {
  if (process.env.NODE_ENV === "production") return;

  const amounts = getAdminV2OrderAmounts(order);
  if (!amounts.discrepancy) return;

  console.warn("[admin-v2:orders] amount discrepancy", {
    orderReference: order.orderReference,
    subtotal: amounts.subtotal,
    deliveryCharge: amounts.deliveryCharge,
    storedTotal: amounts.storedTotal,
    calculatedTotal: amounts.total,
  });
}
