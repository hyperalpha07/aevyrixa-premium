import { AdminV2ModulePage } from "@/components/admin-v2/views/AdminV2ModulePage";

export default async function AdminV2OrderDetailPage(props: PageProps<"/admin-v2/orders/[orderRef]">) {
  const { orderRef } = await props.params;
  return <AdminV2ModulePage module="orderDetail" detail={`Order reference: ${orderRef}`} />;
}
