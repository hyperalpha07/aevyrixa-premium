import { listAdminCustomerOverviews } from "@/app/lib/customer-account-store";
import { listOrders } from "@/app/lib/order-store";
import { listProducts } from "@/app/lib/product-store";
import { listAllReviews } from "@/app/lib/review-store";
import { getAllConversations } from "@/app/lib/support-store";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getAdminV2DashboardData(): Promise<AdminV2DashboardData> {
  const [ordersResult, productsResult, reviewsResult, customersResult, supportResult] =
    await Promise.allSettled([
      listOrders(),
      listProducts({ includeDrafts: true, scope: "admin" }),
      hasSupabaseConfig() ? listAllReviews() : Promise.resolve(null),
      hasSupabaseConfig() ? listAdminCustomerOverviews() : Promise.resolve(null),
      getAllConversations().catch(() => null),
    ]);

  const orderPayload = ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const realOrders =
    orderPayload?.storageMode === "supabase"
      ? orderPayload.orders.filter((order) => !order.archivedAt && !order.deletedAt && !order.softDeletedAt)
      : [];

  const productPayload = productsResult.status === "fulfilled" ? productsResult.value : null;
  const products = productPayload?.products ?? [];

  const reviews = reviewsResult.status === "fulfilled" && reviewsResult.value ? reviewsResult.value : [];
  const customers =
    customersResult.status === "fulfilled" && customersResult.value ? customersResult.value : [];
  const support =
    supportResult.status === "fulfilled" && supportResult.value ? supportResult.value : [];

  return {
    orders: {
      available: orderPayload?.storageMode === "supabase",
      count: realOrders.length,
      revenue: realOrders
        .filter((order) => order.status !== "Cancelled" && !order.isTestOrder)
        .reduce((sum, order) => sum + (Number.isFinite(order.totalAmount) ? order.totalAmount : 0), 0),
      pending: realOrders.filter((order) => order.status === "Pending").length,
      recent: [...realOrders]
        .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
        .slice(0, 6),
      source: orderPayload?.storageMode ?? "unavailable",
    },
    products: {
      available: Boolean(productPayload),
      count: products.length,
      active: products.filter((product) => product.status === "active").length,
      draft: products.filter((product) => product.status === "draft").length,
      lowStock: products.filter((product) => product.stockStatus === "low_stock" || product.stockStatus === "out_of_stock").length,
      source: productPayload?.storageMode ?? "unavailable",
      items: products,
    },
    reviews: {
      available: hasSupabaseConfig() && reviewsResult.status === "fulfilled",
      count: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      source: hasSupabaseConfig() ? "supabase" : "unavailable",
    },
    customers: {
      available: hasSupabaseConfig() && customersResult.status === "fulfilled",
      count: customers.length,
      source: hasSupabaseConfig() ? "supabase" : "unavailable",
    },
    support: {
      available: supportResult.status === "fulfilled" && Array.isArray(supportResult.value),
      open: support.filter((conversation) => conversation.status === "open").length,
      source: supportResult.status === "fulfilled" && Array.isArray(supportResult.value) ? "store" : "unavailable",
    },
  };
}
