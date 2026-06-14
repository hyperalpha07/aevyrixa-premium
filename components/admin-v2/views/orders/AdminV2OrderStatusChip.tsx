"use client";

import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { statusLabel } from "@/components/admin-v2/views/orders/utils";

function chipColor(value?: string) {
  if (!value) return "default";
  if (value === "Delivered" || value === "delivered" || value === "verified") return "success";
  if (value === "Cancelled" || value === "failed" || value === "returned") return "error";
  if (value === "Pending" || value === "pending" || value === "processing" || value === "packed") return "warning";
  if (value === "Confirmed" || value === "Shipped" || value === "dispatched" || value === "in_transit") return "info";
  if (value === "refunded") return "secondary";
  return "default";
}

export function AdminV2OrderStatusChip({ value }: { value?: string }) {
  return <V2Chip label={statusLabel(value)} color={chipColor(value)} variant="filled" />;
}
