import type { OrderRecord } from "@/app/lib/order-types";

export type AdminV2PaymentLabels = {
  method: string;
  status: string;
  verification: string;
  provider: string;
  transactionReference: string;
  paidAmount: number | null;
  dueAmount: number | null;
};

const missing = "Not provided";

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readableStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getAdminV2PaymentLabels(order: OrderRecord): AdminV2PaymentLabels {
  const method = cleanText(order.paymentDetails.paymentMethod) ?? missing;
  const isCod = method === "Cash on Delivery";
  const paymentStatus = cleanText(order.paymentStatus);

  return {
    method,
    status: paymentStatus ? readableStatus(paymentStatus) : isCod ? "Pay on Delivery" : missing,
    verification: cleanText(order.paymentVerificationStatus) ?? missing,
    provider: cleanText(order.paymentDetails.walletProvider) ?? missing,
    transactionReference:
      cleanText(order.paymentReference) ??
      cleanText(order.paymentDetails.transactionReference) ??
      missing,
    paidAmount: null,
    dueAmount: null,
  };
}
