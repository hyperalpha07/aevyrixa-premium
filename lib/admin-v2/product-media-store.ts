import "server-only";

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
