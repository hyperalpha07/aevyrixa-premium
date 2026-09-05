import { notFound } from "next/navigation";
import { AdminV2ProductMediaView, AdminV2ProductMediaUnavailable } from "@/components/admin-v2/views/products/AdminV2ProductMediaView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductDetail } from "@/lib/admin-v2/products";

export const metadata = { title: "Product media | Noromi Care Admin" };

export default async function AdminV2ProductMediaPage(props: PageProps<"/admin-v2/products/[productId]/media">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productMedia");
  const { productId } = await props.params;
  let product;
  try { product = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return <AdminV2ProductMediaUnavailable id={productId} />; }
  if (!product) notFound();
  if (product.status !== "draft") return <AdminV2ProductMediaUnavailable id={productId} active />;
  const detail = await getAdminV2ProductDetail(productId);
  return <AdminV2ProductMediaView id={product.id} name={String(product.name || "Draft product")} images={detail.product?.imageUrls ?? []} />;
}
