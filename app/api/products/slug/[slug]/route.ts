import {
  unauthorizedAdminResponse,
  verifyAdminRequest,
} from "@/app/lib/admin-auth";
import { getProductBySlug } from "@/app/lib/product-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const includeDrafts =
    url.searchParams.get("scope") === "admin" ||
    url.searchParams.get("admin") === "1";

  if (includeDrafts && !verifyAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const result = await getProductBySlug(slug, {
      includeDrafts,
    });

    if (!result.product) {
      return json(
        { product: null, storageMode: result.storageMode, errors: ["Product unavailable."] },
        { status: 404 }
      );
    }

    return json(result);
  } catch (error) {
    console.error("Failed to load product by slug:", error);
    return json(
      { product: null, errors: ["Unable to load product."] },
      { status: 500 }
    );
  }
}
