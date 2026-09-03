"use client";

import {
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Image from "next/image";
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  History,
  MapPin,
  MessageSquareText,
  NotebookText,
  Package,
  PackageCheck,
  ReceiptText,
  Truck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { OrderEventRecord, OrderNoteRecord, OrderRecord } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts, formatAdminV2Amount } from "@/lib/admin-v2/orders/order-amounts";
import { normalizeAdminV2OrderItems, type AdminV2OrderItem } from "@/lib/admin-v2/orders/order-items";
import { getAdminV2DeliveryNote } from "@/lib/admin-v2/orders/order-notes";
import { getAdminV2PaymentLabels } from "@/lib/admin-v2/orders/order-payment";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { AdminV2OrderStatusChip } from "@/components/admin-v2/views/orders/AdminV2OrderStatusChip";
import { formatDateTime, statusLabel } from "@/components/admin-v2/views/orders/utils";
import { adminV2Transition } from "@/components/admin-v2/motion/motion-config";

const missing = "Not provided";

const cardSurfaceSx = {
  height: "100%",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(252,250,255,0.92))",
  borderColor: "rgba(157,47,255,0.16)",
  boxShadow: "0 18px 42px rgba(58, 34, 105, 0.07)",
  position: "relative",
  overflow: "hidden",
  transition: adminV2Transition(["transform", "box-shadow", "border-color"], 180),
  "&::before": {
    content: '""',
    position: "absolute",
    inset: "0 0 auto 0",
    height: 3,
    background: "linear-gradient(90deg, #9d2fff, #ff4fb8 48%, #06b6d4)",
  },
  "&:hover": {
    transform: "translate3d(0, -2px, 0)",
    borderColor: "rgba(157,47,255,0.28)",
    boxShadow: "0 22px 48px rgba(58, 34, 105, 0.11)",
  },
};

function SectionTitle({
  icon: Icon,
  children,
  caption,
}: {
  icon: LucideIcon;
  children: ReactNode;
  caption?: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2.25 }}>
      <Avatar
        variant="rounded"
        sx={{
          width: 34,
          height: 34,
          bgcolor: "rgba(157,47,255,0.09)",
          color: "primary.main",
          border: "1px solid rgba(157,47,255,0.16)",
          boxShadow: "0 10px 26px rgba(157,47,255,0.14)",
        }}
      >
        <Icon size={18} />
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 850, lineHeight: 1.15 }}>
          {children}
        </Typography>
        {caption ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
            {caption}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

function DetailLine({
  label,
  value,
  chip,
  important,
}: {
  label: string;
  value?: string | number | null;
  chip?: ReactNode;
  important?: boolean;
}) {
  const displayValue = value === 0 || value ? value : missing;
  const isMissing = displayValue === missing || displayValue === "-";

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.35, sm: 2 }}
      sx={{ justifyContent: "space-between", gap: 1.5, py: 0.15 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: { sm: 126 }, flexShrink: 0 }}>
        {label}
      </Typography>
      {chip ?? (
        <Typography
          variant={important ? "body2" : "caption"}
          sx={{
            textAlign: { sm: "right" },
            fontWeight: isMissing ? 550 : important ? 800 : 680,
            color: isMissing ? "text.disabled" : "text.primary",
            overflowWrap: "anywhere",
            lineHeight: 1.5,
          }}
        >
          {displayValue}
        </Typography>
      )}
    </Stack>
  );
}

function ValueChip({ label, tone = "primary" }: { label: string; tone?: "primary" | "success" | "warning" | "info" }) {
  return (
    <Chip
      size="small"
      label={label}
      color={tone}
      variant="outlined"
      sx={{
        height: 24,
        fontWeight: 750,
        maxWidth: "100%",
        "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
      }}
    />
  );
}

function dash(value: string | number | null | undefined) {
  return value === 0 || value ? value : "-";
}

