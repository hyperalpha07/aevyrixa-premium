import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { queryOrders } from "@/app/lib/order-store";
import { orderCsvRows } from "@/components/admin-v2/views/orders/utils";
import { brandShortName } from "@/configs/brand/noromi";
import { getCompleteAdminV2OrderRows } from "@/lib/admin-v2/orders";
import { parseAdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.view") || !hasPermission(session, "orders.export")) return forbiddenAdminResponse();

  const params = new URL(request.url).searchParams;
  const query = parseAdminV2OrderQuery(params);
  const includePii = params.get("includePii") === "true";

  try {
    const first = await queryOrders({ ...query, page: 1, pageSize: 50 });
    if (first.storageMode !== "supabase") {
      return Response.json({ errors: ["Persistent order storage is unavailable."] }, { status: 503 });
    }
    if (first.totalCount > 10000) {
      return Response.json({ errors: ["Export exceeds 10,000 orders. Narrow the filters and retry."] }, { status: 409 });
    }
    const orders = await getCompleteAdminV2OrderRows(query, first.totalCount);
    if (!orders || orders.length !== first.totalCount) {
      return Response.json({ errors: ["Complete filtered order set could not be verified. Export was stopped."] }, { status: 409 });
    }

    const csv = orderCsvRows(orders, includePii);
    try {
      await logStaffActivity({
        actor: session,
        action: "orders.exported",
        targetType: "orders",
        targetId: "csv",
        metadata: {
          record_scope: query.recordScope,
          row_count: orders.length,
          include_pii: includePii,
          filters: { q: Boolean(query.q), status: query.status, payment: query.payment,
            paymentStatus: query.paymentStatus, delivery: query.delivery,
            from: query.from, to: query.to, sort: query.sort },
        },
        requireRecorded: true,
      });
    } catch {
      return Response.json({ errors: ["Order export audit could not be recorded."] }, { status: 500 });
    }

    const filename = `${brandShortName.toLowerCase()}-orders-${query.recordScope}-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin-v2:orders] authorized export query failed", error instanceof Error ? error.message : "Unknown export error");
    return Response.json({ errors: ["Order export source is unavailable."] }, { status: 503 });
  }
}
