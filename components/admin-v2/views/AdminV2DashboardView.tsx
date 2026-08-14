import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import {
  Boxes,
  ClipboardList,
  HeartHandshake,
  PackageSearch,
  Plus,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
  AdminV2RecentOrdersTable,
  type AdminV2RecentOrderRow,
} from "@/components/admin-v2/views/dashboard/AdminV2RecentOrdersTable";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";

function recentOrderRows(
  orders: AdminV2DashboardData["orders"]["recent"]
): AdminV2RecentOrderRow[] {
  return orders.map((order) => ({
    orderReference: order.orderReference,
    customerName: order.customer.fullName,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
  }));
}

function availabilityValue(available: boolean, value: string) {
  return available ? value : "—";
}

function SummaryRow({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: string | number;
  color?: "default" | "primary" | "success" | "warning" | "info";
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <V2Chip label={value} color={color} />
    </Stack>
  );
}

const quickActions = [
  { label: "Manage orders", href: "/admin-v2/orders", icon: ClipboardList, ready: true },
  { label: "Add product", href: "/admin-v2/products/new", icon: Plus, ready: false },
  { label: "Products", href: "/admin-v2/products", icon: Boxes, ready: false },
  { label: "Reviews", href: "/admin-v2/reviews", icon: HeartHandshake, ready: false },
  { label: "Customers", href: "/admin-v2/customers", icon: Users, ready: false },
  { label: "Settings", href: "/admin-v2/settings", icon: Settings, ready: false },
] as const;

export function AdminV2DashboardView({ data }: { data: AdminV2DashboardData }) {
  const productsEmpty = data.products.available && data.products.count === 0;

  return (
    <Box component="section" aria-labelledby="admin-v2-dashboard-title">
      <V2PageHeader
        title="Dashboard"
        titleId="admin-v2-dashboard-title"
        titleComponent="h1"
        description="A clear view of store performance, recent activity, and the work that needs attention."
        breadcrumbs={[{ label: "Admin V2" }, { label: "Dashboard" }]}
      />

      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <V2MetricCard
            label="Revenue"
            value={availabilityValue(data.orders.available, formatCurrency(data.orders.revenue))}
            helper={
              data.orders.available
                ? "From non-cancelled, non-test orders"
                : "Order data source unavailable"
            }
            icon={ShoppingBag}
            tone="primary"
            sx={{ height: "100%" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <V2MetricCard
            label="Orders"
            value={availabilityValue(data.orders.available, String(data.orders.count))}
            helper={
              data.orders.available
                ? `${data.orders.pending} awaiting action`
                : "Order data source unavailable"
            }
            icon={ClipboardList}
            tone="warning"
            sx={{ height: "100%" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <V2MetricCard
            label="Products"
            value={availabilityValue(data.products.available, String(data.products.count))}
            helper={
              data.products.available
                ? `${data.products.active} active · ${data.products.draft} draft`
                : "Product data source unavailable"
            }
            icon={Boxes}
            tone="success"
            sx={{ height: "100%" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <V2MetricCard
            label="Customers"
            value={availabilityValue(data.customers.available, String(data.customers.count))}
            helper={
              data.customers.available
                ? "Registered customer accounts"
                : "Customer data source unavailable"
            }
            icon={Users}
            tone="info"
            sx={{ height: "100%" }}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <V2Card>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mb: 2.5, alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
              >
                <Box>
                  <Typography component="h2" variant="h6">
                    Recent orders
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Latest customer orders from the connected Supabase order source.
                  </Typography>
                </Box>
                <V2Button href="/admin-v2/orders" size="small" variant="outlined">
                  View all orders
                </V2Button>
              </Stack>
              <AdminV2RecentOrdersTable
                rows={recentOrderRows(data.orders.recent)}
                available={data.orders.available}
              />
            </V2Card>

            <V2Card>
              <Box sx={{ mb: 2.5 }}>
                <Typography component="h2" variant="h6">
                  Quick actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Orders is operational. Other destinations are available as Admin V2 setup workspaces.
                </Typography>
              </Box>
              <Grid container spacing={1.25}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Grid key={action.href} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <V2Button
                        href={action.href}
                        variant="outlined"
                        startIcon={<Icon size={16} />}
                        aria-label={`${action.label}${action.ready ? "" : ", setup workspace"}`}
                        sx={{ width: "100%", minHeight: 42, justifyContent: "flex-start", whiteSpace: "normal" }}
                      >
                        {action.label}
                      </V2Button>
                    </Grid>
                  );
                })}
              </Grid>
            </V2Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ height: "100%" }}>
            <V2Card>
              <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box>
                  <Typography component="h2" variant="h6">
                    Product status
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Catalog availability at a glance.
                  </Typography>
                </Box>
                {data.products.available ? <V2Chip label="Connected" color="success" /> : null}
              </Stack>

              {data.products.available && !productsEmpty ? (
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  <SummaryRow label="Active" value={data.products.active} color="success" />
                  <SummaryRow label="Draft" value={data.products.draft} />
                  <SummaryRow
                    label="Low or out of stock"
                    value={data.products.lowStock}
                    color={data.products.lowStock ? "warning" : "success"}
                  />
                </Stack>
              ) : (
                <V2EmptyState
                  icon={PackageSearch}
                  title={productsEmpty ? "No products yet" : "Product data is unavailable"}
                  description={
                    productsEmpty
                      ? "Your Supabase catalog is connected and ready for its first product."
                      : "The dashboard does not show static or demo products when Supabase is unavailable."
                  }
                  actionHref={productsEmpty ? "/admin-v2/products/new" : "/admin-v2/products"}
                  actionLabel={productsEmpty ? "Open add product" : "Open products"}
                  compact
                />
              )}
            </V2Card>

            <V2Card>
              <Typography component="h2" variant="h6">
                Reviews and support
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Customer feedback and conversations that may need attention.
              </Typography>
              <Stack spacing={1.5} divider={<Divider flexItem />}>
                <SummaryRow
                  label="Reviews"
                  value={data.reviews.available ? data.reviews.count : "Unavailable"}
                  color={data.reviews.available ? "info" : "default"}
                />
                <SummaryRow
                  label="Pending reviews"
                  value={data.reviews.available ? data.reviews.pending : "Unavailable"}
                  color={data.reviews.pending ? "warning" : "default"}
                />
                <SummaryRow
                  label="Open support"
                  value={data.support.available ? data.support.open : "Unavailable"}
                  color={data.support.open ? "primary" : "default"}
                />
              </Stack>
            </V2Card>
          </Stack>
        </Grid>

      </Grid>
    </Box>
  );
}
