import { notFound } from "next/navigation";
import { AdminV2ProductDetailView } from "@/components/admin-v2/views/products/AdminV2ProductDetailView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductDetail } from "@/lib/admin-v2/products";

export default async function AdminV2ProductDetailPage(props: PageProps<"/admin-v2/products/[productId]">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productDetail");
  const { productId } = await props.params;
  const data = await getAdminV2ProductDetail(productId);

  if (data.available && !data.product) notFound();

  return <AdminV2ProductDetailView data={data} />;
}
