import { AdminV2ExpensesView } from "@/components/admin-v2/views/expenses/AdminV2ExpensesView";
import { hasPermission } from "@/app/lib/admin-permissions";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { getAdminV2Expenses } from "@/lib/admin-v2/expenses/expenses-query";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2ExpensesPage(props: PageProps<"/admin-v2/expenses">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "expenses");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Expenses(params);
  return <AdminV2ExpensesView data={data} capabilities={{
    canManageExpenses: hasPermission(session, "finance.expenses.manage"),
    canExport: hasPermission(session, "finance.expenses.view") && hasPermission(session, "finance.export"),
    canViewOrder: hasPermission(session, "orders.view"),
  }} />;
}
