import { Menu } from "@mui/material";
import type { MenuProps } from "@mui/material";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

export function V2Dropdown(props: MenuProps) {
  return (
    <Menu
      elevation={8}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      {...props}
      slotProps={{
        ...props.slotProps,
        paper: {
          sx: {
            mt: 1,
            animation: `admin-v2-reveal ${adminV2Motion.duration.micro}ms ${adminV2Motion.easing.entrance} both`,
          },
        },
      }}
    />
  );
}
