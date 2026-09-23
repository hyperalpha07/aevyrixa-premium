import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { getAdminSupportInbox } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function GET(request: Request) {
  if (!(await verifyFreshAdminRequestPermission(request, "support.view"))) return forbiddenAdminResponse();

  try {
    return json({ conversations: await getAdminSupportInbox() });
  } catch (error) {
    console.error("Failed to load admin support conversations:", error);
    return json({ conversations: [], error: "Could not load conversations." });
  }
}
