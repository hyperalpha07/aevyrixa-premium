import { AdminV2AuditLogsView } from "@/components/admin-v2/views/audit-logs/AdminV2AuditLogsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2AuditLogsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "auditLogs");

  return <AdminV2AuditLogsView />;
}
