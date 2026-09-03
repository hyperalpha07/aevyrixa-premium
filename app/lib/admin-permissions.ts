export const adminPermissionKeys = [
  "dashboard.view",
  "orders.view",
  "orders.editStatus",
  "orders.editCourier",
  "orders.viewInvoice",
  "orders.issueInvoice",
  "orders.addNote",
  "orders.archiveTest",
  "orders.export",
  "products.view",
  "products.edit",
  "products.media",
  "products.merchandising",
  "reviews.view",
  "reviews.manage",
  "reviews.moderate",
  "reviews.feature",
  "categories.manage",
  "settings.view",
  "settings.editBasic",
  "settings.editSensitive",
  "settings.editSeoAnalytics",
  "settings.manage",
  "announcement.manage",
  "footer.manage",
  "homepage.manage",
  "customers.view",
  "support.view",
  "support.reply",
  "support.close",
  "analytics.view",
  "staff.manage",
  "activity.view",
] as const;

export type AdminPermission = (typeof adminPermissionKeys)[number];

export type AdminRole =
  | "owner"
  | "manager"
  | "order_staff"
  | "product_staff"
  | "support_staff"
  | "viewer";

export type AdminSessionUser = {
  userType: "owner" | "staff";
  username: string;
  displayName: string;
  role: AdminRole;
  permissions: Record<AdminPermission, boolean>;
  staffId?: string;
  isOwner?: boolean;
};

export type AdminSection =
  | "dashboard"
  | "orders"
  | "products"
  | "media"
  | "reviews"
  | "categories"
  | "settings"
  | "support"
  | "customers"
  | "staff"
  | "analytics"
  | "discounts"
  | "integrations"
  | "billing";

export const blockedPermissionMessage =
  "You do not have permission to perform this action.";

export const roleLabels: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Manager",
  order_staff: "Order Staff",
  product_staff: "Product Staff",
  support_staff: "Support Staff",
  viewer: "Viewer",
};

export const permissionLabels: Record<AdminPermission, string> = {
  "dashboard.view": "View dashboard",
  "orders.view": "View orders",
  "orders.editStatus": "Edit order status",
  "orders.editCourier": "Edit courier/tracking",
  "orders.viewInvoice": "View issued invoices",
  "orders.issueInvoice": "Issue invoices",
  "orders.addNote": "Add internal order notes",
  "orders.archiveTest": "Mark test/archive orders",
  "orders.export": "Export orders CSV",
  "products.view": "View products",
  "products.edit": "Create/edit products",
  "products.media": "Upload product media",
  "products.merchandising": "Edit product merchandising",
  "reviews.view": "View reviews",
  "reviews.manage": "Manage reviews",
  "reviews.moderate": "Approve/reject reviews",
  "reviews.feature": "Feature reviews",
  "categories.manage": "Manage categories",
  "settings.view": "View settings",
  "settings.editBasic": "Edit basic settings",
  "settings.editSensitive": "Edit payment/delivery/courier settings",
  "settings.editSeoAnalytics": "Edit SEO/analytics settings",
  "settings.manage": "Manage all settings",
  "announcement.manage": "Manage announcement banner",
  "footer.manage": "Manage footer/support controls",
  "homepage.manage": "Edit homepage CMS",
  "customers.view": "View customers",
  "support.view": "View live chat",
  "support.reply": "Reply live chat",
  "support.close": "Close conversations",
  "analytics.view": "View analytics",
  "staff.manage": "Manage staff",
  "activity.view": "View activity logs",
};

export const permissionGroups = [
  {
    title: "Orders",
    permissions: [
      "orders.view",
      "orders.editStatus",
      "orders.editCourier",
      "orders.viewInvoice",
      "orders.issueInvoice",
      "orders.addNote",
      "orders.archiveTest",
      "orders.export",
    ],
  },
  {
    title: "Products",
    permissions: [
      "products.view",
      "products.edit",
      "products.media",
      "products.merchandising",
      "reviews.view",
      "reviews.manage",
      "reviews.moderate",
      "reviews.feature",
      "categories.manage",
    ],
  },
  {
    title: "Support",
    permissions: ["support.view", "support.reply", "support.close"],
  },
  {
    title: "Storefront CMS",
    permissions: ["homepage.manage", "announcement.manage", "footer.manage", "settings.editBasic"],
  },
  {
    title: "Settings",
    permissions: [
      "settings.view",
      "settings.editBasic",
      "settings.editSensitive",
      "settings.editSeoAnalytics",
      "settings.manage",
    ],
  },
  {
    title: "Admin",
    permissions: ["dashboard.view", "customers.view", "staff.manage", "activity.view", "analytics.view"],
  },
] satisfies Array<{ title: string; permissions: AdminPermission[] }>;

