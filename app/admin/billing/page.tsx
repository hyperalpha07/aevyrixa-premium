import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/app/admin/admin-panel";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Billing | Aevyrixa Admin",
  description: "Review Aevyrixa Her Care finance and billing summaries.",
  robots: { index: false, follow: false },
};

export default async function AdminBillingPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "billing")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="billing" initialSession={session} />;
}
