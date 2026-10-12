import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { adminFinanceActor, callAdminFinanceRpc } from "@/app/lib/admin-finance";
import { validateFinancePaymentPayload } from "@/app/lib/admin-finance-validation";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getOrderByReference } from "@/app/lib/order-store";
import { getAdminV2OrderAmounts } from "@/lib/admin-v2/orders/order-amounts";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "finance.payments.record")) return forbiddenAdminResponse();
  const input = await request.json().catch(() => null);
  if (!isRecord(input)) return Response.json({ errors: ["Invalid payment payload."] }, { status: 400 });
  const payload = validateFinancePaymentPayload(input);
  if (!payload.ok) return Response.json({ errors: payload.errors }, { status: 400 });
  try {
    const orderRef = payload.value.orderRef ?? "";
    const existing = await getOrderByReference(orderRef);
    if (!existing.order) {
      return Response.json({ errors: ["Order was not found."] }, { status: 404 });
    }
    const amounts = getAdminV2OrderAmounts(existing.order);
    if (amounts.discrepancy) {
      return Response.json(
        {
          errors: [
            "Payment recording is blocked because this order has a stored-total mismatch. Resolve the reconciliation discrepancy before creating a finance ledger entry.",
          ],
        },
        { status: 409 }
      );
    }
    const result = await callAdminFinanceRpc("admin_v2_record_payment", {
      p_order_ref: payload.value.orderRef,
      p_amount: payload.value.amount,
      p_currency_code: payload.value.currencyCode,
      p_payment_method: payload.value.paymentMethod,
      p_external_reference: payload.value.externalReference,
      p_note: payload.value.note,
      p_occurred_at: payload.value.occurredAt,
      p_request_key: payload.value.requestKey,
      ...adminFinanceActor(session),
    });
    return Response.json({ payment: result });
  } catch {
    return Response.json({ errors: ["Payment could not be recorded."] }, { status: 409 });
  }
}
