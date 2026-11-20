import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { readDraftEditProduct } from "@/lib/admin-v2/product-edit";
import { draftProductRequest } from "@/lib/admin-v2/product-edit-store";
import { appendDraftProductImage, draftProductMediaPath, liveMediaUpdateQuery, draftMediaUpdateQuery } from "@/lib/admin-v2/product-media";
import { isLibraryMediaPath } from "@/lib/admin-v2/media-library";
import { moveProductMediaObject, publicProductMediaUrl } from "@/lib/admin-v2/product-media-store";

export const dynamic = "force-dynamic";

const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extension(path: string) { return path.split(".").at(-1) ?? ""; }

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "products.media");
  if (!session) return forbiddenAdminResponse();
  const input = await request.json().catch(() => null) as { path?: unknown; productId?: unknown } | null;
  if (!input || !isLibraryMediaPath(input.path) || typeof input.productId !== "string" || !productIdPattern.test(input.productId)) {
    return Response.json({ errors: ["Choose a valid unassociated library image and product."] }, { status: 400 });
  }
  let row;
  try { row = await readDraftEditProduct(input.productId, draftProductRequest); }
  catch { return Response.json({ errors: ["Product data is currently unavailable."] }, { status: 503 }); }
  if (!row || row.deleted_at != null || (row.status !== "draft" && row.status !== "active")) {
    return Response.json({ errors: ["Only current draft or active products can receive media."] }, { status: 409 });
  }

  const destination = draftProductMediaPath(input.productId, randomUUID(), extension(input.path));
  let moved = false;
  let attached = false;
  try {
    const move = await moveProductMediaObject(input.path, destination);
    if (!move.ok) return Response.json({ errors: [`Storage association failed (${move.status}).`] }, { status: 502 });
    moved = true;
    const url = publicProductMediaUrl(destination);
    const query = row.status === "active" ? liveMediaUpdateQuery(input.productId, row.updated_at) : draftMediaUpdateQuery(input.productId, row.updated_at);
    const response = await draftProductRequest(query, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...appendDraftProductImage(row, url, destination), updated_at: new Date().toISOString() }),
    });
    const updated = response.ok ? await response.json().catch(() => []) : [];
    if (!response.ok || !Array.isArray(updated) || updated.length !== 1 || updated[0].id !== input.productId) {
      return Response.json({ errors: ["The product changed before the image could be attached. The library object was restored."] }, { status: 409 });
    }
    attached = true;
    await logStaffActivity({ actor: session, action: "product.media_library_associated", targetType: "product-media", targetId: destination,
      metadata: { productId: input.productId, previousPath: input.path } });
    revalidatePath("/admin-v2/media");
    revalidatePath(`/admin-v2/products/${encodeURIComponent(input.productId)}`);
    revalidatePath(`/admin-v2/products/${encodeURIComponent(input.productId)}/media`);
    revalidatePath("/product");
    if (typeof row.slug === "string" && row.slug) revalidatePath(`/product/${encodeURIComponent(row.slug)}`);
    return Response.json({ attached: true, productId: input.productId, publicUrl: url });
  } catch {
    return Response.json({ errors: ["The media association could not be completed. The library object was restored when possible."] }, { status: 503 });
  } finally {
    if (moved && !attached) await moveProductMediaObject(destination, input.path).catch(() => null);
  }
}
