import { Grid, Link as MuiLink, Stack, TableCell, TableRow, Typography } from "@mui/material";
import Link from "next/link";
import { Boxes, ClipboardList, HeartHandshake, PackageSearch, Plus, ShoppingBag, Users } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import type { OrderRecord } from "@/app/lib/order-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2TableShell } from "@/components/admin-v2/tables/V2TableShell";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function renderOrderRow(order: OrderRecord) {
  return (
    <TableRow key={order.orderReference} hover>
      <TableCell>
        <MuiLink component={Link} href={`/admin-v2/orders/${order.orderReference}`} variant="body2" color="primary" sx={{ textDecoration: "none", fontWeight: 700 }}>
          {order.orderReference}
        </MuiLink>
      </TableCell>
      <TableCell>{order.customer.fullName}</TableCell>
      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
      <TableCell>
        <V2Chip label={order.status} color={order.status === "Pending" ? "warning" : order.status === "Cancelled" ? "error" : "success"} />
      </TableCell>
      <TableCell>{formatDate(order.createdAt)}</TableCell>
    </TableRow>
  );
}

export function AdminV2DashboardView({ data }: { data: AdminV2DashboardData }) {
  return (
    <>
      <V2PageHeader
        title="Dashboard"
        description="Clean operational overview for real Aevyrixa workflows."
        breadcrumbs={[{ label: "Admin V2" }, { label: "Dashboard" }]}
        actions={
          <Stack direction="row" spacing={1}>
            <V2Button component={Link} href="/admin-v2/orders" variant="outlined" startIcon={<ClipboardList size={17} />}>
              Orders
            </V2Button>
            <V2Button component={Link} href="/admin-v2/products/new" variant="contained" startIcon={<Plus size={17} />}>
              Product
            </V2Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <V2MetricCard
            label="Revenue"
            value={formatCurrency(data.orders.revenue)}
            helper={data.orders.available ? "Derived from real non-cancelled orders" : "Order data connection unavailable"}
            icon={ShoppingBag}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <V2MetricCard
            label="Orders"
            value={String(data.orders.count)}
            helper={data.orders.available ? `${data.orders.pending} pending` : "Real order source not connected"}
            icon={ClipboardList}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <V2MetricCard
            label="Products"
            value={String(data.products.count)}
            helper={`${data.products.active} active, ${data.products.draft} draft`}
            icon={Boxes}
            tone="success"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <V2MetricCard
            label="Customers"
            value={String(data.customers.count)}
            helper={data.customers.available ? "Customer account source connected" : "Customer source unavailable"}
            icon={Users}
            tone="info"
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <V2Card>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, justifyContent: "space-between" }}>
              <div>
                <Typography variant="h6">Recent Orders</Typography>
                <Typography variant="body2" color="text.secondary">
                  Real Supabase orders only. Demo-memory fallback is not displayed.
                </Typography>
              </div>
              <V2Button component={Link} href="/admin-v2/orders" size="small" variant="outlined">
                View all
              </V2Button>
            </Stack>
            <V2TableShell
              columns={["Reference", "Customer", "Total", "Status", "Created"]}
              rows={data.orders.recent}
              renderRow={renderOrderRow}
              emptyTitle="No real orders available"
              emptyDescription="Orders will appear here after the Supabase-backed order workflow returns real records."
            />
          </V2Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <V2Card>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Product Status
              </Typography>
              {data.products.count ? (
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Active</Typography>
                    <V2Chip label={data.products.active} color="success" />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Draft</Typography>
                    <V2Chip label={data.products.draft} />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Low/out of stock</Typography>
                    <V2Chip label={data.products.lowStock} color={data.products.lowStock ? "warning" : "success"} />
                  </Stack>
                </Stack>
              ) : (
                <V2EmptyState
                  icon={PackageSearch}
                  title="No products available"
                  description="The product catalog did not return records for Admin V2."
                />
              )}
            </V2Card>

            <V2Card>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Review & Support Summary
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Reviews</Typography>
                  <V2Chip label={data.reviews.available ? data.reviews.count : "Unavailable"} color={data.reviews.available ? "info" : "default"} />
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Pending reviews</Typography>
                  <V2Chip label={data.reviews.pending} color={data.reviews.pending ? "warning" : "default"} />
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Open support</Typography>
                  <V2Chip label={data.support.available ? data.support.open : "Unavailable"} color={data.support.open ? "primary" : "default"} />
                </Stack>
              </Stack>
            </V2Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <V2Card>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
              <div>
                <Typography variant="h6">Quick Actions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Actions route to Admin V2 pages. Scaffolded modules show honest pending-connection states.
                </Typography>
              </div>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                <V2Button component={Link} href="/admin-v2/orders" variant="outlined" startIcon={<ClipboardList size={16} />}>Manage orders</V2Button>
                <V2Button component={Link} href="/admin-v2/products" variant="outlined" startIcon={<Boxes size={16} />}>Products</V2Button>
                <V2Button component={Link} href="/admin-v2/reviews" variant="outlined" startIcon={<HeartHandshake size={16} />}>Reviews</V2Button>
                <V2Button component={Link} href="/admin-v2/customers" variant="outlined" startIcon={<Users size={16} />}>Customers</V2Button>
              </Stack>
            </Stack>
          </V2Card>
        </Grid>
      </Grid>
    </>
  );
}
