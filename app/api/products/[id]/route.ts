import {
  deleteProduct,
  updateProduct,
  validateProductInput,
} from "@/app/lib/product-store";
import type { ProductMutationInput } from "@/app/lib/product-types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return json({ errors: ["Invalid product payload."] }, { status: 400 });
  }

  const input = payload as ProductMutationInput;
  const { errors } = validateProductInput(input, { partial: true });
  if (errors.length > 0) return json({ errors }, { status: 400 });

  try {
    const result = await updateProduct(id, input);

    if (!result.product) {
      return json(
        { errors: ["Product was not found."], storageMode: result.storageMode },
        { status: 404 }
      );
    }

    return json(result);
  } catch (error) {
    console.error("Failed to update product:", error);
    return json(
      { errors: ["Product could not be updated."], detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const result = await deleteProduct(id);

    if (!result.product) {
      return json(
        { errors: ["Product was not found."], storageMode: result.storageMode },
        { status: 404 }
      );
    }

    return json(result);
  } catch (error) {
    console.error("Failed to disable product:", error);
    return json(
      { errors: ["Product could not be disabled."], detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
