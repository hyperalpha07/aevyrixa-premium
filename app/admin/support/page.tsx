import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import {
  canAccessSection,
  firstAccessibleAdminPath,
} from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Support Inbox | Aevyrixa Admin",
  description: "Manage customer support conversations.",
  robots: { index: false, follow: false },
};

export default async function AdminSupportPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "support")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="support" initialSession={session} />;
}
