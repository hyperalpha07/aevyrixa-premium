import { SITE_CURRENCY } from "@/app/lib/currency";
import type { OrderRecord } from "@/app/lib/order-types";
import {
  calculateAdminV2PayableTotal,
  hasAdminV2TotalMismatch,
} from "@/lib/admin-v2/orders/order-financials";
import { formatAdminV2Money } from "@/lib/admin-v2/finance/money";

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
  calculatedPayable: number | null;
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
  const calculatedPayable = calculateAdminV2PayableTotal({ subtotal, discount, deliveryCharge });

  let total = storedTotal ?? calculatedPayable;
  let discrepancy: string | null = null;

  if (
    subtotal !== null &&
    storedTotal !== null &&
    calculatedPayable !== null &&
    hasAdminV2TotalMismatch(storedTotal, calculatedPayable)
  ) {
    discrepancy =
      "Stored order total differs from the arithmetic payable calculation. Admin V2 keeps both values separate for audit instead of substituting one for the other.";
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
    calculatedPayable,
    discrepancy,
  };
}

export function formatAdminV2Amount(value: number | null | undefined) {
  return formatAdminV2Money(value);
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
    calculatedPayable: amounts.calculatedPayable,
  });
}
