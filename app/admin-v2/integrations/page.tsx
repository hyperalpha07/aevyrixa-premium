import { AdminV2IntegrationsView, type IntegrationFact } from "@/components/admin-v2/views/integrations/AdminV2IntegrationsView";
import { getStoreSettings } from "@/app/lib/settings-store";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2IntegrationsPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"integrations");
 const source=await getStoreSettings();
 const settings=source.settings;
 const persisted=source.storageMode==="supabase";
 const facts:IntegrationFact[]=[
  {name:"Supabase",status:source.storageMode==="supabase"?"Data source responding":"Source unavailable",
    detail:source.storageMode==="supabase"?"Persisted store settings loaded from backend. This is not a whole-database health guarantee.":"Configured data source could not provide settings."},
  {name:"Telegram order alerts",status:process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN&&process.env.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID?"Credentials configured":"Not configured",
    detail:"Credential presence is not proof of message delivery. No test send is performed here."},
  {name:"WhatsApp support link",status:!persisted?"Source unavailable":settings.storeProfile.supportWhatsApp?"Contact number configured":"Not configured",
    detail:"A customer contact URL is not WhatsApp Business API integration."},
  {name:"Pathao Courier",status:"Manual only",
    detail:"Automatic booking/tracking not implemented. Existing adapter intentionally does not make API calls."},
  {name:"Steadfast Courier",status:"Manual only",
    detail:"Automatic booking/tracking not implemented. Use the manual Courier Operations workspace."},
  {name:"bKash payments",status:!persisted?"Source unavailable":settings.paymentSettings.bkashEnabled?"Manual payment instructions enabled":"Disabled",
    detail:"A wallet payment option is not gateway settlement or a merchant API connection."},
  {name:"Nagad payments",status:!persisted?"Source unavailable":settings.paymentSettings.nagadEnabled?"Manual payment instructions enabled":"Disabled",
    detail:"Payment verification is manual until a real merchant API is integrated."},
 ];
 return <AdminV2IntegrationsView facts={facts} />;
}
