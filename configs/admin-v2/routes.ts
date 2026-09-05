export type AdminV2Route = {
  title: string;
  path: string;
  description: string;
  module: AdminV2ModuleKey;
  implemented: boolean;
};

export type AdminV2ModuleKey =
  | "dashboard"
  | "orders"
  | "orderDetail"
  | "orderInvoice"
  | "products"
  | "productNew"
  | "productDetail"
  | "productEdit"
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
  { title: "Orders", path: "/admin-v2/orders", module: "orders", description: "Order workflow", implemented: true },
  { title: "Order Detail", path: "/admin-v2/orders/[orderRef]", module: "orderDetail", description: "Order detail workflow", implemented: true },
  { title: "Order Invoice", path: "/admin-v2/orders/[orderRef]/invoice", module: "orderInvoice", description: "Issued invoice print view", implemented: true },
  { title: "Products", path: "/admin-v2/products", module: "products", description: "Read-only product catalog", implemented: true },
  { title: "New Product", path: "/admin-v2/products/new", module: "productNew", description: "Draft-only product creation", implemented: true },
  { title: "Product Detail", path: "/admin-v2/products/[productId]", module: "productDetail", description: "Read-only product detail", implemented: true },
  { title: "Edit draft product", path: "/admin-v2/products/[productId]/edit", module: "productEdit", description: "Edit draft products only", implemented: true },
  { title: "Categories", path: "/admin-v2/categories", module: "categories", description: "Category management", implemented: false },
  { title: "Inventory", path: "/admin-v2/inventory", module: "inventory", description: "Inventory workflow", implemented: false },
  { title: "Reviews", path: "/admin-v2/reviews", module: "reviews", description: "Review moderation", implemented: false },
  { title: "Customers", path: "/admin-v2/customers", module: "customers", description: "Customer management", implemented: false },
  { title: "Customer Detail", path: "/admin-v2/customers/[customerId]", module: "customerDetail", description: "Customer profile", implemented: false },
  { title: "Returns", path: "/admin-v2/returns", module: "returns", description: "Returns workflow", implemented: false },
  { title: "Discounts", path: "/admin-v2/discounts", module: "discounts", description: "Discount management", implemented: false },
  { title: "Support", path: "/admin-v2/support", module: "support", description: "Support inbox", implemented: false },
  { title: "Chat", path: "/admin-v2/chat", module: "chat", description: "Live chat", implemented: false },
  { title: "Email", path: "/admin-v2/email", module: "email", description: "Email workspace", implemented: false },
  { title: "Notifications", path: "/admin-v2/notifications", module: "notifications", description: "Notification center", implemented: false },
  { title: "Media", path: "/admin-v2/media", module: "media", description: "Media library", implemented: false },
  { title: "Calendar", path: "/admin-v2/calendar", module: "calendar", description: "Calendar", implemented: false },
  { title: "Kanban", path: "/admin-v2/kanban", module: "kanban", description: "Kanban board", implemented: false },
  { title: "Couriers", path: "/admin-v2/couriers", module: "couriers", description: "Courier operations", implemented: false },
  { title: "Automation", path: "/admin-v2/automation", module: "automation", description: "Automation rules", implemented: false },
  { title: "Staff", path: "/admin-v2/staff", module: "staff", description: "Staff management", implemented: false },
  { title: "Roles", path: "/admin-v2/roles", module: "roles", description: "Role management", implemented: false },
  { title: "Permissions", path: "/admin-v2/permissions", module: "permissions", description: "Permission matrix", implemented: false },
  { title: "Audit Logs", path: "/admin-v2/audit-logs", module: "auditLogs", description: "Audit log", implemented: false },
  { title: "Approvals", path: "/admin-v2/approvals", module: "approvals", description: "Approval queue", implemented: false },
  { title: "Analytics", path: "/admin-v2/analytics", module: "analytics", description: "Analytics", implemented: false },
  { title: "Reports", path: "/admin-v2/reports", module: "reports", description: "Reports", implemented: false },
  { title: "Invoices", path: "/admin-v2/invoices", module: "invoices", description: "Invoices", implemented: false },
  { title: "Transactions", path: "/admin-v2/transactions", module: "transactions", description: "Transactions", implemented: false },
  { title: "Expenses", path: "/admin-v2/expenses", module: "expenses", description: "Expenses", implemented: false },
  { title: "Refunds", path: "/admin-v2/refunds", module: "refunds", description: "Refunds", implemented: false },
  { title: "Tax", path: "/admin-v2/tax", module: "tax", description: "Tax settings", implemented: false },
  { title: "Billing", path: "/admin-v2/billing", module: "billing", description: "Billing", implemented: false },
  { title: "Settings", path: "/admin-v2/settings", module: "settings", description: "Store settings", implemented: false },
  { title: "Integrations", path: "/admin-v2/integrations", module: "integrations", description: "Integrations", implemented: false },
  { title: "Webhooks", path: "/admin-v2/webhooks", module: "webhooks", description: "Webhook management", implemented: false },
  { title: "System Health", path: "/admin-v2/system-health", module: "systemHealth", description: "System health", implemented: false },
];

export function findAdminV2Route(module: AdminV2ModuleKey) {
  return adminV2Routes.find((route) => route.module === module);
}
