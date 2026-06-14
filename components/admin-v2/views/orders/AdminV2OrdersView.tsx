"use client";

import { Alert, Box, DialogActions, DialogContentText, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { Download, RefreshCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { OrderNoteRecord, OrderRecord, OrderStatus } from "@/app/lib/order-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2Dialog } from "@/components/admin-v2/forms/V2Dialog";
import { V2Select } from "@/components/admin-v2/forms/V2Select";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { AdminV2OrderSummaryCards } from "@/components/admin-v2/views/orders/AdminV2OrderSummaryCards";
import { AdminV2OrdersFilters } from "@/components/admin-v2/views/orders/AdminV2OrdersFilters";
import { AdminV2OrdersTable } from "@/components/admin-v2/views/orders/AdminV2OrdersTable";
import { AdminV2OrdersErrorState } from "@/components/admin-v2/views/orders/AdminV2OrdersErrorState";
import { AdminV2InvoicePreview } from "@/components/admin-v2/views/orders/detail/AdminV2InvoicePreview";
import {
  activeFilterCount,
  emptyOrderFilters,
  formatDateTime,
  orderCsvRows,
  validNextOrderStatuses,
  isSensitiveOrderTransition,
  summaryForOrders,
  type AdminV2OrderFilters,
  type AdminV2OrderSort,
} from "@/components/admin-v2/views/orders/utils";

type Props = {
  orders: OrderRecord[];
  available: boolean;
  storageMode: string;
  limitation: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  permissions: {
    canExport: boolean;
    canEditStatus: boolean;
    canEditCourier: boolean;
  };
};

type Toast = { message: string; severity: "success" | "error" | "warning" };

function readFilters(searchParams: URLSearchParams): AdminV2OrderFilters {
  const sort = searchParams.get("sort");
  return {
    q: searchParams.get("q") ?? "",
    status: searchParams.get("status") ?? "all",
    payment: searchParams.get("payment") ?? "all",
    paymentStatus: searchParams.get("paymentStatus") ?? "all",
    delivery: searchParams.get("delivery") ?? "all",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    sort: sort === "oldest" || sort === "highest" || sort === "lowest" ? (sort as AdminV2OrderSort) : "newest",
  };
}

function hasPii(order: OrderRecord) {
  return Boolean(order.customer.fullName || order.customer.phone || order.customer.email || order.customer.address);
}

async function patchOrder(orderRef: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(result.errors) ? result.errors.join(" ") : "Order update failed.";
    throw new Error(message);
  }
  return result;
}

async function fetchOrderNotes(orderRef: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/notes`, { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Notes could not be loaded.");
  return (result.notes ?? []) as OrderNoteRecord[];
}

async function postOrderNote(orderRef: string, noteBody: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ noteBody, noteType: "internal" }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Note could not be saved.");
  return result.note as OrderNoteRecord;
}

export function AdminV2OrdersView({
  orders,
  available,
  storageMode,
  limitation,
  totalCount,
  page: serverPage,
  pageSize,
  permissions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<AdminV2OrderFilters>(() => readFilters(searchParams));
  const [page, setPage] = useState(Math.max(0, serverPage - 1));
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportConfirm, setExportConfirm] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);
  const [notesOrder, setNotesOrder] = useState<OrderRecord | null>(null);
  const [notes, setNotes] = useState<OrderNoteRecord[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [statusOrder, setStatusOrder] = useState<OrderRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [mutationPending, setMutationPending] = useState(false);

  const metrics = useMemo(() => summaryForOrders(orders), [orders]);
  const filtered = activeFilterCount(filters) > 0;
  const includesPii = orders.some(hasPii);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      if (emptyOrderFilters[key as keyof AdminV2OrderFilters] === value) return;
      params.set(key, value);
    });
    if (page > 0) params.set("page", String(page + 1));
    if (rowsPerPage !== 10) params.set("pageSize", String(rowsPerPage));
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [filters, page, pathname, router, rowsPerPage]);

  const updateFilters = (next: AdminV2OrderFilters) => {
    setFilters(next);
    setPage(0);
  };

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const exportCsv = (includePii: boolean) => {
    try {
      const csv = orderCsvRows(orders, includePii);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aevyrixa-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setToast({ message: "Filtered real orders exported.", severity: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Export failed.", severity: "error" });
    }
  };

  const openStatus = (order: OrderRecord, forcedStatus?: OrderStatus) => {
    setStatusOrder(order);
    setNextStatus(forcedStatus ?? "");
    setReason("");
  };

  const saveStatus = async () => {
    if (!statusOrder || !nextStatus) return;
    if (!validNextOrderStatuses(statusOrder.status).includes(nextStatus)) {
      setToast({ message: "That status transition is not valid for the current order state.", severity: "warning" });
      return;
    }
    const needsReason = isSensitiveOrderTransition(statusOrder.status, nextStatus);
    if (needsReason && !reason.trim()) {
      setToast({ message: "A reason is required for this status change.", severity: "warning" });
      return;
    }

    try {
      setMutationPending(true);
      await patchOrder(statusOrder.orderReference, {
        status: nextStatus,
        ...(nextStatus === "Cancelled" ? { cancelledReason: reason.trim() } : {}),
      });
      setToast({ message: "Order status updated from the real backend.", severity: "success" });
      setStatusOrder(null);
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Order status update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const saveNote = async () => {
    if (!notesOrder || !note.trim()) return;
    try {
      setMutationPending(true);
      await postOrderNote(notesOrder.orderReference, note.trim());
      setNotes(await fetchOrderNotes(notesOrder.orderReference));
      setToast({ message: "Internal note saved to note history.", severity: "success" });
      setNote("");
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Note update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const openNotes = async (order: OrderRecord) => {
    setNotesOrder(order);
    setNote("");
    setNotes([]);
    setNotesError(null);
    setNotesLoading(true);
    try {
      setNotes(await fetchOrderNotes(order.orderReference));
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : "Notes could not be loaded.");
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <>
      <V2PageHeader
        title="Orders"
        description="Manage customer orders, payments, delivery, and fulfillment."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Orders" }]}
        actions={
          <Stack direction="row" spacing={1}>
            <V2Button
              variant="outlined"
              startIcon={<Download size={16} />}
          disabled={!permissions.canExport || orders.length === 0}
              onClick={() => {
                if (includesPii) setExportConfirm(true);
                else exportCsv(false);
              }}
            >
              Export
            </V2Button>
            <V2Button variant="contained" startIcon={<RefreshCcw size={16} />} loading={isPending} onClick={refresh}>
              Refresh
            </V2Button>
          </Stack>
        }
      />

      <Stack spacing={3}>
        {!available ? (
          <AdminV2OrdersErrorState message={`Real orders are unavailable because storage mode is ${storageMode}. Demo-memory orders are hidden.`} />
        ) : null}
        {limitation ? <Alert severity="info">{limitation}</Alert> : null}
        <AdminV2OrderSummaryCards metrics={metrics} />
        <AdminV2OrdersFilters
          filters={filters}
          onChange={updateFilters}
          drawerOpen={drawerOpen}
          onDrawerOpen={() => setDrawerOpen(true)}
          onDrawerClose={() => setDrawerOpen(false)}
        />
        <AdminV2OrdersTable
          orders={orders}
          page={page}
          rowsPerPage={rowsPerPage}
          total={totalCount}
          filtered={filtered}
          canEditStatus={permissions.canEditStatus}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          onStatusClick={(order) => openStatus(order)}
          onNotesClick={(order) => {
            void openNotes(order);
          }}
          onInvoiceClick={setInvoiceOrder}
          onCancelClick={(order) => openStatus(order, "Cancelled")}
        />
      </Stack>

      <V2Dialog title="Export filtered orders?" open={exportConfirm} onClose={() => setExportConfirm(false)}>
        <DialogContentText>
          This export is limited to the currently loaded server page. Customer PII is available in this result set.
        </DialogContentText>
        <DialogActions sx={{ px: 0, pb: 0 }}>
          <V2Button onClick={() => { setExportConfirm(false); exportCsv(false); }}>Export without PII</V2Button>
          <V2Button variant="contained" onClick={() => { setExportConfirm(false); exportCsv(true); }}>
            Include authorized PII
          </V2Button>
        </DialogActions>
      </V2Dialog>

      <V2Dialog title="Update order status" open={Boolean(statusOrder)} onClose={() => setStatusOrder(null)}>
        {statusOrder ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Current status: <strong>{statusOrder.status}</strong>
            </Typography>
            <V2Select
              label="Next status"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
              options={[
                { label: "Select status", value: "" },
                ...validNextOrderStatuses(statusOrder.status).map((status) => ({ label: status, value: status })),
              ]}
            />
            {nextStatus && isSensitiveOrderTransition(statusOrder.status, nextStatus) ? (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Reason required"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                helperText="Required for cancellation, refunds, or reverting fulfilled states."
              />
            ) : null}
            <Alert severity="warning">
              Status changes call the existing order operations API and are saved only after the backend confirms success.
            </Alert>
            <DialogActions sx={{ px: 0, pb: 0 }}>
              <V2Button onClick={() => setStatusOrder(null)}>Cancel</V2Button>
              <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canEditStatus || !nextStatus} onClick={saveStatus}>
                Save status
              </V2Button>
            </DialogActions>
          </Stack>
        ) : null}
      </V2Dialog>

      <V2Dialog title="Order notes" open={Boolean(notesOrder)} onClose={() => setNotesOrder(null)}>
        <Stack spacing={2}>
          {notesLoading ? <Alert severity="info">Loading note history...</Alert> : null}
          {notesError ? <Alert severity="error">{notesError}</Alert> : null}
          {!notesLoading && !notesError && notes.length === 0 ? (
            <Alert severity="info">No note history has been stored for this order yet.</Alert>
          ) : null}
          {notes.map((item) => (
            <V2Card key={item.id} sx={{ p: 2 }}>
              <Typography variant="body2">{item.noteBody}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.createdByName} - {formatDateTime(item.createdAt)} - {item.noteType}
              </Typography>
            </V2Card>
          ))}
          <TextField fullWidth multiline minRows={4} label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} />
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button onClick={() => setNotesOrder(null)}>Close</V2Button>
            <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canEditStatus || !note.trim()} onClick={saveNote}>
              Save note
            </V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <V2Dialog title="Order Invoice" open={Boolean(invoiceOrder)} onClose={() => setInvoiceOrder(null)} maxWidth="md">
        {invoiceOrder ? (
          <Stack spacing={2}>
            <Box sx={{ maxHeight: "70vh", overflow: "auto" }}>
              <AdminV2InvoicePreview order={invoiceOrder} />
            </Box>
            <DialogActions sx={{ px: 0, pb: 0 }}>
              <V2Button onClick={() => setInvoiceOrder(null)}>Close</V2Button>
              <V2Button variant="contained" onClick={() => window.print()}>
                Print
              </V2Button>
            </DialogActions>
          </Stack>
        ) : null}
      </V2Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4200} onClose={() => setToast(null)}>
        <Alert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
