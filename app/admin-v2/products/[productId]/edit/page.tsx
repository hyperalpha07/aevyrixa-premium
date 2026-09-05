import { notFound } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { readDraftEditProduct, isEditableDraft, draftEditInitialValues } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { AdminV2EditProductView, AdminV2EditProductUnavailable } from "@/components/admin-v2/views/products/AdminV2EditProductView";

export const metadata = { title: "Edit draft product | Noromi Care Admin" };

export default async function EditDraftProductPage(props: PageProps<"/admin-v2/products/[productId]/edit">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productEdit");
  const { productId } = await props.params;
  let product;
  try {
    product = await readDraftEditProduct(productId, draftProductRequest);
  } catch {
    return <AdminV2EditProductUnavailable id={productId} />;
  }
  if (!product) notFound();
  if (!isEditableDraft(product)) return <AdminV2EditProductUnavailable id={productId} active />;
  return <AdminV2EditProductView key={product.id} id={product.id} initialValues={draftEditInitialValues(product)} supportsMerchandising={Object.hasOwn(product, "merchandising")} />;
}
