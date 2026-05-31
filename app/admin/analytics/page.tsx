import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/app/admin/admin-panel";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Analytics | Aevyrixa Admin",
  description: "View Aevyrixa Her Care admin analytics.",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "analytics")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="analytics" initialSession={session} />;
}
