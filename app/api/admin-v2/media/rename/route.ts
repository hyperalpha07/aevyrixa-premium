import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { isLibraryMediaPath, renameLibraryMediaPath } from "@/lib/admin-v2/media-library";
import { moveLibraryMediaObject, publicProductMediaUrl } from "@/lib/admin-v2/product-media-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "products.media");
  if (!session) return forbiddenAdminResponse();
  const input = await request.json().catch(() => null) as { path?: unknown; filename?: unknown } | null;
  if (!input || !isLibraryMediaPath(input.path) || typeof input.filename !== "string" || input.filename.length > 120) {
    return Response.json({ errors: ["Choose a valid library image and filename."] }, { status: 400 });
  }
  const destination = renameLibraryMediaPath(input.path, input.filename);
  if (!destination) return Response.json({ errors: ["Keep the existing JPG, PNG, or WebP extension and use a valid filename." ] }, { status: 400 });
  if (destination === input.path) return Response.json({ item: { path: input.path, publicUrl: publicProductMediaUrl(input.path) } });
  try {
    const response = await moveLibraryMediaObject(input.path, destination);
    if (!response.ok) return Response.json({ errors: [`Storage rename failed (${response.status}).`] }, { status: 502 });
    await logStaffActivity({ actor: session, action: "product.media_library_renamed", targetType: "product-media", targetId: destination, metadata: { previousPath: input.path } });
    return Response.json({ item: { path: destination, publicUrl: publicProductMediaUrl(destination) } });
  } catch {
    return Response.json({ errors: ["Product media storage is not configured on this server."] }, { status: 503 });
  }
}
