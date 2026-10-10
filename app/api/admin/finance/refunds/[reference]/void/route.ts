import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { adminFinanceActor, callAdminFinanceRpc } from "@/app/lib/admin-finance";
import { validateFinanceVoidPayload } from "@/app/lib/admin-finance-validation";
import { hasPermission } from "@/app/lib/admin-permissions";

export const dynamic = "force-dynamic";
const voidReasonRequiredMessage = "Void reason is required.";

export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "finance.refunds.record")) return forbiddenAdminResponse();
  const { reference } = await context.params;
  const input = await request.json().catch(() => ({}));
  const payload = validateFinanceVoidPayload(input);
  if (!payload.ok) return Response.json({ errors: payload.errors }, { status: 400 });
  try {
    const result = await callAdminFinanceRpc("admin_v2_void_refund", {
      p_reference: decodeURIComponent(reference),
      p_void_reason: payload.value.reason,
      ...adminFinanceActor(session),
    });
    return Response.json({ refund: result });
  } catch {
    return Response.json({ errors: ["Refund could not be voided."] }, { status: 409 });
  }
}
