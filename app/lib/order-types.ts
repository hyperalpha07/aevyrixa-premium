import type { CartItem } from "@/app/components/cart/cart-context";
import type { WalletProvider } from "@/app/lib/admin-settings";

export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export const paymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const;

export const paymentTypes = ["Send Money", "Merchant Payment", "Cash Out"] as const;
export const paymentVerificationStatuses = [
  "Pending",
  "Verified",
  "Failed",
  "Not Required",
] as const;
export const proofReceivedStatuses = ["No", "Yes", "Requested"] as const;
export const orderSources = ["Website", "Facebook", "Manual", "Other"] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentType = (typeof paymentTypes)[number];
export type PaymentVerificationStatus =
  (typeof paymentVerificationStatuses)[number];
export type ProofReceivedStatus = (typeof proofReceivedStatuses)[number];
export type OrderSource = (typeof orderSources)[number];

export type OrderCustomer = {
  fullName: string;
  phone: string;
  email?: string;
  cityArea: string;
  address: string;
  sizeFitNote?: string;
  deliveryNote?: string;
};

export type OrderPaymentDetails = {
  paymentMethod: PaymentMethod;
  walletProvider?: WalletProvider;
  paymentType?: PaymentType;
  receiverNumber?: string;
  walletSenderNumber?: string;
  transactionReference?: string;
};

export type OrderCartItem = Pick<
  CartItem,
  | "id"
  | "productId"
  | "slug"
  | "name"
  | "price"
  | "image"
  | "visualTheme"
  | "visualVariant"
  | "stockStatus"
  | "size"
  | "color"
  | "absorbency"
  | "variant"
  | "quantity"
>;

export type OrderTotals = {
  totalItems: number;
  subtotal: number;
};

export type OrderRecord = {
  orderId: string;
  orderReference: string;
  customer: OrderCustomer;
  paymentDetails: OrderPaymentDetails;
  items: OrderCartItem[];
  totals: OrderTotals;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  courierName?: string;
  trackingId?: string;
  deliveryCharge?: number;
  customerConfirmationNote?: string;
  paymentVerificationStatus?: PaymentVerificationStatus;
  refundExchangeRequest?: string;
  sizeIssueReport?: string;
  proofReceived?: ProofReceivedStatus;
  adminInternalNote?: string;
  orderSource?: OrderSource;
  assignedStaff?: string;
};

export type OrderOperationsUpdate = Partial<
  Pick<
    OrderRecord,
    | "status"
    | "courierName"
    | "trackingId"
    | "deliveryCharge"
    | "customerConfirmationNote"
    | "paymentVerificationStatus"
    | "refundExchangeRequest"
    | "sizeIssueReport"
    | "proofReceived"
    | "adminInternalNote"
    | "orderSource"
    | "assignedStaff"
  >
>;

export type OrderSubmissionInput = Omit<
  OrderRecord,
  "orderId" | "orderReference" | "status" | "createdAt" | "totalAmount"
> & {
  orderReference?: string;
};

export type OrderStorageMode = "supabase" | "demo-memory";

export type OrderSaveResult = {
  order: OrderRecord;
  storageMode: OrderStorageMode;
};
