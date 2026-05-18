import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Orders | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test orders.",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasPermission(session, "orders.view")) redirect("/admin");

  return <AdminPanel view="orders" initialSession={session} />;
}
