import { redirect } from "next/navigation";
import AdminPanel from "@/app/admin/admin-panel";
import { getAdminSession } from "@/app/lib/admin-auth";
import { canAccessSection, firstAccessibleAdminPath } from "@/app/lib/admin-permissions";

export default async function AdminReviewsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (!canAccessSection(session, "reviews")) {
    redirect(firstAccessibleAdminPath(session) ?? "/admin/login");
  }

  return <AdminPanel view="reviews" initialSession={session} />;
}
