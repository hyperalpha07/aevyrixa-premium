import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { isLibraryMediaPath } from "@/lib/admin-v2/media-library";
import { deleteLibraryMediaObject } from "@/lib/admin-v2/product-media-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "products.media");
  if (!session) return forbiddenAdminResponse();
  const input = await request.json().catch(() => null) as { path?: unknown } | null;
  if (!input || !isLibraryMediaPath(input.path)) return Response.json({ errors: ["Only unassociated library images can be deleted here."] }, { status: 400 });
  try {
    const response = await deleteLibraryMediaObject(input.path);
    if (!response.ok && response.status !== 404) return Response.json({ errors: [`Storage deletion failed (${response.status}).`] }, { status: 502 });
    await logStaffActivity({ actor: session, action: "product.media_library_deleted", targetType: "product-media", targetId: input.path });
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ errors: ["Product media storage is not configured on this server."] }, { status: 503 });
  }
}
