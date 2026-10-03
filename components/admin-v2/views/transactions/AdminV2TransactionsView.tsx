import { Alert, Box, Button, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { AlertTriangle, Banknote, CircleDollarSign, Clock3, Info, ReceiptText } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import {
  adminV2TransactionPaymentMethods,
  adminV2TransactionPaymentStatuses,
  adminV2TransactionVerificationStatuses,
  type AdminV2TransactionQueryResult,
  type AdminV2TransactionRow,
} from "@/lib/admin-v2/transactions/transaction-metrics";

const allOption = { label: "All", value: "all" };

function pageHref(data: AdminV2TransactionQueryResult, page: number) {
  const params = new URLSearchParams();
  if (data.query.q) params.set("q", data.query.q);
  if (data.query.method !== "all") params.set("method", data.query.method);
  if (data.query.status !== "all") params.set("status", data.query.status);
  if (data.query.verification !== "all") params.set("verification", data.query.verification);
  if (data.query.from) params.set("from", data.query.from);
  if (data.query.to) params.set("to", data.query.to);
  params.set("page", String(page));
  params.set("pageSize", String(data.query.pageSize));
  return `/admin-v2/transactions?${params.toString()}`;
}

function orderHref(orderReference: string) {
  return `/admin-v2/orders/${encodeURIComponent(orderReference)}`;
}

function label(value: string) {
  if (!value) return "Not provided";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function amount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? formatCurrency(value) : "Not provided";
}

function statusColor(value: string): "success" | "warning" | "error" | "info" | "default" {
  if (value === "verified" || value === "Verified") return "success";
  if (value === "failed" || value === "Failed") return "error";
  if (value === "refunded") return "info";
  if (value === "pending" || value === "Pending") return "warning";
  return "default";
}

function methodLabel(row: AdminV2TransactionRow) {
  return [row.walletProvider, row.paymentType].filter(Boolean).length
    ? `${row.paymentMethod} · ${[row.walletProvider, row.paymentType].filter(Boolean).join(" / ")}`
    : row.paymentMethod;
}

function paymentReference(row: AdminV2TransactionRow) {
  return row.paymentReference || row.transactionReference || "Not provided";
}

function compactMethodLabel(row: AdminV2TransactionRow) {
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

export function AdminV2TransactionsView({ data }: { data: AdminV2TransactionQueryResult }) {
  const hasFilters = Boolean(data.query.q || data.query.method !== "all" || data.query.status !== "all" || data.query.verification !== "all" || data.query.from || data.query.to);
  const emptyMessage = hasFilters ? "No orders match these payment filters." : "No payment records found.";
  const inputSx = {
    "& .MuiInputBase-root": { minHeight: 38 },
    "& .MuiInputBase-input": { py: 0.85 },
  };

  return (
    <Box component="section" aria-labelledby="admin-v2-transactions-title">
      <Box sx={{ mb: 1.25 }}>
        <V2Breadcrumbs items={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Transactions" }]} />
        <Typography id="admin-v2-transactions-title" component="h1" variant="h4" sx={{ mt: 0.5 }}>
          Transactions
        </Typography>
      </Box>

      <Stack spacing={1.2}>
        {data.limitation ? <Alert severity={data.queryFailed ? "error" : "warning"} sx={{ py: 0.5 }}>{data.limitation}</Alert> : null}

        {!data.queryFailed ? (
          <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1, md: 1.15 }, "&:last-child": { pb: { xs: 1, md: 1.15 } } } }}>
            <Grid container columns={{ xs: 12, lg: 12 }}>
              <MetricCell label="Verified Payments" value={String(data.metrics.verifiedPayments)} icon={ReceiptText} tone="success" />
              <MetricCell label="Verified Amount" value={formatCurrency(data.metrics.verifiedAmount)} icon={Banknote} helper="Persisted paid amount." />
              <MetricCell label="Pending Payments" value={String(data.metrics.pendingPayments)} icon={Clock3} tone="warning" />
              <MetricCell label="COD Due" value={formatCurrency(data.metrics.codDue)} icon={CircleDollarSign} tone="info" helper="Cash on Delivery due." />
              <MetricCell label="Failed / Refunded" value={String(data.metrics.failedOrRefunded)} icon={AlertTriangle} tone="error" />
            </Grid>
          </V2Card>
        ) : null}

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.25, md: 1.35 }, "&:last-child": { pb: { xs: 1.25, md: 1.35 } } } }}>
          <Stack component="form" action="/admin-v2/transactions" method="get" direction={{ xs: "column", xl: "row" }} spacing={1} sx={{ alignItems: { xl: "center" } }}>
            <TextField name="q" label="Search order, customer, or reference" size="small" defaultValue={data.query.q} sx={{ minWidth: { xl: 285 }, ...inputSx }} />
            <TextField select name="method" label="Payment method" size="small" defaultValue={data.query.method} sx={{ minWidth: { xl: 170 }, ...inputSx }}>
              {[allOption, ...adminV2TransactionPaymentMethods.map((method) => ({ label: method, value: method }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select name="status" label="Payment status" size="small" defaultValue={data.query.status} sx={{ minWidth: { xl: 150 }, ...inputSx }}>
              {[allOption, ...adminV2TransactionPaymentStatuses.map((status) => ({ label: label(status), value: status }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select name="verification" label="Verification" size="small" defaultValue={data.query.verification} sx={{ minWidth: { xl: 145 }, ...inputSx }}>
              {[allOption, ...adminV2TransactionVerificationStatuses.map((status) => ({ label: status, value: status }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField name="from" type="date" size="small" label="From" defaultValue={data.query.from} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <TextField name="to" type="date" size="small" label="To" defaultValue={data.query.to} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <input type="hidden" name="pageSize" value={data.query.pageSize} />
            <Button type="submit" variant="contained" sx={{ minHeight: 38, px: 2 }}>Apply</Button>
            {hasFilters ? <Button href="/admin-v2/transactions" variant="outlined" sx={{ minHeight: 38, px: 2 }}>Reset</Button> : null}
          </Stack>
        </V2Card>

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.5, md: 1.75 }, "&:last-child": { pb: { xs: 1.5, md: 1.75 } } } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>Payment reconciliation</Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.totalCount} payment records
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                <Info size={13} /> Order-based payment records - gateway settlement/payout data unavailable.
              </Typography>
            </Box>
            <V2Chip label={`Page ${data.query.page} of ${data.totalPages}`} color="primary" />
          </Stack>

          {data.queryFailed ? (
            <Alert severity="error">Payment records could not be loaded. Please retry after the order payment backend is available.</Alert>
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
                    <TableCell sx={{ width: 160 }}>Payment / Order</TableCell>
                    <TableCell sx={{ width: 160 }}>Customer</TableCell>
                    <TableCell sx={{ width: 170 }}>Method</TableCell>
                    <TableCell sx={{ width: 116 }}>Payment Status</TableCell>
                    <TableCell sx={{ width: 112 }}>Verification</TableCell>
                    <TableCell sx={{ width: 150 }}>Reference</TableCell>
                    <TableCell align="right" sx={{ width: 145 }}>Amounts</TableCell>
                    <TableCell sx={{ width: 150 }}>Date</TableCell>
                    <TableCell align="right" sx={{ width: 105 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id || row.orderReference}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 900 }}>{row.orderReference || "Not provided"}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{paymentReference(row)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{row.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{row.customerContact}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{compactMethodLabel(row)}</Typography>
                      </TableCell>
                      <TableCell>
                        <V2Chip label={label(row.paymentStatus)} color={statusColor(row.paymentStatus)} size="small" sx={{ height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <V2Chip label={row.verificationStatus || "Not provided"} color={statusColor(row.verificationStatus)} size="small" sx={{ height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{paymentReference(row)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0} sx={{ lineHeight: 1.15 }}>
                          <Typography variant="caption">Paid: <strong>{amount(row.paidAmount)}</strong></Typography>
                          <Typography variant="caption">Due: <strong>{amount(row.dueAmount)}</strong></Typography>
                          <Typography variant="caption">Refunded: <strong>{amount(row.refundedAmount)}</strong></Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.paymentVerifiedAt ? formatDateTime(row.paymentVerifiedAt) : formatDateTime(row.createdAt)}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{row.paymentVerifiedAt ? "Verified time" : "Order created"}</Typography>
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