export const roleDefaultPermissions: Record<AdminRole, AdminPermission[]> = {
  owner: [...adminPermissionKeys],
  manager: [
    "dashboard.view",
    "orders.view",
    "orders.editStatus",
    "orders.editCourier",
    "orders.viewInvoice",
    "orders.issueInvoice",
    "orders.addNote",
    "orders.archiveTest",
    "orders.export",
    "products.view",
    "products.edit",
    "products.media",
    "products.merchandising",
    "reviews.view",
    "reviews.manage",
    "reviews.moderate",
    "reviews.feature",
    "categories.manage",
    "settings.view",
    "settings.editBasic",
    "settings.manage",
    "announcement.manage",
    "footer.manage",
    "homepage.manage",
    "support.view",
    "support.reply",
    "support.close",
    "analytics.view",
    "activity.view",
  ],
  order_staff: [
    "dashboard.view",
    "orders.view",
    "orders.editStatus",
    "orders.editCourier",
    "orders.viewInvoice",
    "orders.issueInvoice",
    "orders.addNote",
    "orders.export",
  ],
  product_staff: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "products.media",
    "products.merchandising",
    "reviews.view",
    "reviews.manage",
    "reviews.moderate",
    "reviews.feature",
    "categories.manage",
  ],
  support_staff: ["dashboard.view", "support.view", "support.reply", "support.close"],
  viewer: [
    "dashboard.view",
    "orders.view",
    "orders.viewInvoice",
    "products.view",
    "reviews.view",
    "settings.view",
    "support.view",
    "customers.view",
  ],
};

export function normalizeRole(value: unknown): AdminRole {
  if (
    value === "owner" ||
    value === "manager" ||
    value === "order_staff" ||
    value === "product_staff" ||
    value === "support_staff" ||
    value === "viewer"
  ) {
    return value;
  }

  return "viewer";
}

export function normalizePermissions(
  role: AdminRole,
  permissions: unknown
): Record<AdminPermission, boolean> {
  const defaults = new Set(roleDefaultPermissions[role]);
  const source =
    typeof permissions === "object" && permissions !== null && !Array.isArray(permissions)
      ? (permissions as Record<string, unknown>)
      : {};

  return adminPermissionKeys.reduce((result, key) => {
    result[key] =
      role === "owner" ? true : typeof source[key] === "boolean" ? source[key] : defaults.has(key);
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

export function hasPermission(
  session: AdminSessionUser | null | undefined,
  permission: AdminPermission
) {
  if (!session) return false;
  if (session.userType === "owner" || session.role === "owner" || session.isOwner === true) {
    return true;
  }
  return Boolean(session.permissions?.[permission]);
}

export function requirePermission(
  session: AdminSessionUser | null | undefined,
  permission: AdminPermission
) {
  if (hasPermission(session, permission)) return session;
  throw new Error(blockedPermissionMessage);
}

export function canAccessSection(
  session: AdminSessionUser | null | undefined,
  section: AdminSection
) {
  if (!session) return false;

  if (section === "dashboard") return hasPermission(session, "dashboard.view");
  if (section === "orders") return hasPermission(session, "orders.view");
  if (section === "products") return hasPermission(session, "products.view");
  if (section === "media") return hasPermission(session, "products.media") || hasPermission(session, "products.view");
  if (section === "reviews") return hasPermission(session, "reviews.view");
  if (section === "categories") return hasPermission(session, "categories.manage");
  if (section === "settings") return hasPermission(session, "settings.view");
  if (section === "support") return hasPermission(session, "support.view");
  if (section === "customers") return hasPermission(session, "customers.view");
  if (section === "staff") {
    return hasPermission(session, "staff.manage") || hasPermission(session, "activity.view");
  }
  if (section === "analytics") return hasPermission(session, "analytics.view");
  if (section === "discounts") return hasPermission(session, "settings.manage") || hasPermission(session, "settings.view");
  if (section === "integrations") {
    return hasPermission(session, "settings.view") || hasPermission(session, "settings.editSensitive");
  }
  if (section === "billing") return hasPermission(session, "analytics.view") || hasPermission(session, "orders.view");

  return false;
}

const sectionPaths: Array<{ section: AdminSection; path: string }> = [
  { section: "dashboard", path: "/admin" },
  { section: "orders", path: "/admin/orders" },
  { section: "products", path: "/admin/products" },
  { section: "media", path: "/admin/media" },
  { section: "reviews", path: "/admin/reviews" },
  { section: "categories", path: "/admin/categories" },
  { section: "settings", path: "/admin/settings" },
  { section: "support", path: "/admin/support" },
  { section: "customers", path: "/admin/customers" },
  { section: "staff", path: "/admin/staff" },
  { section: "discounts", path: "/admin/discounts" },
  { section: "analytics", path: "/admin/analytics" },
  { section: "integrations", path: "/admin/integrations" },
  { section: "billing", path: "/admin/billing" },
];

export function firstAccessibleAdminPath(
  session: AdminSessionUser | null | undefined
) {
  return sectionPaths.find((item) => canAccessSection(session, item.section))?.path;
}
