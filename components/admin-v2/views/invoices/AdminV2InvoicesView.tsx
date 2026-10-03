import { Alert, Box, Button, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { CalendarDays, CircleSlash, FileText, ReceiptText } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { AdminV2InvoiceQueryResult, AdminV2InvoiceStatusFilter } from "@/lib/admin-v2/invoices/invoice-metrics";

const statusLabels: Record<AdminV2InvoiceStatusFilter, string> = {
  all: "All",
  issued: "Issued",
  void: "Void",
};

function pageHref(data: AdminV2InvoiceQueryResult, page: number) {
  const params = new URLSearchParams();
  if (data.query.q) params.set("q", data.query.q);
  if (data.query.status !== "all") params.set("status", data.query.status);
  if (data.query.from) params.set("from", data.query.from);
  if (data.query.to) params.set("to", data.query.to);
  params.set("page", String(page));
  params.set("pageSize", String(data.query.pageSize));
  return `/admin-v2/invoices?${params.toString()}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function invoiceHref(invoiceNumber: string, print = false) {
  return `/admin-v2/invoices/${encodeURIComponent(invoiceNumber)}${print ? "?print=1" : ""}`;
}

function orderHref(orderReference: string) {
  return `/admin-v2/orders/${encodeURIComponent(orderReference)}`;
}

export function AdminV2InvoicesView({ data }: { data: AdminV2InvoiceQueryResult }) {
  const hasFilters = Boolean(data.query.q || data.query.status !== "all" || data.query.from || data.query.to);
  const emptyMessage = hasFilters ? "No invoices match the current filters." : "No issued invoices exist yet.";

  return (
    <Box component="section" aria-labelledby="admin-v2-invoices-title">
      <V2PageHeader
        title="Invoices"
        titleId="admin-v2-invoices-title"
        titleComponent="h1"
        description="View and manage issued order invoices."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Invoices" }]}
      />

      <Stack spacing={2.5}>
        {data.limitation ? <Alert severity={data.storageAvailable ? "warning" : "error"}>{data.limitation}</Alert> : null}
        <Alert severity="info">
          Invoices are read-only Phase 1 records from the existing invoice table. Totals use persisted invoice values, not recalculated order totals.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <V2MetricCard label="Issued Invoices" value={String(data.metrics.issuedInvoices)} animatedValue={data.metrics.issuedInvoices} icon={ReceiptText} tone="primary" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <V2MetricCard label="Total Invoiced Value" value={formatCurrency(data.metrics.totalInvoicedValue)} icon={FileText} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <V2MetricCard label="Issued This Month" value={String(data.metrics.issuedThisMonth)} animatedValue={data.metrics.issuedThisMonth} icon={CalendarDays} tone="info" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <V2MetricCard label="Void Invoices" value={String(data.metrics.voidInvoices)} animatedValue={data.metrics.voidInvoices} icon={CircleSlash} tone="warning" />
          </Grid>
        </Grid>

        <V2Card>
          <Stack component="form" action="/admin-v2/invoices" method="get" direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ alignItems: { lg: "center" } }}>
            <TextField name="q" label="Search invoice or order" size="small" defaultValue={data.query.q} sx={{ minWidth: { lg: 260 } }} />
            <TextField select name="status" label="Status" size="small" defaultValue={data.query.status} sx={{ minWidth: { lg: 150 } }}>
              {(["all", "issued", "void"] as const).map((status) => <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>)}
            </TextField>
            <TextField name="from" type="date" size="small" label="Issued from" defaultValue={data.query.from} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField name="to" type="date" size="small" label="Issued to" defaultValue={data.query.to} slotProps={{ inputLabel: { shrink: true } }} />
            <input type="hidden" name="pageSize" value={data.query.pageSize} />
            <Button type="submit" variant="contained">Apply</Button>
            {hasFilters ? <Button href="/admin-v2/invoices" variant="outlined">Reset</Button> : null}
          </Stack>
        </V2Card>

        <V2Card>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}>
            <Box>
              <Typography component="h2" variant="h6">Invoice index</Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {data.rows.length} of {data.totalCount} invoices from the real invoice table.
              </Typography>
            </Box>
            <V2Chip label={`Page ${data.query.page} of ${data.totalPages}`} color="primary" />
          </Stack>

          {data.rows.length === 0 ? (
            <Alert severity="info">{emptyMessage}</Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((invoice) => {
                    const canOpenInvoice = Boolean(invoice.invoiceNumber);
                    return (
                      <TableRow key={invoice.id || `${invoice.invoiceNumber}-${invoice.orderReference}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>{invoice.invoiceNumber || "Not provided"}</Typography>
                        </TableCell>
                        <TableCell>{invoice.orderReference || "Not provided"}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{formatDateTime(invoice.issuedAt)}</TableCell>
                        <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                          <V2Chip label={invoice.status === "void" ? "Void" : "Issued"} color={invoice.status === "void" ? "warning" : "success"} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}>
                            <V2Button size="small" href={canOpenInvoice ? invoiceHref(invoice.invoiceNumber) : undefined} disabled={!canOpenInvoice}>Open Invoice</V2Button>
                            <V2Button size="small" href={canOpenInvoice ? invoiceHref(invoice.invoiceNumber, true) : undefined} disabled={!canOpenInvoice}>Print Invoice</V2Button>
                            <V2Button size="small" variant="outlined" href={invoice.orderReference ? orderHref(invoice.orderReference) : undefined} disabled={!invoice.orderReference}>View Order</V2Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
            <V2Button href={pageHref(data, Math.max(1, data.query.page - 1))} disabled={data.query.page <= 1} variant="outlined">Previous</V2Button>
            <V2Button href={pageHref(data, Math.min(data.totalPages, data.query.page + 1))} disabled={data.query.page >= data.totalPages} variant="outlined">Next</V2Button>
          </Stack>
        </V2Card>
      </Stack>
    </Box>
  );
}
