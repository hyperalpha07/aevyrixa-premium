export type AdminV2Route = {
  title: string;
  path: string;
  description: string;
  module: AdminV2ModuleKey;
  implemented: boolean;
  classicPath?: string;
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
  | "productMedia"
  | "productPublish"
  | "productUnpublish"
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
  | "homepage"
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
  { title: "Product media", path: "/admin-v2/products/[productId]/media", module: "productMedia", description: "Manage draft product images", implemented: true },
  { title: "Publish product", path: "/admin-v2/products/[productId]/publish", module: "productPublish", description: "Review and publish a draft product", implemented: true },
  { title: "Unpublish product", path: "/admin-v2/products/[productId]/unpublish", module: "productUnpublish", description: "Review and return an active product to draft", implemented: true },
  { title: "Categories", path: "/admin-v2/categories", module: "categories", description: "Seven persisted storefront categories with complete content and media editing", implemented: true, classicPath: "/admin/categories" },
  { title: "Inventory", path: "/admin-v2/inventory", module: "inventory", description: "Live inventory quantity and stock status controls", implemented: true },
  { title: "Reviews", path: "/admin-v2/reviews", module: "reviews", description: "Review moderation", implemented: true },
    { title: "Customers", path: "/admin-v2/customers", module: "customers", description: "Customer management", implemented: true },
    { title: "Customer Detail", path: "/admin-v2/customers/[customerId]", module: "customerDetail", description: "Customer profile", implemented: true },
  { title: "Returns", path: "/admin-v2/returns", module: "returns", description: "Real manual return and exchange case workflow", implemented: true },
  { title: "Discounts", path: "/admin-v2/discounts", module: "discounts", description: "Discount management", implemented: false, classicPath: "/admin/discounts" },
  { title: "Support", path: "/admin-v2/support", module: "support", description: "Support inbox", implemented: true },
  { title: "Chat", path: "/admin-v2/chat", module: "chat", description: "Live chat via the existing Support Inbox", implemented: true },
  { title: "Email", path: "/admin-v2/email", module: "email", description: "Email workspace", implemented: false },
  { title: "Notifications", path: "/admin-v2/notifications", module: "notifications", description: "Live operational work-queue alerts; no unread history", implemented: true },
  { title: "Media", path: "/admin-v2/media", module: "media", description: "Media library", implemented: false, classicPath: "/admin/media" },
  { title: "Calendar", path: "/admin-v2/calendar", module: "calendar", description: "Persisted internal work-task due-date calendar", implemented: true },
  { title: "Kanban", path: "/admin-v2/kanban", module: "kanban", description: "Persisted internal staff task board", implemented: true },
  { title: "Couriers", path: "/admin-v2/couriers", module: "couriers", description: "Manual live-order fulfillment and courier tracking", implemented: true },
  { title: "Automation", path: "/admin-v2/automation", module: "automation", description: "Automation rules", implemented: false },
  { title: "Staff", path: "/admin-v2/staff", module: "staff", description: "Staff management", implemented: true },
  { title: "Roles", path: "/admin-v2/roles", module: "roles", description: "Role governance", implemented: true },
  { title: "Permissions", path: "/admin-v2/permissions", module: "permissions", description: "Access-control matrix", implemented: true },
  { title: "Audit Logs", path: "/admin-v2/audit-logs", module: "auditLogs", description: "Audit log", implemented: true },
  { title: "Approvals", path: "/admin-v2/approvals", module: "approvals", description: "Approval queue", implemented: true },
  { title: "Analytics", path: "/admin-v2/analytics", module: "analytics", description: "Analytics", implemented: true },
  { title: "Reports", path: "/admin-v2/reports", module: "reports", description: "Reports", implemented: true },
  { title: "Invoices", path: "/admin-v2/invoices", module: "invoices", description: "Invoices", implemented: true },
  { title: "Transactions", path: "/admin-v2/transactions", module: "transactions", description: "Payment transaction ledger", implemented: true },
  { title: "Expenses", path: "/admin-v2/expenses", module: "expenses", description: "Expense ledger", implemented: true },
  { title: "Refunds", path: "/admin-v2/refunds", module: "refunds", description: "Refund ledger", implemented: true },
  { title: "Tax", path: "/admin-v2/tax", module: "tax", description: "Tax settings", implemented: false },
  { title: "Billing", path: "/admin-v2/billing", module: "billing", description: "Billing", implemented: true },
  { title: "Settings", path: "/admin-v2/settings", module: "settings", description: "Native core store and checkout settings, advanced Classic available", implemented: true, classicPath: "/admin/settings" },
  { title: "Homepage", path: "/admin-v2/homepage", module: "homepage", description: "Real homepage section, editorial, hero and media management", implemented: true },
  { title: "Integrations", path: "/admin-v2/integrations", module: "integrations", description: "Integrations", implemented: false, classicPath: "/admin/integrations" },
  { title: "Webhooks", path: "/admin-v2/webhooks", module: "webhooks", description: "Webhook management", implemented: false },
  { title: "System Health", path: "/admin-v2/system-health", module: "systemHealth", description: "Read-only source availability, not uptime monitoring", implemented: true },
];

export function findAdminV2Route(module: AdminV2ModuleKey) {
  return adminV2Routes.find((route) => route.module === module);
}
