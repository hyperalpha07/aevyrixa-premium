import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  addOrderNote,
  AdminV2ActorIdentityError,
  getOrderByReference,
  listOrderNotes,
  OrderStoreError,
  resolveTrustedAdminActor,
} from "@/app/lib/order-store";
import { validateAdminV2OrderNote } from "@/lib/admin-v2/orders/order-note-validation";

export const dynamic = "force-dynamic";

function logOrderNotesError(action: string, orderRef: string, error: unknown) {
  if (error instanceof OrderStoreError) {
    console.error(`[admin-v2:order-notes] ${action} failed`, {
      orderRef,
      status: error.status,
      code: error.code,
      operation: error.operation,
      details: error.details,
      hint: error.hint,
    });
    return;
  }

  console.error(`[admin-v2:order-notes] ${action} failed`, {
    orderRef,
    error: error instanceof Error ? error.message : String(error),
  });
}

function orderNotesErrorResponse(error: unknown, fallback: string) {
  if (error instanceof AdminV2ActorIdentityError) {
    return Response.json({ errors: [error.message], code: error.code }, { status: error.status });
  }

  if (error instanceof OrderStoreError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return Response.json(
      { errors: [`${fallback}: ${error.code}`], code: error.code },
      { status }
    );
  }

  return Response.json({ errors: [fallback] }, { status: 500 });
}

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
    logOrderNotesError("list", orderRef, error);
    return orderNotesErrorResponse(error, "Order notes could not be loaded");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderRef: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.editStatus")) return forbiddenAdminResponse();
  try {
    resolveTrustedAdminActor(session);
  } catch (error) {
    return orderNotesErrorResponse(error, "Your admin identity could not be verified.");
  }

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
    logOrderNotesError("insert", orderRef, error);
    return orderNotesErrorResponse(error, "The note could not be saved");
  }
}
