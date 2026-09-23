import { Alert } from "@mui/material";
import { getAdminCustomerDetail } from "@/app/lib/customer-account-store";
import { AdminV2CustomerDetailView } from "@/components/admin-v2/views/customers/AdminV2CustomerDetailView";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminV2CustomerDetailPage(props: PageProps<"/admin-v2/customers/[customerId]">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "customerDetail");
  const { customerId } = await props.params;
  if (!uuidPattern.test(customerId)) return <><V2PageHeader title="Customer not found" /><Alert severity="info" action={<V2Button href="/admin-v2/customers">Back to Customers</V2Button>}>This customer does not exist.</Alert></>;
  try {
    const detail = await getAdminCustomerDetail(customerId);
    if (!detail) return <><V2PageHeader title="Customer not found" /><Alert severity="info" action={<V2Button href="/admin-v2/customers">Back to Customers</V2Button>}>This customer does not exist.</Alert></>;
    return <AdminV2CustomerDetailView detail={detail} />;
  } catch {
    return <><V2PageHeader title="Customer unavailable" /><Alert severity="error" action={<V2Button href="/admin-v2/customers">Back to Customers</V2Button>}>Customer data is temporarily unavailable.</Alert></>;
  }
}
