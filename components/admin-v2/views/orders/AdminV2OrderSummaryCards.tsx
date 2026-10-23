"use client";

import { Grid } from "@mui/material";
import { Banknote, CheckCircle2, CirclePause, ClipboardList, PackageCheck, XCircle } from "lucide-react";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { AdminV2Reveal } from "@/components/admin-v2/motion";

type Props = {
  metrics: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    revenue: number;
  } | null;
};

export function AdminV2OrderSummaryCards({ metrics }: Props) {
  const cards = [
    { label: "Total Orders", value: metrics?.total ?? 0, icon: ClipboardList, tone: "primary" as const },
    { label: "Pending", value: metrics?.pending ?? 0, icon: CirclePause, tone: "warning" as const },
    { label: "Confirmed / Processing", value: metrics?.processing ?? 0, icon: CheckCircle2, tone: "info" as const },
    { label: "Delivered", value: metrics?.delivered ?? 0, icon: PackageCheck, tone: "success" as const },
    { label: "Cancelled", value: metrics?.cancelled ?? 0, icon: XCircle, tone: "error" as const },
    { label: "Total Revenue", value: metrics?.revenue ?? 0, icon: Banknote, tone: "success" as const, prefix: "BDT " },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 2 }}>
          <AdminV2Reveal delay={index * 45}>
            <V2MetricCard
              label={card.label}
              value={metrics ? String(card.value) : "Unavailable"}
              animatedValue={metrics ? card.value : undefined}
              prefix={card.prefix}
              icon={card.icon}
              tone={card.tone}
              helper={card.label === "Total Revenue" ? "Excludes cancelled and test orders" : undefined}
            />
          </AdminV2Reveal>
        </Grid>
      ))}
    </Grid>
  );
}
