import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getAdminV2Orders } from "@/lib/admin-v2/orders";
import { AdminV2OrdersView } from "@/components/admin-v2/views/orders";

export default async function AdminV2OrdersPage(props: PageProps<"/admin-v2/orders">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "orders");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const payload = await getAdminV2Orders(params);

  return (
    <AdminV2OrdersView
      orders={payload.orders}
      available={payload.available}
      storageMode={payload.storageMode}
      limitation={payload.limitation}
      totalCount={payload.totalCount}
      page={payload.page}
      pageSize={payload.pageSize}
      totalPages={payload.totalPages}
      permissions={{
        canExport: hasPermission(session, "orders.export"),
        canEditStatus: hasPermission(session, "orders.editStatus"),
        canEditCourier: hasPermission(session, "orders.editCourier"),
        canViewInvoice: hasPermission(session, "orders.viewInvoice"),
        canIssueInvoice: hasPermission(session, "orders.issueInvoice"),
        canAddNote: hasPermission(session, "orders.addNote"),
      }}
    />
  );
}
