import { randomUUID } from "node:crypto";
import {
  forbiddenAdminResponse,
  verifyFreshAdminRequestPermission,
} from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  "video/x-m4v",
]);

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 180 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

function contentTypeFor(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".m4v")) return "video/x-m4v";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "";
}

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
  const session = await verifyFreshAdminRequestPermission(request, "homepage.manage");
  if (!session) return forbiddenAdminResponse();

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

  const section =
    ((formData.get("section") as string | null) ?? "").trim().replace(/[^a-z0-9-]/gi, "-") || "homepage";
  const contentType = contentTypeFor(file);

  const isImage = ALLOWED_IMAGE_TYPES.has(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(contentType);

  if (!isImage && !isVideo) {
    return json(
      {
        errors: [
          "Unsupported file type. Images: jpg, png, webp, gif. Videos: mp4, mov, webm, m4v.",
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
  const objectPath = `homepage/${section}/${mediaFolder}/${randomUUID()}.${ext}`;

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
      "[homepage-media] Storage upload failed:",
      uploadResponse.status,
      detail.slice(0, 240)
    );
    return json(
      {
        errors: [
          `Upload to storage failed (${uploadResponse.status}). Check bucket permissions, file size, and network stability.`,
        ],
      },
      { status: 502 }
    );
  }

  await logStaffActivity({
    actor: session,
    action: "homepage.media_uploaded",
    targetType: "homepage-media",
    targetId: objectPath,
    metadata: { type: isImage ? "image" : "video" },
  });

  return json({
    url: publicStorageUrl(objectPath),
    path: objectPath,
    type: isImage ? "image" : "video",
    filename: file.name,
    size: file.size,
    contentType,
  });
}
