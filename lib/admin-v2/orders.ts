import { getOrderByReference, queryOrders } from "@/app/lib/order-store";
import { parseAdminV2OrderQuery, type AdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";
import type { OrderRecord } from "@/app/lib/order-types";

export type AdminV2OrdersPayload = {
  orders: OrderRecord[];
  storageMode: string;
  available: boolean;
  limitation: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  appliedFilters: AdminV2OrderQuery;
};

export function isVisibleRealOrder(order: OrderRecord) {
  return !order.archivedAt && !order.deletedAt && !order.softDeletedAt;
}

export async function getAdminV2Orders(searchParams = new URLSearchParams()): Promise<AdminV2OrdersPayload> {
  const query = parseAdminV2OrderQuery(searchParams);

  try {
    const result = await queryOrders(query);
    const available = result.storageMode === "supabase";

    return {
      orders: available ? result.rows.filter(isVisibleRealOrder) : [],
      storageMode: result.storageMode,
      available,
      limitation: available
        ? null
        : "Supabase order storage is not configured. Demo-memory orders are intentionally hidden in Admin V2.",
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      appliedFilters: result.appliedFilters,
    };
  } catch {
    return {
      orders: [],
      storageMode: "unavailable",
      available: false,
      limitation: "The existing order backend could not load orders. Admin V2 is showing no fallback or demo orders.",
      totalCount: 0,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 1,
      appliedFilters: query,
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
