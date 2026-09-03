"use client";

import { Box, Divider, GlobalStyles, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { OrderInvoiceRecord, OrderRecord } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { normalizeAdminV2OrderItems } from "@/lib/admin-v2/orders/order-items";
import { getAdminV2PaymentLabels } from "@/lib/admin-v2/orders/order-payment";
import { formatDateTime } from "@/components/admin-v2/views/orders/utils";
import { brandName } from "@/configs/brand/noromi";

export function AdminV2InvoicePreview({ order, invoice }: { order: OrderRecord; invoice?: OrderInvoiceRecord | null }) {
  const amounts = getAdminV2OrderAmounts(order);
  const items = normalizeAdminV2OrderItems(order.items);
  const payment = getAdminV2PaymentLabels(order);

  return (
    <>
      <GlobalStyles
        styles={{
          "@media print": {
            "body *": { visibility: "hidden !important" },
            ".admin-v2-print-invoice, .admin-v2-print-invoice *": { visibility: "visible !important" },
            ".admin-v2-print-invoice": {
              position: "fixed !important",
              inset: "0 !important",
              width: "100% !important",
              minHeight: "100% !important",
              zIndex: "9999 !important",
              overflow: "visible !important",
              padding: "18mm !important",
            },
            ".admin-v2-print-invoice-card": { breakInside: "avoid !important", pageBreakInside: "avoid !important" },
            "@page": { size: "A4", margin: "12mm" },
          },
        }}
      />
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
            bgcolor: "#fff",
            color: "#111827",
            border: 0,
            borderRadius: 0,
            boxShadow: "none",
          },
        }}
      >
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{brandName}</Typography>
          <Typography variant="body2" color="text.secondary">Invoice</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {invoice?.invoiceNumber ?? "Invoice pending"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Issued {invoice?.issuedAt ? formatDateTime(invoice.issuedAt) : "Not provided"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Order {order.orderReference}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ordered {formatDateTime(order.createdAt)}
          </Typography>
        </Box>
      </Stack>

      <Stack className="admin-v2-print-invoice-card" direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Customer</Typography>
          <Typography variant="body2">{order.customer.fullName || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.phone || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.email || "Not provided"}</Typography>
          <Typography variant="body2">{order.customer.address || "Not provided"}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Payment</Typography>
          <Typography variant="body2">{payment.method}</Typography>
          <Typography variant="body2">Status: {payment.status}</Typography>
          <Typography variant="body2">Reference: {payment.transactionReference}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Delivery</Typography>
          <Typography variant="body2">Zone: {order.deliveryZone || "Not provided"}</Typography>
          <Typography variant="body2">Area: {order.deliveryArea || "Not provided"}</Typography>
          <Typography variant="body2">Tracking: {order.trackingId || "Not provided"}</Typography>
        </Box>
      </Stack>

      <Table className="admin-v2-print-invoice-card" size="small">
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
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>{item.variant || "Not provided"}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatAdminV2Amount(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatAdminV2Amount(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />
      <Stack spacing={0.75} sx={{ ml: "auto", maxWidth: 320 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Subtotal</Typography>
          <Typography variant="body2">{formatAdminV2Amount(amounts.subtotal)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Discount</Typography>
          <Typography variant="body2">{formatAdminV2Amount(amounts.discount)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">Delivery</Typography>
          <Typography variant="body2">{formatAdminV2Amount(amounts.deliveryCharge)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1">{formatAdminV2Amount(amounts.total)}</Typography>
        </Stack>
      </Stack>
      </Box>
    </>
  );
}
