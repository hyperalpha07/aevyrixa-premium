"use client";

import { IconButton, Tooltip } from "@mui/material";
import type { IconButtonProps } from "@mui/material";
import { adminV2Motion, adminV2Transition } from "@/components/admin-v2/motion/motion-config";

type V2IconButtonProps = IconButtonProps & {
  label: string;
};

export function V2IconButton({ label, sx, ...props }: V2IconButtonProps) {
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        sx={{
          transition: adminV2Transition(["transform", "background-color", "box-shadow"], adminV2Motion.duration.micro),
          "&:active": {
            transform: "scale(0.94)",
          },
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
          ...sx,
        }}
        {...props}
      />
    </Tooltip>
  );
}
