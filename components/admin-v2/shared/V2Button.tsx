"use client";

import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";
import Link from "next/link";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";
import { adminV2Motion, adminV2Transition } from "@/components/admin-v2/motion/motion-config";

type V2ButtonProps = Omit<ButtonProps, "component" | "href"> & {
  href?: string;
  success?: boolean;
};

export function V2Button({ href, disabled, loading, success, sx, onClick, ...props }: V2ButtonProps) {
  const { startRouteProgress } = useAdminV2Motion();
  const motionSx = {
    transition: adminV2Transition(["transform", "box-shadow", "background-color", "border-color"], adminV2Motion.duration.micro),
    "&:active": {
      transform: disabled || loading ? "none" : "scale(0.985)",
    },
    "&.Mui-focusVisible": {
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: 2,
    },
    ...sx,
  };

  if (href && !disabled && !loading) {
    return (
      <Link href={href} style={{ textDecoration: "none" }} onClick={startRouteProgress}>
        <Button component="span" loading={loading} color={success ? "success" : props.color} sx={motionSx} {...props} />
      </Link>
    );
  }

  return (
    <Button
      disabled={disabled}
      loading={loading}
      color={success ? "success" : props.color}
      onClick={onClick}
      sx={motionSx}
      {...props}
    />
  );
}
