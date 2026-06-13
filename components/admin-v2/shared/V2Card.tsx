import { Card, CardContent } from "@mui/material";
import type { CardProps } from "@mui/material";

export function V2Card({ children, sx, ...props }: CardProps) {
  return (
    <Card variant="outlined" sx={{ borderColor: "divider", ...sx }} {...props}>
      <CardContent sx={{ p: { xs: 2.25, md: 3 }, "&:last-child": { pb: { xs: 2.25, md: 3 } } }}>
        {children}
      </CardContent>
    </Card>
  );
}