function ProductVisual({ item }: { item: AdminV2OrderItem }) {
  if (item.image) {
    return (
      <Box
        sx={{
          width: 54,
          height: 54,
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "rgba(157,47,255,0.06)",
          border: "1px solid rgba(157,47,255,0.14)",
          flexShrink: 0,
        }}
      >
        <Image src={item.image} alt={`${item.productName} product image`} fill sizes="54px" style={{ objectFit: "cover" }} />
      </Box>
    );
  }

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 54,
        height: 54,
        bgcolor: "rgba(6,182,212,0.08)",
        color: "info.main",
        border: "1px solid rgba(6,182,212,0.18)",
      }}
    >
      <Package size={24} />
    </Avatar>
  );
}

function FinancialSummary({ order, compact = false }: { order: OrderRecord; compact?: boolean }) {
  const amounts = getAdminV2OrderAmounts(order);
  const rows = [
    ["Subtotal", formatAdminV2Amount(amounts.subtotal)],
    ["Discount", formatAdminV2Amount(amounts.discount)],
    ["Delivery fee", formatAdminV2Amount(amounts.deliveryCharge)],
  ] as const;

  return (
    <Box
      sx={{
        mt: compact ? 0 : 2.5,
        p: compact ? 1.5 : 2,
        borderRadius: 2,
        border: "1px solid rgba(157,47,255,0.12)",
        bgcolor: "rgba(157,47,255,0.035)",
      }}
    >
      <Stack spacing={0.8}>
        {rows.map(([label, value]) => (
          <Stack key={label} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 750 }}>
              {value}
            </Typography>
          </Stack>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "baseline" }}>
          <Typography variant="body2" sx={{ fontWeight: 850 }}>
            Total payable
          </Typography>
          <Typography variant={compact ? "subtitle1" : "h6"} color="primary.main" sx={{ fontWeight: 900 }}>
            {formatAdminV2Amount(amounts.total)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function AdminV2OrderCustomerCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card sx={cardSurfaceSx}>
      <SectionTitle icon={UserRound} caption={order.customerId ? "Account customer" : "Guest checkout"}>
        Customer Information
      </SectionTitle>
      <Stack spacing={1.1}>
        <DetailLine label="Name" value={order.customer.fullName} important />
        <DetailLine label="Phone" value={order.customer.phone} important />
        <DetailLine label="Email" value={order.customer.email} />
        <DetailLine label="Customer ID" value={order.customerId} />
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
    <V2Card sx={cardSurfaceSx}>
      <SectionTitle icon={CreditCard} caption={`Currency ${amounts.currency}`}>
        Payment Details
      </SectionTitle>
      <Stack spacing={1.1}>
        <DetailLine label="Method" value={payment.method} important />
        <DetailLine
          label="Payment status"
          chip={<ValueChip label={payment.status || missing} tone={order.paymentStatus === "verified" ? "success" : "warning"} />}
        />
        <DetailLine label="Verification" value={payment.verification} />
        <DetailLine label="Provider / wallet" value={payment.provider} />
        <DetailLine label="Transaction/reference" value={payment.transactionReference} />
        <Divider sx={{ my: 0.25 }} />
        <DetailLine label="Subtotal" value={formatAdminV2Amount(amounts.subtotal)} important />
        <DetailLine label="Discount" value={formatAdminV2Amount(amounts.discount)} />
        <DetailLine label="Delivery charge" value={formatAdminV2Amount(amounts.deliveryCharge)} />
        <DetailLine label="Total payable" value={formatAdminV2Amount(amounts.total)} important />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderDeliveryCard({ order }: { order: OrderRecord }) {
  return (
    <V2Card sx={cardSurfaceSx}>
      <SectionTitle icon={MapPin} caption={order.courierName || "Courier not assigned"}>
        Delivery Details
      </SectionTitle>
      <Stack spacing={1.1}>
        <DetailLine label="Courier" value={order.courierName} important />
        <DetailLine label="Tracking ID" value={order.trackingId} />
        <DetailLine label="Delivery status" chip={<AdminV2OrderStatusChip value={order.deliveryStatus} />} />
        <DetailLine label="Zone" value={order.deliveryZone} />
        <DetailLine label="Area" value={order.deliveryArea} />
        <DetailLine label="Fee" value={formatAdminV2Amount(getAdminV2OrderAmounts(order).deliveryCharge)} important />
        <DetailLine label="Recipient phone" value={order.customer.phone} />
        <DetailLine label="Address" value={order.customer.address} />
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderItemsTable({ order }: { order: OrderRecord }) {
  const items = normalizeAdminV2OrderItems(order.items);

  return (
    <V2Card
      sx={{
        ...cardSurfaceSx,
        height: "auto",
        "& .MuiCardContent-root": { p: { xs: 2, md: 2.5 } },
      }}
    >
      <SectionTitle icon={PackageCheck} caption={`${items.length} item${items.length === 1 ? "" : "s"} in this order`}>
        Ordered Items
      </SectionTitle>
      <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
        <Table size="small" aria-label="Ordered items" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  borderBottomColor: "rgba(157,47,255,0.14)",
                  color: "text.secondary",
                  fontSize: 12,
                  fontWeight: 800,
                },
              }}
            >
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
              <TableRow
                key={item.key}
                hover
                sx={{
                  "& td": { py: 1.45, borderBottomColor: "rgba(157,47,255,0.08)" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1.4} sx={{ alignItems: "center", minWidth: 245 }}>
                    <ProductVisual item={item} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 820, overflowWrap: "anywhere" }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                        {item.productSlug || item.productId || "No product reference"}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{dash(item.variant)}</TableCell>
                <TableCell>{dash(item.size)}</TableCell>
                <TableCell>{dash(item.color)}</TableCell>
                <TableCell sx={{ display: { sm: "none", md: "table-cell" } }}>{dash(item.sku)}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{formatAdminV2Amount(item.unitPrice)}</TableCell>
                <TableCell align="right">
                  <Typography component="span" variant="body2" sx={{ fontWeight: 850 }}>
                    {formatAdminV2Amount(item.lineTotal)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
        {items.map((item) => (
          <Box
            key={item.key}
            sx={{
              p: 1.5,
              border: "1px solid rgba(157,47,255,0.13)",
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.72)",
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1.25 }}>
              <ProductVisual item={item} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 820, overflowWrap: "anywhere" }}>
                  {item.productName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {item.productSlug || item.productId || "No product reference"}
                </Typography>
              </Box>
            </Stack>
            <Grid container spacing={1}>
              <Grid size={6}><DetailLine label="Variant" value={dash(item.variant)} /></Grid>
              <Grid size={6}><DetailLine label="Size" value={dash(item.size)} /></Grid>
              <Grid size={6}><DetailLine label="Color" value={dash(item.color)} /></Grid>
              <Grid size={6}><DetailLine label="SKU" value={dash(item.sku)} /></Grid>
              <Grid size={6}><DetailLine label="Qty" value={item.quantity} /></Grid>
              <Grid size={6}><DetailLine label="Unit" value={formatAdminV2Amount(item.unitPrice)} /></Grid>
              <Grid size={12}><DetailLine label="Line total" value={formatAdminV2Amount(item.lineTotal)} important /></Grid>
            </Grid>
          </Box>
        ))}
      </Stack>
      <FinancialSummary order={order} />
    </V2Card>
  );
}

export function AdminV2OrderFinancialMeta({ order }: { order: OrderRecord }) {
  const amounts = getAdminV2OrderAmounts(order);
  const payment = getAdminV2PaymentLabels(order);

  return (
    <V2Card sx={{ ...cardSurfaceSx, height: "auto" }}>
      <SectionTitle icon={CircleDollarSign} caption="Operational payment snapshot">
        Financial Summary
      </SectionTitle>
      <Grid container spacing={1.4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Paid" value={formatAdminV2Amount(payment.paidAmount)} important />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Due" value={formatAdminV2Amount(payment.dueAmount)} important />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Refunded" value={formatAdminV2Amount(amounts.refundAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Order source" value={order.orderSource} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Assigned staff" value={order.assignedStaff} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailLine label="Proof received" value={order.proofReceived} />
        </Grid>
      </Grid>
    </V2Card>
  );
}

function orderProgressEntries(order: OrderRecord) {
  return [
    { label: "Order placed", active: Boolean(order.createdAt), detail: formatDateTime(order.createdAt), icon: ReceiptText },
    { label: "Payment verified", active: order.paymentStatus === "verified", detail: statusLabel(order.paymentStatus), icon: Banknote },
    { label: "Order confirmed", active: order.status === "Confirmed", detail: order.status, icon: PackageCheck },
    { label: "Courier assigned", active: Boolean(order.courierName || order.trackingId), detail: order.courierName || order.trackingId, icon: Truck },
    {
      label: "Out for delivery",
      active: order.deliveryStatus === "in_transit" || order.deliveryStatus === "dispatched" || order.status === "Shipped",
      detail: statusLabel(order.deliveryStatus || order.status),
      icon: Truck,
    },
    {
      label: "Delivered",
      active: order.status === "Delivered" || order.deliveryStatus === "delivered",
      detail: order.status === "Delivered" ? "Completed" : statusLabel(order.deliveryStatus),
      icon: PackageCheck,
    },
  ];
}

export function AdminV2OrderProgress({ order }: { order: OrderRecord }) {
  const entries = orderProgressEntries(order);

  return (
    <V2Card sx={{ ...cardSurfaceSx, height: "auto" }}>
      <SectionTitle icon={Clock3} caption="Current order state">
        Order Timeline
      </SectionTitle>
      <Stack spacing={0.9}>
        {entries.map((entry, index) => {
          const Icon = entry.icon;
          return (
            <Stack key={entry.label} direction="row" spacing={1.2} sx={{ alignItems: "flex-start" }}>
              <Box sx={{ position: "relative", pt: 0.2 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: entry.active ? "rgba(157,47,255,0.12)" : "rgba(100,116,139,0.08)",
                    color: entry.active ? "primary.main" : "text.disabled",
                    border: "1px solid",
                    borderColor: entry.active ? "rgba(157,47,255,0.22)" : "divider",
                  }}
                >
                  <Icon size={15} />
                </Avatar>
                {index < entries.length - 1 ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 30,
                      left: 13,
                      width: 2,
                      height: 17,
                      bgcolor: entry.active ? "rgba(157,47,255,0.24)" : "divider",
                    }}
                  />
                ) : null}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1, pb: 0.4 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: entry.active ? "text.primary" : "text.secondary" }}>
                  {entry.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {entry.detail || "Awaiting update"}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </V2Card>
  );
}

function eventTone(eventType: OrderEventRecord["eventType"]) {
  if (eventType.includes("invoice")) return { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", icon: FileText };
  if (eventType.includes("note")) return { color: "#ff4fb8", bg: "rgba(255,79,184,0.1)", icon: MessageSquareText };
  if (eventType.includes("cancel")) return { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", icon: History };
  if (eventType.includes("delivered") || eventType.includes("confirmed")) return { color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: PackageCheck };
  return { color: "#9d2fff", bg: "rgba(157,47,255,0.1)", icon: History };
}

function eventTitle(event: OrderEventRecord) {
  if (event.eventType === "status_changed" && event.fromStatus && event.toStatus) {
    return `Status updated: ${event.fromStatus} to ${event.toStatus}`;
  }
  return event.eventType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminV2ActivityTimeline({
  order,
  events,
  error,
}: {
  order: OrderRecord;
  events: OrderEventRecord[];
  error?: string | null;
}) {
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const syntheticCreated: OrderEventRecord = {
    id: "order-created-fallback",
    orderReference: order.orderReference,
    eventType: "order_created",
    metadata: {},
    actorName: "System",
    createdAt: order.createdAt,
  };
  const entries = sorted.some((event) => event.eventType === "order_created") ? sorted : [...sorted, syntheticCreated];

  return (
    <V2Card sx={{ ...cardSurfaceSx, height: "auto" }}>
      <SectionTitle icon={History} caption="Real backend events and historical order record">
        Activity Timeline
      </SectionTitle>
      {error ? (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "warning.50", color: "warning.dark" }}>
          <Typography variant="caption">{error}</Typography>
        </Box>
      ) : null}
      <Stack spacing={0}>
        {entries.map((event, index) => {
          const tone = eventTone(event.eventType);
          const Icon = tone.icon;
          return (
            <Stack
              key={event.id}
              direction="row"
              spacing={1.4}
              sx={{
                position: "relative",
                pb: index === entries.length - 1 ? 0 : 2,
                animation: "admin-v2-order-detail-rise 260ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: `${Math.min(index * 35, 180)}ms`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            >
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: tone.bg,
                    color: tone.color,
                    border: "1px solid rgba(157,47,255,0.14)",
                  }}
                >
                  <Icon size={16} />
                </Avatar>
                {index < entries.length - 1 ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 36,
                      left: 15,
                      bottom: 4,
                      width: 2,
                      minHeight: 20,
                      background: "linear-gradient(180deg, rgba(157,47,255,0.26), rgba(6,182,212,0.12))",
                    }}
                  />
                ) : null}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  px: 1.35,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.62)",
                  border: "1px solid rgba(157,47,255,0.09)",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ fontWeight: 850, overflowWrap: "anywhere" }}>
                    {eventTitle(event)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatDateTime(event.createdAt)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {event.actorName || "Trusted system actor"}
                </Typography>
                {event.reason ? (
                  <Typography variant="caption" sx={{ display: "block", mt: 0.55, overflowWrap: "anywhere" }}>
                    {event.reason}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderNotes({
  order,
  notes,
  loading,
}: {
  order: OrderRecord;
  notes: OrderNoteRecord[];
  loading?: boolean;
}) {
  const deliveryNote = getAdminV2DeliveryNote(order);
  const legacyNotes = [
    ["Internal note", order.adminInternalNote],
    ["Customer confirmation", order.customerConfirmationNote],
    ["Delivery note", deliveryNote],
    ["Payment note", order.paymentNote],
    ["Cancelled reason", order.cancelledReason],
  ].filter(([, value]) => typeof value === "string" && value.trim());
  const missingCount = 5 - legacyNotes.length;

  return (
    <V2Card sx={{ ...cardSurfaceSx, height: "auto" }}>
      <SectionTitle icon={NotebookText} caption="Static fields and persisted Admin V2 notes">
        Order Notes
      </SectionTitle>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Legacy order fields
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {legacyNotes.length > 0 ? (
              legacyNotes.map(([label, value]) => (
                <Box key={label} sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(157,47,255,0.045)" }}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                    {value}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No legacy order note fields are populated.
              </Typography>
            )}
            {missingCount > 0 ? (
              <Typography variant="caption" color="text.disabled">
                {missingCount} legacy field{missingCount === 1 ? "" : "s"} not provided.
              </Typography>
            ) : null}
          </Stack>
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Admin V2 note history
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary">Loading note history...</Typography>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <Box key={note.id} sx={{ p: 1.25, borderRadius: 2, border: "1px solid rgba(255,79,184,0.16)", bgcolor: "rgba(255,79,184,0.045)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 720, overflowWrap: "anywhere" }}>
                    {note.noteBody}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.createdByName || "Admin"} - {formatDateTime(note.createdAt)} - {note.noteType}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No persisted Admin V2 notes yet.
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </V2Card>
  );
}

export function AdminV2OrderOverviewGrid({ order }: { order: OrderRecord }) {
  return (
    <Grid container spacing={2.5} sx={{ alignItems: "stretch" }}>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderCustomerCard order={order} /></Grid>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderPaymentCard order={order} /></Grid>
      <Grid size={{ xs: 12, lg: 4 }}><AdminV2OrderDeliveryCard order={order} /></Grid>
    </Grid>
  );
}

export { FinancialSummary as AdminV2OrderFinancialSummary };
