import {
  unauthorizedAdminResponse,
  verifyAdminRequest,
} from "@/app/lib/admin-auth";
import {
  createProduct,
  listProducts,
  productStoreErrorResponse,
  validateProductInput,
} from "@/app/lib/product-store";
import type { ProductMutationInput } from "@/app/lib/product-types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function productInput(payload: unknown): ProductMutationInput | null {
  if (!isRecord(payload)) return null;
  return payload as ProductMutationInput;
}

function includeDraftsFromRequest(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  if (scope === "deleted") return "deleted";
  if (scope === "admin" || url.searchParams.get("admin") === "1") return "admin";
  return "public";
}

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}

export async function GET(request: Request) {
  const scope = includeDraftsFromRequest(request);
  if (scope !== "public" && !verifyAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const result = await listProducts({
      scope,
    });

    return json(result);
  } catch (error) {
    console.error("Failed to list products:", error);
    return json(
      { products: [], errors: ["Unable to load products."] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const input = productInput(payload);
  if (!input) {
    return json({ errors: ["Invalid product payload."] }, { status: 400 });
  }

  const { errors } = validateProductInput(input);
  if (errors.length > 0) return json({ errors }, { status: 400 });

  try {
    const result = await createProduct(input);
    return json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    const response = productStoreErrorResponse(
      error,
      "Product could not be created."
    );
    return json(response.body, { status: response.status });
  }
}
