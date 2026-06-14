import type {
  DeliveryStatus,
  OrderCartItem,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
} from "@/app/lib/order-types";
import { getAdminV2OrderAmounts } from "@/lib/admin-v2/orders/order-amounts";
import {
  isSensitiveAdminV2OrderTransition,
  validNextAdminV2OrderStatuses,
} from "@/lib/admin-v2/orders/order-status-transitions";

export const orderSortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Highest total", value: "highest" },
  { label: "Lowest total", value: "lowest" },
] as const;

export type AdminV2OrderSort = (typeof orderSortOptions)[number]["value"];

export type AdminV2OrderFilters = {
  q: string;
  status: string;
  payment: string;
  paymentStatus: string;
  delivery: string;
  from: string;
  to: string;
  sort: AdminV2OrderSort;
};

export const emptyOrderFilters: AdminV2OrderFilters = {
  q: "",
  status: "all",
  payment: "all",
  paymentStatus: "all",
  delivery: "all",
  from: "",
  to: "",
  sort: "newest",
};

export function formatDateTime(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function formatDateOnly(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function itemVariant(item: OrderCartItem) {
  return item.variant || item.absorbency || "";
}

export function itemCount(order: OrderRecord) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function statusLabel(value?: string) {
  if (!value) return "Not provided";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isCancelled(order: OrderRecord) {
  return order.status === "Cancelled";
}

export function summaryForOrders(orders: OrderRecord[]) {
  return {
    total: orders.length,
    pending: orders.filter((order) => order.status === "Pending").length,
    processing: orders.filter((order) => order.status === "Confirmed" || order.status === "Shipped").length,
    delivered: orders.filter((order) => order.status === "Delivered").length,
    cancelled: orders.filter((order) => order.status === "Cancelled").length,
    revenue: orders
      .filter((order) => !isCancelled(order) && !order.isTestOrder)
      .reduce((sum, order) => sum + (getAdminV2OrderAmounts(order).total ?? 0), 0),
  };
}

export function filterOrders(orders: OrderRecord[], filters: AdminV2OrderFilters) {
  const q = filters.q.trim().toLowerCase();
  const fromTime = filters.from ? new Date(`${filters.from}T00:00:00.000Z`).getTime() : null;
  const toTime = filters.to ? new Date(`${filters.to}T23:59:59.999Z`).getTime() : null;

  const filtered = orders.filter((order) => {
    const created = order.createdAt ? new Date(order.createdAt).getTime() : Number.NaN;
    const searchable = [
      order.orderReference,
      order.orderId,
      order.customer.fullName,
      order.customer.phone,
      order.customer.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (q && !searchable.includes(q)) return false;
    if (filters.status !== "all" && order.status !== filters.status) return false;
    if (filters.payment !== "all" && order.paymentDetails.paymentMethod !== filters.payment) return false;
    if (filters.paymentStatus !== "all" && (order.paymentStatus ?? "") !== filters.paymentStatus) return false;
    if (filters.delivery !== "all" && (order.deliveryStatus ?? "") !== filters.delivery) return false;
    if (fromTime !== null && (Number.isNaN(created) || created < fromTime)) return false;
    if (toTime !== null && (Number.isNaN(created) || created > toTime)) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "highest") return (getAdminV2OrderAmounts(b).total ?? 0) - (getAdminV2OrderAmounts(a).total ?? 0);
    if (filters.sort === "lowest") return (getAdminV2OrderAmounts(a).total ?? 0) - (getAdminV2OrderAmounts(b).total ?? 0);
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return filters.sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
}

export function activeFilterCount(filters: AdminV2OrderFilters) {
  return [
    filters.q,
    filters.status !== "all" ? filters.status : "",
    filters.payment !== "all" ? filters.payment : "",
    filters.paymentStatus !== "all" ? filters.paymentStatus : "",
    filters.delivery !== "all" ? filters.delivery : "",
    filters.from,
    filters.to,
    filters.sort !== "newest" ? filters.sort : "",
  ].filter(Boolean).length;
}

export function orderCsvRows(orders: OrderRecord[], includePii: boolean) {
  const headers = [
    "order_reference",
    "created_at",
    "order_status",
    "payment_method",
    "payment_status",
    "delivery_status",
    "items",
    "subtotal",
    "delivery_charge",
    "total",
    ...(includePii ? ["customer_name", "customer_phone", "customer_email", "delivery_address"] : []),
  ];

  const rows = orders.map((order) => [
    order.orderReference,
    order.createdAt,
    order.status,
    order.paymentDetails.paymentMethod,
    order.paymentStatus ?? "",
    order.deliveryStatus ?? "",
    String(itemCount(order)),
    String(getAdminV2OrderAmounts(order).subtotal ?? ""),
    String(getAdminV2OrderAmounts(order).deliveryCharge ?? ""),
    String(getAdminV2OrderAmounts(order).total ?? ""),
    ...(includePii
      ? [
          order.customer.fullName,
          order.customer.phone,
          order.customer.email ?? "",
          order.customer.address,
        ]
      : []),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export type StatusChipKind = OrderStatus | PaymentStatus | DeliveryStatus | "Not provided" | string;

export function validNextOrderStatuses(status: OrderStatus): OrderStatus[] {
  return validNextAdminV2OrderStatuses(status);
}

export function isSensitiveOrderTransition(current: OrderStatus, next: OrderStatus) {
  return isSensitiveAdminV2OrderTransition(current, next);
}
