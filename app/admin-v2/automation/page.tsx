import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { listTaskAutomationRules } from "@/lib/admin-v2/operations-store";
import { AutomationOperationsView } from "@/components/admin-v2/views/operations/AutomationOperationsView";

export default async function AdminV2AutomationPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"automation");
 const data=await listTaskAutomationRules().catch(()=>null);
 return <AutomationOperationsView initial={data} canManage={hasPermission(session,"automation.manage")}
  schedulerConfigured={Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length>=32)} />;
}
