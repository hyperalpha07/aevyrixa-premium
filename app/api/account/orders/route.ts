import { requireCustomer, customerErrorResponse } from "@/app/api/account/_utils";
import { listOrders } from "@/app/lib/order-store";
import type { OrderCartItem, OrderRecord } from "@/app/lib/order-types";
import { normalizeCustomerPhone } from "@/app/lib/customer-account-store";

export const dynamic = "force-dynamic";

function itemSummary(item: OrderCartItem) {
  const variant = [item.size, item.color, item.absorbency, item.variant]
    .filter(Boolean)
    .join(" / ");

  return {
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variant: variant || undefined,
  };
}

function paymentMethodLabel(order: OrderRecord) {
  const { paymentMethod, walletProvider } = order.paymentDetails;
  return paymentMethod === "Mobile Wallet Payment" && walletProvider
    ? `${walletProvider} ${paymentMethod}`
    : paymentMethod;
}

function safeOrder(order: OrderRecord) {
  return {
    orderRef: order.orderReference || order.orderId,
    createdAt: order.createdAt,
    status: order.status,
    total: order.totalAmount,
    customerPhone: order.customer.phone,
    paymentMethod: paymentMethodLabel(order),
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    deliveryCharge: order.deliveryCharge,
    deliveryArea: order.deliveryArea || order.customer.cityArea,
    deliveryZone: order.deliveryZone,
    deliveryAddress: order.customer.address,
    cityArea: order.customer.cityArea,
    courierName: order.courierName,
    trackingId: order.trackingId,
    items: order.items.map(itemSummary),
  };
}

export async function GET(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;

    const { orders, storageMode } = await listOrders();
    const customerPhone = normalizeCustomerPhone(customer.phone);
    const safeOrders = orders
      .filter((order) => !order.deletedAt && !order.softDeletedAt)
      .filter((order) => {
        if (order.customerId) return order.customerId === customer.id;
        return normalizeCustomerPhone(order.customer.phone) === customerPhone;
      })
      .map(safeOrder);

    return Response.json({ orders: safeOrders, storageMode });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
