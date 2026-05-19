import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import {
  canAccessSection,
  firstAccessibleAdminPath,
} from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Categories | Aevyrixa Admin",
  description: "Manage category cards, status, media, sort order, and display settings.",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "categories")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="categories" initialSession={session} />;
}
