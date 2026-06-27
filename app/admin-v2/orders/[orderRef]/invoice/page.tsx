import { notFound } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Order } from "@/lib/admin-v2/orders";
import { listOrderInvoices } from "@/app/lib/order-store";
import { AdminV2InvoicePrintView } from "@/components/admin-v2/views/orders/detail/AdminV2InvoicePrintView";

export default async function AdminV2OrderInvoicePrintPage(
  props: PageProps<"/admin-v2/orders/[orderRef]/invoice">
) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "orderDetail");
  const { orderRef } = await props.params;
  const payload = await getAdminV2Order(orderRef);

  if (!payload.order) notFound();

  const invoices = await listOrderInvoices(orderRef);
  const invoice = invoices.find((item) => item.status === "issued");

  if (!invoice) notFound();

  return <AdminV2InvoicePrintView order={payload.order} invoice={invoice} />;
}
