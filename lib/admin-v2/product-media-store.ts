import "server-only";

import { isLibraryMediaPath, validMediaLibraryListItem } from "@/lib/admin-v2/media-library";

const BUCKET = "product-media";

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Product media storage is not configured.");
  return { url, key };
}

export function publicProductMediaUrl(path: string) {
  const { url } = configuration();
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function uploadProductMediaObject(path: string, contentType: string, body: ArrayBuffer) {
  const { url, key } = configuration();
  return fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": contentType, "x-upsert": "false" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

export async function removeNewProductMediaObject(path: string) {
  const { url, key } = configuration();
  return fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

function storageJsonHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export type MediaLibraryStorageObject = {
  path: string;
  sizeBytes: number | null;
  contentType: string | null;
  updatedAt: string | null;
  publicUrl: string;
};

/** Lists only the dedicated, unassociated Admin V2 library prefix. */
export async function listMediaLibraryObjects(): Promise<{ available: boolean; items: MediaLibraryStorageObject[] }> {
  try {
    const { url, key } = configuration();
    const response = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: storageJsonHeaders(key),
      body: JSON.stringify({ prefix: "media-library", limit: 100, offset: 0, sortBy: { column: "updated_at", order: "desc" } }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return { available: false, items: [] };
    const payload: unknown = await response.json().catch(() => []);
    if (!Array.isArray(payload)) return { available: false, items: [] };
    const items = payload.flatMap((entry) => {
      if (!validMediaLibraryListItem(entry)) return [];
      const metadata = entry.metadata ?? {};
      const rawSize = metadata.size;
      const sizeBytes = typeof rawSize === "number" && Number.isFinite(rawSize) ? rawSize : null;
      const mime = metadata.mimetype;
      const updated = metadata.lastModified ?? metadata.updated_at;
      const path = `media-library/${entry.name}`;
      return [{
        path,
        sizeBytes,
        contentType: typeof mime === "string" ? mime : null,
        updatedAt: typeof updated === "string" ? updated : null,
        publicUrl: publicProductMediaUrl(path),
      }];
    });
    return { available: true, items };
  } catch {
    return { available: false, items: [] };
  }
}

/** Moves only an unassociated library image; callers must persist an association separately. */
export async function moveLibraryMediaObject(sourcePath: string, destinationPath: string) {
  if (!isLibraryMediaPath(sourcePath)) throw new Error("Unsafe media library source path.");
  return moveProductMediaObject(sourcePath, destinationPath);
}

/** Internal move primitive. Never expose caller-controlled paths from a route. */
export async function moveProductMediaObject(sourcePath: string, destinationPath: string) {
  const { url, key } = configuration();
  return fetch(`${url}/storage/v1/object/move`, {
    method: "POST",
    headers: storageJsonHeaders(key),
    body: JSON.stringify({ bucketId: BUCKET, sourceKey: sourcePath, destinationKey: destinationPath }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

export async function deleteLibraryMediaObject(path: string) {
  if (!isLibraryMediaPath(path)) throw new Error("Unsafe media library path.");
  return removeNewProductMediaObject(path);
}
