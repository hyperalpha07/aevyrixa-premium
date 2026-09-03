import { notFound } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getAdminV2Order } from "@/lib/admin-v2/orders";
import { AdminV2OrderDetailView } from "@/components/admin-v2/views/orders/detail";

export default async function AdminV2OrderDetailPage(props: PageProps<"/admin-v2/orders/[orderRef]">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "orderDetail");
  const { orderRef } = await props.params;
  const payload = await getAdminV2Order(orderRef);

  if (!payload.order) notFound();

  return (
    <AdminV2OrderDetailView
      order={payload.order}
      storageMode={payload.storageMode}
      permissions={{
        canEditStatus: hasPermission(session, "orders.editStatus"),
        canEditCourier: hasPermission(session, "orders.editCourier"),
      }}
    />
  );
}
