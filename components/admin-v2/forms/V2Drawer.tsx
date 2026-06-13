import { Drawer, Box, Typography } from "@mui/material";
import type { DrawerProps } from "@mui/material";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

type V2DrawerProps = DrawerProps & {
  title: string;
};

export function V2Drawer({ title, children, ...props }: V2DrawerProps) {
  return (
    <Drawer
      anchor="right"
      {...props}
      slotProps={{
        ...props.slotProps,
        backdrop: {
          sx: { backdropFilter: "blur(2px)", backgroundColor: "rgba(15, 23, 42, 0.34)" },
        },
        paper: {
          sx: {
            transition: `transform ${adminV2Motion.duration.overlay}ms ${adminV2Motion.easing.entrance}`,
          },
        },
      }}
    >
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </Box>
    </Drawer>
  );
}
