"use client";

import type { CardProps } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";

export function AdminV2HoverCard(props: CardProps & { selected?: boolean; interactive?: boolean }) {
  return <V2Card interactive {...props} />;
}
