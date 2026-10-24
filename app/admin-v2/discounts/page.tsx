import { AdminV2DiscountsView } from "@/components/admin-v2/views/discounts/AdminV2DiscountsView";
import { getStoreSettings } from "@/app/lib/settings-store";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductCatalog } from "@/lib/admin-v2/products";

export default async function AdminV2DiscountsPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"discounts");
 const [catalog,settings]=await Promise.all([getAdminV2ProductCatalog(),getStoreSettings()]);
 return <AdminV2DiscountsView catalog={catalog}
    freeDeliveryThreshold={settings.storageMode==="supabase"?settings.settings.checkoutSettings.freeDeliveryThreshold:null} />;
}
