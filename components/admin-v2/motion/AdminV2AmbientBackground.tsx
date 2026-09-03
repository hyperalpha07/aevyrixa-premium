"use client";

import { Box } from "@mui/material";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

export function AdminV2AmbientBackground() {
  const { reducedMotion } = useAdminV2Motion();

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          width: { xs: 260, md: 460 },
          height: { xs: 260, md: 460 },
          borderRadius: "999px",
          filter: "blur(58px)",
          opacity: (theme) => (theme.palette.mode === "dark" ? 0.18 : 0.12),
          transform: "translate3d(0, 0, 0)",
          animation: reducedMotion
            ? "none"
            : `admin-v2-ambient-drift ${adminV2Motion.duration.ambient}ms ease-in-out infinite alternate`,
        },
        "&::before": {
          top: "10%",
          right: "4%",
          background: "linear-gradient(135deg, #7c3aed, #ea4c89)",
        },
        "&::after": {
          left: "8%",
          bottom: "2%",
          background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
          animationDirection: "alternate-reverse",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: (theme) => (theme.palette.mode === "dark" ? 0.08 : 0.06),
          backgroundImage:
            "linear-gradient(rgba(124,58,237,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at 50% 0%, black, transparent 70%)",
        }}
      />
    </Box>
  );
}
