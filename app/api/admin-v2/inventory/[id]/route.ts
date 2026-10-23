import {
  forbiddenAdminResponse, verifyFreshAdminRequestPermission,
} from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { listProducts, productStoreErrorResponse, updateProduct } from "@/app/lib/product-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const stockStates = ["in_stock", "low_stock", "preorder", "out_of_stock"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await verifyFreshAdminRequestPermission(request, "products.edit");
  if (!session) return forbiddenAdminResponse();

  const { id } = await context.params;
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return Response.json({ errors: ["Invalid inventory request."] }, { status: 400 });
  }
  if (!isRecord(raw)) return Response.json({ errors: ["Invalid inventory request."] }, { status: 400 });
  const { stockStatus, stockQuantity, previousStockStatus, previousStockQuantity } = raw;
  const quantity = stockQuantity;
  if (
    !stockStates.some((value) => value === stockStatus) ||
    !Number.isSafeInteger(quantity) || typeof quantity !== "number" ||
    quantity < 0 || quantity > 1000000 ||
    ((stockStatus === "in_stock" || stockStatus === "low_stock") && quantity === 0) ||
    (stockStatus === "out_of_stock" && quantity !== 0)
  ) return Response.json({ errors: ["Invalid stock status or quantity."] }, { status: 400 });

  try {
    const result = await listProducts({ scope: "admin" });
    if (result.storageMode !== "supabase") return Response.json({ errors: ["Live inventory source is unavailable."] }, { status: 503 });
    const current = result.products.find((product) => product.id === id);
    if (!current) return Response.json({ errors: ["Product no longer exists or is deleted."] }, { status: 404 });
    if (current.stockStatus !== previousStockStatus ||
      (current.stockQuantity ?? null) !== previousStockQuantity) {
      return Response.json({ errors: ["Inventory was changed by another editor. Refresh and try again."] }, { status: 409 });
    }
    if (current.stockStatus === stockStatus && (current.stockQuantity ?? null) === quantity) {
      return Response.json({ ok: true, unchanged: true }, { headers: { "cache-control": "no-store" } });
    }
    const updated = await updateProduct(id, { stockStatus: stockStatus as typeof stockStates[number], stockQuantity: quantity });
    if (updated.storageMode !== "supabase" || !updated.product) {
      return Response.json({ errors: ["The inventory change could not be verified."] }, { status: 503 });
    }
    await logStaffActivity({
      actor: session,
      action: "product.updated",
      targetType: "product",
      targetId: id,
      metadata: {
        operation: "admin-v2-inventory",
        before: { stockStatus: current.stockStatus, stockQuantity: current.stockQuantity },
        after: { stockStatus, stockQuantity: quantity },
      },
    });
    return Response.json({
      ok: true, product: { id: updated.product.id, stockStatus: updated.product.stockStatus, stockQuantity: updated.product.stockQuantity },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[admin-v2:inventory] Stock update failed", error instanceof Error ? error.message : "Unknown error");
    const detail = productStoreErrorResponse(error, "Inventory could not be updated.");
    return Response.json(detail.body, { status: detail.status });
  }
}
