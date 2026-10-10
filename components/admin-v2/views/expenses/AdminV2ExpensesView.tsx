"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { formatCurrency } from "@/app/lib/currency";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { adminV2ExpenseCategories, type AdminV2ExpenseQueryResult } from "@/lib/admin-v2/expenses/expense-metrics";
import type { AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

function fmt(value: number | null, currencyCode = "BDT") {
  if (typeof value !== "number") return "Unavailable";
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

export function AdminV2ExpensesView({ data, capabilities }: { data: AdminV2ExpenseQueryResult; capabilities: { canManageExpenses: boolean; canExport: boolean; canViewOrder: boolean } }) {
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const exportHref = `/api/admin/finance/expenses/export?${new URLSearchParams({
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
        description="Read-only operational expense ledger. Create and void workflows use dedicated finance RPCs; no receipt upload or fake vendor system is included."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Expenses" }]}
      />
      <Stack spacing={2}>
        {data.queryFailed ? <Alert severity="error">Expense ledger could not be loaded. Failed sources are not shown as zero.</Alert> : null}
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
            <Stack component="form" onSubmit={createExpense} direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ alignItems: { lg: "center" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, minWidth: 112 }}>Create Expense</Typography>
              <TextField required name="occurredAt" label="Occurred at" type="datetime-local" size="small" slotProps={{ inputLabel: { shrink: true } }} />
              <TextField required select name="category" label="Category" size="small" defaultValue="other" sx={{ minWidth: 140 }}>
                {adminV2ExpenseCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </TextField>
              <TextField required name="amount" label="Amount" type="number" size="small" slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }} />
              <TextField required name="currencyCode" label="Currency" size="small" defaultValue="BDT" slotProps={{ htmlInput: { maxLength: 3 } }} sx={{ width: 100 }} />
              <TextField required name="description" label="Description" size="small" slotProps={{ htmlInput: { maxLength: 2000 } }} />
              <TextField name="payee" label="Payee" size="small" slotProps={{ htmlInput: { maxLength: 256 } }} />
              <TextField name="paymentMethod" label="Payment method" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} />
              <TextField name="externalReference" label="External ref" size="small" slotProps={{ htmlInput: { maxLength: 256 } }} />
              <TextField name="orderRef" label="Order ref" size="small" slotProps={{ htmlInput: { maxLength: 128 } }} />
              <TextField name="note" label="Note" size="small" slotProps={{ htmlInput: { maxLength: 2000 } }} />
              <Button type="submit" disabled={saving} variant="contained">{saving ? "Saving..." : "Create"}</Button>
            </Stack>
            {actionError ? <Alert severity="warning" sx={{ mt: 1 }}>{actionError}</Alert> : null}
          </V2Card>
        ) : null}
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
                      {data.queryFailed ? "Expense ledger unavailable." : "No expenses match these filters."}
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
