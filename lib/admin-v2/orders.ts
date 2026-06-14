import { getOrderByReference, listOrders } from "@/app/lib/order-store";
import type { OrderRecord } from "@/app/lib/order-types";

export type AdminV2OrdersPayload = {
  orders: OrderRecord[];
  storageMode: string;
  available: boolean;
  limitation: string | null;
};

export function isVisibleRealOrder(order: OrderRecord) {
  return !order.archivedAt && !order.deletedAt && !order.softDeletedAt;
}

export async function getAdminV2Orders(): Promise<AdminV2OrdersPayload> {
  try {
    const result = await listOrders();
    const available = result.storageMode === "supabase";

    return {
      orders: available ? result.orders.filter(isVisibleRealOrder) : [],
      storageMode: result.storageMode,
      available,
      limitation: available
        ? "The current backend returns the latest Supabase orders without server-side pagination or filters."
        : "Supabase order storage is not configured. Demo-memory orders are intentionally hidden in Admin V2.",
    };
  } catch {
    return {
      orders: [],
      storageMode: "unavailable",
      available: false,
      limitation: "The existing order backend could not load orders. Admin V2 is showing no fallback or demo orders.",
    };
  }
}

export async function getAdminV2Order(orderRef: string) {
  try {
    const result = await getOrderByReference(orderRef);
    const available = result.storageMode === "supabase";
    const order = available && result.order && isVisibleRealOrder(result.order) ? result.order : null;

    return {
      order,
      storageMode: result.storageMode,
      available,
    };
  } catch {
    return {
      order: null,
      storageMode: "unavailable",
      available: false,
    };
  }
}
