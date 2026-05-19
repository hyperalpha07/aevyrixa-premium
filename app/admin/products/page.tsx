import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import {
  canAccessSection,
  firstAccessibleAdminPath,
} from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Products | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test products.",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "products")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="products" initialSession={session} />;
}
