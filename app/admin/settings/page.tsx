import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Settings | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care admin settings placeholders.",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasPermission(session, "settings.view")) redirect("/admin");

  return <AdminPanel view="settings" initialSession={session} />;
}
