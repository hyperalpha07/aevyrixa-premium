import { Box, Stack, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { V2Card } from "@/components/admin-v2/shared/V2Card";

type V2MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info" | "error";
};

export function V2MetricCard({ label, value, helper, icon: Icon, tone = "primary" }: V2MetricCardProps) {
  return (
    <V2Card>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.75 }}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: `${tone}.main`,
            bgcolor: `${tone}.main`,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? `${theme.palette[tone].main}22` : `${theme.palette[tone].main}14`,
          }}
        >
          <Icon size={21} />
        </Box>
      </Stack>
    </V2Card>
  );
}
