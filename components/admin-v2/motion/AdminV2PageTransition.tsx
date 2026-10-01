"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

export function AdminV2PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reducedMotion, finishRouteProgress } = useAdminV2Motion();
  const supportWorkspace = pathname === "/admin-v2/support";

  useEffect(() => {
    finishRouteProgress();
  }, [finishRouteProgress, pathname]);

  return (
    <Box
      key={pathname}
      sx={{
        minWidth: 0,
        ...(supportWorkspace ? {
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        } : {}),
        animation: reducedMotion
          ? "none"
          : `admin-v2-page-enter ${adminV2Motion.duration.page}ms ${adminV2Motion.easing.entrance} both`,
      }}
    >
      {children}
    </Box>
  );
}
