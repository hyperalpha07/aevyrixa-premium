import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getOrderByReference, listOrderEvents } from "@/app/lib/order-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderRef: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.view")) return forbiddenAdminResponse();

  const { orderRef } = await context.params;
  const existing = await getOrderByReference(orderRef);
  if (!existing.order) {
    return Response.json({ errors: ["Order was not found."] }, { status: 404 });
  }

  try {
    return Response.json({ events: await listOrderEvents(orderRef) });
  } catch (error) {
    console.error("Failed to list order events:", error);
    return Response.json({ errors: ["Order events could not be loaded."] }, { status: 500 });
  }
}
