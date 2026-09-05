"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { persistDraftEdit, type DraftEditState } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";

export async function saveAdminV2DraftProduct(id: string, _previous: DraftEditState, formData: FormData): Promise<DraftEditState> {
  const session = await getAdminSession();
  if (!hasPermission(session, "products.edit")) {
    return { errors: ["You do not have permission to edit products."], fields: {} };
  }
  // Only Next/React's internal form metadata is omitted. All other unknown fields are rejected.
  const entries = [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION_"));
  if (new Set(entries.map(([key]) => key)).size !== entries.length) {
    return { errors: ["Duplicate form fields were submitted. Reload and try again."], fields: {} };
  }
  try {
    const result = await persistDraftEdit(id, Object.fromEntries(entries), draftProductRequest);
    if (!result.saved) return { errors: result.errors, fields: result.fields };
  } catch {
    return { errors: ["The save could not be confirmed. Reload the product before retrying."], fields: {} };
  }
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;
  revalidatePath("/admin-v2/products");
  revalidatePath(detailPath);
  revalidatePath(`${detailPath}/edit`);
  redirect(detailPath);
}
