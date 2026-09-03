import { SITE_CURRENCY, formatCurrency } from "@/app/lib/currency";
import type { OrderRecord } from "@/app/lib/order-types";
import {
  calculateAdminV2PayableTotal,
  hasAdminV2TotalMismatch,
} from "@/lib/admin-v2/orders/order-financials";

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

export function getAdminV2OrderAmounts(order: OrderRecord): AdminV2OrderAmounts {
  const subtotal = cleanAmount(order.totals?.subtotal);
  const deliveryCharge = cleanAmount(order.deliveryCharge);
  const storedTotal = cleanAmount(order.totalAmount);
  const discount = cleanAmount(order.discountAmount) ?? 0;
  const checkoutTotal =
    calculateAdminV2PayableTotal({ subtotal, discount, deliveryCharge }) ?? storedTotal;

  let total = storedTotal;
  let discrepancy: string | null = null;

  if (
    subtotal !== null &&
    storedTotal !== null &&
    checkoutTotal !== null &&
    hasAdminV2TotalMismatch(storedTotal, checkoutTotal)
  ) {
    discrepancy =
      "Stored order total differs from checkout payable calculation. Admin V2 displays checkout payable while preserving the stored total for audit.";
    total = checkoutTotal;
  } else if (total === null) {
    total = checkoutTotal;
  }

  const paidAmount = cleanAmount(order.paidAmount);
  const dueAmount = cleanAmount(order.dueAmount);
  const refundAmount = cleanAmount(order.refundedAmount);

  return {
    subtotal,
    discount,
    deliveryCharge,
    total,
    paidAmount,
    dueAmount,
    refundAmount,
    currency: order.currencyCode || SITE_CURRENCY,
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
