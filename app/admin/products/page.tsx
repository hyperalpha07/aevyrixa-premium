import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Products | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test products.",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="products" />;
}
