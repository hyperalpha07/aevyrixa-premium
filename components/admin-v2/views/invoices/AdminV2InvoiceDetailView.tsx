"use client";

import { useEffect } from "react";
import { Box, Divider, GlobalStyles, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { formatCurrency } from "@/app/lib/currency";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { brandName, noromiAssets } from "@/configs/brand/noromi";
import type { AdminV2InvoiceRow } from "@/lib/admin-v2/invoices/invoice-metrics";

type AdminV2InvoiceDetailViewProps = {
  invoice: AdminV2InvoiceRow;
  autoPrint?: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function orderHref(orderReference: string) {
  return `/admin-v2/orders/${encodeURIComponent(orderReference)}`;
}

export function AdminV2InvoiceDetailView({ invoice, autoPrint = false }: AdminV2InvoiceDetailViewProps) {
  const snapshot = record(invoice.snapshot);
  const customer = record(snapshot.customer);
  const payment = record(snapshot.payment);
  const delivery = record(snapshot.delivery);
  const items = array(snapshot.items).map((item) => record(item));

  useEffect(() => {
    if (!autoPrint) return;
    const timeout = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  return (
    <Box className="admin-v2-invoice-detail-page" component="section" aria-labelledby="admin-v2-invoice-detail-title">
      <GlobalStyles
        styles={{
          "@page": {
            size: "A4",
            margin: "14mm",
          },
          "@media print": {
            "html, body": {
              background: "#ffffff !important",
              color: "#111827 !important",
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            },
            "header, nav, aside, .admin-v2-invoice-detail-screen-header": {
              display: "none !important",
            },
            ".admin-v2-invoice-detail-page": {
              background: "#ffffff !important",
              color: "#111827 !important",
              margin: "0 !important",
              padding: "0 !important",
              width: "100% !important",
            },
            ".admin-v2-invoice-detail-print": {
              background: "#ffffff !important",
              border: "0 !important",
              boxShadow: "none !important",
              color: "#111827 !important",
              overflow: "visible !important",
              pageBreakInside: "auto",
              width: "100% !important",
            },
            ".admin-v2-invoice-detail-print .MuiCardContent-root": {
              padding: "0 !important",
            },
            ".admin-v2-invoice-detail-print *": {
              color: "#111827 !important",
              textShadow: "none !important",
            },
            ".admin-v2-invoice-detail-print .MuiTypography-colorTextSecondary": {
              color: "#4b5563 !important",
            },
            ".admin-v2-invoice-detail-print table": {
              breakInside: "auto",
            },
            ".admin-v2-invoice-detail-print tr": {
              breakInside: "avoid",
              pageBreakInside: "avoid",
            },
            ".admin-v2-invoice-detail-actions": { display: "none !important" },
          },
        }}
      />
      <Box className="admin-v2-invoice-detail-screen-header">
        <V2PageHeader
          title={`Invoice ${invoice.invoiceNumber || "Not provided"}`}
          titleId="admin-v2-invoice-detail-title"
          titleComponent="h1"
          description="Read-only persisted invoice detail from the existing invoice record."
          breadcrumbs={[
            { label: "Admin V2", href: "/admin-v2/dashboard" },
            { label: "Invoices", href: "/admin-v2/invoices" },
            { label: invoice.invoiceNumber || "Invoice" },
          ]}
          actions={(
            <Stack className="admin-v2-invoice-detail-actions" direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <V2Button href="/admin-v2/invoices" variant="outlined">Back to invoices</V2Button>
              <V2Button variant="contained" onClick={() => window.print()}>Print</V2Button>
              <V2Button href={invoice.orderReference ? orderHref(invoice.orderReference) : undefined} disabled={!invoice.orderReference} variant="outlined">
                View Order
              </V2Button>
            </Stack>
          )}
        />
      </Box>

      <V2Card className="admin-v2-invoice-detail-print">
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                component="img"
                src={noromiAssets.logoHorizontal}
                alt={`${brandName} logo`}
                sx={{ width: 124, maxHeight: 46, objectFit: "contain" }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>{brandName}</Typography>
                <Typography variant="overline" color="text.secondary">Invoice</Typography>
              </Box>
            </Stack>
            <Stack spacing={0.25} sx={{ alignItems: "flex-end", textAlign: "right" }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>Invoice # {invoice.invoiceNumber || "Not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">Issued {formatDateTime(invoice.issuedAt)}</Typography>
              <Typography variant="body2" color="text.secondary">Order {invoice.orderReference || "Not provided"}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "flex-start" } }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Invoice</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950 }}>{invoice.invoiceNumber || "Not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">Order {invoice.orderReference || "Not provided"}</Typography>
            </Box>
            <Stack spacing={1} sx={{ alignItems: { md: "flex-end" } }}>
              <V2Chip label={invoice.status === "void" ? "Void" : "Issued"} color={invoice.status === "void" ? "warning" : "success"} />
              <Typography variant="body2" color="text.secondary">Issued {formatDateTime(invoice.issuedAt)}</Typography>
              <Typography variant="body2" color="text.secondary">Issued by {invoice.issuedBy || "Not provided"}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Customer</Typography>
              <Typography variant="body2">{text(customer.name) || invoice.customerName || "Not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">{text(customer.phone) || "Phone not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">{text(customer.email) || "Email not provided"}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Delivery</Typography>
              <Typography variant="body2">{text(delivery.method) || text(delivery.city) || "Not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">{text(delivery.address) || "Address not provided"}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Payment</Typography>
              <Typography variant="body2">{text(payment.method) || "Not provided"}</Typography>
              <Typography variant="body2" color="text.secondary">{text(payment.status) || "Status not provided"}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit</TableCell>
                  <TableCell align="right">Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? items.map((item, index) => (
                  <TableRow key={`${text(item.sku) || text(item.name) || "item"}-${index}`}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{text(item.name) || "Invoice item"}</Typography>
                      <Typography variant="caption" color="text.secondary">{text(item.sku) || text(item.variant) || "Snapshot item"}</Typography>
                    </TableCell>
                    <TableCell align="right">{numberValue(item.quantity) || 1}</TableCell>
                    <TableCell align="right">{formatCurrency(numberValue(item.unitPrice ?? item.unit_price ?? item.price))}</TableCell>
                    <TableCell align="right">{formatCurrency(numberValue(item.lineTotal ?? item.line_total ?? item.total))}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4}>No item snapshot was stored for this invoice.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Stack spacing={1} sx={{ alignSelf: "flex-end", minWidth: { xs: "100%", sm: 320 } }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography sx={{ fontWeight: 800 }}>{formatCurrency(invoice.subtotalAmount)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary">Discounts</Typography>
              <Typography sx={{ fontWeight: 800 }}>-{formatCurrency(invoice.discountAmount)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary">Delivery</Typography>
              <Typography sx={{ fontWeight: 800 }}>{formatCurrency(invoice.deliveryAmount)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>{formatCurrency(invoice.totalAmount)}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </V2Card>
    </Box>
  );
}
