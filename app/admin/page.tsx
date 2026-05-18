import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import AdminPanel from "./admin-panel";

export const metadata: Metadata = {
  title: "Aevyrixa Admin",
  description: "Local admin dashboard for Aevyrixa Her Care test orders.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasPermission(session, "dashboard.view")) redirect("/admin/orders");

  return <AdminPanel view="dashboard" initialSession={session} />;
}
