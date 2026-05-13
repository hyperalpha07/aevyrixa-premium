import { updateOrderStatus } from "@/app/lib/order-store";
import { orderStatuses, type OrderStatus } from "@/app/lib/order-types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderRef: string }> }
) {
  const { orderRef } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const status = isRecord(payload) ? payload.status : undefined;
  if (!orderStatuses.includes(status as OrderStatus)) {
    return Response.json(
      { errors: ["Valid order status is required."] },
      { status: 400 }
    );
  }

  try {
    const result = await updateOrderStatus(orderRef, status as OrderStatus);

    if (!result.order) {
      return Response.json(
        { errors: ["Order was not found."], storageMode: result.storageMode },
        { status: 404 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return Response.json(
      { errors: ["Order status could not be updated."] },
      { status: 500 }
    );
  }
}
