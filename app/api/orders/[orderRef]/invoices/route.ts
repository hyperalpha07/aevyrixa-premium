import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getOrderByReference, issueOrderInvoice, listOrderInvoices } from "@/app/lib/order-store";

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
    return Response.json({ invoices: await listOrderInvoices(orderRef) });
  } catch (error) {
    console.error("Failed to list order invoices:", error);
    return Response.json({ errors: ["Order invoices could not be loaded."] }, { status: 500 });
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
  const existing = await getOrderByReference(orderRef);
  if (!existing.order) {
    return Response.json({ errors: ["Order was not found."] }, { status: 404 });
  }

  try {
    const invoice = await issueOrderInvoice({ order: existing.order, actor: session });
    return Response.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Failed to issue order invoice:", error);
    return Response.json({ errors: ["Order invoice could not be issued."] }, { status: 500 });
  }
}
