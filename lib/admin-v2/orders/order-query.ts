type DeliveryStatus = "pending" | "processing" | "packed" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";
type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
type PaymentMethod = "Cash on Delivery" | "Mobile Wallet Payment" | "Bank Transfer";
type PaymentStatus = "pending" | "verified" | "failed" | "refunded";

const deliveryStatuses = ["pending", "processing", "packed", "dispatched", "in_transit", "delivered", "failed", "returned"] as const;
const orderStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;
const paymentMethods = ["Cash on Delivery", "Mobile Wallet Payment", "Bank Transfer"] as const;
const paymentStatuses = ["pending", "verified", "failed", "refunded"] as const;

export const adminV2OrderSorts = ["newest", "oldest", "highest", "lowest"] as const;
export type AdminV2OrderSort = (typeof adminV2OrderSorts)[number];

export type AdminV2OrderQuery = {
  q: string;
  status: OrderStatus | "all";
  payment: PaymentMethod | "all";
  paymentStatus: PaymentStatus | "all";
  delivery: DeliveryStatus | "all";
  from: string;
  to: string;
  sort: AdminV2OrderSort;
  page: number;
  pageSize: number;
};

export type AdminV2OrderQueryResult<T> = {
  rows: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  appliedFilters: AdminV2OrderQuery;
};

const maxPageSize = 50;
const defaultPageSize = 10;

function oneOf<T extends readonly string[]>(value: string | null, values: T, fallback: T[number] | "all") {
  if (!value || value === "all") return fallback;
  return values.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function cleanDate(value: string | null) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseAdminV2OrderQuery(searchParams: URLSearchParams): AdminV2OrderQuery {
  const pageSize = Math.min(
    maxPageSize,
    positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize)
  );
  const sort = oneOf(searchParams.get("sort"), adminV2OrderSorts, "newest") as AdminV2OrderSort;

  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    status: oneOf(searchParams.get("status"), orderStatuses, "all") as OrderStatus | "all",
    payment: oneOf(searchParams.get("payment"), paymentMethods, "all") as PaymentMethod | "all",
    paymentStatus: oneOf(searchParams.get("paymentStatus"), paymentStatuses, "all") as PaymentStatus | "all",
    delivery: oneOf(searchParams.get("delivery"), deliveryStatuses, "all") as DeliveryStatus | "all",
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    sort,
    page: positiveInt(searchParams.get("page"), 1),
    pageSize,
  };
}

export function adminV2OrderTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}
