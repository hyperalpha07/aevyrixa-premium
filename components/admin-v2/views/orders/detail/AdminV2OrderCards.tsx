"use client";

import { Avatar, Box, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Image from "next/image";
import type { OrderRecord } from "@/app/lib/order-types";
import { formatCurrency } from "@/app/lib/currency";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { formatDateTime, itemVariant, statusLabel } from "@/components/admin-v2/views/orders/utils";

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>{value || "Not provided"}</Typography>
    </Stack>
  );
}

export function AdminV2OrderCustomerCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
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
  const delivery = order.deliveryCharge ?? 0;
  const discount = Math.max(0, order.totals.subtotal + delivery - order.totalAmount);

  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Payment Details</Typography>
      <Stack spacing={1.25}>
        <DetailLine label="Method" value={order.paymentDetails.paymentMethod} />
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">Payment status</Typography>
          <AdminV2OrderStatusChip value={order.paymentStatus} />
        </Stack>
        <DetailLine label="Verification" value={order.paymentVerificationStatus} />
        <DetailLine label="Wallet provider" value={order.paymentDetails.walletProvider} />
        <DetailLine label="Transaction/reference" value={order.paymentReference || order.paymentDetails.transactionReference} />
        <DetailLine label="Subtotal" value={formatCurrency(order.totals.subtotal)} />
        <DetailLine label="Discount" value={discount ? formatCurrency(discount) : "Not provided"} />
        <DetailLine label="Delivery charge" value={formatCurrency(delivery)} />
        <DetailLine label="Total" value={formatCurrency(order.totalAmount)} />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderDeliveryCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Delivery Details</Typography>
      <Stack spacing={1.25}>
        <DetailLine label="Method" value="Manual fulfillment" />
        <DetailLine label="Courier" value={order.courierName || "Courier not assigned"} />
        <DetailLine label="Tracking ID" value={order.trackingId} />
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">Delivery status</Typography>
          <AdminV2OrderStatusChip value={order.deliveryStatus} />
        </Stack>
        <DetailLine label="Zone" value={order.deliveryZone} />
        <DetailLine label="Area" value={order.deliveryArea} />
        <DetailLine label="Delivery fee" value={typeof order.deliveryCharge === "number" ? formatCurrency(order.deliveryCharge) : "Not provided"} />
        <DetailLine label="Recipient phone" value={order.customer.phone} />
        <DetailLine label="Address" value={order.customer.address} />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderItemsTable({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Ordered Items</Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" aria-label="Ordered items">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Line Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item) => {
              const imageSrc = normalizeAdminV2ImageSrc(item.image);

              return (
                <TableRow key={`${item.id}-${item.name}-${itemVariant(item)}`}>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 220 }}>
                      {imageSrc ? (
                        <Box sx={{ width: 44, height: 44, position: "relative", borderRadius: 1.5, overflow: "hidden", bgcolor: "action.hover", flexShrink: 0 }}>
                          <Image src={imageSrc} alt={item.name || "Product image"} fill sizes="44px" style={{ objectFit: "cover" }} />
                        </Box>
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "action.hover", color: "text.secondary", fontWeight: 700 }}>{(item.name || "P").charAt(0).toUpperCase()}</Avatar>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name || "Product"}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.slug || item.productId || "No product reference"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{itemVariant(item) || "Not provided"}</TableCell>
                  <TableCell>{item.productId || item.id || "Not provided"}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </V2Card>
  );
}

export function AdminV2OrderTimeline({ order }: { order: OrderRecord }) {
  const entries = [
    { label: "Order Placed", active: Boolean(order.createdAt), detail: formatDateTime(order.createdAt) },
    { label: "Payment Confirmed", active: order.paymentStatus === "verified", detail: statusLabel(order.paymentStatus) },
    { label: "Order Confirmed", active: order.status === "Confirmed" || order.status === "Shipped" || order.status === "Delivered", detail: order.status },
    { label: "Courier Assigned", active: Boolean(order.courierName || order.trackingId), detail: order.courierName || order.trackingId },
    { label: "Out for Delivery", active: order.status === "Shipped" || order.deliveryStatus === "in_transit" || order.deliveryStatus === "dispatched", detail: statusLabel(order.deliveryStatus) },
    { label: "Delivered", active: order.status === "Delivered" || order.deliveryStatus === "delivered", detail: order.status === "Delivered" ? "Completed" : statusLabel(order.deliveryStatus) },
    { label: "Cancelled", active: order.status === "Cancelled", detail: order.cancelledReason || "Cancelled" },
  ].filter((entry) => entry.active || entry.label === "Order Placed");

  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Order Timeline</Typography>
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
        <Typography variant="caption" color="text.secondary">
          Detailed event history is not yet stored.
        </Typography>
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderNotes({ order }: { order: OrderRecord }) {
  return (
    <V2Card>
      <Typography variant="h6" sx={{ mb: 2 }}>Order Notes</Typography>
      <Stack spacing={1.25}>
        <DetailLine label="Internal note" value={order.adminInternalNote} />
        <DetailLine label="Customer confirmation" value={order.customerConfirmationNote} />
        <DetailLine label="Delivery note" value={order.deliveryNote || order.customer.deliveryNote} />
        <DetailLine label="Payment note" value={order.paymentNote} />
        <DetailLine label="Cancelled reason" value={order.cancelledReason} />
        <Typography variant="caption" color="text.secondary">
          Notes history and author timestamps require backend note persistence.
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
