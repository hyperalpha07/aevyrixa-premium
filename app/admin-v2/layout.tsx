import type { Metadata } from "next";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { AdminV2Shell } from "@/components/admin-v2/core/AdminV2Shell";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";
import { brandName } from "@/configs/brand/noromi";

export const metadata: Metadata = {
  title: { absolute: `Admin V2 | ${brandName}` },
  description: `${brandName} Admin`,
  robots: { index: false, follow: false },
};

export default async function AdminV2Layout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminV2Session();
  const dashboardData = await getAdminV2DashboardData();

  return (
    <div data-admin-v2-root>
      <AdminV2Shell session={session} dashboardData={dashboardData}>
        {children}
      </AdminV2Shell>
    </div>
  );
}
