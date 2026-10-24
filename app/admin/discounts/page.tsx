import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/app/admin/admin-panel";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Discounts | Aevyrixa Admin",
  description: "Manage Aevyrixa Her Care promotion controls.",
  robots: { index: false, follow: false },
};

export default async function AdminDiscountsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "discounts")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="discounts" initialSession={session} />;
}
