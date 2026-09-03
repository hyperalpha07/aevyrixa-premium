import type { OrderStatus } from "@/app/lib/order-types";

export function validNextAdminV2OrderStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "Pending") return ["Confirmed", "Cancelled"];
  if (status === "Confirmed") return ["Shipped", "Pending", "Cancelled"];
  if (status === "Shipped") return ["Delivered", "Confirmed", "Cancelled"];
  if (status === "Delivered") return ["Shipped"];
  return [];
}

export function isSensitiveAdminV2OrderTransition(current: OrderStatus, next: OrderStatus) {
  if (next === "Cancelled") return true;
  if (current === "Delivered" && next !== "Delivered") return true;
  if (current === "Shipped" && next === "Pending") return true;
  return false;
}
