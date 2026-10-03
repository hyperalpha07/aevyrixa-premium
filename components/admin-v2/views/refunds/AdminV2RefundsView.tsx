import { Alert, Box, Button, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Banknote, CircleDollarSign, FileQuestion, Info, ReceiptText, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import {
  adminV2RefundClassificationLabels,
  adminV2RefundClassifications,
  adminV2RefundPaymentMethods,
  type AdminV2RefundClassification,
  type AdminV2RefundQueryResult,
  type AdminV2RefundRow,
} from "@/lib/admin-v2/refunds/refund-metrics";

const allOption = { label: "All", value: "all" };

function pageHref(data: AdminV2RefundQueryResult, page: number) {
  const params = new URLSearchParams();
  if (data.query.q) params.set("q", data.query.q);
  if (data.query.classification !== "all") params.set("classification", data.query.classification);
  if (data.query.method !== "all") params.set("method", data.query.method);
  if (data.query.from) params.set("from", data.query.from);
  if (data.query.to) params.set("to", data.query.to);
  params.set("page", String(page));
  params.set("pageSize", String(data.query.pageSize));
  return `/admin-v2/refunds?${params.toString()}`;
}

function orderHref(orderReference: string) {
  return `/admin-v2/orders/${encodeURIComponent(orderReference)}`;
}

function amount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? formatCurrency(value) : "Not provided";
}

function classificationColor(value: AdminV2RefundClassification): "success" | "warning" | "error" | "info" | "default" {
  if (value === "full") return "success";
  if (value === "partial") return "info";
  if (value === "inconsistent") return "error";
  if (value === "request_only") return "warning";
  return "default";
}

function methodLabel(row: AdminV2RefundRow) {
  const details = [row.walletProvider, row.paymentType].filter(Boolean).join(" / ");
  return details ? `${row.paymentMethod} - ${details}` : row.paymentMethod;
}

function MetricCell({
  label,
  value,
  helper,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: typeof ReceiptText;
  tone?: "primary" | "success" | "warning" | "info" | "error";
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: "center",
          minHeight: { xs: 58, lg: 64 },
          px: { xs: 1, lg: 1.25 },
          py: 0.75,
          borderRight: { lg: "1px solid" },
          borderColor: { lg: "divider" },
          "&:last-of-type": { borderRight: 0 },
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            flex: "0 0 auto",
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            color: `${tone}.main`,
            backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
          }}
        >
          <Icon size={15} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem", fontWeight: 700, lineHeight: 1.15 }}>
            {label}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.66rem", lineHeight: 1.15 }}>
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Grid>
  );
}

