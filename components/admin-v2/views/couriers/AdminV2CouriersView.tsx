"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import type { OrderRecord, DeliveryStatus } from "@/app/lib/order-types";
import { deliveryStatuses } from "@/app/lib/order-types";
import type { AdminV2OrdersPayload } from "@/lib/admin-v2/orders";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

function shipmentHref(query: string, delivery: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (query.trim()) params.set("q", query.trim());
  if (delivery !== "all") params.set("delivery", delivery);
  return `/admin-v2/couriers?${params}`;
}
function statusLabel(value: string | undefined) {
  return value?.replaceAll("_", " ") ?? "Not provided";
}

export function AdminV2CouriersView({ data, canUpdate }: { data: AdminV2OrdersPayload; canUpdate: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(data.appliedFilters.q);
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("pending");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const filter = data.appliedFilters.delivery;
  function openEdit(order: OrderRecord) {
    setSelected(order);
    setCourierName(order.courierName ?? "");
    setTrackingId(order.trackingId ?? "");
    setDeliveryStatus(order.deliveryStatus ?? "pending");
    setDeliveryNote(order.deliveryNote ?? "");
    setMessage(null);
  }
  async function save() {
    if (!selected || saving) return;
    if (selected.status === "Cancelled") {
      setMessage({ severity: "error", text: "Cancelled orders cannot be shipped." });
      return;
    }
    if (courierName.trim().length > 120 || trackingId.trim().length > 160 || deliveryNote.trim().length > 1000) {
      setMessage({ severity: "error", text: "Courier details exceed their allowed length." }); return;
    }
    if (["dispatched", "in_transit", "delivered"].includes(deliveryStatus) &&
        (!courierName.trim() || !trackingId.trim())) {
      setMessage({ severity: "error", text: "Please enter the courier and actual tracking reference before marking dispatch/delivery." }); return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(selected.orderReference)}`, {
        method: "PATCH", cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courierName: courierName.trim(), trackingId: trackingId.trim(),
          deliveryStatus, deliveryNote: deliveryNote.trim(),
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Courier update failed.");
      }
      setSelected(null);
      setMessage({ severity: "success", text: "Manual courier details saved. Confirm shipment and collection with the actual courier separately." });
      router.refresh();
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "Courier update failed." });
    } finally { setSaving(false); }
  }
  return (
    <>
      <V2PageHeader title="Courier Operations" description="Manage real LIVE-order courier assignments and manual tracking. No external parcel booking is assumed."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Couriers" }]}
        actions={<Button component={Link} href="/admin-v2/orders?recordScope=live" variant="outlined">Live orders</Button>} />
      <Stack spacing={2}>
        {!data.available ? <Alert severity="error">Live order backend is unavailable. No demonstration shipments are displayed.</Alert> : null}
        <Alert severity="info">Manual courier mode: create the parcel in your courier provider dashboard and copy its actual tracking reference here. Pathao and Steadfast automated booking are not connected. This page does not verify COD settlement or mark refunds paid.</Alert>
        {message ? <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert> : null}
        <V2Card>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
              <Typography variant="h6">Live shipment queue · {data.available ? data.totalCount : "Unavailable"}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField size="small" label="Search orders" value={query} onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") router.push(shipmentHref(query, filter)); }} />
                <Button variant="outlined" onClick={() => router.push(shipmentHref(query, filter))}>Search</Button>
                <TextField select size="small" label="Delivery" value={filter} sx={{ minWidth: 150 }}
                  onChange={(event) => router.push(shipmentHref(query, event.target.value))}>
                  <MenuItem value="all">All</MenuItem>
                  {deliveryStatuses.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}
                </TextField>
              </Stack>
            </Stack>
            {data.available ? <TableContainer>
              <Table size="small" aria-label="Live courier shipments">
                <TableHead><TableRow>
                  <TableCell>Order</TableCell><TableCell>Order status</TableCell>
                  <TableCell>Courier</TableCell><TableCell>Tracking ID</TableCell><TableCell>Delivery</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow key={order.orderReference}>
                      <TableCell><Button size="small" component={Link} href={`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`}>{order.orderReference}</Button></TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{order.courierName || "Not assigned"}</TableCell>
                      <TableCell>{order.trackingId || "Not provided"}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={statusLabel(order.deliveryStatus)} /></TableCell>
                      <TableCell align="right">
                        {canUpdate && order.status !== "Cancelled" ?
                          <Button size="small" onClick={() => openEdit(order)}>Update tracking</Button> :
                          <Typography variant="caption" color="text.secondary">Read only</Typography>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.orders.length === 0 ? <TableRow><TableCell colSpan={6}>No live orders match the selected filters.</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </TableContainer> : null}
            {data.available && data.totalPages > 1 ? <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
              <Button disabled={data.page <= 1} onClick={() => router.push(shipmentHref(query, filter, data.page - 1))}>Previous</Button>
              <Typography variant="body2">Page {data.page} / {data.totalPages}</Typography>
              <Button disabled={data.page >= data.totalPages} onClick={() => router.push(shipmentHref(query, filter, data.page + 1))}>Next</Button>
            </Stack> : null}
          </Stack>
        </V2Card>
      </Stack>

      <Dialog open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Manual courier update · {selected?.orderReference}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Actual courier provider" size="small" value={courierName} onChange={(event) => setCourierName(event.target.value)} />
            <TextField label="Actual courier tracking ID" size="small" value={trackingId} onChange={(event) => setTrackingId(event.target.value)} />
            <TextField select label="Delivery status" size="small" value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value as DeliveryStatus)}>
              {deliveryStatuses.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}
            </TextField>
            <TextField multiline minRows={2} size="small" label="Manual delivery note" value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} />
            <Alert severity="warning">Only enter verified tracking information. This updates the order's courier fields—not courier provider APIs, financial ledgers or COD settlement.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setSelected(null)}>Cancel</Button>
          <Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving…" : "Save tracking"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
