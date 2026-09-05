"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { getAdminV2ProductDetail } from "@/lib/admin-v2/products";
import { evaluatePublishReadiness, hasObviousLegacyMediaReference, publishPayload,
  publishSlugQuery, publishUpdateQuery, validatePublishConfirmation } from "@/lib/admin-v2/product-publish";

export type AdminV2PublishActionState = { errors: string[] };

export async function publishAdminV2DraftProduct(productId: string, _state: AdminV2PublishActionState, formData: FormData): Promise<AdminV2PublishActionState> {
  const session = await getAdminSession();
  if (!hasPermission(session, "products.publish")) return { errors: ["You do not have permission to publish products."] };
  const entries = [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION_"));
  if (entries.length !== 1 || entries[0][0] !== "confirmation" || typeof entries[0][1] !== "string") {
    return { errors: ["Unsupported publish fields were submitted."] };
  }
  const confirmationError = validatePublishConfirmation(entries[0][1]);
  if (confirmationError) return { errors: [confirmationError] };

  let row;
  try { row = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return { errors: ["Product data is currently unavailable."] }; }
  if (!row || row.deleted_at != null) return { errors: ["Product was not found or has been deleted."] };
  if (row.status !== "draft") return { errors: ["Only draft products can be published."] };

  const duplicateResponse = await draftProductRequest(publishSlugQuery(productId, String(row.slug || ""))).catch(() => null);
  if (!duplicateResponse?.ok) return { errors: ["Slug availability could not be confirmed. Nothing was published."] };
  const duplicates = await duplicateResponse.json().catch(() => null);
  if (!Array.isArray(duplicates)) return { errors: ["Slug availability could not be confirmed. Nothing was published."] };
  const detail = await getAdminV2ProductDetail(productId).catch(() => null);
  const readiness = evaluatePublishReadiness(row, {
    reachableImageCount: detail?.product?.imageUrls.length ?? 0,
    duplicateSlug: duplicates.length > 0,
    unsafeMediaWarning: hasObviousLegacyMediaReference(row),
  });
  if (!readiness.ready) return { errors: ["This draft does not pass all required publish checks."] };

  const query = publishUpdateQuery(productId, row.updated_at);
  const now = new Date().toISOString();
  const response = await draftProductRequest(query, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(publishPayload(now)),
  }).catch(() => null);
  const updated = response?.ok ? await response.json().catch(() => []) : [];
  if (!response?.ok) return { errors: ["Product could not be published. No retry was attempted."] };
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0].id !== productId) {
    return { errors: ["The product changed before publishing. Reload and review it again."] };
  }

  const detailPath = `/admin-v2/products/${encodeURIComponent(productId)}`;
  revalidatePath("/admin-v2/products");
  revalidatePath(detailPath);
  revalidatePath(`${detailPath}/publish`);
  revalidatePath("/product");
  revalidatePath(`/product/${encodeURIComponent(String(row.slug))}`);
  redirect(detailPath);
}
