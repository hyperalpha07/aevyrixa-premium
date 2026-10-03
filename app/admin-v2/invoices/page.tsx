import { AdminV2InvoicesView } from "@/components/admin-v2/views/invoices/AdminV2InvoicesView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Invoices } from "@/lib/admin-v2/invoices/invoices-query";

export default async function AdminV2InvoicesPage(props: PageProps<"/admin-v2/invoices">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "invoices");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Invoices(params);

  return <AdminV2InvoicesView data={data} />;
}
