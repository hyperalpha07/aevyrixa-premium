import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { addOrderNote, getOrderByReference, listOrderNotes } from "@/app/lib/order-store";
import { validateAdminV2OrderNote } from "@/lib/admin-v2/orders/order-note-validation";

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
    return Response.json({ notes: await listOrderNotes(orderRef) });
  } catch (error) {
    console.error("Failed to list order notes:", error);
    return Response.json({ errors: ["Order notes could not be loaded."] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderRef: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.editStatus")) return forbiddenAdminResponse();

  const { orderRef } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const validation = validateAdminV2OrderNote(payload);
  if (!validation.noteBody || !validation.noteType) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  const existing = await getOrderByReference(orderRef);
  if (!existing.order) {
    return Response.json({ errors: ["Order was not found."] }, { status: 404 });
  }

  try {
    const note = await addOrderNote({
      orderRef,
      noteBody: validation.noteBody,
      noteType: validation.noteType,
      actor: session,
    });
    await logStaffActivity({
      actor: session,
      action: "order.note_added",
      targetType: "order",
      targetId: orderRef,
      metadata: { noteType: validation.noteType },
    });
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Failed to add order note:", error);
    return Response.json({ errors: ["Order note could not be saved."] }, { status: 500 });
  }
}
