import { getOrderByReference, OrderStoreError, queryOrders } from "@/app/lib/order-store";
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

function logOrderLoadError(error: unknown, operation: string) {
  if (error instanceof OrderStoreError) {
    console.error("[admin-v2:orders] backend load failed", {
      operation: error.operation || operation,
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return;
  }

  console.error("[admin-v2:orders] backend load failed", {
    operation,
    code: "ORDER_BACKEND_UNKNOWN",
    message: error instanceof Error ? error.message : "Unknown order backend error.",
  });
}

function limitationForError(error: unknown) {
  if (error instanceof OrderStoreError) {
    if (error.status === 401 || error.status === 403) {
      return "The Supabase order backend rejected the server credential. Verify the service-role credential and table permissions.";
    }

    if (error.code === "42703") {
      return "The Supabase order query references a column that does not exist in the current orders schema.";
    }

    return `The Supabase order query failed (${error.code}). Check server logs for safe backend details.`;
  }

  return "The existing order backend could not load orders. Admin V2 is showing no fallback or demo orders.";
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
  } catch (error) {
    logOrderLoadError(error, "admin orders list");

    return {
      orders: [],
      storageMode: "unavailable",
      available: false,
      limitation: limitationForError(error),
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
  } catch (error) {
    logOrderLoadError(error, "admin order detail");

    return {
      order: null,
      storageMode: "unavailable",
      available: false,
    };
  }
}
