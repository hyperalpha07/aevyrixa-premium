"use client";

import { Box } from "@mui/material";
import type { BoxProps } from "@mui/material";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

type AdminV2RevealProps = BoxProps & {
  delay?: number;
};

export function AdminV2Reveal({ delay = 0, sx, children, ...props }: AdminV2RevealProps) {
  const { reducedMotion } = useAdminV2Motion();

  return (
    <Box
      sx={{
        animation: reducedMotion
          ? "none"
          : `admin-v2-reveal ${adminV2Motion.duration.page}ms ${adminV2Motion.easing.entrance} both`,
        animationDelay: reducedMotion ? "0ms" : `${delay}ms`,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
