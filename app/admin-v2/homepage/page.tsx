import { hasPermission } from "@/app/lib/admin-permissions";
import { getStoreSettings } from "@/app/lib/settings-store";
import { AdminV2HomepageView } from "@/components/admin-v2/views/homepage/AdminV2HomepageView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { extractHomepageAppearance, extractHomepageContent } from "@/lib/admin-v2/homepage/homepage-settings";

export const metadata={title:"Homepage Content | Noromi Care Admin"};

export default async function AdminV2HomepagePage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"homepage");
 const data=await getStoreSettings();
 return <AdminV2HomepageView
  initialContent={extractHomepageContent(data.settings.homepageMediaSettings)}
  initialAppearance={extractHomepageAppearance(data.settings.appearanceSettings)}
  available={data.storageMode==="supabase"}
  canEditContent={hasPermission(session,"homepage.manage")}
  canEditAppearance={hasPermission(session,"settings.editBasic")} />;
}
