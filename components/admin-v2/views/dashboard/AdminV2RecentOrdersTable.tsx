"use client";

import { Box, Stack, TableCell, TableRow, Typography } from "@mui/material";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import type { OrderStatus } from "@/app/lib/order-types";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2TableShell } from "@/components/admin-v2/tables/V2TableShell";

export type AdminV2RecentOrderRow = {
  orderReference: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusColor(status: OrderStatus) {
  if (status === "Pending") return "warning";
  if (status === "Cancelled") return "error";
  return "success";
}

function renderOrderRow(order: AdminV2RecentOrderRow) {
  return (
    <TableRow key={order.orderReference} hover>
      <TableCell>
        <Link
          href={`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`}
          style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}
        >
          {order.orderReference}
        </Link>
      </TableCell>
      <TableCell>{order.customerName || "Customer name unavailable"}</TableCell>
      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
      <TableCell>
        <V2Chip label={order.status} color={statusColor(order.status)} />
      </TableCell>
      <TableCell>{formatDate(order.createdAt)}</TableCell>
    </TableRow>
  );
}

export function AdminV2RecentOrdersTable({
  rows,
  available,
}: {
  rows: AdminV2RecentOrderRow[];
  available: boolean;
}) {
  if (rows.length === 0) {
    return (
      <V2EmptyState
        icon={ClipboardList}
        title={available ? "No orders yet" : "Order data is unavailable"}
        description={
          available
            ? "New customer orders will appear here as soon as they are placed."
            : "The dashboard could not reach the Supabase-backed order source. No fallback orders are shown."
        }
        actionHref="/admin-v2/orders"
        actionLabel="Manage orders"
        compact
      />
    );
  }

  return (
    <>
      <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
        {rows.map((order) => (
          <Box
            key={order.orderReference}
            component={Link}
            href={`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`}
            aria-label={`View order ${order.orderReference}`}
            sx={{
              display: "block",
              p: 1.75,
              color: "text.primary",
              textDecoration: "none",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
                  {order.orderReference}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {order.customerName || "Customer name unavailable"}
                </Typography>
              </Box>
              <V2Chip label={order.status} color={statusColor(order.status)} />
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatCurrency(order.totalAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                {formatDate(order.createdAt)}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <V2TableShell
          columns={["Reference", "Customer", "Total", "Status", "Created"]}
          rows={rows}
          renderRow={renderOrderRow}
          emptyTitle="No orders yet"
          emptyDescription="New customer orders will appear here as soon as they are placed."
        />
      </Box>
    </>
  );
}
