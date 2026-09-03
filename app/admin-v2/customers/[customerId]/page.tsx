import { AdminV2ModulePage } from "@/components/admin-v2/views/AdminV2ModulePage";

export default async function AdminV2CustomerDetailPage(props: PageProps<"/admin-v2/customers/[customerId]">) {
  const { customerId } = await props.params;
  return <AdminV2ModulePage module="customerDetail" detail={`Customer ID: ${customerId}`} />;
}
