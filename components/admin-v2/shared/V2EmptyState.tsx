import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type V2EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function V2EmptyState({ icon: Icon, title, description, actionHref, actionLabel }: V2EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 5,
        px: 2,
        textAlign: "center",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "action.hover",
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        {Icon ? <Icon size={28} /> : null}
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
          {description}
        </Typography>
        {actionHref && actionLabel ? (
          <Button component={Link} href={actionHref} variant="contained" size="small">
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
