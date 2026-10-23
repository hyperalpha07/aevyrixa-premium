import Link from "next/link";
import { Alert, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import { Bell, ClipboardList, HeartHandshake, MessageSquare } from "lucide-react";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2NotificationsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "notifications");
  const data = await getAdminV2DashboardData(session);
  const queues = [
    { label: "Pending live orders", count: data.orders.pending, available: data.orders.available, href: "/admin-v2/orders?recordScope=live&status=Pending", icon: ClipboardList },
    { label: "Pending reviews", count: data.reviews.pending, available: data.reviews.available, href: "/admin-v2/reviews", icon: HeartHandshake },
    { label: "Open support conversations", count: data.support.open, available: data.support.available, href: "/admin-v2/support", icon: MessageSquare },
  ];
  const active = queues.filter((queue) => queue.available && queue.count > 0);
  const unavailable = queues.filter((queue) => !queue.available);
  return (
    <>
      <V2PageHeader title="Notifications" description="Live operational work queues, not a simulated unread inbox or historical delivery feed."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Notifications" }]}
        actions={<Chip icon={<Bell size={14} />} variant="outlined" label={`${active.length} queues need attention`} />} />
      <Stack spacing={3}>
        <Alert severity="info">These alerts are calculated from current live records. No per-user read receipts or message-delivery history are persisted in this workspace.</Alert>
        {unavailable.length ? <Alert severity="warning">{unavailable.length} source(s) are unavailable or not permitted. Counts have not been replaced with zeros.</Alert> : null}
        <Grid container spacing={2}>
          {queues.map((queue) => (
            <Grid key={queue.label} size={{ xs: 12, md: 4 }}>
              <V2MetricCard label={queue.label} icon={queue.icon}
                value={queue.available ? String(queue.count) : "Unavailable"}
                animatedValue={queue.available ? queue.count : undefined}
                tone={queue.count > 0 ? "warning" : "info"} />
            </Grid>
          ))}
        </Grid>
        <V2Card>
          <Typography variant="h6" sx={{ mb: 2 }}>Review work queues</Typography>
          <Stack spacing={1.5}>
            {queues.filter((queue) => queue.available).map((queue) => (
              <Stack key={queue.label} direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: { md: "center" } }}>
                <Typography variant="body2">{queue.label}: <strong>{queue.count}</strong></Typography>
                <Button component={Link} href={queue.href} variant="outlined" size="small">Open queue</Button>
              </Stack>
            ))}
            {!active.length && !unavailable.length ? <Alert severity="success">No active work-queue alerts.</Alert> : null}
          </Stack>
        </V2Card>
      </Stack>
    </>
  );
}
