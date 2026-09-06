"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { appendDraftProductImage, assignDraftProductColorImage, assignDraftRichContentImage, draftMediaUpdateQuery, draftProductMediaPath,
  hasValidAdminV2ImageSignature, mediaStepFailure, moveDraftProductImage, removeDraftProductImage,
  safeDraftMediaStoragePath, setDraftProductPrimaryImage, validateAdminV2MediaFile } from "@/lib/admin-v2/product-media";
import { publicProductMediaUrl, removeNewProductMediaObject, uploadProductMediaObject } from "@/lib/admin-v2/product-media-store";

export type AdminV2MediaActionState = { errors: string[] };

function revalidateProductMedia(productId: string, slug?: unknown) {
  const detailPath = `/admin-v2/products/${encodeURIComponent(productId)}`;
  revalidatePath("/admin-v2/products");
  revalidatePath(detailPath);
  revalidatePath(`${detailPath}/media`);
  revalidatePath(`${detailPath}/publish`);
  revalidatePath("/product");
  if (typeof slug === "string" && slug) revalidatePath(`/product/${encodeURIComponent(slug)}`);
  return detailPath;
}

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
  let uploaded = false;
  let attached = false;
  try {
    const publicUrl = publicProductMediaUrl(objectPath);
    const upload = await uploadProductMediaObject(objectPath, validation.contentType, body);
    if (!upload.ok) return { errors: [mediaStepFailure("storage", upload.status)] };
    uploaded = true;
    const query = draftMediaUpdateQuery(productId, row.updated_at);
    const response = await draftProductRequest(query, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...appendDraftProductImage(row, publicUrl, objectPath), updated_at: new Date().toISOString() }),
    });
    const updated = response.ok ? await response.json().catch(() => []) : [];
    if (!response.ok) return { errors: [mediaStepFailure("database", response.status)] };
    if (!Array.isArray(updated) || updated.length !== 1 || updated[0].id !== productId) {
      return { errors: ["The product changed or is no longer an editable draft. Cleanup of the new storage object was attempted."] };
    }
    attached = true;
  } catch (error) {
    const message = error instanceof Error && error.message === "Product media storage is not configured."
      ? "Product media storage is not configured on this server."
      : uploaded
        ? "Database attachment could not be completed. Cleanup of the new storage object was attempted."
        : "Storage upload could not be completed. Check the connection and try again.";
    return { errors: [message] };
  } finally {
    if (uploaded && !attached) await removeNewProductMediaObject(objectPath).catch(() => null);
  }
  const detailPath = revalidateProductMedia(productId, row.slug);
  redirect(`${detailPath}/media?uploaded=1`);
}

type MediaOperation = "remove" | "primary" | "up" | "down" | "color" | "rich";

export async function manageAdminV2DraftImage(productId: string, _state: AdminV2MediaActionState, formData: FormData): Promise<AdminV2MediaActionState> {
  const session = await getAdminSession();
  if (!hasPermission(session, "products.media")) return { errors: ["You do not have permission to manage product media."] };
  const entries = [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION_"));
  if (entries.some(([key, value]) => !["operation", "imageUrl", "color", "role"].includes(key) || typeof value !== "string")) {
    return { errors: ["Unsupported media fields were submitted."] };
  }
  const operation = formData.get("operation");
  const imageUrl = formData.get("imageUrl");
  const color = formData.get("color");
  const role = formData.get("role");
  const expectedFields = operation === "color" || operation === "rich" ? 3 : 2;
  if (entries.length !== expectedFields || !(["remove", "primary", "up", "down", "color", "rich"] as unknown[]).includes(operation)
    || typeof imageUrl !== "string" || (operation !== "rich" && !imageUrl) || imageUrl.length > 3000
    || (operation === "color" && typeof color !== "string") || (operation === "rich" && typeof role !== "string")) {
    return { errors: ["Choose a valid gallery action and image."] };
  }

  let row;
  try { row = await readDraftEditProduct(productId, draftProductRequest); }
  catch { return { errors: ["Product data is currently unavailable."] }; }
  if (!row || row.deleted_at != null) return { errors: ["Product was not found or has been deleted."] };
  if (row.status !== "draft") return { errors: ["Only draft product media can be changed."] };

  const typedOperation = operation as MediaOperation;
  const payload = typedOperation === "remove"
    ? removeDraftProductImage(row, productId, imageUrl)
    : typedOperation === "primary"
      ? setDraftProductPrimaryImage(row, productId, imageUrl)
      : typedOperation === "color"
        ? assignDraftProductColorImage(row, imageUrl, color as string)
        : typedOperation === "rich"
          ? assignDraftRichContentImage(row, role, imageUrl)
          : moveDraftProductImage(row, productId, imageUrl, typedOperation);
  if (!payload) return { errors: [typedOperation === "up" || typedOperation === "down"
    ? "That image cannot be moved in this direction."
    : typedOperation === "color"
      ? "Choose a current product color and gallery image."
      : typedOperation === "rich"
        ? "Choose a supported rich-content role and current gallery image."
      : "The selected image is no longer in this draft gallery."] };

  const response = await draftProductRequest(draftMediaUpdateQuery(productId, row.updated_at), {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  }).catch(() => null);
  const updated = response?.ok ? await response.json().catch(() => []) : [];
  if (!response?.ok) return { errors: [`Draft media could not be updated${response ? ` (${response.status})` : ""}.`] };
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0].id !== productId) {
    return { errors: ["The product changed or is no longer an editable draft. Reload before trying again."] };
  }

  let cleanupFailed = false;
  if (typedOperation === "remove") {
    const path = safeDraftMediaStoragePath(imageUrl, productId);
    if (path) {
      const cleanup = await removeNewProductMediaObject(path).catch(() => null);
      cleanupFailed = !cleanup?.ok;
    }
  }
  const detailPath = revalidateProductMedia(productId, row.slug);
  redirect(`${detailPath}/media?updated=${typedOperation}${cleanupFailed ? "&cleanup=failed" : ""}`);
}
