"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { isUnpublishableActive, unpublishPayload, unpublishUpdateQuery, validateUnpublishConfirmation } from "@/lib/admin-v2/product-unpublish";

export type AdminV2UnpublishActionState = { errors: string[] };

export async function unpublishAdminV2ActiveProduct(productId: string, _state: AdminV2UnpublishActionState, formData: FormData): Promise<AdminV2UnpublishActionState> {
  const session = await getAdminSession();
  if (!hasPermission(session, "products.unpublish")) return { errors: ["You do not have permission to unpublish products."] };
  const entries = [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION_"));
  if (entries.length !== 1 || entries[0][0] !== "confirmation" || typeof entries[0][1] !== "string") {
    return { errors: ["Unsupported unpublish fields were submitted."] };
  }
  const confirmationError = validateUnpublishConfirmation(entries[0][1]);
  if (confirmationError) return { errors: [confirmationError] };

  let row;
  try { row = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return { errors: ["Product data is currently unavailable."] }; }
  if (!row || row.deleted_at != null) return { errors: ["Product was not found or has been deleted."] };
  if (!isUnpublishableActive(row)) return { errors: ["Only active products can be unpublished."] };

  const now = new Date().toISOString();
  const response = await draftProductRequest(unpublishUpdateQuery(productId, row.updated_at), {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(unpublishPayload(now)),
  }).catch(() => null);
  const updated = response?.ok ? await response.json().catch(() => []) : [];
  if (!response?.ok) return { errors: ["Product could not be unpublished. No retry was attempted."] };
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0].id !== productId) {
    return { errors: ["The product changed before unpublishing. Reload and review it again."] };
  }

  const detailPath = `/admin-v2/products/${encodeURIComponent(productId)}`;
  revalidatePath("/admin-v2/products");
  revalidatePath(detailPath);
  revalidatePath(`${detailPath}/unpublish`);
  revalidatePath("/product");
  revalidatePath(`/product/${encodeURIComponent(String(row.slug))}`);
  redirect(detailPath);
}
