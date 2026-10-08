import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { ApprovalStoreError, decideApproval } from "@/lib/admin-v2/approvals/approvals-store";

export const dynamic = "force-dynamic";

function approvalError(error: unknown) {
  if (error instanceof ApprovalStoreError) return Response.json({ errors: [error.message] }, { status: error.status });
  return Response.json({ errors: ["Approval decision failed."] }, { status: 503 });
}

export async function POST(request: Request, context: RouteContext<"/api/admin/approvals/[id]/decision">) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "approvals.decide")) return forbiddenAdminResponse();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  try {
    return Response.json({ approval: await decideApproval(session, id, body) });
  } catch (error) {
    return approvalError(error);
  }
}
