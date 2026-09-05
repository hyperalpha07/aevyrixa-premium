import type { AdminPermission, AdminSection } from "@/app/lib/admin-permissions";
import type { AdminV2ModuleKey } from "@/configs/admin-v2/routes";

export type AdminV2AccessRule = {
  section?: AdminSection;
  permission?: AdminPermission;
};

export const adminV2AccessRules: Record<AdminV2ModuleKey, AdminV2AccessRule> = {
  dashboard: { section: "dashboard" },
  orders: { section: "orders" },
  orderDetail: { section: "orders" },
  orderInvoice: { permission: "orders.viewInvoice" },
  products: { permission: "products.view" },
  productNew: { permission: "products.create" },
  productDetail: { permission: "products.view" },
  categories: { section: "categories" },
  inventory: { section: "products" },
  reviews: { section: "reviews" },
  customers: { section: "customers" },
  customerDetail: { section: "customers" },
  returns: { section: "orders" },
  discounts: { section: "discounts" },
  support: { section: "support" },
  chat: { section: "support" },
  email: { section: "support" },
  notifications: { section: "support" },
  media: { section: "media" },
  calendar: { section: "staff" },
  kanban: { section: "staff" },
  couriers: { section: "orders" },
  automation: { section: "settings" },
  staff: { section: "staff" },
  roles: { permission: "staff.manage" },
  permissions: { permission: "staff.manage" },
  auditLogs: { permission: "activity.view" },
  approvals: { section: "staff" },
  analytics: { section: "analytics" },
  reports: { section: "analytics" },
  invoices: { section: "billing" },
  transactions: { section: "billing" },
  expenses: { section: "billing" },
  refunds: { section: "billing" },
  tax: { section: "billing" },
  billing: { section: "billing" },
  settings: { section: "settings" },
  integrations: { section: "integrations" },
  webhooks: { section: "integrations" },
  systemHealth: { section: "settings" },
};
