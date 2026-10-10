import { AdminV2TransactionsView } from "@/components/admin-v2/views/transactions/AdminV2TransactionsView";
import { hasPermission } from "@/app/lib/admin-permissions";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Transactions } from "@/lib/admin-v2/transactions/transactions-query";

export default async function AdminV2TransactionsPage(props: PageProps<"/admin-v2/transactions">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "transactions");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Transactions(params);

  return <AdminV2TransactionsView data={data} capabilities={{
    canRecordPayment: hasPermission(session, "finance.payments.record"),
    canExport: hasPermission(session, "finance.transactions.view") && hasPermission(session, "finance.export"),
    canViewOrder: hasPermission(session, "orders.view"),
  }} />;
}
