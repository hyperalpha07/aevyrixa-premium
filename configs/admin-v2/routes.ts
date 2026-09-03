export type AdminV2Route = {
  title: string;
  path: string;
  description: string;
  module: AdminV2ModuleKey;
  implemented?: boolean;
};

export type AdminV2ModuleKey =
  | "dashboard"
  | "orders"
  | "orderDetail"
  | "products"
  | "productNew"
  | "productDetail"
  | "categories"
  | "inventory"
  | "reviews"
  | "customers"
  | "customerDetail"
  | "returns"
  | "discounts"
  | "support"
  | "chat"
  | "email"
  | "notifications"
  | "media"
  | "calendar"
  | "kanban"
  | "couriers"
  | "automation"
  | "staff"
  | "roles"
  | "permissions"
  | "auditLogs"
  | "approvals"
  | "analytics"
  | "reports"
  | "invoices"
  | "transactions"
  | "expenses"
  | "refunds"
  | "tax"
  | "billing"
  | "settings"
  | "integrations"
  | "webhooks"
  | "systemHealth";

export const adminV2Routes: AdminV2Route[] = [
  { title: "Dashboard", path: "/admin-v2/dashboard", module: "dashboard", description: "Admin V2 overview", implemented: true },
  { title: "Orders", path: "/admin-v2/orders", module: "orders", description: "Order workflow" },
  { title: "Order Detail", path: "/admin-v2/orders/[orderRef]", module: "orderDetail", description: "Order detail workflow" },
  { title: "Products", path: "/admin-v2/products", module: "products", description: "Product catalog" },
  { title: "New Product", path: "/admin-v2/products/new", module: "productNew", description: "Product creation" },
  { title: "Product Detail", path: "/admin-v2/products/[productId]", module: "productDetail", description: "Product edit workflow" },
  { title: "Categories", path: "/admin-v2/categories", module: "categories", description: "Category management" },
  { title: "Inventory", path: "/admin-v2/inventory", module: "inventory", description: "Inventory workflow" },
  { title: "Reviews", path: "/admin-v2/reviews", module: "reviews", description: "Review moderation" },
  { title: "Customers", path: "/admin-v2/customers", module: "customers", description: "Customer management" },
  { title: "Customer Detail", path: "/admin-v2/customers/[customerId]", module: "customerDetail", description: "Customer profile" },
  { title: "Returns", path: "/admin-v2/returns", module: "returns", description: "Returns workflow" },
  { title: "Discounts", path: "/admin-v2/discounts", module: "discounts", description: "Discount management" },
  { title: "Support", path: "/admin-v2/support", module: "support", description: "Support inbox" },
  { title: "Chat", path: "/admin-v2/chat", module: "chat", description: "Live chat" },
  { title: "Email", path: "/admin-v2/email", module: "email", description: "Email workspace" },
  { title: "Notifications", path: "/admin-v2/notifications", module: "notifications", description: "Notification center" },
  { title: "Media", path: "/admin-v2/media", module: "media", description: "Media library" },
  { title: "Calendar", path: "/admin-v2/calendar", module: "calendar", description: "Calendar" },
  { title: "Kanban", path: "/admin-v2/kanban", module: "kanban", description: "Kanban board" },
  { title: "Couriers", path: "/admin-v2/couriers", module: "couriers", description: "Courier operations" },
  { title: "Automation", path: "/admin-v2/automation", module: "automation", description: "Automation rules" },
  { title: "Staff", path: "/admin-v2/staff", module: "staff", description: "Staff management" },
  { title: "Roles", path: "/admin-v2/roles", module: "roles", description: "Role management" },
  { title: "Permissions", path: "/admin-v2/permissions", module: "permissions", description: "Permission matrix" },
  { title: "Audit Logs", path: "/admin-v2/audit-logs", module: "auditLogs", description: "Audit log" },
  { title: "Approvals", path: "/admin-v2/approvals", module: "approvals", description: "Approval queue" },
  { title: "Analytics", path: "/admin-v2/analytics", module: "analytics", description: "Analytics" },
  { title: "Reports", path: "/admin-v2/reports", module: "reports", description: "Reports" },
  { title: "Invoices", path: "/admin-v2/invoices", module: "invoices", description: "Invoices" },
  { title: "Transactions", path: "/admin-v2/transactions", module: "transactions", description: "Transactions" },
  { title: "Expenses", path: "/admin-v2/expenses", module: "expenses", description: "Expenses" },
  { title: "Refunds", path: "/admin-v2/refunds", module: "refunds", description: "Refunds" },
  { title: "Tax", path: "/admin-v2/tax", module: "tax", description: "Tax settings" },
  { title: "Billing", path: "/admin-v2/billing", module: "billing", description: "Billing" },
  { title: "Settings", path: "/admin-v2/settings", module: "settings", description: "Store settings" },
  { title: "Integrations", path: "/admin-v2/integrations", module: "integrations", description: "Integrations" },
  { title: "Webhooks", path: "/admin-v2/webhooks", module: "webhooks", description: "Webhook management" },
  { title: "System Health", path: "/admin-v2/system-health", module: "systemHealth", description: "System health" },
];

export function findAdminV2Route(module: AdminV2ModuleKey) {
  return adminV2Routes.find((route) => route.module === module);
}
