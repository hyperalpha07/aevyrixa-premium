"use client";

import { Alert, Box, Chip, DialogActions, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { ArrowLeft, NotebookPen, Printer, RefreshCcw, ShieldAlert, SquarePen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { OrderRecord, OrderStatus } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2Dialog } from "@/components/admin-v2/forms/V2Dialog";
import { V2Select } from "@/components/admin-v2/forms/V2Select";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { AdminV2InvoicePreview } from "@/components/admin-v2/views/orders/detail/AdminV2InvoicePreview";
import { AdminV2OrderOverviewGrid } from "@/components/admin-v2/views/orders/detail/AdminV2OrderCards";
import {
  formatDateTime,
  isSensitiveOrderTransition,
  validNextOrderStatuses,
} from "@/components/admin-v2/views/orders/utils";

type Props = {
  order: OrderRecord;
  storageMode: string;
  permissions: {
    canEditStatus: boolean;
    canEditCourier: boolean;
  };
};

type Toast = { message: string; severity: "success" | "error" | "warning" };

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

export function AdminV2OrderDetailView({ order, permissions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState(order.adminInternalNote ?? "");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);

  const refresh = () => startTransition(() => router.refresh());
  const amounts = getAdminV2OrderAmounts(order);
  const backHref = searchParams.toString()
    ? `/admin-v2/orders?${searchParams.toString()}`
    : "/admin-v2/orders";

  const saveStatus = async () => {
    if (!nextStatus) return;
    if (!validNextOrderStatuses(order.status).includes(nextStatus)) {
      setToast({ message: "That status transition is not valid for the current order state.", severity: "warning" });
      return;
    }
    const needsReason = isSensitiveOrderTransition(order.status, nextStatus);
    if (needsReason && !reason.trim()) {
      setToast({ message: "A reason is required for this status change.", severity: "warning" });
      return;
    }

    try {
      setMutationPending(true);
      await patchOrder(order.orderReference, {
        status: nextStatus,
        ...(nextStatus === "Cancelled" ? { cancelledReason: reason.trim() } : {}),
      });
      setToast({ message: "Order status updated.", severity: "success" });
      setStatusOpen(false);
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Order status update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      setMutationPending(true);
      await patchOrder(order.orderReference, { adminInternalNote: note.trim() });
      setToast({ message: "Internal note saved.", severity: "success" });
      setNotesOpen(false);
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Note update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const canCancel = order.status !== "Cancelled" && order.status !== "Delivered";

  return (
    <>
      <V2PageHeader
        title={order.orderReference}
        description={`Created ${formatDateTime(order.createdAt)}. Total payable ${formatAdminV2Amount(amounts.total)}.`}
        breadcrumbs={[
          { label: "Admin V2", href: "/admin-v2/dashboard" },
          { label: "Orders", href: "/admin-v2/orders" },
          { label: order.orderReference },
        ]}
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <V2Button href={backHref} variant="text" startIcon={<ArrowLeft size={16} />}>Back</V2Button>
            <V2Button variant="outlined" startIcon={<NotebookPen size={16} />} onClick={() => setNotesOpen(true)}>Add Note</V2Button>
            <V2Button variant="outlined" startIcon={<Printer size={16} />} onClick={() => setInvoiceOpen(true)}>Print Invoice</V2Button>
            <V2Button variant="outlined" startIcon={<RefreshCcw size={16} />} loading={isPending} onClick={refresh}>Refresh</V2Button>
            <V2Button variant="contained" startIcon={<SquarePen size={16} />} disabled={!permissions.canEditStatus} onClick={() => { setNextStatus(""); setReason(""); setStatusOpen(true); }}>Update Status</V2Button>
          </Stack>
        }
      />

      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, flexWrap: "wrap" }}>
          <AdminV2OrderStatusChip value={order.status} />
          <Chip size="small" label={`Created ${formatDateTime(order.createdAt)}`} variant="outlined" />
          {order.updatedAt ? <Chip size="small" label={`Updated ${formatDateTime(order.updatedAt)}`} variant="outlined" /> : null}
        </Stack>
        {amounts.discrepancy ? (
          <Alert severity="warning" variant="outlined">
            Stored total differs from checkout payable. Admin V2 displays subtotal plus delivery as the payable total.
          </Alert>
        ) : null}
        <AdminV2OrderOverviewGrid order={order} />
      </Stack>

      <V2Dialog title="Update order status" open={statusOpen} onClose={() => setStatusOpen(false)}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Current status: <strong>{order.status}</strong>
          </Typography>
          <V2Select
            label="Next status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
            options={[
              { label: "Select status", value: "" },
              ...validNextOrderStatuses(order.status).map((status) => ({ label: status, value: status })),
            ]}
          />
          {nextStatus && isSensitiveOrderTransition(order.status, nextStatus) ? (
            <TextField fullWidth multiline minRows={3} label="Reason required" value={reason} onChange={(event) => setReason(event.target.value)} />
          ) : null}
          <Alert severity={nextStatus === "Cancelled" || order.status === "Delivered" ? "warning" : "info"}>
            Status changes are saved only after the existing order operations API confirms success.
          </Alert>
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button onClick={() => setStatusOpen(false)}>Close</V2Button>
            <V2Button variant="outlined" color="error" startIcon={<ShieldAlert size={16} />} disabled={!permissions.canEditStatus || !canCancel} onClick={() => { setNextStatus("Cancelled"); setReason(""); }}>
              Cancel order
            </V2Button>
            <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canEditStatus || !nextStatus} onClick={saveStatus}>
              Save status
            </V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <V2Dialog title="Order notes" open={notesOpen} onClose={() => setNotesOpen(false)}>
        <Stack spacing={2}>
          <Alert severity="info">
            Order note persistence is connected to the existing single internal note field. Note history, author, and note timestamps are not stored yet.
          </Alert>
          <TextField fullWidth multiline minRows={4} label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} />
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button onClick={() => setNotesOpen(false)}>Close</V2Button>
            <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canEditStatus || !note.trim()} onClick={saveNote}>Save note</V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <V2Dialog title="Order Invoice" open={invoiceOpen} onClose={() => setInvoiceOpen(false)} maxWidth="md">
        <Stack spacing={2}>
          <Box sx={{ maxHeight: "70vh", overflow: "auto" }}>
            <AdminV2InvoicePreview order={order} />
          </Box>
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button onClick={() => setInvoiceOpen(false)}>Close</V2Button>
            <V2Button variant="contained" onClick={() => window.print()}>Print</V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4200} onClose={() => setToast(null)}>
        <Alert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
