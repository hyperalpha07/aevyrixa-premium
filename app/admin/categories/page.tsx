import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Categories | Aevyrixa Admin",
  description: "Manage category cards, status, media, sort order, and display settings.",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  return <AdminPanel view="categories" />;
}
