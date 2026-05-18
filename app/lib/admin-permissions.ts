export const adminPermissionKeys = [
  "dashboard.view",
  "orders.view",
  "orders.editStatus",
  "orders.editCourier",
  "orders.archiveTest",
  "products.view",
  "products.edit",
  "products.media",
  "categories.manage",
  "settings.view",
  "settings.editBasic",
  "settings.editSensitive",
  "settings.editSeoAnalytics",
  "homepage.manage",
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
};

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
  "orders.archiveTest": "Mark test/archive orders",
  "products.view": "View products",
  "products.edit": "Create/edit products",
  "products.media": "Upload product media",
  "categories.manage": "Manage categories",
  "settings.view": "View settings",
  "settings.editBasic": "Edit basic settings",
  "settings.editSensitive": "Edit payment/delivery/courier settings",
  "settings.editSeoAnalytics": "Edit SEO/analytics settings",
  "homepage.manage": "Edit homepage CMS",
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
      "orders.archiveTest",
    ],
  },
  {
    title: "Products",
    permissions: [
      "products.view",
      "products.edit",
      "products.media",
      "categories.manage",
    ],
  },
  {
    title: "Support",
    permissions: ["support.view", "support.reply", "support.close"],
  },
  {
    title: "Storefront CMS",
    permissions: ["homepage.manage", "settings.editBasic"],
  },
  {
    title: "Settings",
    permissions: [
      "settings.view",
      "settings.editBasic",
      "settings.editSensitive",
      "settings.editSeoAnalytics",
    ],
  },
  {
    title: "Admin",
    permissions: ["dashboard.view", "staff.manage", "activity.view", "analytics.view"],
  },
] satisfies Array<{ title: string; permissions: AdminPermission[] }>;

export const roleDefaultPermissions: Record<AdminRole, AdminPermission[]> = {
  owner: [...adminPermissionKeys],
  manager: [
    "dashboard.view",
    "orders.view",
    "orders.editStatus",
    "orders.editCourier",
    "orders.archiveTest",
    "products.view",
    "products.edit",
    "products.media",
    "categories.manage",
    "settings.view",
    "settings.editBasic",
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
  ],
  product_staff: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "products.media",
    "categories.manage",
  ],
  support_staff: ["dashboard.view", "support.view", "support.reply", "support.close"],
  viewer: [
    "dashboard.view",
    "orders.view",
    "products.view",
    "settings.view",
    "support.view",
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
  if (session.userType === "owner" || session.role === "owner") return true;
  return Boolean(session.permissions[permission]);
}
