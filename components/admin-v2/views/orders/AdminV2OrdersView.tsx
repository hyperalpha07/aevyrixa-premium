"use client";

import { Alert, Box, DialogActions, DialogContentText, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { Download, RefreshCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { OrderRecord, OrderStatus } from "@/app/lib/order-types";
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
  filterOrders,
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

export function AdminV2OrdersView({ orders, available, storageMode, limitation, permissions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<AdminV2OrderFilters>(() => readFilters(searchParams));
  const [page, setPage] = useState(Number(searchParams.get("page") || 1) - 1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportConfirm, setExportConfirm] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);
  const [notesOrder, setNotesOrder] = useState<OrderRecord | null>(null);
  const [note, setNote] = useState("");
  const [statusOrder, setStatusOrder] = useState<OrderRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [mutationPending, setMutationPending] = useState(false);

  const filteredOrders = useMemo(() => filterOrders(orders, filters), [orders, filters]);
  const metrics = useMemo(() => summaryForOrders(orders), [orders]);
  const visibleOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const filtered = activeFilterCount(filters) > 0;
  const includesPii = filteredOrders.some(hasPii);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      if (emptyOrderFilters[key as keyof AdminV2OrderFilters] === value) return;
      params.set(key, value);
    });
    if (page > 0) params.set("page", String(page + 1));
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [filters, page, pathname, router]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredOrders.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredOrders.length, page, rowsPerPage]);

  const updateFilters = (next: AdminV2OrderFilters) => {
    setFilters(next);
    setPage(0);
  };

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const exportCsv = (includePii: boolean) => {
    try {
      const csv = orderCsvRows(filteredOrders, includePii);
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
      await patchOrder(notesOrder.orderReference, { adminInternalNote: note.trim() });
      setToast({ message: "Internal note saved to the existing order note field.", severity: "success" });
      setNotesOrder(null);
      setNote("");
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Note update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
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
              disabled={!permissions.canExport || filteredOrders.length === 0}
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
          orders={visibleOrders}
          page={page}
          rowsPerPage={rowsPerPage}
          total={filteredOrders.length}
          filtered={filtered}
          canEditStatus={permissions.canEditStatus}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          onStatusClick={(order) => openStatus(order)}
          onNotesClick={(order) => {
            setNotesOrder(order);
            setNote(order.adminInternalNote ?? "");
          }}
          onInvoiceClick={setInvoiceOrder}
          onCancelClick={(order) => openStatus(order, "Cancelled")}
        />
      </Stack>

      <V2Dialog title="Export filtered orders?" open={exportConfirm} onClose={() => setExportConfirm(false)}>
        <DialogContentText>
          This export is limited to the currently filtered real orders. Customer PII is available in this result set.
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
          <Alert severity="info">
            Order note persistence is connected to the existing single internal note field. Note history, authors, and note timestamps are not stored yet.
          </Alert>
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
