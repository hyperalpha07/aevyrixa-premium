import { Box, Stack, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

type V2EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
};

export function V2EmptyState({ icon: Icon, title, description, actionHref, actionLabel, compact }: V2EmptyStateProps) {
  return (
    <Box
      sx={{
        py: compact ? 3 : 5,
        px: 2,
        textAlign: "center",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "action.hover",
        animation: "admin-v2-reveal 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        {Icon ? (
          <Box
            sx={{
              width: compact ? 38 : 48,
              height: compact ? 38 : 48,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: "action.selected",
            }}
          >
            <Icon size={compact ? 21 : 26} />
          </Box>
        ) : null}
        <Typography variant={compact ? "subtitle1" : "h6"}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
          {description}
        </Typography>
        {actionHref && actionLabel ? (
          <V2Button href={actionHref} variant="contained" size="small">
            {actionLabel}
          </V2Button>
        ) : null}
      </Stack>
    </Box>
  );
}
