export const ADMIN_V2_MEDIA_MAX_MB = 20;
export const ADMIN_V2_MEDIA_MAX_BYTES = ADMIN_V2_MEDIA_MAX_MB * 1024 * 1024;

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
  if (file.size > ADMIN_V2_MEDIA_MAX_BYTES) return { valid: false, error: `Image must be ${ADMIN_V2_MEDIA_MAX_MB} MB or smaller.` };
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

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function draftProductMediaUrls(row: Record<string, unknown>) {
  return [...new Set([...stringList(row.images), text(row.primary_image_url), text(row.image_url)].filter((value): value is string => Boolean(value)))];
}

export function safeDraftMediaStoragePath(value: string, productId: string) {
  const prefix = `products/${productId.toLowerCase()}/images/`;
  let candidate = value;
  try {
    if (/^https?:\/\//i.test(value)) {
      const pathname = decodeURIComponent(new URL(value).pathname);
      const marker = "/storage/v1/object/public/product-media/";
      if (!pathname.startsWith(marker)) return null;
      candidate = pathname.slice(marker.length);
    }
  } catch { return null; }
  candidate = candidate.replace(/^\/+/, "");
  if (!candidate.toLowerCase().startsWith(prefix)) return null;
  const filename = candidate.slice(prefix.length);
  return /^[a-z0-9-]+\.(?:jpe?g|png|webp)$/i.test(filename) ? candidate : null;
}

function primaryFields(row: Record<string, unknown>, nextPrimary: string | null, productId: string) {
  return {
    ...(Object.hasOwn(row, "primary_image_url") ? { primary_image_url: nextPrimary } : {}),
    ...(Object.hasOwn(row, "image_url") ? { image_url: nextPrimary } : {}),
    ...(Object.hasOwn(row, "primary_image_path") ? { primary_image_path: nextPrimary ? safeDraftMediaStoragePath(nextPrimary, productId) : null } : {}),
  };
}

export function removeDraftProductImage(row: Record<string, unknown>, productId: string, target: string) {
  const current = draftProductMediaUrls(row);
  if (!current.includes(target)) return null;
  const images = current.filter((url) => url !== target);
  const primary = text(row.primary_image_url) ?? text(row.image_url);
  const nextPrimary = primary === target || !primary || !images.includes(primary) ? images[0] ?? null : primary;
  return { images, ...primaryFields(row, nextPrimary, productId) };
}

export function setDraftProductPrimaryImage(row: Record<string, unknown>, productId: string, target: string) {
  return draftProductMediaUrls(row).includes(target) ? primaryFields(row, target, productId) : null;
}

export const setDraftPrimaryImage = setDraftProductPrimaryImage;

export function moveDraftProductImage(row: Record<string, unknown>, productId: string, target: string, direction: "up" | "down") {
  const images = draftProductMediaUrls(row);
  const index = images.indexOf(target);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return null;
  [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
  const primary = text(row.primary_image_url) ?? text(row.image_url);
  return { images, ...(!primary ? primaryFields(row, images[0] ?? null, productId) : {}) };
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
