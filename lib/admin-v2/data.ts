import { listAdminCustomerOverviews } from "@/app/lib/customer-account-store";
import { listOrders } from "@/app/lib/order-store";
import { listProducts } from "@/app/lib/product-store";
import { listAllReviews } from "@/app/lib/review-store";
import { getAllConversations } from "@/app/lib/support-store";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import { canAccessAdminV2Module } from "@/lib/admin-v2/permissions";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getAdminV2DashboardData(
  session: AdminSessionUser
): Promise<AdminV2DashboardData> {
  const canViewOrders = canAccessAdminV2Module(session, "orders");
  const canViewProducts = canAccessAdminV2Module(session, "products");
  const canViewReviews = canAccessAdminV2Module(session, "reviews");
  const canViewCustomers = canAccessAdminV2Module(session, "customers");
  const canViewSupport = canAccessAdminV2Module(session, "support");
  const supabaseConfigured = hasSupabaseConfig();

  const [ordersResult, productsResult, reviewsResult, customersResult, supportResult] =
    await Promise.allSettled([
      canViewOrders ? listOrders() : Promise.resolve(null),
      canViewProducts
        ? listProducts({ includeDrafts: true, scope: "admin" })
        : Promise.resolve(null),
      canViewReviews && supabaseConfigured ? listAllReviews() : Promise.resolve(null),
      canViewCustomers && supabaseConfigured
        ? listAdminCustomerOverviews()
        : Promise.resolve(null),
      canViewSupport ? getAllConversations().catch(() => null) : Promise.resolve(null),
    ]);

  const orderPayload = ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const realOrders =
    orderPayload?.storageMode === "supabase"
      ? orderPayload.orders.filter((order) => !order.archivedAt && !order.deletedAt && !order.softDeletedAt)
      : [];

  const productPayload = productsResult.status === "fulfilled" ? productsResult.value : null;
  const products =
    productPayload?.storageMode === "supabase" ? productPayload.products : [];

  const reviews = reviewsResult.status === "fulfilled" && reviewsResult.value ? reviewsResult.value : [];
  const customers =
    customersResult.status === "fulfilled" && customersResult.value ? customersResult.value : [];
  const support =
    supportResult.status === "fulfilled" && supportResult.value ? supportResult.value : [];

  return {
    orders: {
      available: canViewOrders && orderPayload?.storageMode === "supabase",
      count: realOrders.length,
      revenue: realOrders
        .filter((order) => order.status !== "Cancelled" && !order.isTestOrder)
        .reduce((sum, order) => sum + (Number.isFinite(order.totalAmount) ? order.totalAmount : 0), 0),
      pending: realOrders.filter((order) => order.status === "Pending").length,
      recent: [...realOrders]
        .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
        .slice(0, 6),
      source: canViewOrders ? orderPayload?.storageMode ?? "unavailable" : "unauthorized",
    },
    products: {
      available: canViewProducts && productPayload?.storageMode === "supabase",
      count: products.length,
      active: products.filter((product) => product.status === "active").length,
      draft: products.filter((product) => product.status === "draft").length,
      lowStock: products.filter((product) => product.stockStatus === "low_stock" || product.stockStatus === "out_of_stock").length,
      source:
        !canViewProducts
          ? "unauthorized"
          : productPayload?.storageMode === "supabase"
            ? "supabase"
            : "unavailable",
      items: products,
    },
    reviews: {
      available: canViewReviews && supabaseConfigured && reviewsResult.status === "fulfilled" && Array.isArray(reviewsResult.value),
      count: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      source: !canViewReviews ? "unauthorized" : supabaseConfigured ? "supabase" : "unavailable",
    },
    customers: {
      available: canViewCustomers && supabaseConfigured && customersResult.status === "fulfilled" && Array.isArray(customersResult.value),
      count: customers.length,
      source: !canViewCustomers ? "unauthorized" : supabaseConfigured ? "supabase" : "unavailable",
    },
    support: {
      available: canViewSupport && supportResult.status === "fulfilled" && Array.isArray(supportResult.value),
      open: support.filter((conversation) => conversation.status === "open").length,
      source: !canViewSupport
        ? "unauthorized"
        : supportResult.status === "fulfilled" && Array.isArray(supportResult.value)
          ? "store"
          : "unavailable",
    },
  };
}
