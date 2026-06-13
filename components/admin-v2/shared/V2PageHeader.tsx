import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";

type V2PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

export function V2PageHeader({ title, description, actions, breadcrumbs }: V2PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs ? <V2Breadcrumbs items={breadcrumbs} /> : null}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions}
      </Stack>
    </Box>
  );
}
