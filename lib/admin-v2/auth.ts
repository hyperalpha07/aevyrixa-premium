import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";

export async function requireAdminV2Session(): Promise<AdminSessionUser> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=/admin-v2");
  return session;
}
