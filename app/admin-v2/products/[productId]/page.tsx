import { AdminV2ModulePage } from "@/components/admin-v2/views/AdminV2ModulePage";

export default async function AdminV2ProductDetailPage(props: PageProps<"/admin-v2/products/[productId]">) {
  const { productId } = await props.params;
  return <AdminV2ModulePage module="productDetail" detail={`Product ID: ${productId}`} />;
}
