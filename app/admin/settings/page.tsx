import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Settings | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care admin settings placeholders.",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="settings" />;
}
