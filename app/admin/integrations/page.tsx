import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/app/admin/admin-panel";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Integrations | Aevyrixa Admin",
  description: "Review Aevyrixa Her Care system integrations.",
  robots: { index: false, follow: false },
};

export default async function AdminIntegrationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "integrations")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="integrations" initialSession={session} />;
}
