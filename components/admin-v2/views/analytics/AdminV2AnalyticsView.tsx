import { Alert, Box, Button, Divider, Grid, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { BarChart3, ClipboardList, HeartHandshake, ShoppingBag, Star, Users } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { analyticsPresetRanges, type AdminV2AnalyticsResult, type AnalyticsProductRank, type AnalyticsTrendBucket } from "@/lib/admin-v2/analytics/analytics-metrics";

const rangeLabels = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  year: "This year",
  custom: "Custom",
} as const;

function maximum(values: number[]) {
  return Math.max(1, ...values.filter((value) => Number.isFinite(value)));
}

function TrendChart({ buckets }: { buckets: AnalyticsTrendBucket[] }) {
  const maxSales = maximum(buckets.map((bucket) => bucket.payableSales));
  const maxOrders = maximum(buckets.map((bucket) => bucket.orders));
  const points = buckets.map((bucket, index) => {
    const x = buckets.length <= 1 ? 0 : (index / (buckets.length - 1)) * 100;
    const y = 88 - (bucket.payableSales / maxSales) * 76;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <Box>
      <Box
        component="svg"
        role="img"
        aria-label="Payable sales and orders over time"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        sx={{ width: "100%", height: 220, display: "block" }}
      >
        <defs>
          <linearGradient id="admin-v2-analytics-sales" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9d2fff" />
            <stop offset="100%" stopColor="#31e6d4" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#admin-v2-analytics-sales)" strokeWidth="2.6" vectorEffect="non-scaling-stroke" points={points} />
        {buckets.map((bucket, index) => {
          const barWidth = Math.max(1.8, 66 / Math.max(1, buckets.length));
          const x = buckets.length <= 1 ? 48 : (index / (buckets.length - 1)) * 96 + 2 - barWidth / 2;
          const height = (bucket.orders / maxOrders) * 38;
          return <rect key={bucket.key} x={x} y={92 - height} width={barWidth} height={height} rx="1" fill="rgba(157,47,255,0.22)" />;
        })}
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        {buckets.slice(0, 6).map((bucket) => (
          <V2Chip key={bucket.key} size="small" label={`${bucket.label}: ${bucket.orders} orders`} />
        ))}
      </Stack>
    </Box>
  );
}

function ProductRows({ rows, mode }: { rows: AnalyticsProductRank[]; mode: "quantity" | "value" }) {
  if (rows.length === 0) {
    return <Typography variant="body2" color="text.secondary">No qualifying order item snapshots in this date range.</Typography>;
  }

  const max = maximum(rows.map((row) => mode === "quantity" ? row.quantity : row.orderValue));
  return (
    <Stack spacing={1.5}>
      {rows.map((row) => {
        const value = mode === "quantity" ? row.quantity : row.orderValue;
        return (
          <Box key={row.key}>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{row.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{row.slug || row.productId || "Snapshot only"}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>{mode === "quantity" ? value : formatCurrency(value)}</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={(value / max) * 100} sx={{ mt: 0.75, height: 6, borderRadius: 999 }} />
          </Box>
        );
      })}
    </Stack>
  );
}

export function AdminV2AnalyticsView({ data }: { data: AdminV2AnalyticsResult }) {
  const statusMax = maximum(data.orderStatus.map((slice) => slice.count));
  const customAction = `/admin-v2/analytics`;

  return (
    <Box component="section" aria-labelledby="admin-v2-analytics-title">
      <V2PageHeader
        title="Analytics"
        titleId="admin-v2-analytics-title"
        titleComponent="h1"
        description="Read-only commerce analytics derived from existing orders, customers, products, and reviews."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Analytics" }]}
      />

      <Stack spacing={2.5}>
        <V2Card>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Date range</Typography>
              <Typography variant="body2" color="text.secondary">{data.range.label}</Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              {analyticsPresetRanges.filter((range) => range !== "custom").map((range) => (
                <Button key={range} href={`/admin-v2/analytics?range=${range}`} variant={data.range.preset === range ? "contained" : "outlined"} size="small">
                  {rangeLabels[range]}
                </Button>
              ))}
            </Stack>
            <Box component="form" action={customAction} method="get" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <input type="hidden" name="range" value="custom" />
              <TextField name="from" type="date" size="small" label="From" defaultValue={data.range.from} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField name="to" type="date" size="small" label="To" defaultValue={data.range.to} slotProps={{ inputLabel: { shrink: true } }} />
              <Button type="submit" variant="outlined" size="small">Apply</Button>
            </Box>
          </Stack>
        </V2Card>

        {data.range.warnings.map((warning) => <Alert key={warning} severity="warning">{warning}</Alert>)}
        {data.limitation ? <Alert severity="warning">{data.limitation}</Alert> : null}

        <Alert severity="info">
          Payable sales represents non-cancelled, non-test order value and is not necessarily settled cash revenue.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, xl: 2.4 }}>
            <V2MetricCard label="Orders" value={String(data.kpis.orders)} animatedValue={data.kpis.orders} icon={ClipboardList} tone="warning" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 2.4 }}>
            <V2MetricCard label="Payable Sales" value={formatCurrency(data.kpis.payableSales)} icon={ShoppingBag} tone="primary" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 2.4 }}>
            <V2MetricCard label="Average Order Value" value={formatCurrency(data.kpis.averageOrderValue)} icon={BarChart3} tone="info" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 2.4 }}>
            <V2MetricCard label="New Customers" value={String(data.kpis.newCustomers)} animatedValue={data.kpis.newCustomers} icon={Users} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 2.4 }}>
            <V2MetricCard label="Reviews" value={String(data.kpis.reviews)} animatedValue={data.kpis.reviews} icon={HeartHandshake} tone="info" />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">Sales & Orders Over Time</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Payable sales and order count from real order timestamps. Empty dates remain zero.
              </Typography>
              <TrendChart buckets={data.trend} />
            </V2Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">Order Status Distribution</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Real order.status values in range.</Typography>
              <Stack spacing={1.5}>
                {data.orderStatus.length === 0 ? <Typography variant="body2" color="text.secondary">No orders in this range.</Typography> : null}
                {data.orderStatus.map((slice) => (
                  <Box key={slice.status}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{slice.status}</Typography>
                      <Typography variant="body2" color="text.secondary">{slice.count} · {Math.round(slice.proportion * 100)}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={(slice.count / statusMax) * 100} sx={{ mt: 0.75, height: 7, borderRadius: 999 }} />
                  </Box>
                ))}
              </Stack>
            </V2Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography component="h2" variant="h6">Top Products</Typography>
                  <Typography variant="body2" color="text.secondary">Based on order item snapshots.</Typography>
                </Box>
                <V2Chip label="By quantity" color="primary" />
              </Stack>
              <ProductRows rows={data.topProductsByQuantity.slice(0, 5)} mode="quantity" />
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle2">By Order Value</Typography>
                <V2Chip label="Snapshot value" color="info" />
              </Stack>
              <ProductRows rows={data.topProductsByValue.slice(0, 5)} mode="value" />
            </V2Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">Customer Analytics</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                New accounts use customer account creation dates. Repeat insight is based on linked customer accounts only.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 4 }}><MiniStat label="Linked customers" value={data.linkedCustomers.linkedCustomers} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><MiniStat label="New linked" value={data.linkedCustomers.newLinkedCustomers} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><MiniStat label="Repeat linked" value={data.linkedCustomers.repeatLinkedCustomers} /></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                {data.trend.slice(-8).map((bucket) => (
                  <Stack key={bucket.key} direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">{bucket.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{bucket.newCustomers} new customers</Typography>
                  </Stack>
                ))}
              </Stack>
            </V2Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography component="h2" variant="h6">Review Summary</Typography>
                  <Typography variant="body2" color="text.secondary">Real review volume and ratings in range.</Typography>
                </Box>
                <Star size={22} />
              </Stack>
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}><MiniStat label="Average rating" value={data.reviewSummary.averageRating.toFixed(1)} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Reviews" value={data.reviewSummary.total} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Approved" value={data.reviewSummary.approved} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Pending" value={data.reviewSummary.pending} /></Grid>
              </Grid>
            </V2Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">Order Value Breakdown</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Uses available discount_amount and delivery_charge fields. Older rows may not include both fields.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}><MiniStat label="Discounts" value={formatCurrency(data.valueBreakdown.discounts)} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Delivery fees" value={formatCurrency(data.valueBreakdown.deliveryFees)} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Discount rows" value={data.valueBreakdown.discountRows} /></Grid>
                <Grid size={{ xs: 6 }}><MiniStat label="Delivery rows" value={data.valueBreakdown.deliveryRows} /></Grid>
              </Grid>
            </V2Card>
          </Grid>
        </Grid>

        <V2Card>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>Source notes</Typography>
          <Stack component="ul" sx={{ pl: 2.5, mb: 0 }} spacing={0.75}>
            {data.sourceNotes.map((note) => <Typography key={note} component="li" variant="body2" color="text.secondary">{note}</Typography>)}
          </Stack>
        </V2Card>
      </Stack>
    </Box>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}
