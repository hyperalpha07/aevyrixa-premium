import { Card, CardContent } from "@mui/material";
import type { CardProps } from "@mui/material";
import { adminV2Motion, adminV2Transition } from "@/components/admin-v2/motion/motion-config";

type V2CardProps = CardProps & {
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
};

export function V2Card({ children, sx, interactive, selected, disabled, ...props }: V2CardProps) {
  return (
    <Card
      variant="outlined"
      aria-disabled={disabled || undefined}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        opacity: disabled ? 0.58 : 1,
        transition: adminV2Transition(
          ["transform", "box-shadow", "border-color", "background-color"],
          adminV2Motion.duration.hover
        ),
        ...(interactive && !disabled
          ? {
              cursor: props.onClick ? "pointer" : "default",
              "&:hover": {
                transform: `translate3d(0, -${adminV2Motion.distance.hover}px, 0)`,
                borderColor: selected ? "primary.main" : "primary.main",
                boxShadow: "0 16px 38px rgba(35, 22, 80, 0.13)",
              },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 3,
              },
            }
          : null),
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 3 }, "&:last-child": { pb: { xs: 2.25, md: 3 } } }}>
        {children}
      </CardContent>
    </Card>
  );
}
