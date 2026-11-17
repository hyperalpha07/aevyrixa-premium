import { randomUUID } from "node:crypto";

import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { hasValidAdminV2ImageSignature, validateAdminV2MediaFile } from "@/lib/admin-v2/product-media";
import { libraryMediaPathFromFilename, mediaLibraryUploadProblem } from "@/lib/admin-v2/media-library";
import { publicProductMediaUrl, uploadProductMediaObject } from "@/lib/admin-v2/product-media-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "products.media");
  if (!session) return forbiddenAdminResponse();

  let form: FormData;
  try { form = await request.formData(); }
  catch { return Response.json({ errors: ["Invalid multipart form data."] }, { status: 400 }); }
  const keys = [...form.keys()];
  if (keys.length !== 1 || keys[0] !== "file") return Response.json({ errors: ["Unsupported upload fields were submitted."] }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ errors: ["Choose an image to upload."] }, { status: 400 });
  const problem = mediaLibraryUploadProblem(file);
  if (problem) return Response.json({ errors: [problem] }, { status: 400 });
  const validation = validateAdminV2MediaFile(file);
  if (!validation.valid) return Response.json({ errors: [validation.error] }, { status: 400 });

  const body = await file.arrayBuffer();
  if (!hasValidAdminV2ImageSignature(validation.contentType, new Uint8Array(body))) {
    return Response.json({ errors: ["The file content does not match a supported image format."] }, { status: 400 });
  }
  const path = libraryMediaPathFromFilename(file.name, randomUUID());
  if (!path) return Response.json({ errors: ["The file name could not be used safely."] }, { status: 400 });
  try {
    const response = await uploadProductMediaObject(path, validation.contentType, body);
    if (!response.ok) return Response.json({ errors: [`Storage upload failed (${response.status}).`] }, { status: 502 });
    await logStaffActivity({ actor: session, action: "product.media_library_uploaded", targetType: "product-media", targetId: path,
      metadata: { contentType: validation.contentType, sizeBytes: file.size } });
    return Response.json({ item: { path, publicUrl: publicProductMediaUrl(path), sizeBytes: file.size, contentType: validation.contentType, updatedAt: new Date().toISOString() } }, { status: 201 });
  } catch {
    return Response.json({ errors: ["Product media storage is not configured on this server."] }, { status: 503 });
  }
}
