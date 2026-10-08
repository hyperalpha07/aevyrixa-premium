import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { ApprovalStoreError, createApproval, listApprovals } from "@/lib/admin-v2/approvals/approvals-store";

export const dynamic = "force-dynamic";

function approvalError(error: unknown) {
  if (error instanceof ApprovalStoreError) {
    return Response.json({ errors: [error.message] }, { status: error.status });
  }
  return Response.json({ errors: ["Approval request failed."] }, { status: 503 });
}

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "approvals.view")) return forbiddenAdminResponse();
  const url = new URL(request.url);
  try {
    const approvals = await listApprovals(session, url.searchParams.get("status") ?? "pending", url.searchParams.get("mine") === "1");
    return Response.json({ approvals }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return approvalError(error);
  }
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "approvals.request")) return forbiddenAdminResponse();
  const body = await request.json().catch(() => null);
  try {
    const approval = await createApproval(session, body);
    return Response.json({ approval }, { status: 201 });
  } catch (error) {
    return approvalError(error);
  }
}
