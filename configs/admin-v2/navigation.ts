import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileText,
  GitBranch,
  HeartHandshake,
  Image,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PackageCheck,
  Percent,
  Receipt,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Tags,
  Truck,
  UserCheck,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminV2ModuleKey } from "@/configs/admin-v2/routes";

export type AdminV2NavigationItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string;
  module?: AdminV2ModuleKey;
  children?: AdminV2NavigationItem[];
};

export type AdminV2NavigationSection = {
  heading: string;
  items: AdminV2NavigationItem[];
};

export const adminV2Navigation: AdminV2NavigationSection[] = [
  {
    heading: "Core",
    items: [
      { label: "Dashboard", href: "/admin-v2/dashboard", icon: LayoutDashboard, module: "dashboard" },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { label: "Orders", href: "/admin-v2/orders", icon: ClipboardList, module: "orders" },
      {
        label: "Products",
        href: "/admin-v2/products",
        icon: Boxes,
        module: "products",
        children: [
          { label: "All Products", href: "/admin-v2/products", module: "products" },
          { label: "New Product", href: "/admin-v2/products/new", module: "productNew" },
          { label: "Categories", href: "/admin-v2/categories", module: "categories" },
          { label: "Inventory", href: "/admin-v2/inventory", module: "inventory" },
        ],
      },
      { label: "Reviews", href: "/admin-v2/reviews", icon: HeartHandshake, module: "reviews" },
      { label: "Customers", href: "/admin-v2/customers", icon: Users, module: "customers" },
      { label: "Returns", href: "/admin-v2/returns", icon: RefreshCcw, module: "returns" },
      { label: "Discounts", href: "/admin-v2/discounts", icon: Percent, module: "discounts" },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Support", href: "/admin-v2/support", icon: MessageSquare, module: "support" },
      { label: "Chat", href: "/admin-v2/chat", icon: MessageSquare, module: "chat" },
      { label: "Email", href: "/admin-v2/email", icon: Mail, module: "email" },
      { label: "Notifications", href: "/admin-v2/notifications", icon: Bell, module: "notifications" },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Media", href: "/admin-v2/media", icon: Image, module: "media" },
      { label: "Calendar", href: "/admin-v2/calendar", icon: CalendarDays, module: "calendar" },
      { label: "Kanban", href: "/admin-v2/kanban", icon: ClipboardCheck, module: "kanban" },
      { label: "Couriers", href: "/admin-v2/couriers", icon: Truck, module: "couriers" },
      { label: "Automation", href: "/admin-v2/automation", icon: Workflow, module: "automation" },
    ],
  },
  {
    heading: "Team",
    items: [
      { label: "Staff", href: "/admin-v2/staff", icon: UserCheck, module: "staff" },
      { label: "Roles", href: "/admin-v2/roles", icon: ShieldCheck, module: "roles" },
      { label: "Permissions", href: "/admin-v2/permissions", icon: KeyRound, module: "permissions" },
      { label: "Audit Logs", href: "/admin-v2/audit-logs", icon: Activity, module: "auditLogs" },
      { label: "Approvals", href: "/admin-v2/approvals", icon: PackageCheck, module: "approvals" },
    ],
  },
  {
    heading: "Analytics & Finance",
    items: [
      { label: "Analytics", href: "/admin-v2/analytics", icon: BarChart3, module: "analytics" },
      { label: "Reports", href: "/admin-v2/reports", icon: FileBarChart, module: "reports" },
      { label: "Invoices", href: "/admin-v2/invoices", icon: FileText, module: "invoices" },
      { label: "Transactions", href: "/admin-v2/transactions", icon: Receipt, module: "transactions" },
      { label: "Expenses", href: "/admin-v2/expenses", icon: BadgeDollarSign, module: "expenses" },
      { label: "Refunds", href: "/admin-v2/refunds", icon: RefreshCcw, module: "refunds" },
      { label: "Tax", href: "/admin-v2/tax", icon: Tags, module: "tax" },
      { label: "Billing", href: "/admin-v2/billing", icon: CreditCard, module: "billing" },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Settings", href: "/admin-v2/settings", icon: Settings, module: "settings" },
      { label: "Integrations", href: "/admin-v2/integrations", icon: GitBranch, module: "integrations" },
      { label: "Webhooks", href: "/admin-v2/webhooks", icon: Webhook, module: "webhooks" },
      { label: "System Health", href: "/admin-v2/system-health", icon: Activity, module: "systemHealth" },
    ],
  },
];
