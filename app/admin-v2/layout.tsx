import type { Metadata } from "next";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { AdminV2Shell } from "@/components/admin-v2/core/AdminV2Shell";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";

export const metadata: Metadata = {
  title: "Admin V2 | Aevyrixa Her Care",
  description: "Aevyrixa Her Care Admin V2",
  robots: { index: false, follow: false },
};

export default async function AdminV2Layout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminV2Session();
  const dashboardData = await getAdminV2DashboardData();

  return (
    <AdminV2Shell session={session} dashboardData={dashboardData}>
      {children}
    </AdminV2Shell>
  );
}
