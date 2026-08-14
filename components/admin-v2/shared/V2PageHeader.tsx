import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { AdminV2Reveal } from "@/components/admin-v2/motion/AdminV2Reveal";

type V2PageHeaderProps = {
  title: string;
  titleId?: string;
  titleComponent?: "h1" | "h2";
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

export function V2PageHeader({
  title,
  titleId,
  titleComponent,
  description,
  actions,
  breadcrumbs,
}: V2PageHeaderProps) {
  return (
    <AdminV2Reveal sx={{ mb: 3 }}>
      {breadcrumbs ? <V2Breadcrumbs items={breadcrumbs} /> : null}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Box>
          {titleComponent ? (
            <Typography id={titleId} component={titleComponent} variant="h4">
              {title}
            </Typography>
          ) : (
            <Typography id={titleId} variant="h4">
              {title}
            </Typography>
          )}
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions}
      </Stack>
    </AdminV2Reveal>
  );
}
