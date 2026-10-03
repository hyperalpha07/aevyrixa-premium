import { Alert, Box, Button, Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { BarChart3, FileBarChart, PackageSearch, ReceiptText, Star, Truck, Users } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
  adminV2ReportLabels,
  adminV2ReportTypes,
  type AdminV2ReportResult,
  type AdminV2ReportType,
} from "@/lib/admin-v2/reports/reports-metrics";
import { analyticsPresetRanges } from "@/lib/admin-v2/analytics/analytics-metrics";

const rangeLabels = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  year: "This year",
  custom: "Custom",
} as const;

const icons: Record<AdminV2ReportType, typeof FileBarChart> = {
  sales: BarChart3,
  orders: ReceiptText,
  products: PackageSearch,
  customers: Users,
  reviews: Star,
  fees: Truck,
};

function reportHref(type: AdminV2ReportType, range: string, from?: string, to?: string) {
  const params = new URLSearchParams({ type, range });
  if (range === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }
  return `/admin-v2/reports?${params.toString()}`;
}

function exportHref(data: AdminV2ReportResult) {
  const params = new URLSearchParams({ type: data.type, range: data.range.preset });
  if (data.range.preset === "custom") {
    params.set("from", data.range.from);
    params.set("to", data.range.to);
  }
  return `/api/admin/reports/export?${params.toString()}`;
}

function isMoneyMetric(label: string) {
  return /sales|value|fees|discounts|total|aov/i.test(label);
}

function isMoneyColumn(key: string) {
  return /value|total|discount|fee|charge|payable/i.test(key);
}

function displayValue(value: string | number, money = false) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return money ? formatCurrency(value) : new Intl.NumberFormat("en").format(value);
  }
  return value ? String(value) : "—";
}

export function AdminV2ReportsView({ data }: { data: AdminV2ReportResult }) {
  const Icon = icons[data.type];

  return (
    <Box component="section" aria-labelledby="admin-v2-reports-title">
      <V2PageHeader
        title="Reports"
        titleId="admin-v2-reports-title"
        titleComponent="h1"
        description="Generate operational reports from real store data."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Reports" }]}
        actions={
          data.exportable ? (
            <Button href={exportHref(data)} variant="contained">
              Export CSV
            </Button>
          ) : (
            <Button variant="outlined" disabled>
              Export unavailable
            </Button>
          )
        }
      />

      <Stack spacing={2.5}>
        <V2Card>
          <Stack component="form" action="/admin-v2/reports" method="get" direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: { lg: "center" } }}>
            <TextField select name="type" label="Report Type" size="small" defaultValue={data.type} sx={{ minWidth: { lg: 240 } }}>
              {adminV2ReportTypes.map((type) => <MenuItem key={type} value={type}>{adminV2ReportLabels[type]}</MenuItem>)}
            </TextField>
            <TextField select name="range" label="Date Range" size="small" defaultValue={data.range.preset} sx={{ minWidth: { lg: 180 } }}>
              {analyticsPresetRanges.map((range) => <MenuItem key={range} value={range}>{rangeLabels[range]}</MenuItem>)}
            </TextField>
            <TextField name="from" type="date" size="small" label="From" defaultValue={data.range.from} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField name="to" type="date" size="small" label="To" defaultValue={data.range.to} slotProps={{ inputLabel: { shrink: true } }} />
            <Button type="submit" variant="contained">Apply</Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
            {analyticsPresetRanges.filter((range) => range !== "custom").map((range) => (
              <Button key={range} href={reportHref(data.type, range)} variant={data.range.preset === range ? "contained" : "outlined"} size="small">
                {rangeLabels[range]}
              </Button>
            ))}
          </Stack>
        </V2Card>

        {data.range.warnings.map((warning) => <Alert key={warning} severity="warning">{warning}</Alert>)}
        {data.limitation ? <Alert severity="warning">{data.limitation}</Alert> : null}
        {!data.exportable ? <Alert severity="info">{data.exportDisabledReason}</Alert> : null}
        <Alert severity="info">
          Payable Sales excludes cancelled, test, archived, deleted and soft-deleted orders and is not settled revenue.
        </Alert>

        <Grid container spacing={2}>
          {data.kpis.map((metric) => (
            <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: data.kpis.length === 5 ? 2.4 : 3 }}>
              <V2MetricCard
                label={metric.label}
                value={displayValue(metric.value, isMoneyMetric(metric.label))}
                animatedValue={typeof metric.value === "number" && !isMoneyMetric(metric.label) ? metric.value : undefined}
                icon={Icon}
                tone={data.type === "reviews" ? "warning" : data.type === "customers" ? "success" : "primary"}
                helper={metric.helper}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">{data.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Showing {data.rows.length} preview rows for {data.range.label}. CSV export is generated server-side for the selected range when complete.
              </Typography>
              {data.rows.length === 0 ? (
                <Alert severity="info">No real data is available for this report and date range.</Alert>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {data.columns.map((column) => <TableCell key={column.key} align={column.align}>{column.label}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.rows.map((row, index) => (
                        <TableRow key={index}>
                          {data.columns.map((column) => (
                            <TableCell key={column.key} align={column.align}>
                              {displayValue(row[column.key] ?? "", isMoneyColumn(column.key))}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </V2Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <V2Card sx={{ height: "100%" }}>
              <Typography component="h2" variant="h6">Report scope</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Phase 1 reports are on-demand snapshots derived from existing operational records and Analytics aggregation.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack component="ul" spacing={1} sx={{ pl: 2.5, mb: 0 }}>
                {data.notes.map((note) => (
                  <Typography key={note} component="li" variant="body2" color="text.secondary">{note}</Typography>
                ))}
                <Typography component="li" variant="body2" color="text.secondary">
                  No traffic, conversion, visitor, ROAS, CAC, forecast, XLSX, PDF, saved report or scheduled report capability is shown.
                </Typography>
              </Stack>
            </V2Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
