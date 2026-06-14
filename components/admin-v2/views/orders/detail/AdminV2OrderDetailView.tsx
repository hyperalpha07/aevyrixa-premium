"use client";

import { Alert, Box, Chip, DialogActions, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { ArrowLeft, NotebookPen, Printer, RefreshCcw, ShieldAlert, SquarePen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { OrderEventRecord, OrderInvoiceRecord, OrderNoteRecord, OrderRecord, OrderStatus } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
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

async function fetchOrderEvents(orderRef: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/events`, { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Events could not be loaded.");
  return (result.events ?? []) as OrderEventRecord[];
}

async function issueInvoice(orderRef: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/invoices`, { method: "POST" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Invoice could not be issued.");
  return result.invoice as OrderInvoiceRecord;
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
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<OrderNoteRecord[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [events, setEvents] = useState<OrderEventRecord[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<OrderInvoiceRecord | null>(null);
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
      await postOrderNote(order.orderReference, note.trim());
      setNotes(await fetchOrderNotes(order.orderReference));
      setEvents(await fetchOrderEvents(order.orderReference));
      setToast({ message: "Internal note saved.", severity: "success" });
      setNote("");
      refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Note update failed.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const openNotes = async () => {
    setNotesOpen(true);
    setNotesLoading(true);
    try {
      setNotes(await fetchOrderNotes(order.orderReference));
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Notes could not be loaded.", severity: "error" });
    } finally {
      setNotesLoading(false);
    }
  };

  const openInvoice = async () => {
    try {
      setMutationPending(true);
      setIssuedInvoice(await issueInvoice(order.orderReference));
      setInvoiceOpen(true);
      setEvents(await fetchOrderEvents(order.orderReference));
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Invoice could not be issued.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const canCancel = order.status !== "Cancelled" && order.status !== "Delivered";

  useEffect(() => {
    let active = true;
    fetchOrderEvents(order.orderReference)
      .then((next) => {
        if (active) setEvents(next);
      })
      .catch((error) => {
        if (active) setEventsError(error instanceof Error ? error.message : "Events could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [order.orderReference]);

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
            <V2Button variant="outlined" startIcon={<NotebookPen size={16} />} onClick={openNotes}>Add Note</V2Button>
            <V2Button variant="outlined" startIcon={<Printer size={16} />} loading={mutationPending} onClick={openInvoice}>Print Invoice</V2Button>
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
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Timeline</Typography>
          {eventsError ? <Alert severity="warning">{eventsError}</Alert> : null}
          <Stack spacing={1}>
            <V2Card sx={{ p: 2 }}>
              <Typography variant="body2">Order created</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(order.createdAt)} - Detailed history before Phase 2.2 was not stored.
              </Typography>
            </V2Card>
            {events.map((event) => (
              <V2Card key={event.id} sx={{ p: 2 }}>
                <Typography variant="body2">
                  {event.eventType.replaceAll("_", " ")}
                  {event.fromStatus && event.toStatus ? `: ${event.fromStatus} -> ${event.toStatus}` : ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.actorName} - {formatDateTime(event.createdAt)}
                  {event.reason ? ` - ${event.reason}` : ""}
                </Typography>
              </V2Card>
            ))}
          </Stack>
        </Box>
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
          {notesLoading ? <Alert severity="info">Loading note history...</Alert> : null}
          {!notesLoading && notes.length === 0 ? <Alert severity="info">No note history has been stored for this order yet.</Alert> : null}
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
            <V2Button onClick={() => setNotesOpen(false)}>Close</V2Button>
            <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canEditStatus || !note.trim()} onClick={saveNote}>Save note</V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <V2Dialog title="Order Invoice" open={invoiceOpen} onClose={() => setInvoiceOpen(false)} maxWidth="md">
        <Stack spacing={2}>
          {issuedInvoice ? (
            <Alert severity="success">
              Issued invoice {issuedInvoice.invoiceNumber} on {formatDateTime(issuedInvoice.issuedAt)}.
            </Alert>
          ) : null}
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
