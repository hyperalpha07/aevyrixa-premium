import { getFreshAdminRequestSession, unauthorizedAdminResponse, forbiddenAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { AuditLogStoreError, auditFilterMetadata, listAuditLogs } from "@/lib/admin-v2/audit-logs/audit-log-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "activity.view")) return forbiddenAdminResponse();
  const url = new URL(request.url);
  try {
    const result = await listAuditLogs({
      query: url.searchParams.get("query") ?? "",
      action: url.searchParams.get("action") ?? "all",
      actor: url.searchParams.get("actor") ?? "all",
      targetType: url.searchParams.get("targetType") ?? "all",
      timeRange: url.searchParams.get("timeRange") ?? "all",
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 50),
    });
    const filters = await auditFilterMetadata().catch(() => ({ actions: [], actors: [], targetTypes: [] }));
    return Response.json({ ...result, filters }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof AuditLogStoreError) return Response.json({ errors: [error.message] }, { status: error.status });
    return Response.json({ errors: ["Audit logs could not be loaded."] }, { status: 503 });
  }
}
