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
export const paymentStatuses = [
  "pending",
  "verified",
  "failed",
  "refunded",
] as const;
export const deliveryStatuses = [
  "pending",
  "processing",
  "packed",
  "dispatched",
  "in_transit",
  "delivered",
  "failed",
  "returned",
] as const;
export const proofReceivedStatuses = ["No", "Yes", "Requested"] as const;
export const orderSources = ["Website", "Facebook", "Manual", "Other"] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentType = (typeof paymentTypes)[number];
export type PaymentVerificationStatus =
  (typeof paymentVerificationStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
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
  | "visualTheme"
  | "visualVariant"
  | "stockStatus"
  | "size"
  | "color"
  | "absorbency"
  | "variant"
  | "quantity"
> & {
  image?: string | null;
  sku?: string;
  lineTotal?: number;
};

export type OrderTotals = {
  totalItems: number;
  subtotal: number;
};

export type OrderRecord = {
  orderId: string;
  orderReference: string;
  customerId?: string;
  customer: OrderCustomer;
  paymentDetails: OrderPaymentDetails;
  items: OrderCartItem[];
  totals: OrderTotals;
  totalAmount: number;
  discountAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  refundedAmount?: number;
  currencyCode?: string;
  paymentVerifiedAt?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  courierName?: string;
  trackingId?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryNote?: string;
  customerConfirmationNote?: string;
  paymentStatus?: PaymentStatus;
  paymentVerificationStatus?: PaymentVerificationStatus;
  paymentReference?: string;
  paymentNote?: string;
  refundExchangeRequest?: string;
  sizeIssueReport?: string;
  proofReceived?: ProofReceivedStatus;
  adminInternalNote?: string;
  orderSource?: OrderSource;
  assignedStaff?: string;
  isTestOrder?: boolean;
  archivedAt?: string;
  deletedAt?: string;
  softDeletedAt?: string;
  cancelledReason?: string;
};

export type OrderNoteType = "internal" | "customer" | "delivery" | "payment";

export type OrderNoteRecord = {
  id: string;
  orderReference: string;
  noteBody: string;
  noteType: OrderNoteType;
  createdByAdminId?: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type OrderEventType =
  | "order_created"
  | "status_changed"
  | "order_confirmed"
  | "cancellation_requested"
  | "order_cancelled"
  | "courier_assigned"
  | "out_for_delivery"
  | "delivered"
  | "refund_initiated"
  | "refunded"
  | "note_added"
  | "invoice_issued";

export type OrderEventRecord = {
  id: string;
  orderReference: string;
  eventType: OrderEventType;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  reason?: string;
  metadata: Record<string, unknown>;
  actorAdminId?: string;
  actorName: string;
  createdAt: string;
};

export type OrderInvoiceStatus = "issued" | "void";

export type OrderInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  orderReference: string;
  status: OrderInvoiceStatus;
  issuedAt: string;
  issuedBy?: string;
  subtotalAmount: number;
  discountAmount: number;
  deliveryAmount: number;
  totalAmount: number;
  currencyCode: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
};

export type OrderOperationsUpdate = Partial<
  Pick<
    OrderRecord,
    | "status"
    | "courierName"
    | "trackingId"
    | "deliveryStatus"
    | "deliveryCharge"
    | "deliveryArea"
    | "deliveryZone"
    | "deliveryNote"
    | "customerConfirmationNote"
    | "paymentStatus"
    | "paymentReference"
    | "paymentNote"
    | "paymentVerificationStatus"
    | "refundExchangeRequest"
    | "sizeIssueReport"
    | "proofReceived"
    | "adminInternalNote"
    | "orderSource"
    | "assignedStaff"
    | "isTestOrder"
    | "archivedAt"
    | "deletedAt"
    | "softDeletedAt"
    | "cancelledReason"
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
