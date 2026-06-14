"use client";

import { Box, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { OrderRecord } from "@/app/lib/order-types";
import { formatCurrency } from "@/app/lib/currency";
import { formatDateTime, itemVariant, statusLabel } from "@/components/admin-v2/views/orders/utils";

export function AdminV2InvoicePreview({ order }: { order: OrderRecord }) {
  const delivery = order.deliveryCharge ?? 0;
  const discount = Math.max(0, order.totals.subtotal + delivery - order.totalAmount);

  return (
    <Box
      className="admin-v2-print-invoice"
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        p: { xs: 2, md: 3 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        "@media print": {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          bgcolor: "#fff",
          color: "#111827",
          border: 0,
          borderRadius: 0,
          overflow: "visible",
        },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Aevyrixa Her Care</Typography>
          <Typography variant="body2" color="text.secondary">Order Invoice</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.orderReference}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDateTime(order.createdAt)}</Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Customer</Typography>
          <Typography variant="body2">{order.customer.fullName || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.phone || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.email || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.address || "Not provided"}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Payment</Typography>
          <Typography variant="body2">{order.paymentDetails.paymentMethod}</Typography>
          <Typography variant="body2">Status: {statusLabel(order.paymentStatus)}</Typography>
          <Typography variant="body2">Reference: {order.paymentReference || order.paymentDetails.transactionReference || "Not provided"}</Typography>
        </Box>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Variant</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={`${item.id}-${item.name}-${itemVariant(item)}`}>
              <TableCell>{item.name || "Product"}</TableCell>
              <TableCell>{itemVariant(item) || "Not provided"}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatCurrency(item.price)}</TableCell>
              <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />
      <Stack spacing={0.75} sx={{ ml: "auto", maxWidth: 320 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Subtotal</Typography>
          <Typography variant="body2">{formatCurrency(order.totals.subtotal)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Discount</Typography>
          <Typography variant="body2">{discount ? formatCurrency(discount) : "Not provided"}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Delivery</Typography>
          <Typography variant="body2">{formatCurrency(delivery)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1">{formatCurrency(order.totalAmount)}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
