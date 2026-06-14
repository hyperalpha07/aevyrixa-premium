"use client";

import { Avatar, Box, Chip, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Image from "next/image";
import { CreditCard, MapPin, Package, PackageCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { OrderRecord } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { normalizeAdminV2OrderItems, type AdminV2OrderItem } from "@/lib/admin-v2/orders/order-items";
import { getAdminV2DeliveryNote } from "@/lib/admin-v2/orders/order-notes";
import { getAdminV2PaymentLabels } from "@/lib/admin-v2/orders/order-payment";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { formatDateTime, statusLabel } from "@/components/admin-v2/views/orders/utils";

const missing = "Not provided";

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
      <Icon size={18} />
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{children}</Typography>
    </Stack>
  );
}

function DetailLine({ label, value, chip }: { label: string; value?: string | number | null; chip?: ReactNode }) {
  const displayValue = value === 0 || value ? value : missing;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.35, sm: 2 }} sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: 132 }, flexShrink: 0 }}>{label}</Typography>
      {chip ?? (
        <Typography
          variant="body2"
          sx={{
            textAlign: { sm: "right" },
            fontWeight: displayValue === missing ? 500 : 650,
            color: displayValue === missing ? "text.disabled" : "text.primary",
            overflowWrap: "anywhere",
            lineHeight: 1.55,
          }}
        >
          {displayValue}
        </Typography>
      )}
    </Stack>
  );
}

export function AdminV2OrderCustomerCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <SectionTitle icon={UserRound}>Customer Information</SectionTitle>
      <Stack spacing={1.25}>
        <DetailLine label="Name" value={order.customer.fullName} />
        <DetailLine label="Phone" value={order.customer.phone} />
        <DetailLine label="Email" value={order.customer.email} />
        <DetailLine label="Customer ID" value={order.customerId} />
        <DetailLine label="Customer type" value={order.customerId ? "Account customer" : "Guest or unavailable"} />
        <DetailLine label="City / Area" value={order.customer.cityArea} />
        <DetailLine label="Delivery address" value={order.customer.address} />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderPaymentCard({ order }: { order: OrderRecord }) {
  const amounts = getAdminV2OrderAmounts(order);
  const payment = getAdminV2PaymentLabels(order);

  return (
    <V2Card>
      <SectionTitle icon={CreditCard}>Payment Details</SectionTitle>
      <Stack spacing={1.25}>
        <DetailLine label="Method" value={payment.method} />
        <DetailLine label="Payment status" value={payment.status} />
        <DetailLine label="Verification" value={payment.verification} />
        <DetailLine label="Provider / wallet" value={payment.provider} />
        <DetailLine label="Transaction/reference" value={payment.transactionReference} />
        <DetailLine label="Subtotal" value={formatAdminV2Amount(amounts.subtotal)} />
        <DetailLine label="Discount" value={formatAdminV2Amount(amounts.discount)} />
        <DetailLine label="Delivery charge" value={formatAdminV2Amount(amounts.deliveryCharge)} />
        <DetailLine label="Total payable" value={formatAdminV2Amount(amounts.total)} />
        <DetailLine label="Paid" value={formatAdminV2Amount(payment.paidAmount)} />
        <DetailLine label="Due" value={formatAdminV2Amount(payment.dueAmount)} />
        {amounts.discrepancy ? (
          <Typography variant="caption" color="warning.main" sx={{ display: "block", lineHeight: 1.5 }}>
            Stored total: {formatAdminV2Amount(amounts.storedTotal)}. Displayed total follows checkout subtotal plus delivery.
          </Typography>
        ) : null}
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderDeliveryCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <SectionTitle icon={MapPin}>Delivery Details</SectionTitle>
      <Stack spacing={1.25}>
        <DetailLine label="Method" value="Not provided" />
        <DetailLine label="Courier" value={order.courierName} />
        <DetailLine label="Tracking ID" value={order.trackingId} />
        <DetailLine label="Delivery status" chip={<AdminV2OrderStatusChip value={order.deliveryStatus} />} />
        <DetailLine label="Zone" value={order.deliveryZone} />
        <DetailLine label="Area" value={order.deliveryArea} />
        <DetailLine label="Fee" value={formatAdminV2Amount(getAdminV2OrderAmounts(order).deliveryCharge)} />
        <DetailLine label="Recipient phone" value={order.customer.phone} />
        <DetailLine label="Address" value={order.customer.address} />
      </Stack>
    </V2Card>
  );
}

function ProductVisual({ item }: { item: AdminV2OrderItem }) {
  if (item.image) {
    return (
      <Box sx={{ width: 48, height: 48, position: "relative", borderRadius: 1.5, overflow: "hidden", bgcolor: "action.hover", flexShrink: 0 }}>
        <Image src={item.image} alt={`${item.productName} product image`} fill sizes="48px" style={{ objectFit: "cover" }} />
      </Box>
    );
  }

  return (
    <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: "action.hover", color: "text.secondary", border: "1px solid", borderColor: "divider" }}>
      <Package size={22} />
    </Avatar>
  );
}

function dash(value: string | number | null | undefined) {
  return value === 0 || value ? value : "\u2014";
}

