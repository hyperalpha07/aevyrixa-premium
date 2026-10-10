"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Button, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Banknote, Info, ReceiptText, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import {
  adminV2RefundLedgerStatusLabels,
  adminV2RefundLedgerStatuses,
  adminV2RefundPaymentMethods,
  type AdminV2RefundLedgerStatus,
  type AdminV2RefundQueryResult,
} from "@/lib/admin-v2/refunds/refund-metrics";
import type { AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

const allOption = { label: "All", value: "all" };

function pageHref(data: AdminV2RefundQueryResult, page: number) {
  const params = new URLSearchParams();
  if (data.query.q) params.set("q", data.query.q);
  if (data.query.status !== "all") params.set("status", data.query.status);
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

function amount(value: number | null | undefined, currencyCode = "BDT") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return currencyCode === "BDT" ? formatCurrency(value) : `${currencyCode} ${value.toLocaleString("en-US")}`;
}

function moneyAggregate(summary: AdminV2MoneyAggregate) {
  if (summary.kind === "mixed") return "Mixed currencies";
  if (summary.kind === "none") return formatCurrency(0);
  return summary.currencyCode === "BDT" ? formatCurrency(summary.amount) : `${summary.currencyCode} ${summary.amount.toLocaleString("en-US")}`;
}

async function submitFinanceJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(body.errors) ? body.errors[0] : "Finance action failed.");
}

function statusColor(value: string): "success" | "warning" | "error" | "info" | "default" {
  if (value === "recorded") return "success";
  if (value === "void") return "warning";
  return "default";
}

