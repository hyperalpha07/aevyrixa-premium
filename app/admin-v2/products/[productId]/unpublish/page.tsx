import { notFound } from "next/navigation";
import { AdminV2ProductUnpublishUnavailable, AdminV2ProductUnpublishView } from "@/components/admin-v2/views/products/AdminV2ProductUnpublishView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductDetail } from "@/lib/admin-v2/products";

export const metadata = { title: "Unpublish product | Noromi Care Admin" };

export default async function AdminV2ProductUnpublishPage(props: PageProps<"/admin-v2/products/[productId]/unpublish">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productUnpublish");
  const { productId } = await props.params;
  let product;
  try { product = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return <AdminV2ProductUnpublishUnavailable id={productId} />; }
  if (!product) notFound();
  if (product.status !== "active") return <AdminV2ProductUnpublishUnavailable id={productId} draft />;
  const detail = await getAdminV2ProductDetail(productId).catch(() => null);
  return <AdminV2ProductUnpublishView id={product.id} product={{
    name: String(product.name || "Active product"), slug: String(product.slug || ""), category: String(product.category || ""),
    price: Number(product.price), status: String(product.status), stockStatus: String(product.stock_status || "Not set"),
    stockQuantity: product.stock_quantity == null ? null : Number(product.stock_quantity), imageCount: detail?.product?.imageUrls.length ?? 0,
  }} />;
}
