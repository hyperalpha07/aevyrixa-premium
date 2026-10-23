import { Alert, Chip, Grid, Stack, Typography } from "@mui/material";
import { Activity, Database, ShieldCheck } from "lucide-react";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2SystemHealthPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "systemHealth");
  const data = await getAdminV2DashboardData(session);
  const sources = [
    { title: "Orders", state: data.orders, available: data.orders.available, source: data.orders.source },
    { title: "Products", state: data.products, available: data.products.available, source: data.products.source },
    { title: "Reviews", state: data.reviews, available: data.reviews.available, source: data.reviews.source },
    { title: "Customers", state: data.customers, available: data.customers.available, source: data.customers.source },
    { title: "Support", state: data.support, available: data.support.available, source: data.support.source },
  ];
  const unavailable = sources.filter((source) => !source.available);
  return (
    <>
      <V2PageHeader title="System Health" description="Read-only operational data-source availability, based on this authorized admin session."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "System Health" }]}
        actions={<Chip icon={<Activity size={14} />} variant="outlined"
          color={unavailable.length ? "warning" : "success"}
          label={unavailable.length ? "Some sources unavailable" : "Data sources responding"} />} />
      <Stack spacing={3}>
        <Alert severity="info">This is a source-readiness view, not an uptime monitor, gateway settlement audit, or proof of customer checkout completion. Unauthorized or unavailable sources are not treated as healthy.</Alert>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><V2MetricCard label="Sources checked" value={String(sources.length)} icon={Database} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><V2MetricCard label="Available" value={String(sources.length - unavailable.length)} icon={ShieldCheck} tone="success" /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><V2MetricCard label="Unavailable / restricted" value={String(unavailable.length)} icon={Activity} tone={unavailable.length ? "warning" : "info"} /></Grid>
        </Grid>
        <V2Card>
          <Typography variant="h6" sx={{ mb: 2 }}>Live source checks</Typography>
          <Stack spacing={1}>
            {sources.map((source) => (
              <Stack key={source.title} direction="row" spacing={2}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, px: 2, py: 1.5, alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" fontWeight={700}>{source.title}</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">{source.source}</Typography>
                  <Chip size="small" variant="outlined" label={source.available ? "Available" : "Unavailable"} color={source.available ? "success" : "warning"} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </V2Card>
      </Stack>
    </>
  );
}
