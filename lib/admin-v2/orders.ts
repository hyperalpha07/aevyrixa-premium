import { getOrderByReference, OrderStoreError, queryOrders } from "@/app/lib/order-store";
import { parseAdminV2OrderQuery, type AdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";
import type { OrderRecord } from "@/app/lib/order-types";
import { summaryForOrders } from "@/components/admin-v2/views/orders/utils";

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
  summary: ReturnType<typeof summaryForOrders> | null;
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

const maxSummaryRows = 10000;
const summaryBatchSize = 50;

// Read every matching order before calculating KPIs. Page length is not the
// total order count, even when the table defaults to ten rows.
export async function getCompleteAdminV2OrderSummary(query: AdminV2OrderQuery, expectedCount: number) {
  if (!Number.isSafeInteger(expectedCount) || expectedCount < 0 || expectedCount > maxSummaryRows) return null;
  const allOrders: OrderRecord[] = [];
  const pages = Math.ceil(expectedCount / summaryBatchSize);
  for (let page = 1; page <= pages; page += 5) {
    const batch = await Promise.all(Array.from({ length: Math.min(5, pages - page + 1) }, (_, index) =>
      queryOrders({ ...query, page: page + index, pageSize: summaryBatchSize })
    ));
    for (let index = 0; index < batch.length; index++) {
      const result = batch[index];
      const expectedSize = Math.min(summaryBatchSize, expectedCount - (page + index - 1) * summaryBatchSize);
      if (result.storageMode !== "supabase" || result.totalCount !== expectedCount || result.rows.length !== expectedSize) {
        return null;
      }
      allOrders.push(...result.rows.filter(isVisibleRealOrder));
    }
  }
  return summaryForOrders(allOrders);
}

export async function getAdminV2Orders(searchParams = new URLSearchParams()): Promise<AdminV2OrdersPayload> {
  const query = parseAdminV2OrderQuery(searchParams);

  try {
    const result = await queryOrders(query);
    const available = result.storageMode === "supabase";
    const summary = available
      ? await getCompleteAdminV2OrderSummary(query, result.totalCount).catch((error) => {
          logOrderLoadError(error, "admin order summary");
          return null;
        })
      : null;

    return {
      orders: available ? result.rows.filter(isVisibleRealOrder) : [],
      storageMode: result.storageMode,
      available,
      limitation: available
        ? summary === null ? "Complete order summary is unavailable or exceeds the safe 10,000-order limit. The order list remains available." : null
        : "Supabase order storage is not configured. Demo-memory orders are intentionally hidden in Admin V2.",
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      appliedFilters: result.appliedFilters,
      summary,
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
      summary: null,
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
