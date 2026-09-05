import { notFound } from "next/navigation";
import { AdminV2ProductMediaView, AdminV2ProductMediaUnavailable } from "@/components/admin-v2/views/products/AdminV2ProductMediaView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { draftProductMediaUrls } from "@/lib/admin-v2/product-media";

export const metadata = { title: "Product media | Noromi Care Admin" };

export default async function AdminV2ProductMediaPage(props: PageProps<"/admin-v2/products/[productId]/media">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productMedia");
  const [{ productId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  let product;
  try { product = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return <AdminV2ProductMediaUnavailable id={productId} />; }
  if (!product) notFound();
  if (product.status !== "draft") return <AdminV2ProductMediaUnavailable id={productId} active />;
  const primaryImageUrl = typeof product.primary_image_url === "string" && product.primary_image_url
    ? product.primary_image_url : typeof product.image_url === "string" ? product.image_url : null;
  const images = draftProductMediaUrls(product).flatMap((value) => {
    const src = normalizeAdminV2ImageSrc(value);
    return src ? [{ value, src }] : [];
  });
  return <AdminV2ProductMediaView id={product.id} name={String(product.name || "Draft product")}
    images={images} primaryImageUrl={primaryImageUrl}
    notice={{ uploaded: searchParams.uploaded === "1", updated: typeof searchParams.updated === "string" ? searchParams.updated : null,
      cleanupFailed: searchParams.cleanup === "failed" }} />;
}
