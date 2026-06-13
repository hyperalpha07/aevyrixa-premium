import type { Metadata } from "next";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { AdminV2Shell } from "@/components/admin-v2/core/AdminV2Shell";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";
import {
  adminV2ColorSchemeAttribute,
  adminV2DefaultColorScheme,
  adminV2DefaultThemeSettings,
  adminV2ThemeStorageKey,
} from "@/configs/admin-v2/theme";

export const metadata: Metadata = {
  title: "Admin V2 | Aevyrixa Her Care",
  description: "Aevyrixa Her Care Admin V2",
  robots: { index: false, follow: false },
};

const adminV2InitColorSchemeScript = `
(function() {
  try {
    var raw = window.localStorage.getItem(${JSON.stringify(adminV2ThemeStorageKey)});
    var settings = raw ? JSON.parse(raw) : null;
    var mode = settings && (settings.mode === "light" || settings.mode === "dark" || settings.mode === "system")
      ? settings.mode
      : ${JSON.stringify(adminV2DefaultThemeSettings.mode)};
    var resolvedMode = mode === "system"
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.setAttribute(${JSON.stringify(adminV2ColorSchemeAttribute)}, resolvedMode);
    document.documentElement.style.colorScheme = resolvedMode;
  } catch (error) {
    document.documentElement.setAttribute(${JSON.stringify(adminV2ColorSchemeAttribute)}, ${JSON.stringify(adminV2DefaultColorScheme)});
    document.documentElement.style.colorScheme = ${JSON.stringify(adminV2DefaultColorScheme)};
  }
})();
`;

export default async function AdminV2Layout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminV2Session();
  const dashboardData = await getAdminV2DashboardData();

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: adminV2InitColorSchemeScript }} />
      <AdminV2Shell session={session} dashboardData={dashboardData}>
        {children}
      </AdminV2Shell>
    </>
  );
}
