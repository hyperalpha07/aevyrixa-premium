import { Box, Stack, Typography } from "@mui/material";
import type { CardProps } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { AdminV2AnimatedNumber } from "@/components/admin-v2/motion/AdminV2AnimatedNumber";

type V2MetricCardProps = {
  label: string;
  value: string;
  animatedValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  helper?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info" | "error";
  sx?: CardProps["sx"];
};

export function V2MetricCard({
  label,
  value,
  animatedValue,
  prefix,
  suffix,
  decimals,
  helper,
  icon: Icon,
  tone = "primary",
  sx,
}: V2MetricCardProps) {
  return (
    <V2Card sx={sx}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.75 }}>
            {typeof animatedValue === "number" ? (
              <AdminV2AnimatedNumber value={animatedValue} prefix={prefix} suffix={suffix} decimals={decimals} />
            ) : (
              value
            )}
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
            bgcolor: "transparent",
            backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)",
            animation: "admin-v2-reveal 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <Icon size={21} />
        </Box>
      </Stack>
    </V2Card>
  );
}
