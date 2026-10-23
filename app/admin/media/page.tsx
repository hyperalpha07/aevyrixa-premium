import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Media Vault | Aevyrixa Admin",
  description: "Manage Aevyrixa Her Care product media coverage.",
  robots: { index: false, follow: false },
};

export default async function AdminMediaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canAccessSection(session, "media")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  redirect("/admin-v2/media");
}
