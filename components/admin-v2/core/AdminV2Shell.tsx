"use client";

import { Box, Drawer } from "@mui/material";
import { useState } from "react";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import { AdminV2NotificationDrawer } from "@/components/admin-v2/core/AdminV2NotificationDrawer";
import { AdminV2CommandPalette } from "@/components/admin-v2/core/AdminV2CommandPalette";
import { AdminV2Footer } from "@/components/admin-v2/layouts/AdminV2Footer";
import { AdminV2Sidebar } from "@/components/admin-v2/navigation/AdminV2Sidebar";
import { AdminV2ThemeProvider, useAdminV2Theme } from "@/components/admin-v2/theme/AdminV2ThemeProvider";
import { AdminV2Topbar } from "@/components/admin-v2/layouts/AdminV2Topbar";
import {
  AdminV2AmbientBackground,
  AdminV2MotionProvider,
  AdminV2PageTransition,
} from "@/components/admin-v2/motion";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";

const expandedWidth = 278;
const collapsedWidth = 86;

type AdminV2ShellProps = {
  session: AdminSessionUser;
  dashboardData?: AdminV2DashboardData;
  children: React.ReactNode;
};

function AdminV2ShellContent({ session, dashboardData, children }: AdminV2ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { contentWidth, navigationStyle } = useAdminV2Theme();
  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth;
  const notificationCount =
    (dashboardData?.orders.pending ?? 0) + (dashboardData?.reviews.pending ?? 0) + (dashboardData?.support.open ?? 0);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      <AdminV2AmbientBackground />
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "block" },
          width: sidebarWidth,
          transition: "width 220ms cubic-bezier(0.2, 0, 0, 1)",
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: navigationStyle === "bordered" ? "divider" : "transparent",
          bgcolor: "background.paper",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 2,
        }}
      >
        <AdminV2Sidebar session={session} collapsed={collapsed} />
      </Box>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", lg: "none" } }}
        slotProps={{
          root: { keepMounted: true },
          backdrop: {
            sx: {
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(15, 23, 42, 0.34)",
            },
          },
          paper: { sx: { width: expandedWidth, transition: "transform 260ms cubic-bezier(0.2, 0, 0, 1)" } },
        }}
      >
        <AdminV2Sidebar session={session} collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </Drawer>
      <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <AdminV2Topbar
          session={session}
          onOpenMobileNav={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          notificationCount={notificationCount}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: contentWidth === "compact" ? 1440 : "none",
            mx: "auto",
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 2.5, lg: 4 },
          }}
        >
          <AdminV2PageTransition>{children}</AdminV2PageTransition>
        </Box>
        <AdminV2Footer />
      </Box>
      <AdminV2CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} session={session} />
      <AdminV2NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        data={dashboardData}
      />
    </Box>
  );
}

export function AdminV2Shell(props: AdminV2ShellProps) {
  return (
    <AdminV2ThemeProvider>
      <AdminV2MotionProvider>
        <AdminV2ShellContent {...props} />
      </AdminV2MotionProvider>
    </AdminV2ThemeProvider>
  );
}
