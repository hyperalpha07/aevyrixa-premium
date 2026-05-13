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

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentType = (typeof paymentTypes)[number];

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
  | "size"
  | "color"
  | "absorbency"
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
};

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
