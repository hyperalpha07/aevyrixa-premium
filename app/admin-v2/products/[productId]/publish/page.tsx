import { notFound } from "next/navigation";
import { AdminV2ProductPublishUnavailable, AdminV2ProductPublishView } from "@/components/admin-v2/views/products/AdminV2ProductPublishView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductDetail } from "@/lib/admin-v2/products";
import { evaluatePublishReadiness, hasObviousLegacyMediaReference, publishSlugQuery } from "@/lib/admin-v2/product-publish";

export const metadata = { title: "Publish product | Noromi Care Admin" };

export default async function AdminV2ProductPublishPage(props: PageProps<"/admin-v2/products/[productId]/publish">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productPublish");
  const { productId } = await props.params;
  let product;
  try { product = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return <AdminV2ProductPublishUnavailable id={productId} />; }
  if (!product) notFound();
  if (product.status !== "draft") return <AdminV2ProductPublishUnavailable id={productId} active />;
  const [detail, duplicateResponse] = await Promise.all([
    getAdminV2ProductDetail(productId).catch(() => null),
    draftProductRequest(publishSlugQuery(productId, String(product.slug || ""))).catch(() => null),
  ]);
  const duplicates = duplicateResponse?.ok ? await duplicateResponse.json().catch(() => null) : null;
  const imageCount = detail?.product?.imageUrls.length ?? 0;
  const readiness = evaluatePublishReadiness(product, {
    reachableImageCount: imageCount,
    duplicateSlug: !Array.isArray(duplicates) || duplicates.length > 0,
    unsafeMediaWarning: hasObviousLegacyMediaReference(product),
  });
  return <AdminV2ProductPublishView id={product.id} product={{
    name: String(product.name || "Draft product"), slug: String(product.slug || ""), category: String(product.category || ""),
    price: Number(product.price), compareAtPrice: product.compare_at_price == null ? null : Number(product.compare_at_price),
    status: String(product.status), stockStatus: String(product.stock_status || "Not set"),
    stockQuantity: product.stock_quantity == null ? null : Number(product.stock_quantity), imageCount,
  }} readiness={readiness} />;
}
