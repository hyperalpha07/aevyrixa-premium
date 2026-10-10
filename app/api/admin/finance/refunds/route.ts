import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { adminFinanceActor, callAdminFinanceRpc } from "@/app/lib/admin-finance";
import { validateFinanceRefundPayload } from "@/app/lib/admin-finance-validation";
import { hasPermission } from "@/app/lib/admin-permissions";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "finance.refunds.record")) return forbiddenAdminResponse();
  const input = await request.json().catch(() => null);
  if (!isRecord(input)) return Response.json({ errors: ["Invalid refund payload."] }, { status: 400 });
  const payload = validateFinanceRefundPayload(input);
  if (!payload.ok) return Response.json({ errors: payload.errors }, { status: 400 });
  try {
    const result = await callAdminFinanceRpc("admin_v2_record_refund", {
      p_order_ref: payload.value.orderRef,
      p_payment_transaction_id: payload.value.paymentTransactionId,
      p_amount: payload.value.amount,
      p_currency_code: payload.value.currencyCode,
      p_refund_method: payload.value.refundMethod,
      p_external_reference: payload.value.externalReference,
      p_reason: payload.value.reason,
      p_note: payload.value.note,
      p_occurred_at: payload.value.occurredAt,
      p_request_key: payload.value.requestKey,
      ...adminFinanceActor(session),
    });
    return Response.json({ refund: result });
  } catch {
    return Response.json({ errors: ["Refund could not be recorded."] }, { status: 409 });
  }
}
