"use client";

import { Alert, Box, Breadcrumbs, Chip, DialogActions, Divider, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { ArrowLeft, CircleDollarSign, Clock3, NotebookPen, Printer, RefreshCcw, ShieldAlert, Sparkles, SquarePen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { OrderEventRecord, OrderInvoiceRecord, OrderNoteRecord, OrderRecord, OrderStatus } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Dialog } from "@/components/admin-v2/forms/V2Dialog";
import { V2Select } from "@/components/admin-v2/forms/V2Select";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { AdminV2InvoicePreview } from "@/components/admin-v2/views/orders/detail/AdminV2InvoicePreview";
import {
  AdminV2ActivityTimeline,
  AdminV2OrderFinancialMeta,
  AdminV2OrderItemsTable,
  AdminV2OrderNotes,
  AdminV2OrderOverviewGrid,
  AdminV2OrderProgress,
} from "@/components/admin-v2/views/orders/detail/AdminV2OrderCards";
import {
  formatDateTime,
  isSensitiveOrderTransition,
  itemCount,
  validNextOrderStatuses,
} from "@/components/admin-v2/views/orders/utils";

type Props = {
  order: OrderRecord;
  storageMode: string;
  permissions: {
    canEditStatus: boolean;
    canEditCourier: boolean;
    canViewInvoice: boolean;
    canIssueInvoice: boolean;
    canAddNote: boolean;
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

async function fetchIssuedInvoice(orderRef: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/invoices`, {
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Invoice could not be loaded.");
  }
  return ((result.invoices ?? []) as OrderInvoiceRecord[]).find((invoice) => invoice.status === "issued") ?? null;
}

export function AdminV2OrderDetailView({ order, storageMode, permissions }: Props) {
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
  const [invoiceIssueOpen, setInvoiceIssueOpen] = useState(false);
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
      setNotesOpen(false);
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

  const viewInvoice = async () => {
    if (mutationPending) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.title = "Checking invoice";
      printWindow.document.body.innerHTML = "<p style=\"font-family: Arial, sans-serif; padding: 24px;\">Checking for an issued invoice...</p>";
    }

    try {
      setMutationPending(true);
      const invoice = await fetchIssuedInvoice(order.orderReference);
      if (!invoice) {
        printWindow?.close();
        setToast({ message: "No issued invoice exists for this order. Use Issue invoice to create one.", severity: "warning" });
        return;
      }
      setIssuedInvoice(invoice);
      if (printWindow) {
        printWindow.location.href = `/admin-v2/orders/${encodeURIComponent(order.orderReference)}/invoice`;
      } else {
        setInvoiceOpen(true);
      }
    } catch (error) {
      printWindow?.close();
      setToast({ message: error instanceof Error ? error.message : "Invoice could not be loaded.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const confirmIssueInvoice = async () => {
    if (mutationPending || !permissions.canIssueInvoice) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.title = "Issuing invoice";
      printWindow.document.body.innerHTML = "<p style=\"font-family: Arial, sans-serif; padding: 24px;\">Issuing invoice after confirmation...</p>";
    }

    try {
      setMutationPending(true);
      const invoice = await issueInvoice(order.orderReference);
      setIssuedInvoice(invoice);
      setInvoiceIssueOpen(false);
      if (printWindow) {
        printWindow.location.href = `/admin-v2/orders/${encodeURIComponent(order.orderReference)}/invoice`;
      } else {
        setInvoiceOpen(true);
      }
      setEvents(await fetchOrderEvents(order.orderReference));
      setToast({ message: `Invoice ${invoice.invoiceNumber} is issued.`, severity: "success" });
    } catch (error) {
      printWindow?.close();
      setToast({ message: error instanceof Error ? error.message : "Invoice could not be issued.", severity: "error" });
    } finally {
      setMutationPending(false);
    }
  };

  const canCancel = order.status !== "Cancelled" && order.status !== "Delivered";

  useEffect(() => {
    let active = true;
    setNotesLoading(true);
    fetchOrderNotes(order.orderReference)
      .then((next) => {
        if (active) setNotes(next);
      })
      .catch(() => {
        if (active) setNotes([]);
      })
      .finally(() => {
        if (active) setNotesLoading(false);
      });
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
      <Stack
        spacing={2.5}
        sx={{
          position: "relative",
          "&::before": {
            content: '""',
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 78% 8%, rgba(255,79,184,0.13), transparent 28%), radial-gradient(circle at 12% 28%, rgba(6,182,212,0.09), transparent 26%)",
            zIndex: -1,
          },
        }}
      >
        <V2Card
          sx={{
            p: 0,
            overflow: "hidden",
            borderColor: "rgba(157,47,255,0.2)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(250,246,255,0.92) 58%, rgba(240,253,255,0.86))",
            boxShadow: "0 24px 70px rgba(58,34,105,0.13)",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 18% 0%, rgba(157,47,255,0.16), transparent 32%), radial-gradient(circle at 86% 24%, rgba(255,79,184,0.12), transparent 28%)",
              pointerEvents: "none",
            },
            "& .MuiCardContent-root": { p: { xs: 2.25, md: 3 } },
          }}
        >
          <Stack spacing={2.25} sx={{ position: "relative" }}>
            <Breadcrumbs aria-label="Order detail breadcrumb" sx={{ color: "text.secondary", fontSize: 13 }}>
              <Typography component={Link} href="/admin-v2/dashboard" color="inherit" sx={{ textDecoration: "none", "&:hover": { color: "primary.main" } }}>
                Admin V2
              </Typography>
              <Typography component={Link} href="/admin-v2/orders" color="inherit" sx={{ textDecoration: "none", "&:hover": { color: "primary.main" } }}>
                Orders
              </Typography>
              <Typography color="text.primary" sx={{ fontWeight: 750 }}>{order.orderReference}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ justifyContent: "space-between", alignItems: { lg: "flex-start" } }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    size="small"
                    icon={<Sparkles size={14} />}
                    label="Order command"
                    variant="outlined"
                    sx={{ bgcolor: "rgba(157,47,255,0.06)", fontWeight: 750 }}
                  />
                  <AdminV2OrderStatusChip value={order.status} />
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0, overflowWrap: "anywhere" }}>
                  {order.orderReference}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                  {order.customer.fullName || "Customer not provided"} - {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"} - {order.paymentDetails.paymentMethod || "Payment method not provided"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Chip size="small" icon={<Clock3 size={14} />} label={`Created ${formatDateTime(order.createdAt)}`} variant="outlined" />
                  {order.updatedAt ? <Chip size="small" label={`Updated ${formatDateTime(order.updatedAt)}`} variant="outlined" /> : null}
                  <Chip size="small" label={`Delivery ${order.deliveryStatus ? order.deliveryStatus.replaceAll("_", " ") : "not provided"}`} variant="outlined" />
                </Stack>
              </Box>

              <Stack spacing={1.6} sx={{ width: { xs: "100%", lg: 390 } }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid rgba(157,47,255,0.16)",
                    bgcolor: "rgba(255,255,255,0.72)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <CircleDollarSign size={20} color="#9d2fff" />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, textTransform: "uppercase" }}>
                        Canonical payable
                      </Typography>
                    </Stack>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: 950 }}>
                      {formatAdminV2Amount(amounts.total)}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1.4 }} />
                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>{order.customer.phone || "Not provided"}</Typography>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, justifyContent: { lg: "flex-end" } }}>
                  <V2Button href={backHref} variant="text" startIcon={<ArrowLeft size={16} />} aria-label="Back to orders">Back</V2Button>
                  <V2Button variant="outlined" startIcon={<NotebookPen size={16} />} disabled={!permissions.canAddNote} onClick={openNotes}>Add Note</V2Button>
                  <Tooltip title="Read-only: opens an already issued invoice">
                    <span>
                      <V2Button variant="outlined" startIcon={<Printer size={16} />} loading={mutationPending} disabled={!permissions.canViewInvoice} onClick={viewInvoice}>
                        {mutationPending ? "Checking..." : "View / Print invoice"}
                      </V2Button>
                    </span>
                  </Tooltip>
                  <V2Button variant="outlined" startIcon={<Printer size={16} />} disabled={!permissions.canIssueInvoice} onClick={() => setInvoiceIssueOpen(true)}>Issue invoice</V2Button>
                  <V2Button variant="outlined" startIcon={<RefreshCcw size={16} />} loading={isPending} onClick={refresh}>Refresh</V2Button>
                  <V2Button variant="contained" startIcon={<SquarePen size={16} />} disabled={!permissions.canEditStatus} onClick={() => { setNextStatus(""); setReason(""); setStatusOpen(true); }}>Update Status</V2Button>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </V2Card>

        {amounts.discrepancy ? (
          <Alert
            severity="warning"
            variant="outlined"
            icon={<TriangleAlert size={19} />}
            sx={{
              alignItems: "flex-start",
              borderColor: "rgba(245,158,11,0.34)",
              bgcolor: "rgba(255,251,235,0.78)",
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 850 }}>
              Stored total differs from checkout payable.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin V2 displays subtotal plus delivery as the payable total while preserving the stored total for audit.
            </Typography>
            <Box component="details" sx={{ mt: 0.75 }}>
              <Typography component="summary" variant="caption" sx={{ cursor: "pointer", fontWeight: 750 }}>
                View stored-total details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stored total {formatAdminV2Amount(amounts.storedTotal)}. Displayed payable {formatAdminV2Amount(amounts.total)}.
              </Typography>
            </Box>
          </Alert>
        ) : null}

        <AdminV2OrderOverviewGrid order={order} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 7fr) minmax(300px, 3fr)" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            <AdminV2OrderItemsTable order={order} />
            <AdminV2OrderFinancialMeta order={order} />
            <AdminV2ActivityTimeline order={order} events={events} error={eventsError} />
          </Stack>
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            <AdminV2OrderProgress order={order} />
            <AdminV2OrderNotes order={order} notes={notes} loading={notesLoading} />
            <V2Card
              sx={{
                borderColor: "rgba(6,182,212,0.16)",
                bgcolor: "rgba(255,255,255,0.78)",
                "& .MuiCardContent-root": { p: 2 },
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, textTransform: "uppercase" }}>
                Order meta
              </Typography>
              <Stack spacing={0.8} sx={{ mt: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">Storage</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 750 }}>{storageMode}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 750, overflowWrap: "anywhere", textAlign: "right" }}>{order.orderId}</Typography>
                </Stack>
              </Stack>
            </V2Card>
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
            <V2Button variant="contained" loading={mutationPending} disabled={!permissions.canAddNote || !note.trim()} onClick={saveNote}>
              {mutationPending ? "Saving..." : "Save note"}
            </V2Button>
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
            <AdminV2InvoicePreview order={order} invoice={issuedInvoice} />
          </Box>
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button onClick={() => setInvoiceOpen(false)}>Close</V2Button>
            <V2Button variant="contained" onClick={() => window.print()}>Print</V2Button>
          </DialogActions>
        </Stack>
      </V2Dialog>

      <V2Dialog
        title="Issue invoice?"
        open={invoiceIssueOpen}
        onClose={() => {
          if (!mutationPending) setInvoiceIssueOpen(false);
        }}
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            This creates a persistent financial snapshot and audit event for order {order.orderReference}.
            Viewing or printing an existing invoice does not perform this action.
          </Typography>
          <Alert severity="warning">Only continue after confirming that the order is ready for invoice issuance.</Alert>
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <V2Button disabled={mutationPending} onClick={() => setInvoiceIssueOpen(false)}>Cancel</V2Button>
            <V2Button
              variant="contained"
              loading={mutationPending}
              disabled={!permissions.canIssueInvoice}
              onClick={() => void confirmIssueInvoice()}
            >
              Issue invoice
            </V2Button>
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
