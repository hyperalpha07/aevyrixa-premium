import { redirect } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

/** Customer live-chat conversations are already handled by the working Support Inbox. */
export default async function AdminV2ChatPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "chat");
  redirect("/admin-v2/support");
}
