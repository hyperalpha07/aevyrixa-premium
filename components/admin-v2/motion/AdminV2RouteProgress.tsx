"use client";

import { Box } from "@mui/material";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

export function AdminV2RouteProgress() {
  const { routeProgressActive, reducedMotion } = useAdminV2Motion();

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: routeProgressActive ? 1 : 0,
        transition: reducedMotion ? "none" : `opacity ${adminV2Motion.duration.micro}ms ${adminV2Motion.easing.standard}`,
        "&::before": {
          content: '""',
          display: "block",
          height: "100%",
          width: routeProgressActive ? "72%" : "0%",
          borderRadius: 999,
          background: "linear-gradient(90deg, #7c3aed, #ea4c89, #22d3ee)",
          transition: reducedMotion
            ? "none"
            : `width ${routeProgressActive ? 900 : 160}ms ${adminV2Motion.easing.entrance}`,
        },
      }}
    />
  );
}
