import type { OrderEventType, OrderStatus } from "@/app/lib/order-types";

export function eventTypeForStatusChange(toStatus: OrderStatus): OrderEventType {
  if (toStatus === "Confirmed") return "order_confirmed";
  if (toStatus === "Cancelled") return "order_cancelled";
  if (toStatus === "Shipped") return "out_for_delivery";
  if (toStatus === "Delivered") return "delivered";
  return "status_changed";
}

export function sanitizeOrderEventMetadata(metadata: Record<string, unknown> = {}) {
  const blocked = new Set(["password", "token", "secret", "authorization", "SUPABASE_SERVICE_ROLE_KEY"]);
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blocked.has(key) && !key.toLowerCase().includes("secret"))
  );
}
