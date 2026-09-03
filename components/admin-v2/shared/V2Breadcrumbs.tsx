import { Breadcrumbs, Typography } from "@mui/material";
import Link from "next/link";

export function V2Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <Breadcrumbs sx={{ mb: 1.5, fontSize: 13 }}>
      {items.map((item, index) =>
        item.href && index !== items.length - 1 ? (
          <Link key={item.label} href={item.href} style={{ color: "inherit", fontSize: 13, textDecoration: "none" }}>
            {item.label}
          </Link>
        ) : (
          <Typography key={item.label} color="text.primary" variant="caption">
            {item.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
