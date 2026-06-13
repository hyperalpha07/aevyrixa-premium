"use client";

import { TableCell, TableRow } from "@mui/material";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/currency";
import type { OrderStatus } from "@/app/lib/order-types";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
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
          href={`/admin-v2/orders/${order.orderReference}`}
          style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}
        >
          {order.orderReference}
        </Link>
      </TableCell>
      <TableCell>{order.customerName}</TableCell>
      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
      <TableCell>
        <V2Chip label={order.status} color={statusColor(order.status)} />
      </TableCell>
      <TableCell>{formatDate(order.createdAt)}</TableCell>
    </TableRow>
  );
}

export function AdminV2RecentOrdersTable({ rows }: { rows: AdminV2RecentOrderRow[] }) {
  return (
    <V2TableShell
      columns={["Reference", "Customer", "Total", "Status", "Created"]}
      rows={rows}
      renderRow={renderOrderRow}
      emptyTitle="No real orders available"
      emptyDescription="Orders will appear here after the Supabase-backed order workflow returns real records."
    />
  );
}
