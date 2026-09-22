import type { AccountOrder } from "@/app/account/_shared/account-types";

export type OrderFilter = "all" | "pending" | "delivered" | "other";
export const ORDERS_PER_PAGE = 5;

export function orderGroup(order: Pick<AccountOrder, "status" | "deliveryStatus">): Exclude<OrderFilter, "all"> {
  const status = order.status.trim().toLowerCase();
  const delivery = order.deliveryStatus?.trim().toLowerCase() ?? "";
  if (/(cancel|fail|return|refund)/.test(`${status} ${delivery}`)) return "other";
  if (status.includes("deliver") || delivery.includes("deliver")) return "delivered";
  if (status.includes("pending")) return "pending";
  return "other";
}

export function filterOrders<T extends Pick<AccountOrder, "status" | "deliveryStatus">>(orders: T[], filter: OrderFilter): T[] {
  return filter === "all" ? orders : orders.filter((order) => orderGroup(order) === filter);
}

export function paginateOrders<T>(orders: T[], page: number, pageSize = ORDERS_PER_PAGE) {
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  return { items: orders.slice((currentPage - 1) * pageSize, currentPage * pageSize), currentPage, pageCount };
}

export function paginationNumbers(currentPage: number, pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1);
}

export function firstOrderImage(items: Pick<AccountOrder["items"][number], "image">[]): string | null {
  return items[0]?.image ?? null;
}
