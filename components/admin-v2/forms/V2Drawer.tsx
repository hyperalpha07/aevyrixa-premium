import { Drawer, Box, Typography } from "@mui/material";
import type { DrawerProps } from "@mui/material";

type V2DrawerProps = DrawerProps & {
  title: string;
};

export function V2Drawer({ title, children, ...props }: V2DrawerProps) {
  return (
    <Drawer anchor="right" {...props}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </Box>
    </Drawer>
  );
}