export function AdminV2OrderItemsTable({ order }: { order: OrderRecord }) {
  const items = normalizeAdminV2OrderItems(order.items);

  return (
    <V2Card>
      <SectionTitle icon={PackageCheck}>Ordered Items</SectionTitle>
      <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
        <Table size="small" aria-label="Ordered items">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Color</TableCell>
              <TableCell sx={{ display: { sm: "none", md: "table-cell" } }}>SKU</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Line Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
                <TableRow key={item.key} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 220 }}>
                      <ProductVisual item={item} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.productSlug || item.productId || "No product reference"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{dash(item.variant)}</TableCell>
                  <TableCell>{dash(item.size)}</TableCell>
                  <TableCell>{dash(item.color)}</TableCell>
                  <TableCell sx={{ display: { sm: "none", md: "table-cell" } }}>{dash(item.sku)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatAdminV2Amount(item.unitPrice)}</TableCell>
                  <TableCell align="right">{formatAdminV2Amount(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
        {items.map((item) => (
          <Box key={item.key} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1.25 }}>
              <ProductVisual item={item} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>{item.productName}</Typography>
                <Typography variant="caption" color="text.secondary">{item.productSlug || item.productId || "No product reference"}</Typography>
              </Box>
            </Stack>
            <Grid container spacing={1}>
              <Grid size={6}><DetailLine label="Variant" value={dash(item.variant)} /></Grid>
              <Grid size={6}><DetailLine label="Size" value={dash(item.size)} /></Grid>
              <Grid size={6}><DetailLine label="Color" value={dash(item.color)} /></Grid>
              <Grid size={6}><DetailLine label="SKU" value={dash(item.sku)} /></Grid>
              <Grid size={6}><DetailLine label="Qty" value={item.quantity} /></Grid>
              <Grid size={6}><DetailLine label="Unit" value={formatAdminV2Amount(item.unitPrice)} /></Grid>
              <Grid size={12}><DetailLine label="Line total" value={formatAdminV2Amount(item.lineTotal)} /></Grid>
            </Grid>
          </Box>
        ))}
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderTimeline({ order }: { order: OrderRecord }) {
  const entries = [
    { label: "Order Placed", active: Boolean(order.createdAt), detail: formatDateTime(order.createdAt) },
    { label: "Payment Confirmed", active: order.paymentStatus === "verified", detail: statusLabel(order.paymentStatus) },
    { label: "Order Confirmed", active: order.status === "Confirmed", detail: order.status },
    { label: "Courier Assigned", active: Boolean(order.courierName || order.trackingId), detail: order.courierName || order.trackingId },
    { label: "Out for Delivery", active: order.deliveryStatus === "in_transit" || order.deliveryStatus === "dispatched", detail: statusLabel(order.deliveryStatus) },
    { label: "Delivered", active: order.status === "Delivered" || order.deliveryStatus === "delivered", detail: order.status === "Delivered" ? "Completed" : statusLabel(order.deliveryStatus) },
    { label: "Cancelled", active: order.status === "Cancelled", detail: order.cancelledReason || "Cancelled" },
  ].filter((entry) => entry.active);

  return (
    <V2Card>
      <SectionTitle icon={PackageCheck}>Order Timeline</SectionTitle>
      <Stack spacing={1.5}>
        {entries.map((entry) => (
          <Stack key={entry.label} direction="row" spacing={1.5}>
            <Box sx={{ width: 10, height: 10, mt: 0.7, borderRadius: "50%", bgcolor: entry.active ? "primary.main" : "divider", flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{entry.label}</Typography>
              <Typography variant="caption" color="text.secondary">{entry.detail || "Known from current order fields"}</Typography>
            </Box>
          </Stack>
        ))}
        <Chip size="small" label="Detailed event history is not yet stored." variant="outlined" sx={{ alignSelf: "flex-start" }} />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderNotes({ order }: { order: OrderRecord }) {
  const deliveryNote = getAdminV2DeliveryNote(order);

  return (
    <V2Card>
      <SectionTitle icon={Package}>Order Notes</SectionTitle>
      <Stack spacing={1.25}>
        <DetailLine label="Internal note" value={order.adminInternalNote} />
        <DetailLine label="Customer confirmation" value={order.customerConfirmationNote} />
        <DetailLine label="Delivery note" value={deliveryNote} />
        <DetailLine label="Payment note" value={order.paymentNote} />
        <DetailLine label="Cancelled reason" value={order.cancelledReason} />
        <Typography variant="caption" color="text.secondary">
          Full note history, authors, and note timestamps are not yet stored.
        </Typography>
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderOverviewGrid({ order }: { order: OrderRecord }) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderCustomerCard order={order} /></Grid>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderPaymentCard order={order} /></Grid>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderDeliveryCard order={order} /></Grid>
      <Grid size={{ xs: 12, xl: 8 }}><AdminV2OrderItemsTable order={order} /></Grid>
      <Grid size={{ xs: 12, xl: 4 }}>
        <Stack spacing={3}>
          <AdminV2OrderTimeline order={order} />
          <AdminV2OrderNotes order={order} />
        </Stack>
      </Grid>
    </Grid>
  );
}