export function AdminV2RefundsView({ data }: { data: AdminV2RefundQueryResult }) {
  const hasFilters = Boolean(data.query.q || data.query.classification !== "all" || data.query.method !== "all" || data.query.from || data.query.to);
  const emptyMessage = hasFilters ? "No orders match these refund filters." : "No refund-related orders found.";
  const inputSx = {
    "& .MuiInputBase-root": { minHeight: 38 },
    "& .MuiInputBase-input": { py: 0.85 },
  };

  return (
    <Box component="section" aria-labelledby="admin-v2-refunds-title">
      <Box sx={{ mb: 1.25 }}>
        <V2Breadcrumbs items={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Refunds" }]} />
        <Typography id="admin-v2-refunds-title" component="h1" variant="h4" sx={{ mt: 0.5 }}>
          Refunds
        </Typography>
      </Box>

      <Stack spacing={1.2}>
        {data.limitation ? <Alert severity={data.queryFailed ? "error" : "warning"} sx={{ py: 0.5 }}>{data.limitation}</Alert> : null}

        {!data.queryFailed ? (
          <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1, md: 1.15 }, "&:last-child": { pb: { xs: 1, md: 1.15 } } } }}>
            <Grid container columns={{ xs: 12, lg: 12 }}>
              <MetricCell label="Refunded Orders" value={String(data.metrics.refundedOrders)} icon={ReceiptText} tone="success" />
              <MetricCell label="Refunded Amount" value={formatCurrency(data.metrics.refundedAmount)} icon={Banknote} helper="Persisted refunded_amount." />
              <MetricCell label="Full Refunds" value={String(data.metrics.fullRefunds)} icon={CircleDollarSign} tone="info" />
              <MetricCell label="Partial Refunds" value={String(data.metrics.partialRefunds)} icon={RotateCcw} tone="warning" />
              <MetricCell label="Refund Requests" value={String(data.metrics.refundRequests)} icon={FileQuestion} tone="error" helper="Request note only." />
            </Grid>
          </V2Card>
        ) : null}

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.25, md: 1.35 }, "&:last-child": { pb: { xs: 1.25, md: 1.35 } } } }}>
          <Stack component="form" action="/admin-v2/refunds" method="get" direction={{ xs: "column", xl: "row" }} spacing={1} sx={{ alignItems: { xl: "center" } }}>
            <TextField name="q" label="Search order, customer, reference, or note" size="small" defaultValue={data.query.q} sx={{ minWidth: { xl: 305 }, ...inputSx }} />
            <TextField select name="classification" label="Classification" size="small" defaultValue={data.query.classification} sx={{ minWidth: { xl: 185 }, ...inputSx }}>
              {[allOption, ...adminV2RefundClassifications.map((classification) => ({ label: adminV2RefundClassificationLabels[classification], value: classification }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select name="method" label="Payment method" size="small" defaultValue={data.query.method} sx={{ minWidth: { xl: 175 }, ...inputSx }}>
              {[allOption, ...adminV2RefundPaymentMethods.map((method) => ({ label: method, value: method }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField name="from" type="date" size="small" label="From" defaultValue={data.query.from} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <TextField name="to" type="date" size="small" label="To" defaultValue={data.query.to} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <input type="hidden" name="pageSize" value={data.query.pageSize} />
            <Button type="submit" variant="contained" sx={{ minHeight: 38, px: 2 }}>Apply</Button>
            {hasFilters ? <Button href="/admin-v2/refunds" variant="outlined" sx={{ minHeight: 38, px: 2 }}>Reset</Button> : null}
          </Stack>
        </V2Card>

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.5, md: 1.75 }, "&:last-child": { pb: { xs: 1.5, md: 1.75 } } } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>Refund reconciliation</Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.totalCount} refund-related orders
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                <Info size={13} /> Order-level refund signals only - no gateway refund ledger or refund history is stored.
              </Typography>
            </Box>
            <V2Chip label={`Page ${data.query.page} of ${data.totalPages}`} color="primary" />
          </Stack>

          {data.queryFailed ? (
            <Alert severity="error">Refund reconciliation could not be loaded. Please retry after the order payment backend is available.</Alert>
          ) : data.rows.length === 0 ? (
            <Alert severity="info">{emptyMessage}</Alert>
          ) : (
            <Box sx={{ maxHeight: { md: 460 }, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small" stickyHeader sx={{
                tableLayout: "fixed",
                "& .MuiTableCell-root": { py: 0.75, px: 1.25, fontSize: "0.78rem", lineHeight: 1.25 },
                "& .MuiTableHead-root .MuiTableCell-root": { py: 0.85, bgcolor: "background.paper", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" },
                "& .MuiTypography-caption": { fontSize: "0.68rem", lineHeight: 1.2 },
                "& .MuiTypography-body2": { fontSize: "0.78rem", lineHeight: 1.25 },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 150 }}>Order</TableCell>
                    <TableCell sx={{ width: 160 }}>Customer</TableCell>
                    <TableCell sx={{ width: 155 }}>Refund Classification</TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>Refunded Amount</TableCell>
                    <TableCell align="right" sx={{ width: 125 }}>Payable Amount</TableCell>
                    <TableCell sx={{ width: 165 }}>Payment Method</TableCell>
                    <TableCell sx={{ width: 145 }}>Reference</TableCell>
                    <TableCell sx={{ width: 210 }}>Request / Note</TableCell>
                    <TableCell align="right" sx={{ width: 105 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id || row.orderReference}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 900 }}>{row.orderReference || "Not provided"}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{row.paymentStatus || "Payment state unavailable"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{row.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{row.customerContact}</Typography>
                      </TableCell>
                      <TableCell>
                        <V2Chip label={adminV2RefundClassificationLabels[row.classification]} color={classificationColor(row.classification)} size="small" sx={{ height: 22 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" noWrap sx={{ fontWeight: 800 }}>{amount(row.refundedAmount)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" noWrap>{amount(row.payableAmount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{methodLabel(row)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.reference}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.requestNote || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <V2Button size="small" variant="outlined" href={row.orderReference ? orderHref(row.orderReference) : undefined} disabled={!row.orderReference} sx={{ minHeight: 30, px: 1.25 }}>
                          View Order
                        </V2Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1.25 }}>
            <V2Button href={pageHref(data, Math.max(1, data.query.page - 1))} disabled={data.query.page <= 1} variant="outlined">Previous</V2Button>
            <V2Button href={pageHref(data, Math.min(data.totalPages, data.query.page + 1))} disabled={data.query.page >= data.totalPages} variant="outlined">Next</V2Button>
          </Stack>
        </V2Card>
      </Stack>
    </Box>
  );
}
