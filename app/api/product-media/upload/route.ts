import { randomUUID } from "node:crypto";
import {
  unauthorizedAdminResponse,
  verifyAdminRequest,
} from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const BUCKET = "product-media";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function supabaseStorageBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  return `${url.replace(/\/$/, "")}/storage/v1/object`;
}

function publicStorageUrl(objectPath: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return key;
}

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json(
      { errors: ["Storage is not configured on this server."] },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ errors: ["Invalid multipart form data."] }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ errors: ["No file provided."] }, { status: 400 });
  }

  const productSlug =
    ((formData.get("productSlug") as string | null) ?? "").trim() || "draft";
  const contentType = file.type;

  const isImage = ALLOWED_IMAGE_TYPES.has(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(contentType);

  if (!isImage && !isVideo) {
    return json(
      {
        errors: [
          "Unsupported file type. Images: jpg, png, webp, gif. Videos: mp4, webm, mov.",
        ],
      },
      { status: 400 }
    );
  }

  const maxBytes = isImage ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    return json(
      {
        errors: [
          `File too large. Maximum ${limitMb}MB for ${isImage ? "images" : "videos"}.`,
        ],
      },
      { status: 400 }
    );
  }

  const mediaFolder = isImage ? "images" : "videos";
  const ext = EXT_MAP[contentType] ?? (isImage ? "jpg" : "mp4");
  const objectPath = `products/${productSlug}/${mediaFolder}/${randomUUID()}.${ext}`;

  const body = await file.arrayBuffer();

  const key = serviceRoleKey();
  const uploadResponse = await fetch(
    `${supabaseStorageBase()}/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    }
  );

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => "");
    console.error(
      "[product-media] Storage upload failed:",
      uploadResponse.status,
      detail.slice(0, 240)
    );
    return json(
      { errors: ["Upload to storage failed. Check bucket permissions."] },
      { status: 502 }
    );
  }

  return json({
    url: publicStorageUrl(objectPath),
    path: objectPath,
    type: isImage ? "image" : "video",
    filename: file.name,
    size: file.size,
    contentType,
  });
}
