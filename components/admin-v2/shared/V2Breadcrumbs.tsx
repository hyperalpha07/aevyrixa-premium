import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";

export function V2Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <Breadcrumbs sx={{ mb: 1.5, fontSize: 13 }}>
      {items.map((item, index) =>
        item.href && index !== items.length - 1 ? (
          <MuiLink key={item.label} component={Link} href={item.href} color="text.secondary" underline="hover">
            {item.label}
          </MuiLink>
        ) : (
          <Typography key={item.label} color="text.primary" variant="caption">
            {item.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
