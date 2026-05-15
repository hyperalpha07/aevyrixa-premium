import {
  createProduct,
  listProducts,
  validateProductInput,
} from "@/app/lib/product-store";
import type { ProductMutationInput } from "@/app/lib/product-types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function productInput(payload: unknown): ProductMutationInput | null {
  if (!isRecord(payload)) return null;
  return payload as ProductMutationInput;
}

function includeDraftsFromRequest(request: Request) {
  const url = new URL(request.url);
  return (
    url.searchParams.get("scope") === "admin" ||
    url.searchParams.get("admin") === "1"
  );
}

export async function GET(request: Request) {
  try {
    const result = await listProducts({
      includeDrafts: includeDraftsFromRequest(request),
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to list products:", error);
    return Response.json(
      { products: [], errors: ["Unable to load products."] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const input = productInput(payload);
  if (!input) {
    return Response.json({ errors: ["Invalid product payload."] }, { status: 400 });
  }

  const { errors } = validateProductInput(input);
  if (errors.length > 0) return Response.json({ errors }, { status: 400 });

  try {
    const result = await createProduct(input);
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return Response.json(
      { errors: ["Product could not be created."] },
      { status: 500 }
    );
  }
}
