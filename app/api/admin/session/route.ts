import { getAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  return Response.json({ session });
}
