import {
  deleteProduct,
  permanentlyDeleteProduct,
  productStoreErrorResponse,
  restoreProduct,
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

  if (payload.action === "restore") {
    try {
      const result = await restoreProduct(id);

      if (!result.product) {
        return json(
          { errors: ["Deleted product was not found."], storageMode: result.storageMode },
          { status: 404 }
        );
      }

      return json(result);
    } catch (error) {
      console.error("Failed to restore product:", error);
      const response = productStoreErrorResponse(
        error,
        "Product could not be restored."
      );
      return json(response.body, { status: response.status });
    }
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
    const response = productStoreErrorResponse(
      error,
      "Product could not be updated."
    );
    return json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const permanent = url.searchParams.get("permanent") === "1";

  try {
    if (permanent) {
      const result = await permanentlyDeleteProduct(id);

      if (!result.deleted) {
        return json(
          { errors: ["Deleted product was not found."], storageMode: result.storageMode },
          { status: 404 }
        );
      }

      return json(result);
    }

    const result = await deleteProduct(id);

    if (!result.product) {
      return json(
        { errors: ["Product was not found."], storageMode: result.storageMode },
        { status: 404 }
      );
    }

    return json(result);
  } catch (error) {
    console.error("Failed to delete product:", error);
    const response = productStoreErrorResponse(
      error,
      permanent
        ? "Product could not be permanently deleted."
        : "Product could not be deleted."
    );
    return json(response.body, { status: response.status });
  }
}
