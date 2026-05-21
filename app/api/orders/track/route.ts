import { getOrderByReference } from "@/app/lib/order-store";
import type { OrderCartItem, OrderRecord, OrderStatus } from "@/app/lib/order-types";

export const dynamic = "force-dynamic";

const timelineLabels = [
  "Order Received",
  "Confirmed",
  "Shipped",
  "Delivered",
] as const;

type TimelineLabel = (typeof timelineLabels)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").replace(/^\+?88/, "");
}

function paymentMethodLabel(order: OrderRecord) {
  const { paymentMethod, walletProvider } = order.paymentDetails;
  if (paymentMethod === "Mobile Wallet Payment" && walletProvider) {
    return `${walletProvider} ${paymentMethod}`;
  }

  return paymentMethod;
}

function itemSummary(item: OrderCartItem) {
  const variant = [item.size, item.color, item.absorbency, item.variant]
    .filter(Boolean)
    .join(" / ");

  return {
    name: item.name,
    quantity: item.quantity,
    variant: variant || undefined,
  };
}

function timelineForStatus(status: OrderStatus) {
  const activeIndexByStatus: Record<Exclude<OrderStatus, "Cancelled">, number> = {
    Pending: 0,
    Confirmed: 1,
    Shipped: 2,
    Delivered: 3,
  };

  if (status === "Cancelled") {
    return timelineLabels.map((label) => ({
      label,
      state: "inactive" as const,
    }));
  }

  const activeIndex = activeIndexByStatus[status];
  return timelineLabels.map((label, index) => ({
    label: label as TimelineLabel,
    state:
      index < activeIndex
        ? ("complete" as const)
        : index === activeIndex
          ? ("active" as const)
          : ("inactive" as const),
  }));
}

function safeOrderSummary(order: OrderRecord) {
  return {
    orderRef: order.orderReference || order.orderId,
    status: order.status,
    createdAt: order.createdAt,
    cityArea: order.customer.cityArea,
    total: order.totalAmount,
    paymentMethod: paymentMethodLabel(order),
    paymentStatus: order.paymentStatus,
    courierName: order.courierName,
    trackingId: order.trackingId,
    deliveryStatus: order.deliveryStatus,
    deliveryCharge: order.deliveryCharge,
    deliveryArea: order.deliveryArea || order.customer.cityArea,
    deliveryZone: order.deliveryZone,
    deliveryAddress: order.customer.address,
    deliveryNote: order.deliveryNote || order.customer.deliveryNote,
    items: order.items.map(itemSummary),
    timeline: timelineForStatus(order.status),
  };
}

function notFoundResponse() {
  return Response.json(
    { errors: ["We could not find an order matching those details."] },
    { status: 404 }
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const orderRef = isRecord(payload) ? text(payload.orderRef).toUpperCase() : "";
  const customerPhone = isRecord(payload) ? text(payload.customerPhone) : "";

  if (!orderRef || !customerPhone) {
    return Response.json(
      { errors: ["Order reference and phone number are required."] },
      { status: 400 }
    );
  }

  try {
    const { order } = await getOrderByReference(orderRef);

    if (!order || order.deletedAt || order.softDeletedAt) return notFoundResponse();

    const providedPhone = normalizePhone(customerPhone);
    const storedPhone = normalizePhone(order.customer.phone);

    if (!providedPhone || providedPhone !== storedPhone) {
      return notFoundResponse();
    }

    return Response.json({ order: safeOrderSummary(order) });
  } catch (error) {
    console.error("Failed to track order:", error);
    return Response.json(
      { errors: ["Order tracking is temporarily unavailable."] },
      { status: 500 }
    );
  }
}
