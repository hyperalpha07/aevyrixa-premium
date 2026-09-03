"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";
import type { OrderInvoiceRecord, OrderRecord } from "@/app/lib/order-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { AdminV2InvoicePreview } from "@/components/admin-v2/views/orders/detail/AdminV2InvoicePreview";

type Props = {
  order: OrderRecord;
  invoice: OrderInvoiceRecord;
};

export function AdminV2InvoicePrintView({ order, invoice }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Stack spacing={2}>
      <Box
        className="admin-v2-print-toolbar"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          "@media print": { display: "none !important" },
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Print Invoice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {invoice.invoiceNumber} for order {order.orderReference}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <V2Button href={`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`} variant="outlined" startIcon={<ArrowLeft size={16} />}>
            Back to order
          </V2Button>
          <V2Button variant="contained" startIcon={<Printer size={16} />} onClick={() => window.print()}>
            Print
          </V2Button>
        </Stack>
      </Box>
      <AdminV2InvoicePreview order={order} invoice={invoice} />
    </Stack>
  );
}
