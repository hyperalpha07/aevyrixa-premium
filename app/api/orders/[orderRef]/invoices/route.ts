import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import {
  AdminV2ActorIdentityError,
  getOrderByReference,
  issueOrderInvoice,
  listOrderInvoices,
  OrderStoreError,
  resolveTrustedAdminActor,
} from "@/app/lib/order-store";

export const dynamic = "force-dynamic";

function logOrderInvoiceError(action: string, orderRef: string, error: unknown) {
  if (error instanceof OrderStoreError) {
    console.error(`[admin-v2:order-invoices] ${action} failed`, {
      orderRef,
      status: error.status,
      code: error.code,
      operation: error.operation,
      details: error.details,
      hint: error.hint,
    });
    return;
  }

  console.error(`[admin-v2:order-invoices] ${action} failed`, {
    orderRef,
    error: error instanceof Error ? error.message : String(error),
  });
}

function orderInvoiceErrorResponse(error: unknown, fallback: string) {
  if (error instanceof AdminV2ActorIdentityError) {
    return Response.json({ errors: ["Invoice issuer identity is unavailable."], code: error.code }, { status: error.status });
  }

  if (error instanceof OrderStoreError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    const message =
      error.code === "INVOICE_FINANCIAL_SNAPSHOT_INCOMPLETE"
        ? "Invoice financial snapshot is incomplete."
        : `${fallback}: ${error.code}`;
    return Response.json({ errors: [message], code: error.code }, { status });
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
    return Response.json({ invoices: await listOrderInvoices(orderRef) });
  } catch (error) {
    logOrderInvoiceError("list", orderRef, error);
    return orderInvoiceErrorResponse(error, "Order invoices could not be loaded");
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
    return orderInvoiceErrorResponse(error, "Invoice issuer identity is unavailable.");
  }

  const { orderRef } = await context.params;
  const existing = await getOrderByReference(orderRef);
  if (!existing.order) {
    return Response.json({ errors: ["Order was not found."] }, { status: 404 });
  }

  try {
    const invoice = await issueOrderInvoice({ order: existing.order, actor: session });
    return Response.json({ invoice }, { status: 201 });
  } catch (error) {
    logOrderInvoiceError("issue", orderRef, error);
    return orderInvoiceErrorResponse(error, "Invoice creation failed");
  }
}
