"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { adminV2ExpenseCategories, type AdminV2ExpenseQueryResult } from "@/lib/admin-v2/expenses/expense-metrics";
import { formatAdminV2Money, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

function fmt(value: number | null, currencyCode = "BDT") {
  if (typeof value !== "number") return "Unavailable";
  return formatAdminV2Money(value, currencyCode);
}

function moneyAggregate(summary: AdminV2MoneyAggregate) {
  if (summary.kind === "mixed") return "Mixed currencies";
  if (summary.kind === "none") return formatAdminV2Money(0);
  return formatAdminV2Money(summary.amount, summary.currencyCode);
}

async function submitFinanceJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(body.errors) ? body.errors[0] : "Finance action failed.");
}

export function AdminV2ExpensesView({ data, capabilities }: { data: AdminV2ExpenseQueryResult; capabilities: { canManageExpenses: boolean; canExport: boolean; canViewOrder: boolean } }) {
  const [actionError, setActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const hasFilters = Boolean(data.query.q || data.query.category !== "all" || data.query.status !== "all" || data.query.from || data.query.to);
  const emptyMessage = hasFilters ? "No expense records match these filters." : "No expense records found.";
  const exportHref = `/api/admin/finance/expenses/export?${new URLSearchParams({
    scope: data.dataScope ?? "live",
    ...(data.query.q ? { q: data.query.q } : {}),
    ...(data.query.category !== "all" ? { category: data.query.category } : {}),
    ...(data.query.status !== "all" ? { status: data.query.status } : {}),
    ...(data.query.from ? { from: data.query.from } : {}),
    ...(data.query.to ? { to: data.query.to } : {}),
  }).toString()}`;

  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitFinanceJson("/api/admin/finance/expenses", {
        occurredAt: form.get("occurredAt"),
        category: form.get("category"),
        amount: Number(form.get("amount")),
        currencyCode: form.get("currencyCode"),
        description: form.get("description"),
        payee: form.get("payee"),
        paymentMethod: form.get("paymentMethod"),
        externalReference: form.get("externalReference"),
        orderRef: form.get("orderRef"),
        note: form.get("note"),
        requestKey: crypto.randomUUID(),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Expense could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function voidExpense(reference: string) {
    const reason = window.prompt("Void reason is required.");
    if (!reason?.trim()) return;
    setVoiding(reference);
    try {
      await submitFinanceJson(`/api/admin/finance/expenses/${encodeURIComponent(reference)}/void`, { reason });
      window.location.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Expense could not be voided.");
    } finally {
      setVoiding(null);
    }
  }

  return (
    <Box component="section" aria-labelledby="admin-v2-expenses-title">
      <V2PageHeader
        title="Expenses"
        titleId="admin-v2-expenses-title"
        titleComponent="h1"
        description="Operational expense ledger with controlled create and void workflows; no receipt upload or fake vendor system is included."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Expenses" }]}
      />
      <Stack spacing={2}>
        {data.queryFailed ? <Alert severity="error">Expense ledger could not be loaded. Failed sources are not shown as zero.</Alert> : null}
        <Alert severity={data.dataScope === "test" ? "warning" : "info"}>{data.dataScope === "test" ? "TEST DATA ONLY — excluded from live business financial totals." : "LIVE BUSINESS DATA — historical test-order records excluded."}</Alert>
        {data.limitation ? <Alert severity={data.queryFailed ? "error" : "warning"}>{data.limitation}</Alert> : null}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          {[
            ["Active expenses", data.metrics.activeExpenses.toLocaleString("en-US")],
            ["Recorded expenses", moneyAggregate(data.metrics.activeAmountSummary)],
            ["Voided", data.metrics.voidExpenses.toLocaleString("en-US")],
            ["Linked orders", data.metrics.linkedOrders.toLocaleString("en-US")],
          ].map(([label, value]) => (
            <V2Card key={label}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 950, mt: 0.5 }}>{value}</Typography>
            </V2Card>
          ))}
        </Box>
        <V2Card>
          <Stack component="form" action="/admin-v2/expenses" method="get" direction={{ xs: "column", xl: "row" }} spacing={1} sx={{ alignItems: { xl: "center" } }}>
            <input type="hidden" name="scope" value={data.dataScope ?? "live"} />
            <TextField name="q" label="Search reference, order, payee, description" size="small" defaultValue={data.query.q} sx={{ minWidth: { xl: 300 } }} />
            <TextField select name="category" label="Category" size="small" defaultValue={data.query.category} sx={{ minWidth: { xl: 160 } }}>
              <MenuItem value="all">All</MenuItem>
              {adminV2ExpenseCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </TextField>
            <TextField select name="status" label="Status" size="small" defaultValue={data.query.status} sx={{ minWidth: { xl: 130 } }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="void">Void</MenuItem>
            </TextField>
            <TextField name="from" type="date" size="small" label="From" defaultValue={data.query.from} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField name="to" type="date" size="small" label="To" defaultValue={data.query.to} slotProps={{ inputLabel: { shrink: true } }} />
            <input type="hidden" name="pageSize" value={data.query.pageSize} />
            <Button type="submit" variant="contained">Apply</Button>
            {capabilities.canExport ? <Button href={exportHref} variant="outlined">Export CSV</Button> : null}
          </Stack>
        </V2Card>
        {capabilities.canManageExpenses ? (
          <V2Card>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Create an expense</Typography>
                <Typography variant="caption" color="text.secondary">Controlled expense ledger creation with all audit fields preserved.</Typography>
              </Box>
              <Button variant="contained" onClick={() => setCreateOpen(true)}>Create Expense</Button>
            </Stack>
            {actionError ? <Alert severity="warning" sx={{ mt: 1 }}>{actionError}</Alert> : null}
          </V2Card>
        ) : null}

        <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="md" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
          <DialogTitle sx={{ pb: 0.75, fontWeight: 950 }}>Create Expense</DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            <Stack id="admin-v2-create-expense-form" component="form" onSubmit={createExpense} spacing={2}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required name="occurredAt" label="Occurred at" type="datetime-local" size="small" slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required select name="category" label="Category" size="small" defaultValue="other">{adminV2ExpenseCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</TextField></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required name="amount" label="Amount" type="number" size="small" slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required name="currencyCode" label="Currency" size="small" defaultValue="BDT" slotProps={{ htmlInput: { maxLength: 3 } }} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth name="paymentMethod" label="Payment method" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} /></Grid>
                <Grid size={{ xs: 12 }}><TextField fullWidth required name="description" label="Description" size="small" multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="payee" label="Payee" size="small" slotProps={{ htmlInput: { maxLength: 256 } }} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="orderRef" label="Order reference" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="externalReference" label="External reference" size="small" slotProps={{ htmlInput: { maxLength: 256 } }} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="note" label="Internal note" size="small" multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }} /></Grid>
              </Grid>
              {actionError ? <Alert severity="warning">{actionError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.25 }}>
            <Button variant="outlined" disabled={saving} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="admin-v2-create-expense-form" disabled={saving} variant="contained">{saving ? "Saving..." : "Save Expense"}</Button>
          </DialogActions>
        </Dialog>
        <V2Card>
          <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                {["Reference", "Date", "Category", "Description", "Amount", "Status", "Actions"].map((label) => <TableCell key={label} align={label === "Actions" ? "right" : "left"}>{label}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id || row.reference}>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell>{row.occurredAt ? row.occurredAt.slice(0, 10) : "Not provided"}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.description || row.payee}</TableCell>
                  <TableCell>{fmt(row.amount, row.currencyCode)}</TableCell>
                  <TableCell><Chip size="small" label={row.status || "unknown"} color={row.status === "void" ? "warning" : "success"} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      {capabilities.canViewOrder && row.orderReference ? <V2Button size="small" variant="outlined" href={`/admin-v2/orders/${encodeURIComponent(row.orderReference)}`}>View Order</V2Button> : null}
                      {capabilities.canManageExpenses && row.status === "active" ? <Button size="small" color="warning" disabled={voiding === row.reference} onClick={() => voidExpense(row.reference)}>Void</Button> : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!data.rows.length ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      {data.queryFailed ? "Expense ledger unavailable." : emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </V2Card>
      </Stack>
    </Box>
  );
}
