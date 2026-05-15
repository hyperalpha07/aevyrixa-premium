import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "./admin-panel";

export const metadata: Metadata = {
  title: "Aevyrixa Admin",
  description: "Local admin dashboard for Aevyrixa Her Care test orders.",
};

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="dashboard" />;
}