function statusLabel(value: string) {
  return adminV2RefundLedgerStatusLabels[value as AdminV2RefundLedgerStatus] ?? (value || "Not provided");
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

export function AdminV2RefundsView({ data, capabilities }: { data: AdminV2RefundQueryResult; capabilities: { canRecordRefund: boolean; canExport: boolean; canViewOrder: boolean } }) {
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const hasFilters = Boolean(data.query.q || data.query.status !== "all" || data.query.method !== "all" || data.query.from || data.query.to);
  const emptyMessage = hasFilters ? "No refund records match these filters." : "No refund records found.";
  const inputSx = {
    "& .MuiInputBase-root": { minHeight: 38 },
    "& .MuiInputBase-input": { py: 0.85 },
  };
  const exportHref = `/api/admin/finance/refunds/export?${new URLSearchParams({
    ...(data.query.q ? { q: data.query.q } : {}),
    ...(data.query.method !== "all" ? { method: data.query.method } : {}),
    ...(data.query.status !== "all" ? { status: data.query.status } : {}),
    ...(data.query.from ? { from: data.query.from } : {}),
    ...(data.query.to ? { to: data.query.to } : {}),
  }).toString()}`;

  async function recordRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitFinanceJson("/api/admin/finance/refunds", {
        orderRef: form.get("orderRef"),
        paymentTransactionId: form.get("paymentTransactionId"),
        amount: Number(form.get("amount")),
        currencyCode: form.get("currencyCode"),
        refundMethod: form.get("refundMethod"),
        externalReference: form.get("externalReference"),
        reason: form.get("reason"),
        note: form.get("note"),
        occurredAt: form.get("occurredAt"),
        requestKey: crypto.randomUUID(),
      });
      window.location.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Refund could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  async function voidRefund(reference: string) {
    const reason = window.prompt("Void reason is required.");
    if (!reason?.trim()) return;
    setVoiding(reference);
    try {
      await submitFinanceJson(`/api/admin/finance/refunds/${encodeURIComponent(reference)}/void`, { reason });
      window.location.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Refund could not be voided.");
    } finally {
      setVoiding(null);
    }
  }

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
              <MetricCell label="Recorded Refunds" value={String(data.metrics.recordedRefunds)} icon={ReceiptText} tone="success" />
              <MetricCell label="Recorded Amount" value={moneyAggregate(data.metrics.recordedAmountSummary)} icon={Banknote} helper={data.metrics.recordedAmountSummary.kind === "mixed" ? "Unavailable as a single total." : "Recorded refund ledger amount."} />
              <MetricCell label="Voided Refunds" value={String(data.metrics.voidedRefunds)} icon={RotateCcw} tone="warning" />
              <MetricCell label="Total Ledger Entries" value={String(data.metrics.totalLedgerEntries)} icon={ReceiptText} tone="info" />
            </Grid>
          </V2Card>
        ) : null}

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.25, md: 1.35 }, "&:last-child": { pb: { xs: 1.25, md: 1.35 } } } }}>
          <Stack component="form" action="/admin-v2/refunds" method="get" direction={{ xs: "column", xl: "row" }} spacing={1} sx={{ alignItems: { xl: "center" } }}>
            <TextField name="q" label="Search refund, order, reference, or reason" size="small" defaultValue={data.query.q} sx={{ minWidth: { xl: 305 }, ...inputSx }} />
            <TextField select name="status" label="Ledger status" size="small" defaultValue={data.query.status} sx={{ minWidth: { xl: 165 }, ...inputSx }}>
              {[allOption, ...adminV2RefundLedgerStatuses.map((status) => ({ label: adminV2RefundLedgerStatusLabels[status], value: status }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select name="method" label="Refund method" size="small" defaultValue={data.query.method} sx={{ minWidth: { xl: 175 }, ...inputSx }}>
              {[allOption, ...adminV2RefundPaymentMethods.map((method) => ({ label: method, value: method }))].map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField name="from" type="date" size="small" label="From" defaultValue={data.query.from} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <TextField name="to" type="date" size="small" label="To" defaultValue={data.query.to} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <input type="hidden" name="pageSize" value={data.query.pageSize} />
            <Button type="submit" variant="contained" sx={{ minHeight: 38, px: 2 }}>Apply</Button>
            {hasFilters ? <Button href="/admin-v2/refunds" variant="outlined" sx={{ minHeight: 38, px: 2 }}>Reset</Button> : null}
            {capabilities.canExport ? <Button href={exportHref} variant="outlined" sx={{ minHeight: 38, px: 2 }}>Export CSV</Button> : null}
          </Stack>
        </V2Card>

        {capabilities.canRecordRefund ? (
          <V2Card>
            <Stack component="form" onSubmit={recordRefund} direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ alignItems: { lg: "center" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, minWidth: 112 }}>Record Refund</Typography>
              <TextField required name="orderRef" label="Order reference" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} />
              <TextField name="paymentTransactionId" label="Payment txn ID" size="small" slotProps={{ htmlInput: { maxLength: 64 } }} />
              <TextField required name="amount" label="Amount" type="number" size="small" slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }} />
              <TextField required name="currencyCode" label="Currency" size="small" defaultValue="BDT" slotProps={{ htmlInput: { maxLength: 3 } }} sx={{ width: 100 }} />
              <TextField name="refundMethod" label="Refund method" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} />
              <TextField required name="occurredAt" label="Occurred at" type="datetime-local" size="small" slotProps={{ inputLabel: { shrink: true } }} />
              <TextField required name="reason" label="Reason" size="small" slotProps={{ htmlInput: { maxLength: 1000 } }} />
              <TextField name="externalReference" label="External ref" size="small" slotProps={{ htmlInput: { maxLength: 256 } }} />
              <TextField name="note" label="Note" size="small" slotProps={{ htmlInput: { maxLength: 2000 } }} />
              <Button type="submit" disabled={saving} variant="contained">{saving ? "Saving..." : "Record"}</Button>
            </Stack>
            {actionError ? <Alert severity="warning" sx={{ mt: 1 }}>{actionError}</Alert> : null}
          </V2Card>
        ) : null}

        <V2Card sx={{ "& .MuiCardContent-root": { p: { xs: 1.5, md: 1.75 }, "&:last-child": { pb: { xs: 1.5, md: 1.75 } } } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>Refund reconciliation</Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.totalCount} refund records
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                <Info size={13} /> Recorded refund ledger entries. Gateway processor refund history is not tracked.
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
                    <TableCell sx={{ width: 150 }}>Refund reference</TableCell>
                    <TableCell sx={{ width: 145 }}>Order reference</TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>Amount</TableCell>
                    <TableCell sx={{ width: 165 }}>Refund method</TableCell>
                    <TableCell sx={{ width: 145 }}>External Reference</TableCell>
                    <TableCell sx={{ width: 210 }}>Reason</TableCell>
                    <TableCell sx={{ width: 105 }}>Status</TableCell>
                    <TableCell sx={{ width: 145 }}>Occurred at</TableCell>
                    <TableCell align="right" sx={{ width: 105 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id || row.orderReference}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 900 }}>{row.reference || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.orderReference || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" noWrap sx={{ fontWeight: 800 }}>{amount(row.amount, row.currencyCode)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.refundMethod}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.externalReference || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.reason || row.voidReason || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell>
                        <V2Chip label={statusLabel(row.status)} color={statusColor(row.status)} size="small" sx={{ height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{row.occurredAt || "Not provided"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}>
                          {capabilities.canViewOrder ? (
                            <V2Button size="small" variant="outlined" href={row.orderReference ? orderHref(row.orderReference) : undefined} disabled={!row.orderReference} sx={{ minHeight: 30, px: 1.25 }}>
                              View Order
                            </V2Button>
                          ) : null}
                          {capabilities.canRecordRefund && row.status === "recorded" ? (
                            <Button size="small" variant="text" color="warning" disabled={voiding === row.reference} onClick={() => voidRefund(row.reference)} sx={{ minHeight: 28, px: 1 }}>
                              Void
                            </Button>
                          ) : null}
                        </Stack>
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
