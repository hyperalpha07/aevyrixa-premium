import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getAdminV2Orders } from "@/lib/admin-v2/orders";
import { AdminV2OrdersView } from "@/components/admin-v2/views/orders";

export default async function AdminV2OrdersPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "orders");
  const payload = await getAdminV2Orders();

  return (
    <AdminV2OrdersView
      orders={payload.orders}
      available={payload.available}
      storageMode={payload.storageMode}
      limitation={payload.limitation}
      permissions={{
        canExport: hasPermission(session, "orders.export"),
        canEditStatus: hasPermission(session, "orders.editStatus"),
        canEditCourier: hasPermission(session, "orders.editCourier"),
      }}
    />
  );
}
