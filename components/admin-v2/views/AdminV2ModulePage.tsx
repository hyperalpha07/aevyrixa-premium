import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { findAdminV2Route, type AdminV2ModuleKey } from "@/configs/admin-v2/routes";
import { AdminV2PlaceholderView } from "@/components/admin-v2/views/AdminV2PlaceholderView";

type AdminV2ModulePageProps = {
  module: AdminV2ModuleKey;
  title?: string;
  description?: string;
  detail?: string;
};

export async function AdminV2ModulePage({ module, title, description, detail }: AdminV2ModulePageProps) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, module);
  const route = findAdminV2Route(module);

  return (
    <AdminV2PlaceholderView
      title={title ?? route?.title ?? "Admin V2 Module"}
      description={description ?? route?.description ?? "Admin V2 module scaffold."}
      detail={detail}
    />
  );
}
