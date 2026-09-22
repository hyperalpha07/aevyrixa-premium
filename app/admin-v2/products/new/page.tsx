import type { Metadata } from "next";
import { AdminV2NewProductView } from "@/components/admin-v2/views/products/AdminV2NewProductView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { canAccessAdminV2Module, requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export const metadata: Metadata = {
  title: "New Product",
};

export default async function AdminV2NewProductPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "productNew");

  return <AdminV2NewProductView canManageMedia={canAccessAdminV2Module(session, "productMedia")} />;
}
