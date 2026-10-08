import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { ApprovalStoreError, getApproval } from "@/lib/admin-v2/approvals/approvals-store";

export const dynamic = "force-dynamic";

function approvalError(error: unknown) {
  if (error instanceof ApprovalStoreError) return Response.json({ errors: [error.message] }, { status: error.status });
  return Response.json({ errors: ["Approval request failed."] }, { status: 503 });
}

export async function GET(_request: Request, context: RouteContext<"/api/admin/approvals/[id]">) {
  const session = await getFreshAdminRequestSession(_request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "approvals.view")) return forbiddenAdminResponse();
  const { id } = await context.params;
  try {
    return Response.json({ approval: await getApproval(session, id) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return approvalError(error);
  }
}
