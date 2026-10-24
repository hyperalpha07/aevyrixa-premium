import { hasPermission } from "@/app/lib/admin-permissions";
import { getStoreSettings } from "@/app/lib/settings-store";
import { AdminV2CategoriesView } from "@/components/admin-v2/views/categories/AdminV2CategoriesView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { extractAdminV2Categories } from "@/lib/admin-v2/categories/category-settings";

export default async function AdminV2CategoriesPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "categories");
  const result = await getStoreSettings();
  return <AdminV2CategoriesView initial={extractAdminV2Categories(result.settings.homepageMediaSettings)}
    available={result.storageMode === "supabase"} storageMode={result.storageMode}
    canManage={hasPermission(session, "categories.manage")} />;
}
