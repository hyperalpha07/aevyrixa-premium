"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { appendDraftProductImage, draftMediaUpdateQuery, draftProductMediaPath,
  hasValidAdminV2ImageSignature, validateAdminV2MediaFile } from "@/lib/admin-v2/product-media";
import { publicProductMediaUrl, removeNewProductMediaObject, uploadProductMediaObject } from "@/lib/admin-v2/product-media-store";

export type AdminV2MediaActionState = { errors: string[] };

export async function uploadAdminV2DraftImage(productId: string, _state: AdminV2MediaActionState, formData: FormData): Promise<AdminV2MediaActionState> {
  const session = await getAdminSession();
  if (!hasPermission(session, "products.media")) return { errors: ["You do not have permission to upload product media."] };
  const submittedKeys = [...formData.keys()].filter((key) => !key.startsWith("$ACTION_"));
  if (submittedKeys.length !== 1 || submittedKeys[0] !== "file") return { errors: ["Unsupported upload fields were submitted."] };
  const file = formData.get("file");
  if (!(file instanceof File)) return { errors: ["Choose an image to upload."] };
  const validation = validateAdminV2MediaFile(file);
  if (!validation.valid) return { errors: [validation.error] };

  let row;
  try { row = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return { errors: ["Product data is currently unavailable."] }; }
  if (!row || row.deleted_at != null) return { errors: ["Product was not found or has been deleted."] };
  if (row.status !== "draft") return { errors: ["Only draft products can receive new media."] };

  const body = await file.arrayBuffer();
  if (!hasValidAdminV2ImageSignature(validation.contentType, new Uint8Array(body))) {
    return { errors: ["The file content does not match a supported image format."] };
  }
  const objectPath = draftProductMediaPath(productId, randomUUID(), validation.extension);
  const publicUrl = publicProductMediaUrl(objectPath);
  let uploaded = false;
  let attached = false;
  try {
    const upload = await uploadProductMediaObject(objectPath, validation.contentType, body);
    if (!upload.ok) return { errors: ["Image could not be uploaded to storage."] };
    uploaded = true;
    const query = draftMediaUpdateQuery(productId, row.updated_at);
    const response = await draftProductRequest(query, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...appendDraftProductImage(row, publicUrl, objectPath), updated_at: new Date().toISOString() }),
    });
    const updated = response.ok ? await response.json().catch(() => []) : [];
    if (!response.ok || !Array.isArray(updated) || updated.length !== 1 || updated[0].id !== productId) {
      return { errors: ["The product changed or is no longer an editable draft. No image was attached."] };
    }
    attached = true;
  } catch {
    return { errors: ["The media upload could not be completed."] };
  } finally {
    if (uploaded && !attached) await removeNewProductMediaObject(objectPath).catch(() => null);
  }
  const detailPath = `/admin-v2/products/${encodeURIComponent(productId)}`;
  revalidatePath("/admin-v2/products");
  revalidatePath(detailPath);
  revalidatePath(`${detailPath}/media`);
  redirect(`${detailPath}/media?uploaded=1`);
}
