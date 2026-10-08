import { getFreshAdminRequestSession, unauthorizedAdminResponse, forbiddenAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { AuditLogStoreError, auditLogsCsv } from "@/lib/admin-v2/audit-logs/audit-log-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "activity.view")) return forbiddenAdminResponse();
  const url = new URL(request.url);
  try {
    const csv = await auditLogsCsv({
      query: url.searchParams.get("query") ?? "",
      action: url.searchParams.get("action") ?? "all",
      actor: url.searchParams.get("actor") ?? "all",
      targetType: url.searchParams.get("targetType") ?? "all",
      timeRange: url.searchParams.get("timeRange") ?? "all",
      limit: 100,
    });
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="admin-audit-logs.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuditLogStoreError) return Response.json({ errors: [error.message] }, { status: error.status });
    return Response.json({ errors: ["Audit export could not be generated."] }, { status: 503 });
  }
}
