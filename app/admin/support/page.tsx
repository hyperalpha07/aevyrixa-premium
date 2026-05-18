import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Support Inbox | Aevyrixa Admin",
  description: "Manage customer support conversations.",
  robots: { index: false, follow: false },
};

export default async function AdminSupportPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="support" />;
}
