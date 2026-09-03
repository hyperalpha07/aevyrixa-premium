import type { OrderRecord } from "../../../app/lib/order-types";

function cleanRef(value: string) {
  return value.replace(/[^A-Z0-9-]/gi, "").toUpperCase().slice(0, 48);
}

export function createDeterministicInvoiceNumber(orderRef: string, issuedAtIso: string) {
  const date = issuedAtIso.slice(0, 10).replace(/-/g, "");
  return `AEV-INV-${date}-${cleanRef(orderRef)}`;
}

export function createOrderInvoiceSnapshot(order: OrderRecord) {
  const subtotal = Math.max(0, order.totals?.subtotal ?? 0);
  const discount = Math.max(0, order.discountAmount ?? 0);
  const delivery = Math.max(0, order.deliveryCharge ?? 0);
  const calculatedTotal = Math.max(0, subtotal - discount + delivery);
  const total = Math.abs((order.totalAmount ?? 0) - calculatedTotal) > 1 ? calculatedTotal : order.totalAmount;
  return {
    orderReference: order.orderReference,
    createdAt: order.createdAt,
    customer: {
      name: order.customer.fullName,
      phone: order.customer.phone,
      email: order.customer.email ?? null,
      cityArea: order.customer.cityArea,
      deliveryAddress: order.customer.address,
    },
    payment: {
      method: order.paymentDetails.paymentMethod,
      status: order.paymentStatus ?? null,
      reference: order.paymentReference ?? order.paymentDetails.transactionReference ?? null,
    },
    delivery: {
      status: order.deliveryStatus ?? null,
      charge: delivery,
      courierName: order.courierName ?? null,
      trackingId: order.trackingId ?? null,
    },
    items: order.items.map((item) => ({
      id: item.id,
      sku: item.sku ?? null,
      name: item.name,
      size: item.size ?? null,
      color: item.color ?? null,
      variant: item.variant ?? item.absorbency ?? null,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.lineTotal ?? item.price * item.quantity,
    })),
    totals: {
      subtotal,
      discount,
      delivery,
      total,
      paid: order.paidAmount ?? null,
      due: order.dueAmount ?? null,
      refunded: order.refundedAmount ?? null,
      currency: order.currencyCode ?? "BDT",
    },
  };
}
