import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { listWebhookSubscriptions } from "@/lib/admin-v2/operations-store";
import { WebhookRegistryView } from "@/components/admin-v2/views/operations/WebhookRegistryView";

export default async function AdminV2WebhooksPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"webhooks");
 const subscriptions=await listWebhookSubscriptions().catch(()=>null);
 return <WebhookRegistryView initial={subscriptions} canManage={hasPermission(session,"webhooks.manage")} />;
}
