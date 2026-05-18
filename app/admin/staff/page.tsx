import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Staff | Aevyrixa Admin",
  description: "Manage staff roles and permissions.",
  robots: { index: false, follow: false },
};

export default async function AdminStaffPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasPermission(session, "staff.manage") && !hasPermission(session, "activity.view")) {
    redirect("/admin");
  }

  return <AdminPanel view="staff" initialSession={session} />;
}
