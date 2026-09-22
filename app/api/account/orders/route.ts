import { requireCustomer, customerErrorResponse } from "@/app/api/account/_utils";
import { listOrders } from "@/app/lib/order-store";
import { listProducts } from "@/app/lib/product-store";
import type { OrderCartItem, OrderRecord } from "@/app/lib/order-types";
import { normalizeCustomerPhone } from "@/app/lib/customer-account-store";
import { isPublicProductImageAllowed } from "@/app/lib/public-product-media-safety";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { createProductImageLookup, resolveOrderItemImage, safeAccountOrderImage } from "@/app/account/orders/account-order-image";

export const dynamic = "force-dynamic";

const safeImage = (value: unknown) => safeAccountOrderImage(
  value,
  (image) => normalizeAdminV2ImageSrc(image),
  isPublicProductImageAllowed,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

function itemSummary(item: OrderCartItem, catalog: ReturnType<typeof createProductImageLookup> | null) {
  const variant = [item.size, item.color, item.absorbency, item.variant]
    .filter(Boolean)
    .join(" / ");

  return {
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    image: resolveOrderItemImage(item, catalog, safeImage),
    variant: variant || undefined,
  };
}

function paymentMethodLabel(order: OrderRecord) {
  const { paymentMethod, walletProvider } = order.paymentDetails;
  return paymentMethod === "Mobile Wallet Payment" && walletProvider
    ? `${walletProvider} ${paymentMethod}`
    : paymentMethod;
}

function safeOrder(order: OrderRecord, catalog: ReturnType<typeof createProductImageLookup> | null) {
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
    items: order.items.map((item) => itemSummary(item, catalog)),
  };
}

export async function GET(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;

    const { orders, storageMode } = await listOrders();
    const customerPhone = normalizeCustomerPhone(customer.phone);
    const customerOrders = orders
      .filter((order) => !order.deletedAt && !order.softDeletedAt)
      .filter((order) => {
        if (order.customerId) return order.customerId === customer.id;
        return normalizeCustomerPhone(order.customer.phone) === customerPhone;
      });

    // Historical snapshots win. Consult the public catalog once only for missing images.
    const needsCatalog = customerOrders.some((order) => order.items.some((item) => !safeImage(item.image)));
    let catalog: ReturnType<typeof createProductImageLookup> | null = null;
    if (needsCatalog) {
      // A previously purchased product may have since been unpublished.
      const result = await listProducts({ scope: "admin" });
      // Never substitute demo fallback products for a real customer's order.
      if (result.storageMode === "supabase") catalog = createProductImageLookup(result.products);
    }
    const safeOrders = customerOrders.map((order) => safeOrder(order, catalog));

    return Response.json({ orders: safeOrders, storageMode });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
