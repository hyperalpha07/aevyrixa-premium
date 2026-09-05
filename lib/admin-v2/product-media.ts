export const ADMIN_V2_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
} as const;

export type AdminV2MediaType = keyof typeof imageTypes;
export type AdminV2MediaValidation =
  | { valid: true; contentType: AdminV2MediaType; extension: "jpg" | "png" | "webp" }
  | { valid: false; error: string };

export function validateAdminV2MediaFile(file: Pick<File, "name" | "type" | "size">): AdminV2MediaValidation {
  if (!file.name || file.size <= 0) return { valid: false, error: "Choose a non-empty image file." };
  if (file.size > ADMIN_V2_MEDIA_MAX_BYTES) return { valid: false, error: "Image must be 5 MB or smaller." };
  if (!Object.hasOwn(imageTypes, file.type)) return { valid: false, error: "Use a JPG, PNG, or WebP image." };
  const suffix = file.name.toLowerCase().split(".").at(-1);
  const contentType = file.type as AdminV2MediaType;
  const allowedExtensions = contentType === "image/jpeg" ? ["jpg", "jpeg"] : [imageTypes[contentType].extension];
  if (!suffix || !allowedExtensions.includes(suffix)) {
    return { valid: false, error: "The file extension does not match its image type." };
  }
  return { valid: true, contentType, extension: imageTypes[contentType].extension };
}

export function hasValidAdminV2ImageSignature(contentType: AdminV2MediaType, bytes: Uint8Array) {
  if (contentType === "image/webp") {
    return imageTypes[contentType].signatures[0].every((byte, index) => bytes[index] === byte)
      && [0x57, 0x45, 0x42, 0x50].every((byte, index) => bytes[index + 8] === byte);
  }
  return imageTypes[contentType].signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte));
}

export function draftProductMediaPath(productId: string, uniqueId: string, extension: string) {
  const safeId = /^[0-9a-f-]{36}$/i.test(productId) ? productId.toLowerCase() : "invalid-product";
  const safeUniqueId = uniqueId.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return `products/${safeId}/images/${safeUniqueId}.${extension}`;
}

export function draftMediaUpdateQuery(id: string, updatedAt?: string) {
  const query = new URLSearchParams({ id: `eq.${id}`, status: "eq.draft", deleted_at: "is.null", select: "id" });
  if (updatedAt) query.set("updated_at", `eq.${updatedAt}`);
  return query;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

export function appendDraftProductImage(row: Record<string, unknown>, url: string, path: string) {
  const images = stringList(row.images);
  const hasPrimary = [row.primary_image_url, row.image_url].some((value) => typeof value === "string" && Boolean(value.trim()));
  return {
    images: images.includes(url) ? images : [...images, url],
    ...(!hasPrimary && Object.hasOwn(row, "primary_image_url") ? { primary_image_url: url } : {}),
    ...(!hasPrimary && Object.hasOwn(row, "primary_image_path") ? { primary_image_path: path } : {}),
    ...(!hasPrimary && Object.hasOwn(row, "image_url") ? { image_url: url } : {}),
  };
}

export function mediaStepFailure(step: "storage" | "database", status?: number) {
  const suffix = status ? ` (${status})` : "";
  return step === "storage"
    ? `Storage upload failed${suffix}. The image was not attached.`
    : `Database attachment failed${suffix}. Cleanup of the new storage object was attempted.`;
}
