import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Orders | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test orders.",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="orders" />;
}
