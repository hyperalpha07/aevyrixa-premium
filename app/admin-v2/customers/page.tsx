import { Alert } from "@mui/material";
import { listAdminCustomerOverviews } from "@/app/lib/customer-account-store";
import { AdminV2CustomersView } from "@/components/admin-v2/views/customers/AdminV2CustomersView";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { parseCustomerFilter, queryCustomers } from "@/lib/admin-v2/customers/customer-query";

export default async function AdminV2CustomersPage(props: PageProps<"/admin-v2/customers">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "customers");
  const search = await props.searchParams;
  const query = typeof search.q === "string" ? search.q.slice(0, 120) : "";
  const filter = parseCustomerFilter(typeof search.filter === "string" ? search.filter : undefined);
  const requestedPage = typeof search.page === "string" ? Number(search.page) : 1;
  try {
    const allCustomers = await listAdminCustomerOverviews();
    const result = queryCustomers(allCustomers, query, filter, requestedPage);
    return <AdminV2CustomersView allCustomers={allCustomers} query={query} filter={filter} {...result} />;
  } catch {
    return <><V2PageHeader title="Customers" /><Alert severity="error" action={<V2Button href="/admin-v2/customers">Retry</V2Button>}>Customer data is temporarily unavailable.</Alert></>;
  }
}
