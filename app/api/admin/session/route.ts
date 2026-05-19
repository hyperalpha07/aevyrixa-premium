import { getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  return Response.json({ session });
}
