"use client";

import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { MoreVertical, NotebookPen, Printer, RefreshCcw, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { OrderRecord } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { AdminV2OrdersEmptyState } from "@/components/admin-v2/views/orders/AdminV2OrdersEmptyState";
import { formatDateTime, itemCount, statusLabel } from "@/components/admin-v2/views/orders/utils";

type Props = {
  orders: OrderRecord[];
  page: number;
  rowsPerPage: number;
  total: number;
  filtered: boolean;
  canEditStatus: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onStatusClick: (order: OrderRecord) => void;
  onNotesClick: (order: OrderRecord) => void;
  onInvoiceClick: (order: OrderRecord) => void;
  onCancelClick: (order: OrderRecord) => void;
};

function canCancel(order: OrderRecord) {
  return order.status !== "Cancelled" && order.status !== "Delivered";
}

export function AdminV2OrdersTable({
  orders,
  page,
  rowsPerPage,
  total,
  filtered,
  canEditStatus,
  onPageChange,
  onRowsPerPageChange,
  onStatusClick,
  onNotesClick,
  onInvoiceClick,
  onCancelClick,
}: Props) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [menuOrder, setMenuOrder] = useState<OrderRecord | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLElement>, order: OrderRecord) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
    setMenuOrder(order);
  };

  const closeMenu = () => {
    setAnchor(null);
    setMenuOrder(null);
  };

  if (orders.length === 0) {
    return <AdminV2OrdersEmptyState filtered={filtered} />;
  }

  return (
    <V2Card sx={{ p: 0 }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" stickyHeader aria-label="Real Aevyrixa orders">
          <TableHead>
            <TableRow>
              {["Order Reference", "Customer", "Date", "Items", "Payment Method", "Payment Status", "Order Status", "Delivery Status", "Total", "Actions"].map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700, bgcolor: "background.paper", whiteSpace: "nowrap" }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.orderReference}
                hover
                tabIndex={0}
                onClick={() => router.push(`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`);
                }}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Typography
                    component="button"
                    type="button"
                    variant="body2"
                    sx={{
                      p: 0,
                      border: 0,
                      bgcolor: "transparent",
                      font: "inherit",
                      fontWeight: 700,
                      color: "primary.main",
                      cursor: "pointer",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/admin-v2/orders/${encodeURIComponent(order.orderReference)}`);
                    }}
                  >
                    {order.orderReference}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer.fullName || "Not provided"}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.customer.phone || order.customer.email || "No contact provided"}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell>{itemCount(order)}</TableCell>
                <TableCell sx={{ minWidth: 150 }}>{order.paymentDetails.paymentMethod}</TableCell>
                <TableCell><AdminV2OrderStatusChip value={order.paymentStatus} /></TableCell>
                <TableCell><AdminV2OrderStatusChip value={order.status} /></TableCell>
                <TableCell><AdminV2OrderStatusChip value={order.deliveryStatus} /></TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>{formatAdminV2Amount(getAdminV2OrderAmounts(order).total)}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <IconButton aria-label={`Actions for ${order.orderReference}`} onClick={(event) => openMenu(event, order)}>
                    <MoreVertical size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Showing {total === 0 ? 0 : page * rowsPerPage + 1}-{Math.min(total, page * rowsPerPage + orders.length)} of {total} results
        </Typography>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => onPageChange(nextPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Stack>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuOrder) router.push(`/admin-v2/orders/${encodeURIComponent(menuOrder.orderReference)}`);
            closeMenu();
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          disabled={!menuOrder || !canEditStatus}
          onClick={() => {
            if (menuOrder) onStatusClick(menuOrder);
            closeMenu();
          }}
        >
          <RefreshCcw size={16} />&nbsp; Update Status
        </MenuItem>
        <Tooltip title="Notes persist to the existing admin internal note field only. Full note history is pending backend support.">
          <span>
            <MenuItem
              onClick={() => {
                if (menuOrder) onNotesClick(menuOrder);
                closeMenu();
              }}
            >
              <NotebookPen size={16} />&nbsp; Add Note
            </MenuItem>
          </span>
        </Tooltip>
        <MenuItem
          onClick={() => {
            if (menuOrder) onInvoiceClick(menuOrder);
            closeMenu();
          }}
        >
          <Printer size={16} />&nbsp; Print Invoice
        </MenuItem>
        <Tooltip title={menuOrder && !canCancel(menuOrder) ? `Cancel is unavailable for ${statusLabel(menuOrder.status)} orders.` : ""}>
          <span>
            <MenuItem
              disabled={!menuOrder || !canEditStatus || !canCancel(menuOrder)}
              onClick={() => {
                if (menuOrder) onCancelClick(menuOrder);
                closeMenu();
              }}
            >
              <ShieldAlert size={16} />&nbsp; Cancel Order
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>
    </V2Card>
  );
}
