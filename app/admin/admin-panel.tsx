"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReviewsCommandCenter from "@/app/admin/reviews-command-center";
import {
  ArrowLeft,
  Bell as BellIcon,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Command,
  Tag,
  Copy,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Globe,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Inbox,
  LogOut,
  MapPin,
  MessageSquare,
  MonitorDot,
  MoreVertical,
  PackageCheck,
  Paperclip,
  Phone,
  Pencil,
  Plus,
  RefreshCw,
  Rows3,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  ShoppingBag,
  Star,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Video as VideoIcon,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { products as seedProducts, type ProductVisualTheme } from "@/app/lib/products";
import { formatCurrency, SITE_CURRENCY } from "@/app/lib/currency";
import {
  ADMIN_SETTINGS_KEY,
  courierIntegrationModes,
  courierOptions,
  defaultAdminSettings,
  normalizeAdminSettings,
  type AdminSettings,
  type CourierOption,
  type CtaSectionMediaMode,
  type HomepageCategoryMediaMode,
  type HomepageMediaSettings,
  type LayerComfortMediaMode,
} from "@/app/lib/admin-settings";
import {
  deliveryStatuses,
  orderSources,
  orderStatuses,
  paymentStatuses,
  paymentMethods,
  paymentVerificationStatuses,
  proofReceivedStatuses,
  type DeliveryStatus,
  type OrderOperationsUpdate,
  type OrderSource,
  type OrderStatus,
  type PaymentStatus,
  type PaymentVerificationStatus,
  type ProofReceivedStatus,
} from "@/app/lib/order-types";
import type {
  ProductCatalogItem,
  ProductStockStatus,
  ProductStatus as StoreProductStatus,
} from "@/app/lib/product-types";
import {
  adminPermissionKeys,
  blockedPermissionMessage,
  canAccessSection,
  hasPermission,
  permissionGroups,
  permissionLabels,
  roleDefaultPermissions,
  roleLabels,
  type AdminPermission,
  type AdminRole,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";
import {
  buildProductCmsMedia,
  createBenefitItem,
  createColorOption,
  createContentBlock,
  createDescriptionMediaItem,
  createEmptySectionMedia,
  createFaqItem,
  defaultVisualThemeSettings,
  extractProductCmsContent,
  productSectionLabels,
  safeColorHex,
  type ProductBenefitItem,
  type ProductColorOption,
  type ProductContentBlock,
  type ProductDescriptionMediaItem,
  type ProductFaqItem,
  type ProductSectionMediaKey,
  type ProductSectionMediaMap,
  type ProductVisualThemeSettings,
} from "@/app/lib/product-content";

const LATEST_DRAFT_ORDER_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_KEY = "aevyrixa-draft-orders";
const ADMIN_PRODUCTS_KEY = "aevyrixa-admin-products";
const ADMIN_SOUND_MUTED_KEY = "aevyrixa-admin-sound-muted";

type AdminSoundCue =
  | "click"
  | "hover"
  | "menu"
  | "toggle"
  | "tab"
  | "primary"
  | "success"
  | "warning"
  | "error";

const adminSoundAssetPaths: Partial<Record<AdminSoundCue, string>> = {
  // Drop real assets in public/admin/sounds and point these keys at them later.
};

const productStatuses = ["Active", "Draft"] as const;
const stockStatuses: ProductStockStatus[] = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "preorder",
];
const visualThemes: ProductVisualTheme[] = ["blush-violet", "cyan-night", "rose-gold"];

const CMS_CATEGORY_NAMES = [
  "Reusable Period Care",
  "Comfort Panty",
  "Soft Support Bra",
  "Nightwear",
  "Hygiene Essentials",
  "Bundles",
  "New Arrivals",
] as const;

type ProductStatus = (typeof productStatuses)[number];
type ProductFilter = "All" | "Active" | "Draft" | "Out of Stock" | "Deleted";
type AdminView =
  | "dashboard"
  | "orders"
  | "products"
  | "media"
  | "reviews"
  | "settings"
  | "support"
  | "categories"
  | "staff"
  | "customers"
  | "discounts"
  | "analytics"
  | "integrations"
  | "billing";
type PaymentFilter = "All" | (typeof paymentMethods)[number];
type PaymentStatusFilter = "All" | PaymentStatus;
type StatusFilter = "All" | OrderStatus;
type DeliveryStatusFilter = "All" | DeliveryStatus;
type SpecialOrderFilter = "Active" | "Include archived/test" | "Archived only" | "Test only";
type OrderSort = "Newest first" | "Oldest first" | "Highest total" | "Lowest total";
type SettingsStorageMode =
  | "supabase"
  | "fallback-default"
  | "fallback-missing-table"
  | "fallback-error";

type StoredOrderItem = {
  id?: string;
  productId?: string;
  slug?: string;
  name?: string;
  price?: number;
  size?: string;
  color?: string;
  absorbency?: string;
  variant?: string;
  quantity?: number;
};

type StoredOrder = {
  orderId: string;
  orderReference?: string;
  customerId?: string;
  customer: {
    fullName?: string;
    phone?: string;
    email?: string;
    cityArea?: string;
    address?: string;
    sizeFitNote?: string;
    deliveryNote?: string;
  };
  paymentDetails: {
    paymentMethod?: string;
    walletProvider?: string;
    paymentType?: string;
    receiverNumber?: string;
    walletSenderNumber?: string;
    transactionReference?: string;
  };
  items: StoredOrderItem[];
  totals: {
    totalItems?: number;
    subtotal?: number;
  };
  totalAmount?: number;
  status: OrderStatus;
  createdAt?: string;
  courierName?: string;
  trackingId?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryNote?: string;
  customerConfirmationNote?: string;
  paymentStatus?: PaymentStatus;
  paymentVerificationStatus?: PaymentVerificationStatus;
  paymentReference?: string;
  paymentNote?: string;
  refundExchangeRequest?: string;
  sizeIssueReport?: string;
  proofReceived?: ProofReceivedStatus;
  adminInternalNote?: string;
  orderSource?: OrderSource;
  assignedStaff?: string;
  isTestOrder?: boolean;
  archivedAt?: string;
  deletedAt?: string;
  softDeletedAt?: string;
  cancelledReason?: string;
};

type AdminReviewClientRecord = {
  id: string;
  productId: string;
  productSlug: string;
  orderId?: string;
  orderReference?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  title?: string;
  body: string;
  mediaUrls: string[];
  status: "pending" | "approved" | "rejected" | "hidden";
  sourceType: "order-linked" | "customer-submitted" | "admin-added" | "imported";
  verifiedPurchase: boolean;
  isFeatured: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};

type DashboardMetrics = {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  archivedTestOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingPaymentAmount: number;
  paidRevenue: number;
  mobileWalletOrders: number;
  codOrders: number;
  bankTransferOrders: number;
};

type DashboardRangePreset =
  | "today"
  | "last7"
  | "last30"
  | "month"
  | "custom";

type DashboardRange = {
  preset: DashboardRangePreset;
  start: Date;
  end: Date;
  label: string;
};

type ChartDatum = {
  label: string;
  value: number;
  amount?: number;
};

type SettingsApiResponse = {
  settings?: AdminSettings;
  storageMode?: SettingsStorageMode;
  backendConnected?: boolean;
  message?: string;
  errors?: string[];
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  sizes: string[];
  colors: string[];
  absorbency: string;
  benefits: string[];
  care: string[];
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
  featured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  badgeText: string;
  badgeStyle: string;
  sortOrder?: number;
  lowStockThreshold?: number;
  showOnHomepage: boolean;
  showInFeaturedCollection: boolean;
  stockStatus: ProductStockStatus;
  stockQuantity?: number;
  visualTheme: ProductVisualTheme;
  visualVariant: string;
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  images: string[];
  media: unknown[];
  sectionMedia: ProductSectionMediaMap;
  descriptionMedia: ProductDescriptionMediaItem[];
  contentBlocks: ProductContentBlock[];
  colorOptions: ProductColorOption[];
  benefitItems: ProductBenefitItem[];
  faqItems: ProductFaqItem[];
  visualThemeSettings: ProductVisualThemeSettings;
  deletedAt?: string;
  deletedReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type UnknownRecord = Record<string, unknown>;

type AdminStaffClientRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: AdminRole;
  permissions: Record<AdminPermission, boolean>;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
};

type AdminActivityClientRecord = {
  id: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt?: string;
};

type DashboardSupportConversation = AdminConvSummary & {
  unread_customer_count?: number;
  updated_at?: string | null;
};

const staffRoleOptions: AdminRole[] = [
  "manager",
  "order_staff",
  "product_staff",
  "support_staff",
  "viewer",
];

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge, view: "dashboard", permission: "dashboard.view" },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, view: "orders", permission: "orders.view" },
  { label: "Products", href: "/admin/products", icon: Boxes, view: "products", permission: "products.view" },
  { label: "Reviews", href: "/admin/reviews", icon: Star, view: "reviews", permission: "reviews.view" },
  { label: "Categories", href: "/admin/categories", icon: Tag, view: "categories", permission: "categories.manage" },
  { label: "Customers", href: "/admin/customers", icon: Users, view: "customers", permission: "customers.view" },
  { label: "Support", href: "/admin/support", icon: MessageSquare, view: "support", permission: "support.view" },
  { label: "Staff", href: "/admin/staff", icon: Users, view: "staff", permission: "staff.manage", fallbackPermission: "activity.view" },
  { label: "Media", href: "/admin/media", icon: ImageIcon, view: "media", permission: "products.media", fallbackPermission: "products.view" },
  { label: "Discounts", href: "/admin/discounts", icon: Tag, view: "discounts", permission: "settings.manage", fallbackPermission: "settings.view" },
  { label: "Analytics", href: "/admin/analytics", icon: Gauge, view: "analytics", permission: "analytics.view" },
  { label: "Settings", href: "/admin/settings", icon: Settings, view: "settings", permission: "settings.view" },
  { label: "Integrations", href: "/admin/integrations", icon: Globe, view: "integrations", permission: "settings.view", fallbackPermission: "settings.editSensitive" },
  { label: "Billing", href: "/admin/billing", icon: CreditCard, view: "billing", permission: "analytics.view", fallbackPermission: "orders.view" },
] satisfies Array<{
  label: string;
  href: string;
  icon: typeof Gauge;
  view: AdminView;
  permission: AdminPermission;
  fallbackPermission?: AdminPermission;
}>;

const commandRailGroups: Array<{
  label: string;
  items: Array<{
    label: string;
    href: string;
    icon: typeof Gauge;
    view?: AdminView;
    permission?: AdminPermission;
    fallbackPermission?: AdminPermission;
    badge?: "orders" | "reviews" | "support";
    disabled?: boolean;
  }>;
}> = [
  {
    label: "Command",
    items: [
      { label: "Dashboard", href: "/admin", icon: Home, view: "dashboard", permission: "dashboard.view" },
      { label: "Orders", href: "/admin/orders", icon: ClipboardList, view: "orders", permission: "orders.view", badge: "orders" },
      { label: "Products", href: "/admin/products", icon: Boxes, view: "products", permission: "products.view" },
      { label: "Reviews", href: "/admin/reviews", icon: Star, view: "reviews", permission: "reviews.view", badge: "reviews" },
      { label: "Categories", href: "/admin/categories", icon: Tag, view: "categories", permission: "categories.manage" },
      { label: "Customers", href: "/admin/customers", icon: Users, view: "customers", permission: "customers.view" },
      { label: "Support", href: "/admin/support", icon: MessageSquare, view: "support", permission: "support.view", badge: "support" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", href: "/admin/staff", icon: Users, view: "staff", permission: "staff.manage", fallbackPermission: "activity.view" },
      { label: "Media", href: "/admin/media", icon: ImageIcon, view: "media", permission: "products.media", fallbackPermission: "products.view" },
      { label: "Discounts", href: "/admin/discounts", icon: Tag, view: "discounts", permission: "settings.manage", fallbackPermission: "settings.view" },
      { label: "Analytics", href: "/admin/analytics", icon: Gauge, view: "analytics", permission: "analytics.view" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings, view: "settings", permission: "settings.view" },
      { label: "Integrations", href: "/admin/integrations", icon: Globe, view: "integrations", permission: "settings.view", fallbackPermission: "settings.editSensitive" },
      { label: "Billing", href: "/admin/billing", icon: CreditCard, view: "billing", permission: "analytics.view", fallbackPermission: "orders.view" },
    ],
  },
];

function useAdminSoundSystem() {
  const [muted, setMuted] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastCueAtRef = useRef<Record<AdminSoundCue, number>>({
    click: 0,
    hover: 0,
    menu: 0,
    toggle: 0,
    tab: 0,
    primary: 0,
    success: 0,
    warning: 0,
    error: 0,
  });

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(ADMIN_SOUND_MUTED_KEY) !== "false");
    } catch {
      setMuted(true);
    }
  }, []);

  const setSoundMuted = useCallback((nextMuted: boolean) => {
    setMuted(nextMuted);
    try {
      window.localStorage.setItem(ADMIN_SOUND_MUTED_KEY, String(nextMuted));
    } catch {
      // Sound preference is optional.
    }
  }, []);

  const play = useCallback(
    (cue: AdminSoundCue) => {
      if (muted) return;

      const now = performance.now();
      const minimumGap = cue === "hover" ? 190 : 85;
      if (now - lastCueAtRef.current[cue] < minimumGap) return;
      lastCueAtRef.current[cue] = now;

      const assetPath = adminSoundAssetPaths[cue];
      if (assetPath) {
        const audio = new Audio(assetPath);
        audio.volume = cue === "hover" ? 0.08 : 0.16;
        void audio.play().catch(() => null);
        return;
      }

      try {
        const audioWindow = globalThis as typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        };
        const AudioContextCtor = window.AudioContext || audioWindow.webkitAudioContext;
        if (!AudioContextCtor) return;
        const context = audioContextRef.current ?? new AudioContextCtor();
        audioContextRef.current = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const frequencies: Record<AdminSoundCue, number> = {
          click: 420,
          hover: 560,
          menu: 330,
          toggle: 610,
          tab: 690,
          primary: 760,
          success: 880,
          warning: 220,
          error: 160,
        };
        const duration =
          cue === "warning" || cue === "error"
            ? 0.16
            : cue === "success" || cue === "primary"
              ? 0.18
              : 0.085;
        oscillator.type = cue === "warning" || cue === "error" ? "triangle" : "sine";
        oscillator.frequency.value = frequencies[cue];
        gain.gain.setValueAtTime(cue === "hover" ? 0.014 : cue === "primary" ? 0.04 : 0.028, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
      } catch {
        // Interaction audio is optional and should never block admin actions.
      }
    },
    [muted]
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("button,a,select,input[type='checkbox'],[role='button']");
      if (!interactive) return;
      const soundType = interactive.getAttribute("data-admin-sound");
      const cue = (
        soundType === "menu" ||
        soundType === "toggle" ||
        soundType === "tab" ||
        soundType === "primary" ||
        soundType === "success" ||
        soundType === "warning" ||
        soundType === "error"
          ? soundType
          : "click"
      ) as AdminSoundCue;
      play(cue);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-admin-hover-sound='true']")) return;
      play("hover");
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("pointerover", handlePointerOver);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("pointerover", handlePointerOver);
    };
  }, [play]);

  return { muted, setSoundMuted, play };
}

const emptyProduct: AdminProduct = {
  id: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "Reusable Period Panty",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: ["Black", "Nude", "Soft Pink"],
  absorbency: "Light",
  benefits: [],
  care: [],
  seoTitle: "",
  seoDescription: "",
  status: "Draft",
  featured: false,
  isTrending: false,
  isBestSeller: false,
  isNewArrival: false,
  badgeText: "",
  badgeStyle: "info",
  sortOrder: undefined,
  lowStockThreshold: undefined,
  showOnHomepage: true,
  showInFeaturedCollection: false,
  stockStatus: "in_stock",
  stockQuantity: undefined,
  visualTheme: "blush-violet",
  visualVariant: "default",
  imageUrl: "",
  videoUrl: "",
  posterUrl: "",
  images: [],
  media: [],
  sectionMedia: {},
  descriptionMedia: [],
  contentBlocks: [],
  colorOptions: ["Black", "Nude", "Soft Pink"].map((name, index) => ({
    ...createColorOption(name),
    id: `default-color-${index}`,
    sortOrder: index + 1,
  })),
  benefitItems: [],
  faqItems: [],
  visualThemeSettings: defaultVisualThemeSettings,
};

const defaultSettings = defaultAdminSettings;

const statusStyles: Record<OrderStatus, string> = {
  Pending: "border-amber-200/35 bg-amber-200/12 text-amber-100",
  Confirmed: "border-cyan-200/35 bg-cyan-200/12 text-cyan-100",
  Shipped: "border-violet-200/35 bg-violet-200/12 text-violet-100",
  Delivered: "border-emerald-200/35 bg-emerald-200/12 text-emerald-100",
  Cancelled: "border-rose-200/35 bg-rose-200/12 text-rose-100",
};

const statusFilterOptions = ["All", ...orderStatuses] as const;
const paymentFilterOptions = ["All", ...paymentMethods] as const;
const paymentStatusFilterOptions = ["All", ...paymentStatuses] as const;
const deliveryStatusFilterOptions = ["All", ...deliveryStatuses] as const;
const specialOrderFilterOptions = [
  "Active",
  "Include archived/test",
  "Archived only",
  "Test only",
] as const;
const orderSortOptions = [
  "Newest first",
  "Oldest first",
  "Highest total",
  "Lowest total",
] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== "string") return "Pending";
  const lower = value.toLowerCase();

  if (lower === "draft" || lower === "pending") return "Pending";

  return orderStatuses.find((status) => status.toLowerCase() === lower) ?? "Pending";
}

function normalizeDeliveryStatus(value: unknown) {
  return deliveryStatuses.includes(value as never)
    ? (value as DeliveryStatus)
    : undefined;
}

function normalizePaymentStatus(value: unknown) {
  return paymentStatuses.includes(value as never)
    ? (value as PaymentStatus)
    : undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
}

function normalizeOrder(value: unknown): StoredOrder | null {
  if (!isRecord(value)) return null;

  const orderReference = textValue(value.orderReference);
  const orderId = textValue(value.orderId) || orderReference;
  if (!orderId) return null;

  const customer = isRecord(value.customer) ? value.customer : {};
  const paymentDetails = isRecord(value.paymentDetails) ? value.paymentDetails : {};
  const totals = isRecord(value.totals) ? value.totals : {};
  const items = Array.isArray(value.items)
    ? value.items.filter(isRecord).map((item) => ({
        id: textValue(item.id),
        productId: textValue(item.productId),
        slug: textValue(item.slug),
        name: textValue(item.name),
        price: numberValue(item.price),
        size: textValue(item.size),
        color: textValue(item.color),
        absorbency: textValue(item.absorbency),
        variant: textValue(item.variant),
        quantity: numberValue(item.quantity),
      }))
    : [];

  return {
    orderId,
    orderReference,
    customerId: textValue(value.customerId),
    customer: {
      fullName: textValue(customer.fullName),
      phone: textValue(customer.phone),
      email: textValue(customer.email),
      cityArea: textValue(customer.cityArea),
      address: textValue(customer.address),
      sizeFitNote: textValue(customer.sizeFitNote),
      deliveryNote: textValue(customer.deliveryNote),
    },
    paymentDetails: {
      paymentMethod: textValue(paymentDetails.paymentMethod),
      walletProvider: textValue(paymentDetails.walletProvider),
      paymentType: textValue(paymentDetails.paymentType),
      receiverNumber: textValue(paymentDetails.receiverNumber),
      walletSenderNumber: textValue(paymentDetails.walletSenderNumber),
      transactionReference: textValue(paymentDetails.transactionReference),
    },
    items,
    totals: {
      totalItems: numberValue(totals.totalItems),
      subtotal: numberValue(totals.subtotal),
    },
    totalAmount: numberValue(value.totalAmount),
    status: normalizeStatus(value.status),
    createdAt: textValue(value.createdAt),
    courierName: textValue(value.courierName),
    trackingId: textValue(value.trackingId),
    deliveryStatus: normalizeDeliveryStatus(value.deliveryStatus),
    deliveryCharge: numberValue(value.deliveryCharge),
    deliveryArea: textValue(value.deliveryArea),
    deliveryZone: textValue(value.deliveryZone),
    deliveryNote: textValue(value.deliveryNote),
    customerConfirmationNote: textValue(value.customerConfirmationNote),
    paymentStatus: normalizePaymentStatus(value.paymentStatus),
    paymentVerificationStatus: paymentVerificationStatuses.includes(
      value.paymentVerificationStatus as never
    )
      ? (value.paymentVerificationStatus as PaymentVerificationStatus)
      : undefined,
    paymentReference: textValue(value.paymentReference),
    paymentNote: textValue(value.paymentNote),
    refundExchangeRequest: textValue(value.refundExchangeRequest),
    sizeIssueReport: textValue(value.sizeIssueReport),
    proofReceived: proofReceivedStatuses.includes(value.proofReceived as never)
      ? (value.proofReceived as ProofReceivedStatus)
      : undefined,
    adminInternalNote: textValue(value.adminInternalNote),
    orderSource: orderSources.includes(value.orderSource as never)
      ? (value.orderSource as OrderSource)
      : undefined,
    assignedStaff: textValue(value.assignedStaff),
    isTestOrder: booleanValue(value.isTestOrder),
    archivedAt: textValue(value.archivedAt),
    deletedAt: textValue(value.deletedAt),
    softDeletedAt: textValue(value.softDeletedAt),
    cancelledReason: textValue(value.cancelledReason),
  };
}

function orderReferenceKey(order: StoredOrder) {
  return order.orderReference || order.orderId;
}

function normalizeAdminProduct(value: unknown): AdminProduct | null {
  if (!isRecord(value)) return null;

  const name = textValue(value.name);
  const slug = textValue(value.slug);
  if (!name || !slug) return null;

  const visualTheme = visualThemes.includes(value.visualTheme as ProductVisualTheme)
    ? (value.visualTheme as ProductVisualTheme)
    : "blush-violet";
  const colors = stringArrayValue(value.colors);
  const media = Array.isArray(value.media) ? value.media : [];
  const cms = extractProductCmsContent(media, colors);

  return {
    id: textValue(value.id) || `admin-product-${slug}`,
    name,
    slug,
    shortDescription: textValue(value.shortDescription) || "",
    description: textValue(value.description) || "",
    price: textValue(value.price) || "",
    compareAtPrice: textValue(value.compareAtPrice) || "",
    category: textValue(value.category) || "",
    sizes: stringArrayValue(value.sizes),
    colors,
    absorbency: textValue(value.absorbency) || "",
    benefits: stringArrayValue(value.benefits),
    care: stringArrayValue(value.care),
    seoTitle: textValue(value.seoTitle) || "",
    seoDescription: textValue(value.seoDescription) || "",
    status: value.status === "Active" || value.status === "active" ? "Active" : "Draft",
    featured: Boolean(value.featured),
    isTrending: Boolean(value.isTrending),
    isBestSeller: Boolean(value.isBestSeller),
    isNewArrival: Boolean(value.isNewArrival),
    badgeText: textValue(value.badgeText) || "",
    badgeStyle: textValue(value.badgeStyle) || "info",
    sortOrder: numberValue(value.sortOrder),
    lowStockThreshold: numberValue(value.lowStockThreshold),
    showOnHomepage: value.showOnHomepage !== false,
    showInFeaturedCollection:
      booleanValue(value.showInFeaturedCollection) ?? Boolean(value.featured),
    stockStatus: stockStatuses.includes(value.stockStatus as ProductStockStatus)
      ? (value.stockStatus as ProductStockStatus)
      : "in_stock",
    stockQuantity: numberValue(value.stockQuantity) || undefined,
    visualTheme,
    visualVariant: textValue(value.visualVariant) || visualTheme,
    imageUrl: textValue(value.imageUrl) || "",
    videoUrl: textValue(value.videoUrl) || "",
    posterUrl: textValue(value.posterUrl) || "",
    images: stringArrayValue(value.images),
    media,
    sectionMedia: isRecord(value.sectionMedia)
      ? extractProductCmsContent(
          buildProductCmsMedia(media, { ...cms, sectionMedia: value.sectionMedia }),
          colors
        ).sectionMedia
      : cms.sectionMedia,
    descriptionMedia: Array.isArray(value.descriptionMedia)
      ? extractProductCmsContent(
          buildProductCmsMedia(media, {
            ...cms,
            descriptionMedia: value.descriptionMedia as ProductDescriptionMediaItem[],
          }),
          colors
        ).descriptionMedia
      : cms.descriptionMedia,
    contentBlocks: Array.isArray(value.contentBlocks) ? extractProductCmsContent(buildProductCmsMedia(media, { ...cms, contentBlocks: value.contentBlocks as ProductContentBlock[] }), colors).contentBlocks : cms.contentBlocks,
    colorOptions: Array.isArray(value.colorOptions) ? extractProductCmsContent(buildProductCmsMedia(media, { ...cms, colorOptions: value.colorOptions as ProductColorOption[] }), colors).colorOptions : cms.colorOptions,
    benefitItems: Array.isArray(value.benefitItems) ? extractProductCmsContent(buildProductCmsMedia(media, { ...cms, benefitItems: value.benefitItems as ProductBenefitItem[] }), colors).benefitItems : cms.benefitItems,
    faqItems: Array.isArray(value.faqItems) ? extractProductCmsContent(buildProductCmsMedia(media, { ...cms, faqItems: value.faqItems as ProductFaqItem[] }), colors).faqItems : cms.faqItems,
    visualThemeSettings: isRecord(value.visualThemeSettings)
      ? extractProductCmsContent(
          buildProductCmsMedia(media, { ...cms, visualThemeSettings: value.visualThemeSettings as ProductVisualThemeSettings }),
          colors
        ).visualThemeSettings
      : cms.visualThemeSettings,
    deletedAt: textValue(value.deletedAt),
    deletedReason: textValue(value.deletedReason),
    createdAt: textValue(value.createdAt),
    updatedAt: textValue(value.updatedAt),
  };
}

function productSeed(): AdminProduct[] {
  return seedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    category: product.category,
    sizes: product.sizes,
    colors: product.colors,
    absorbency: product.absorbency,
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    status: "Active",
    featured: true,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: false,
    badgeText: "",
    badgeStyle: "info",
    sortOrder: undefined,
    lowStockThreshold: undefined,
    showOnHomepage: true,
    showInFeaturedCollection: true,
    stockStatus: "in_stock",
    stockQuantity: undefined,
    visualTheme: product.visualTheme,
    visualVariant: product.visualTheme,
    imageUrl: "",
    videoUrl: "",
    posterUrl: "",
    images: [],
    media: [],
    sectionMedia: {},
    descriptionMedia: [],
    contentBlocks: [],
    colorOptions: product.colors.map((name, index) => ({
      ...createColorOption(name),
      id: `seed-color-${product.id}-${index}`,
      sortOrder: index + 1,
    })),
    benefitItems: [],
    faqItems: [],
    visualThemeSettings: defaultVisualThemeSettings,
    deletedAt: undefined,
    deletedReason: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  }));
}

function readOrdersFromStorage() {
  const orders: StoredOrder[] = [];
  const seen = new Set<string>();

  const pushOrder = (value: unknown) => {
    const order = normalizeOrder(value);
    if (!order) return;
    const key = orderReferenceKey(order);
    if (seen.has(key)) return;
    seen.add(key);
    orders.push(order);
  };

  try {
    const savedOrders = localStorage.getItem(DRAFT_ORDERS_KEY);
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders) as unknown;
      if (Array.isArray(parsed)) parsed.forEach(pushOrder);
    }

    const latestOrder = localStorage.getItem(LATEST_DRAFT_ORDER_KEY);
    if (latestOrder) pushOrder(JSON.parse(latestOrder) as unknown);
  } catch (error) {
    console.error("Failed to load admin orders:", error);
  }

  return orders.sort((a, b) => {
    const first = a.createdAt ? Date.parse(a.createdAt) : 0;
    const second = b.createdAt ? Date.parse(b.createdAt) : 0;
    return second - first;
  });
}

function mergeOrders(apiOrders: StoredOrder[], localOrders: StoredOrder[]) {
  const merged: StoredOrder[] = [];
  const seen = new Set<string>();

  [...apiOrders, ...localOrders].forEach((order) => {
    const key = orderReferenceKey(order);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(order);
  });

  return merged.sort((a, b) => {
    const first = a.createdAt ? Date.parse(a.createdAt) : 0;
    const second = b.createdAt ? Date.parse(b.createdAt) : 0;
    return second - first;
  });
}

async function readOrdersFromApi() {
  try {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload) || !Array.isArray(payload.orders)) return null;

    const orders = payload.orders
      .map(normalizeOrder)
      .filter((order): order is StoredOrder => Boolean(order));

    return orders;
  } catch (error) {
    console.error("Failed to load backend orders:", error);
    return null;
  }
}

async function updateOrderStatusInApi(orderId: string, status: OrderStatus) {
  return updateOrderOperationsInApi(orderId, { status });
}

async function updateOrderOperationsInApi(
  orderId: string,
  updates: OrderOperationsUpdate
) {
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload)) return null;

    return normalizeOrder(payload.order);
  } catch (error) {
    console.error("Failed to update backend order operations:", error);
    return null;
  }
}

function priceTextToNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalPriceTextToNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/[^0-9.]+/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatAdminPrice(value?: number) {
  if (typeof value !== "number") return "";
  return formatCurrency(value);
}

function storeStatus(status: ProductStatus): StoreProductStatus {
  return status === "Active" ? "active" : "draft";
}

function adminStatus(status: StoreProductStatus): ProductStatus {
  return status === "active" ? "Active" : "Draft";
}

function productToApiPayload(product: AdminProduct) {
  const cms = {
    sectionMedia: product.sectionMedia,
    descriptionMedia: product.descriptionMedia,
    contentBlocks: product.contentBlocks,
    colorOptions: product.colorOptions,
    benefitItems: product.benefitItems,
    faqItems: product.faqItems,
    visualThemeSettings: product.visualThemeSettings,
  };

  return {
    id: product.id,
    name: product.name,
    slug: slugify(product.slug),
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category,
    price: priceTextToNumber(product.price),
    compareAtPrice: optionalPriceTextToNumber(product.compareAtPrice),
    currency: SITE_CURRENCY,
    status: storeStatus(product.status),
    featured: product.featured,
    isTrending: product.isTrending,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    badgeText: product.badgeText,
    badgeStyle: product.badgeStyle,
    sortOrder: product.sortOrder,
    lowStockThreshold: product.lowStockThreshold,
    showOnHomepage: product.showOnHomepage,
    showInFeaturedCollection: product.showInFeaturedCollection,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    sizes: product.sizes,
    colors: product.colorOptions.length > 0
      ? product.colorOptions.map((color) => color.name).filter(Boolean)
      : product.colors,
    absorbency: product.absorbency,
    absorbencyOptions: product.absorbency ? [product.absorbency] : [],
    visual: product.visualTheme,
    visualTheme: product.visualTheme,
    visualVariant: product.visualVariant,
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    imageUrl: product.imageUrl,
    videoUrl: product.videoUrl,
    posterUrl: product.posterUrl,
    images: product.images,
    media: buildProductCmsMedia(product.media, cms),
  };
}

function apiProductToAdminProduct(product: ProductCatalogItem): AdminProduct {
  const media = Array.isArray(product.media) ? product.media : [];
  const cms = extractProductCmsContent(media, product.colors);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: formatAdminPrice(product.price),
    compareAtPrice: formatAdminPrice(product.compareAtPrice),
    category: product.category,
    sizes: product.sizes,
    colors: product.colors,
    absorbency: product.absorbency,
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    status: adminStatus(product.status),
    featured: product.featured,
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    badgeText: product.badgeText ?? "",
    badgeStyle: product.badgeStyle ?? "info",
    sortOrder: product.sortOrder,
    lowStockThreshold: product.lowStockThreshold,
    showOnHomepage: product.showOnHomepage !== false,
    showInFeaturedCollection:
      product.showInFeaturedCollection ?? Boolean(product.featured),
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    visualTheme: product.visualTheme,
    visualVariant: product.visualVariant ?? product.visualTheme,
    imageUrl: product.imageUrl ?? "",
    videoUrl: product.videoUrl ?? "",
    posterUrl: product.posterUrl ?? "",
    images: Array.isArray(product.images)
      ? (product.images as unknown[]).filter((u): u is string => typeof u === "string")
      : [],
    media,
    sectionMedia: cms.sectionMedia,
    descriptionMedia: cms.descriptionMedia,
    contentBlocks: cms.contentBlocks,
    colorOptions: cms.colorOptions,
    benefitItems: cms.benefitItems,
    faqItems: cms.faqItems,
    visualThemeSettings: cms.visualThemeSettings,
    deletedAt: product.deletedAt,
    deletedReason: product.deletedReason,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function readProductsFromApi() {
  try {
    const [adminResponse, deletedResponse] = await Promise.all([
      fetch("/api/products?scope=admin", { cache: "no-store" }),
      fetch("/api/products?scope=deleted", { cache: "no-store" }),
    ]);
    if (!adminResponse.ok || !deletedResponse.ok) return null;

    const [adminPayload, deletedPayload] = (await Promise.all([
      adminResponse.json(),
      deletedResponse.json(),
    ])) as [unknown, unknown];
    if (
      !isRecord(adminPayload) ||
      !Array.isArray(adminPayload.products) ||
      !isRecord(deletedPayload) ||
      !Array.isArray(deletedPayload.products)
    ) {
      return null;
    }

    const products = [
      ...adminPayload.products.map(apiProductToAdminProduct),
      ...deletedPayload.products.map(apiProductToAdminProduct),
    ];
    const seen = new Set<string>();
    return products.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  } catch (error) {
    console.error("Failed to load backend products:", error);
    return null;
  }
}

async function readReviewsFromApi() {
  try {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as {
      reviews?: AdminReviewClientRecord[];
      errors?: string[];
    } | null;
    if (!response.ok || !Array.isArray(payload?.reviews)) return null;
    return payload.reviews;
  } catch (error) {
    console.error("Failed to load backend reviews:", error);
    return null;
  }
}

async function updateReviewInApi(
  updates: Pick<AdminReviewClientRecord, "id"> &
    Partial<
      Pick<
        AdminReviewClientRecord,
        | "productId"
        | "productSlug"
        | "customerName"
        | "rating"
        | "title"
        | "body"
        | "mediaUrls"
        | "status"
        | "sourceType"
        | "isFeatured"
        | "adminNote"
        | "createdAt"
      >
    >
) {
  const response = await fetch("/api/admin/reviews", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json().catch(() => null)) as {
    review?: AdminReviewClientRecord;
    errors?: string[];
  } | null;
  if (!response.ok || !payload?.review) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin review update failed", { updates, payload });
    }
    throw new Error(payload?.errors?.[0] ?? "Review could not be updated.");
  }
  return payload.review;
}

async function createReviewInApi(
  review: Pick<
    AdminReviewClientRecord,
    | "productId"
    | "productSlug"
    | "customerName"
    | "rating"
    | "title"
    | "body"
    | "mediaUrls"
    | "status"
    | "sourceType"
    | "isFeatured"
    | "adminNote"
    | "createdAt"
  >
) {
  const response = await fetch("/api/admin/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(review),
  });
  const payload = (await response.json().catch(() => null)) as {
    review?: AdminReviewClientRecord;
    errors?: string[];
  } | null;
  if (!response.ok || !payload?.review) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin review create failed", { review, payload });
    }
    throw new Error(payload?.errors?.[0] ?? "Review could not be created.");
  }
  return payload.review;
}

async function deleteReviewInApi(id: string) {
  const response = await fetch("/api/admin/reviews", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const payload = (await response.json().catch(() => null)) as {
    errors?: string[];
  } | null;
  if (!response.ok) {
    throw new Error(payload?.errors?.[0] ?? "Review could not be deleted.");
  }
  return true;
}

function apiErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;

  const parts: string[] = [];

  if (Array.isArray(payload.errors)) {
    const errors = payload.errors.filter((error): error is string => typeof error === "string");
    if (errors.length > 0) parts.push(...errors);
  }

  if (isRecord(payload.fields)) {
    const fieldMessages = Object.entries(payload.fields)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([field, msg]) => `${field}: ${msg}`);
    if (fieldMessages.length > 0) parts.push(fieldMessages.join(" | "));
  }

  if (parts.length > 0) return parts.join(" ");
  return textValue(payload.detail) || fallback;
}

async function saveProductToApi(product: AdminProduct, exists: boolean) {
  const response = await fetch(
    exists ? `/api/products/${encodeURIComponent(product.id)}` : "/api/products",
    {
      method: exists ? "PATCH" : "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(productToApiPayload(product)),
    }
  );

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, "Product could not be saved."));
  }

  if (!isRecord(payload) || !isRecord(payload.product)) {
    throw new Error("Product save did not return a saved product.");
  }

  return apiProductToAdminProduct(payload.product as ProductCatalogItem);
}

async function deleteProductInApi(productId: string) {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, "Product could not be deleted."));
  }

  if (!isRecord(payload) || !isRecord(payload.product)) {
    throw new Error("Product delete did not return a deleted product.");
  }

  return apiProductToAdminProduct(payload.product as ProductCatalogItem);
}

async function restoreProductInApi(productId: string) {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "restore" }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, "Product could not be restored."));
  }

  if (!isRecord(payload) || !isRecord(payload.product)) {
    throw new Error("Product restore did not return a saved product.");
  }

  return apiProductToAdminProduct(payload.product as ProductCatalogItem);
}

async function permanentlyDeleteProductInApi(productId: string) {
  const response = await fetch(
    `/api/products/${encodeURIComponent(productId)}?permanent=1`,
    {
      method: "DELETE",
    }
  );

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, "Product could not be permanently deleted."));
  }

  if (!isRecord(payload) || payload.deleted !== true) {
    throw new Error("Product permanent delete did not complete.");
  }

  return true;
}

function writeOrdersToStorage(orders: StoredOrder[]) {
  localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(orders));

  const latestStored = localStorage.getItem(LATEST_DRAFT_ORDER_KEY);
  if (!latestStored) return;

  try {
    const latest = normalizeOrder(JSON.parse(latestStored) as unknown);
    const latestKey = latest ? orderReferenceKey(latest) : undefined;
    const updatedLatest = orders.find(
      (order) => latestKey && orderReferenceKey(order) === latestKey
    );
    if (updatedLatest) {
      localStorage.setItem(LATEST_DRAFT_ORDER_KEY, JSON.stringify(updatedLatest));
    }
  } catch {
    localStorage.setItem(LATEST_DRAFT_ORDER_KEY, JSON.stringify(orders[0] ?? null));
  }
}

function readProductsFromStorage() {
  try {
    const stored = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        const products = parsed.map(normalizeAdminProduct).filter((item): item is AdminProduct => Boolean(item));
        if (products.length > 0) return products;
      }
    }
  } catch (error) {
    console.error("Failed to load admin products:", error);
  }

  const seeded = productSeed();
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeProductsToStorage(products: AdminProduct[]) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

function readSettingsFromStorage() {
  try {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      return normalizeAdminSettings(JSON.parse(stored) as unknown);
    }
  } catch (error) {
    console.error("Failed to load admin settings:", error);
  }

  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
}

function writeSettingsToStorage(settings: AdminSettings) {
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}

// Returns true when Supabase has no saved homepage media (column missing or all empty).
// Used to avoid overwriting localStorage-persisted media URLs with Supabase defaults.
function isDefaultHomepageMediaSettings(hms: HomepageMediaSettings): boolean {
  return (
    !hms.heroMedia.imageUrl &&
    !hms.heroMedia.videoUrl &&
    hms.heroMedia.mode === "animation" &&
    !hms.careMedia.imageUrl &&
    !hms.careMedia.videoUrl &&
    hms.careMedia.mode === "animation" &&
    !hms.experienceMedia.imageUrl &&
    !hms.experienceMedia.videoUrl &&
    hms.experienceMedia.mode === "animation" &&
    !hms.categoryReusablePeriodCareImageUrl &&
    !hms.categoryComfortPantyImageUrl &&
    !hms.categorySoftSupportBraImageUrl &&
    !hms.categoryNightwearImageUrl &&
    !hms.categoryHygieneEssentialsImageUrl &&
    !hms.categoryBundlesImageUrl &&
    !hms.categoryNewArrivalsImageUrl &&
    !hms.whatsappWidgetEnabled &&
    !hms.layerComfortImageUrl &&
    !hms.layerComfortVideoUrl
  );
}

async function readSettingsFromApi() {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const payload = (await response.json()) as SettingsApiResponse;

    if (!payload.settings) return null;
    const localSettings = readSettingsFromStorage();
    const backendConnected = Boolean(payload.backendConnected);

    // When backend is not connected, payload.settings holds hardcoded defaults.
    // Merging defaults over local settings would wipe locally-saved values.
    // For homepageMediaSettings: if Supabase returns all-default values (column
    // missing or genuinely empty), preserve the localStorage version so that
    // uploaded URLs and configured modes are not wiped on refresh.
    const mergedSettings = backendConnected
      ? normalizeAdminSettings({
          ...localSettings,
          ...payload.settings,
          homepageMediaSettings: isDefaultHomepageMediaSettings(
            payload.settings.homepageMediaSettings
          )
            ? localSettings.homepageMediaSettings
            : payload.settings.homepageMediaSettings,
        })
      : localSettings;

    return {
      settings: mergedSettings,
      storageMode: payload.storageMode ?? (backendConnected ? "supabase" : "fallback-default"),
      backendConnected,
      message: payload.message,
    };
  } catch (error) {
    console.error("Failed to load backend settings:", error);
    return null;
  }
}

async function saveSettingsToApi(settings: AdminSettings) {
  let response: Response;
  let payload: SettingsApiResponse;

  try {
    response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(settings),
    });
    payload = (await response.json()) as SettingsApiResponse;
  } catch (error) {
    console.error("Failed to save backend settings:", error);
    return {
      settings: null,
      storageMode: "fallback-error" as SettingsStorageMode,
      backendConnected: false,
      message:
        "Settings backend not connected. Local fallback was updated only.",
    };
  }

  if (!response.ok || !payload.settings) {
    return {
      settings: null,
      storageMode: payload.storageMode ?? "fallback-error",
      backendConnected: false,
      message:
        payload.errors?.[0] ||
        "Settings backend not connected. Local fallback was updated only.",
    };
  }

  return {
    settings: normalizeAdminSettings({ ...settings, ...payload.settings }),
    storageMode: payload.storageMode ?? "supabase",
    backendConnected: Boolean(payload.backendConnected),
    message: payload.message,
  };
}

function orderTotal(order: StoredOrder) {
  return order.totalAmount ?? order.totals.subtotal ?? 0;
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeOrderAge(value?: string) {
  if (!value) return "timing not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "timing not recorded";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isToday(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDashboardRange(
  preset: DashboardRangePreset,
  customStart: string,
  customEnd: string
): DashboardRange {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);

  if (preset === "last7") {
    return {
      preset,
      start: addDays(todayStart, -6),
      end: todayEnd,
      label: "Last 7 days",
    };
  }

  if (preset === "last30") {
    return {
      preset,
      start: addDays(todayStart, -29),
      end: todayEnd,
      label: "Last 30 days",
    };
  }

  if (preset === "month") {
    return {
      preset,
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: todayEnd,
      label: "This month",
    };
  }

  if (preset === "custom") {
    const parsedStart = parseDateInput(customStart);
    const parsedEnd = parseDateInput(customEnd);
    const start = parsedStart ? startOfLocalDay(parsedStart) : todayStart;
    const end = parsedEnd ? endOfLocalDay(parsedEnd) : todayEnd;
    const safeStart = start.getTime() <= end.getTime() ? start : end;
    const safeEnd = start.getTime() <= end.getTime() ? end : endOfLocalDay(start);

    return {
      preset,
      start: safeStart,
      end: safeEnd,
      label: "Custom range",
    };
  }

  return {
    preset: "today",
    start: todayStart,
    end: todayEnd,
    label: "Today",
  };
}

function isWithinDashboardRange(value: string | undefined, range: DashboardRange) {
  if (!value) return false;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return false;
  return time >= range.start.getTime() && time <= range.end.getTime();
}

function dayKey(date: Date) {
  return dateInputValue(date);
}

function shortDayLabel(key: string) {
  const date = parseDateInput(key);
  if (!date) return key;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function buildDailySeries(orders: StoredOrder[], range: DashboardRange) {
  const days: ChartDatum[] = [];
  const cursor = startOfLocalDay(range.start);
  const end = startOfLocalDay(range.end);

  while (cursor.getTime() <= end.getTime() && days.length < 62) {
    days.push({ label: shortDayLabel(dayKey(cursor)), value: 0, amount: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayIndex = new Map<string, ChartDatum>();
  const indexCursor = startOfLocalDay(range.start);
  for (const item of days) {
    dayIndex.set(dayKey(indexCursor), item);
    indexCursor.setDate(indexCursor.getDate() + 1);
  }

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime())) return;
    const item = dayIndex.get(dayKey(created));
    if (!item) return;
    item.value += 1;
    if (order.status !== "Cancelled") item.amount = (item.amount ?? 0) + orderTotal(order);
  });

  return days;
}

function countBy<T extends string>(values: readonly T[], rows: T[]) {
  return values.map((value) => ({
    label: value.replace(/_/g, " "),
    value: rows.filter((row) => row === value).length,
  }));
}

function listToText(values: string[]) {
  return values.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToLines(values: string[]) {
  return values.join("\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function itemVariantSummary(item: StoredOrderItem) {
  return item.variant || [item.size, item.color, item.absorbency].filter(Boolean).join(" / ");
}

function mainItemSummary(order: StoredOrder) {
  if (order.items.length === 0) return "No item recorded";

  const [firstItem, ...restItems] = order.items;
  const quantity = firstItem.quantity ?? 0;
  const more = restItems.length > 0 ? ` +${restItems.length} more` : "";
  return `${firstItem.name ?? "Unnamed item"} x ${quantity}${more}`;
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function exportOrdersCsv(orders: StoredOrder[]) {
  const headers = [
    "order_reference",
    "created_date",
    "customer_name",
    "phone",
    "city_area",
    "delivery_address",
    "items_summary",
    "total",
    "payment_method",
    "order_status",
    "delivery_status",
    "courier_name",
    "tracking_id",
  ];
  const rows = orders.map((order) => [
    orderReferenceKey(order),
    order.createdAt ?? "",
    order.customer.fullName ?? "",
    order.customer.phone ?? "",
    order.customer.cityArea ?? "",
    order.customer.address ?? "",
    order.items
      .map((item) => `${item.name ?? "Item"} x ${item.quantity ?? 0}`)
      .join("; "),
    orderTotal(order),
    order.paymentDetails.paymentMethod ?? "",
    order.status,
    order.deliveryStatus ?? "",
    order.courierName ?? "",
    order.trackingId ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aevyrixa-orders-${dateInputValue(new Date())}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function orderSearchText(order: StoredOrder) {
  return [
    orderReferenceKey(order),
    order.orderId,
    order.customer.fullName,
    order.customer.phone,
    order.paymentDetails.transactionReference,
    order.paymentReference,
    order.trackingId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function productSearchText(product: AdminProduct) {
  return [
    product.name,
    product.slug,
    product.category,
    product.absorbency,
    product.visualVariant,
    product.visualTheme,
    product.stockStatus.replace(/_/g, " "),
    product.stockStatus,
    product.status,
    product.price,
    product.compareAtPrice,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterAndSortOrders(
  orders: StoredOrder[],
  searchTerm: string,
  statusFilter: StatusFilter,
  paymentFilter: PaymentFilter,
  paymentStatusFilter: PaymentStatusFilter,
  deliveryStatusFilter: DeliveryStatusFilter,
  specialFilter: SpecialOrderFilter,
  sortOrder: OrderSort
) {
  const query = searchTerm.trim().toLowerCase();

  return orders
    .filter((order) => {
      const matchesSearch = !query || orderSearchText(order).includes(query);
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All" || order.paymentDetails.paymentMethod === paymentFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "All" || order.paymentStatus === paymentStatusFilter;
      const matchesDeliveryStatus =
        deliveryStatusFilter === "All" || order.deliveryStatus === deliveryStatusFilter;
      const isArchived = Boolean(order.archivedAt);
      const isDeleted = Boolean(order.deletedAt || order.softDeletedAt);
      const isTest = Boolean(order.isTestOrder);
      const matchesSpecial =
        specialFilter === "Include archived/test"
          ? !isDeleted
          : specialFilter === "Archived only"
            ? isArchived && !isDeleted
            : specialFilter === "Test only"
              ? isTest && !isDeleted
              : !isArchived && !isTest && !isDeleted;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesPaymentStatus &&
        matchesDeliveryStatus &&
        matchesSpecial
      );
    })
    .sort((a, b) => {
      if (sortOrder === "Highest total") return orderTotal(b) - orderTotal(a);
      if (sortOrder === "Lowest total") return orderTotal(a) - orderTotal(b);

      const first = a.createdAt ? Date.parse(a.createdAt) : 0;
      const second = b.createdAt ? Date.parse(b.createdAt) : 0;
      return sortOrder === "Oldest first" ? first - second : second - first;
    });
}

function buildOrderSummary(order: StoredOrder) {
  return [
    `Order: ${orderReferenceKey(order)}`,
    `Status: ${order.status}`,
    `Customer: ${order.customer.fullName ?? "Not provided"}`,
    `Phone: ${order.customer.phone ?? "Not provided"}`,
    `City/Area: ${order.customer.cityArea ?? "Not provided"}`,
    `Address: ${order.customer.address ?? "Not provided"}`,
    `Payment: ${order.paymentDetails.paymentMethod ?? "Not provided"}`,
    `Reference: ${order.paymentDetails.transactionReference ?? "Not provided"}`,
    `Total: ${formatCurrency(orderTotal(order))}`,
    `Items: ${order.items
      .map((item) => {
        const variants = itemVariantSummary(item);
        return `${item.name ?? "Unnamed item"}${variants ? ` (${variants})` : ""} x ${
          item.quantity ?? 0
        }`;
      })
      .join(", ") || "Not recorded"}`,
  ].join("\n");
}

function buildCustomerContact(order: StoredOrder) {
  return [
    order.customer.fullName,
    order.customer.phone,
    order.customer.email,
    order.customer.cityArea,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDeliveryAddress(order: StoredOrder) {
  return [
    order.customer.fullName,
    order.customer.phone,
    order.customer.cityArea,
    order.customer.address,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPaymentSummary(order: StoredOrder) {
  return [
    `Payment method: ${order.paymentDetails.paymentMethod ?? "Not provided"}`,
    `Wallet provider: ${order.paymentDetails.walletProvider ?? "Not provided"}`,
    `Payment type: ${order.paymentDetails.paymentType ?? "Not provided"}`,
    `Receiver number: ${order.paymentDetails.receiverNumber ?? "Not provided"}`,
    `Sender number: ${order.paymentDetails.walletSenderNumber ?? "Not provided"}`,
    `Transaction/reference ID: ${order.paymentDetails.transactionReference ?? "Not provided"}`,
    `Total: ${formatCurrency(orderTotal(order))}`,
  ].join("\n");
}

export default function AdminPanel({
  view,
  initialSession,
}: {
  view: AdminView;
  initialSession: AdminSessionUser;
}) {
  const router = useRouter();
  const [session] = useState<AdminSessionUser>(initialSession);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [reviews, setReviews] = useState<AdminReviewClientRecord[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [settingsStorageMode, setSettingsStorageMode] =
    useState<SettingsStorageMode>("fallback-default");
  const [settingsBackendMessage, setSettingsBackendMessage] = useState(
    "Settings backend not connected. Using safe local fallback."
  );
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [commandQuery, setCommandQuery] = useState("");
  const adminSound = useAdminSoundSystem();
  const activeSectionTitle = viewTitle(view);
  const visibleNavItems = navItems.filter((item) => canAccessSection(session, item.view));
  const pendingOrderCount = orders.filter((order) => order.status === "Pending").length;
  const pendingReviewCount = reviews.filter((review) => review.status === "pending").length;
  const activeProductCount = adminProducts.filter((product) => !product.deletedAt).length;
  const commandRailVisibleGroups = commandRailGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.disabled) return true;
        if (!item.permission || !item.view) return true;
        return canAccessSection(session, item.view) || (item.fallbackPermission ? hasPermission(session, item.fallbackPermission) : false);
      }),
    }))
    .filter((group) => group.items.length > 0);
  const liveSignals = [
    { label: "Orders", value: String(orders.length), tone: "cyan" },
    { label: "Products", value: String(adminProducts.filter((product) => !product.deletedAt).length), tone: "violet" },
    { label: "Reviews", value: String(reviews.length), tone: "rose" },
    { label: "Support", value: supportUnreadCount > 99 ? "99+" : String(supportUnreadCount), tone: "amber" },
  ];

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const canLoadSettings =
        hasPermission(session, "settings.view") ||
        hasPermission(session, "settings.editBasic") ||
        hasPermission(session, "settings.editSensitive") ||
        hasPermission(session, "settings.editSeoAnalytics") ||
        hasPermission(session, "homepage.manage") ||
        hasPermission(session, "categories.manage");
      const canLoadOrders = hasPermission(session, "orders.view");
      const canLoadProducts = hasPermission(session, "products.view");
      const canLoadReviews = hasPermission(session, "reviews.view");
      const canLoadSupport = hasPermission(session, "support.view");

      if (canLoadSettings) {
        setSettings(readSettingsFromStorage());
      }
      setIsLoaded(true);

      if (canLoadSettings) {
        void readSettingsFromApi().then((backendSettings) => {
          if (!backendSettings) return;

          setSettings(backendSettings.settings);
          setSettingsStorageMode(backendSettings.storageMode);
          setSettingsBackendMessage(
            backendSettings.message ||
              (backendSettings.backendConnected
                ? "Settings are connected to Supabase."
                : "Settings backend not connected. Using safe fallback defaults.")
          );
          writeSettingsToStorage(backendSettings.settings);
        });
      }

      if (canLoadOrders) {
        const localOrders = readOrdersFromStorage();
        setOrders(localOrders);

        void readOrdersFromApi().then((backendOrders) => {
          const latestLocalOrders = readOrdersFromStorage();

          // Temporary no-database bridge: merge API demo-memory with the browser
          // fallback so checkout-submitted orders remain visible until the real
          // Supabase/Postgres order table replaces localStorage in the next phase.
          const nextOrders = backendOrders
            ? mergeOrders(backendOrders, latestLocalOrders)
            : latestLocalOrders;

          setOrders(nextOrders);
          writeOrdersToStorage(nextOrders);
        });
      }

      if (canLoadProducts) {
        void readProductsFromApi().then((backendProducts) => {
          if (!backendProducts) {
            setAdminProducts(readProductsFromStorage());
            return;
          }
          setAdminProducts(backendProducts);
          writeProductsToStorage(backendProducts);
        });
      }

      if (canLoadReviews) {
        void readReviewsFromApi().then((backendReviews) => {
          if (backendReviews) setReviews(backendReviews);
        });
      }

      if (canLoadSupport) {
        void fetch("/api/admin/support/conversations", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : null))
          .then((payload: { conversations?: DashboardSupportConversation[] } | null) => {
            if (!Array.isArray(payload?.conversations)) return;
            setSupportUnreadCount(
              payload.conversations.reduce(
                (sum, conversation) => sum + (conversation.unread_customer_count ?? 0),
                0
              )
            );
          })
          .catch(() => null);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [session]);

  useEffect(() => {
    if (!hasPermission(session, "support.view")) return;

    const interval = window.setInterval(() => {
      void fetch("/api/admin/support/conversations", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { conversations?: DashboardSupportConversation[] } | null) => {
          if (!Array.isArray(payload?.conversations)) return;
          setSupportUnreadCount(
            payload.conversations.reduce(
              (sum, conversation) => sum + (conversation.unread_customer_count ?? 0),
              0
            )
          );
        })
        .catch(() => null);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const updateOrderStatus = (orderKey: string, status: OrderStatus) => {
    if (!hasPermission(session, "orders.editStatus")) return;
    setOrders((current) => {
      const nextOrders = current.map((order) =>
        orderReferenceKey(order) === orderKey || order.orderId === orderKey
          ? { ...order, status }
          : order
      );
      writeOrdersToStorage(nextOrders);
      return nextOrders;
    });

    void updateOrderStatusInApi(orderKey, status).then((backendOrder) => {
      if (!backendOrder) return;

      setOrders((current) => {
        const nextOrders = current.map((order) =>
          orderReferenceKey(order) === orderKey || order.orderId === orderKey
            ? { ...order, ...backendOrder }
            : order
        );
        writeOrdersToStorage(nextOrders);
        return nextOrders;
      });
    });
  };

  const updateOrderOperations = async (
    orderKey: string,
    updates: OrderOperationsUpdate
  ) => {
    if (
      (("archivedAt" in updates || "isTestOrder" in updates) &&
        !hasPermission(session, "orders.archiveTest")) ||
      (("courierName" in updates ||
        "trackingId" in updates ||
        "deliveryStatus" in updates ||
        "deliveryCharge" in updates ||
        "deliveryArea" in updates ||
        "deliveryZone" in updates ||
        "deliveryNote" in updates) &&
        !hasPermission(session, "orders.editCourier")) ||
      ("status" in updates && !hasPermission(session, "orders.editStatus"))
    ) {
      return false;
    }

    setOrders((current) => {
      const nextOrders = current.map((order) =>
        orderReferenceKey(order) === orderKey || order.orderId === orderKey
          ? { ...order, ...updates }
          : order
      );
      writeOrdersToStorage(nextOrders);
      return nextOrders;
    });

    const backendOrder = await updateOrderOperationsInApi(orderKey, updates);
    if (!backendOrder) return false;

    setOrders((current) => {
      const nextOrders = current.map((order) =>
        orderReferenceKey(order) === orderKey || order.orderId === orderKey
          ? { ...order, ...backendOrder }
          : order
      );
      writeOrdersToStorage(nextOrders);
      return nextOrders;
    });

    return true;
  };

  const saveProducts = (nextProducts: AdminProduct[]) => {
    setAdminProducts(nextProducts);
    writeProductsToStorage(nextProducts);
  };

  const saveSettings = async (nextSettings: AdminSettings) => {
    setSettings(nextSettings);
    writeSettingsToStorage(nextSettings);
    const result = await saveSettingsToApi(nextSettings);

    setSettingsStorageMode(result.storageMode);
    setSettingsBackendMessage(
      result.message ||
        (result.backendConnected
          ? "Settings saved to Supabase."
          : "Settings backend not connected. Local fallback was updated only.")
    );

    if (result.settings) {
      setSettings(result.settings);
      writeSettingsToStorage(result.settings);
    }

    return result;
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    setExpandedOrderId(null);
    router.replace("/admin/login");
    router.refresh();
  };

  const runCommandSearch = () => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return;
    const target = visibleNavItems.find((item) =>
      item.label.toLowerCase().includes(query)
    );
    if (!target) {
      adminSound.play("warning");
      return;
    }
    adminSound.play("tab");
    router.push(target.href);
  };

  if (!isLoaded) {
    return (
      <main className="aev-admin-control-room grid min-h-screen place-items-center overflow-hidden px-4 text-white">
        <ControlRoomBackground />
        <div className="aev-admin-loading rounded-[1.4rem] border border-cyan-200/18 bg-black/40 p-6 text-sm text-white/70">
          <span className="aev-admin-live-dot mr-2 inline-block h-2 w-2 rounded-full bg-cyan-200" />
          Loading admin control room...
        </div>
      </main>
    );
  }

  return (
    <main className="aev-admin-control-room min-h-screen overflow-x-hidden text-white">
      <ControlRoomBackground />

      <div className="aev-admin-shell aev-admin-control-shell grid min-h-screen w-full gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[286px_minmax(0,1fr)] lg:px-5 lg:py-5">
        <aside className="aev-admin-command-rail min-w-0 p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-hidden">
          <div className="aev-admin-brand-block flex min-w-0 items-center gap-3">
            <span className="aev-admin-brand-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
              <Command className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight">
                Aevyrixa Her Care
              </h1>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.34em] text-pink-200/80">
                Admin Control Room
              </p>
            </div>
          </div>

          <nav className="aev-admin-command-nav mt-6 space-y-4" aria-label="Admin command rail">
            {commandRailVisibleGroups.map((group) => (
              <div key={group.label} className="min-w-0">
                <p className="mb-2 px-2 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/34">
                  {group.label}
                </p>
                <div className="grid gap-2">
                  {group.items.map((item) => (
                    <AdminNavItem
                      key={`${group.label}-${item.label}`}
                      item={item}
                      isActive={Boolean(item.view && item.view === view)}
                      supportUnreadCount={supportUnreadCount}
                      pendingOrderCount={pendingOrderCount}
                      pendingReviewCount={pendingReviewCount}
                      disabled={item.disabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="aev-admin-rail-bottom mt-5 space-y-3">
            <div className="aev-admin-pro-card rounded-2xl border p-4 text-center">
              <p className="text-sm font-semibold text-violet-100">Aevyrixa Pro</p>
              <p className="mt-1 text-xs text-white/52">Premium Admin Suite</p>
              <button
                type="button"
                disabled
                title="Aevyrixa Pro help center is coming soon"
                className="mt-3 rounded-full border border-pink-200/20 bg-pink-300/10 px-4 py-2 text-xs font-semibold text-pink-100"
              >
                Coming soon
              </button>
            </div>
            <Link href="/admin/support" className="aev-admin-help-card flex items-center gap-3 rounded-2xl border p-4" data-admin-hover-sound="true">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200/25 bg-violet-300/12">
                <HelpCircle className="h-4 w-4 text-violet-100" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Need Help?</p>
                <p className="text-xs text-white/45">Live support available</p>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                data-admin-hover-sound="true"
                className="aev-admin-utility-link inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Store
              </Link>
              <button
                type="button"
                onClick={() => {
                  adminSound.play("warning");
                  void handleLogout();
                }}
                data-admin-hover-sound="true"
                className="aev-admin-nav-danger inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="aev-admin-main-panel min-w-0 p-3 sm:p-4 xl:p-5">
            <div className="aev-admin-topbar mb-4 grid gap-3 rounded-2xl border p-3 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-center">
              <label className="aev-admin-command-input relative block min-w-0">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-100/70" />
                <input
                  type="search"
                  placeholder="Search orders, products, customers..."
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runCommandSearch();
                  }}
                  className="w-full rounded-2xl border py-3.5 pl-11 pr-16 text-sm outline-none"
                  onFocus={() => adminSound.play("hover")}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.65rem] font-bold text-white/48 sm:inline-flex">
                  Ctrl K
                </span>
              </label>
              <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
                <span className="aev-admin-status-pill aev-admin-status-operational">
                  <span className="aev-admin-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                  <span>System Status</span>
                  <strong>All Systems Operational</strong>
                </span>
                <span className="aev-admin-status-pill">
                  <MonitorDot className="h-3.5 w-3.5 text-cyan-200" />
                  <span>Live Visitors</span>
                  <strong>{Math.max(1, activeProductCount + supportUnreadCount)} Online</strong>
                </span>
                <span className="aev-admin-status-pill">
                  <Globe className="h-3.5 w-3.5 text-pink-200" />
                  <span>Storefront</span>
                  <strong>Live</strong>
                </span>
                <button
                  type="button"
                  data-admin-hover-sound="true"
                  onClick={() => router.push(supportUnreadCount > 0 ? "/admin/support" : pendingReviewCount > 0 ? "/admin/reviews" : "/admin")}
                  className="aev-admin-icon-button"
                  aria-label="Notifications"
                  title="Open current admin alerts"
                >
                  <BellIcon className="h-4 w-4" />
                  {(supportUnreadCount + pendingReviewCount) > 0 && (
                    <span className="aev-admin-alert-dot">{Math.min(9, supportUnreadCount + pendingReviewCount)}</span>
                  )}
                </button>
                <Link href="/admin/support" data-admin-hover-sound="true" className="aev-admin-icon-button" aria-label="Support messages">
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !adminSound.muted;
                    adminSound.setSoundMuted(nextMuted);
                    if (!nextMuted) window.setTimeout(() => adminSound.play("success"), 10);
                  }}
                  data-admin-sound="toggle"
                  data-admin-hover-sound="true"
                  className="aev-admin-icon-button"
                  aria-label={adminSound.muted ? "Unmute admin sounds" : "Mute admin sounds"}
                >
                  {adminSound.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <div className="aev-admin-profile-card flex min-w-[170px] items-center gap-3 rounded-2xl border px-3 py-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pink-200/40 bg-pink-300/12 text-sm font-bold text-pink-100">
                    {(session.displayName || session.username || "A").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{session.displayName || session.username || "Admin"}</p>
                    <p className="truncate text-[0.68rem] text-white/45">{session.role ? roleLabels[session.role] : "Admin"}</p>
                  </div>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-white/45" />
                </div>
              </div>
            </div>

            {view === "orders" ? (
              <OrdersSection
                orders={orders}
                products={adminProducts}
                settings={settings}
                expandedOrderId={expandedOrderId}
                onToggleDetails={(orderId) =>
                  setExpandedOrderId((current) =>
                    current === orderId ? null : orderId
                  )
                }
                onStatusChange={updateOrderStatus}
                onOperationsSave={updateOrderOperations}
                session={session}
              />
            ) : view === "products" ? (
              <ProductsSection products={adminProducts} onSaveProducts={saveProducts} session={session} />
            ) : view === "media" ? (
              <MediaSection products={adminProducts} session={session} />
            ) : view === "reviews" ? (
              <ReviewsCommandCenter
                reviews={reviews}
                setReviews={setReviews}
                products={adminProducts}
                session={session}
              />
            ) : view === "settings" ? (
              <SettingsSection
                settings={settings}
                storageMode={settingsStorageMode}
                backendMessage={settingsBackendMessage}
                onSaveSettings={saveSettings}
                session={session}
              />
            ) : view === "categories" ? (
              <CategoriesSection
                settings={settings}
                storageMode={settingsStorageMode}
                backendMessage={settingsBackendMessage}
                onSaveSettings={saveSettings}
                session={session}
              />
            ) : view === "support" ? (
              <SupportSection session={session} />
            ) : view === "customers" ? (
              <CustomersSection session={session} />
            ) : view === "staff" ? (
              <StaffSection session={session} />
            ) : view === "discounts" ? (
              <DiscountsSection orders={orders} session={session} />
            ) : view === "analytics" ? (
              <AnalyticsSection
                orders={orders}
                products={adminProducts}
                reviews={reviews}
                supportUnreadCount={supportUnreadCount}
                session={session}
              />
            ) : view === "integrations" ? (
              <IntegrationsSection settings={settings} session={session} />
            ) : view === "billing" ? (
              <BillingSection orders={orders} session={session} />
            ) : (
              <DashboardSection
                orders={orders}
                products={adminProducts}
                settings={settings}
                reviews={reviews}
                onStatusChange={updateOrderStatus}
                session={session}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ControlRoomDashboard({
  activeProducts,
  activityInRange,
  canViewActivity,
  canViewAnalytics,
  canViewOrders,
  canViewProducts,
  canViewSupport,
  closedSupport,
  customEnd,
  customStart,
  draftProducts,
  lowStockProducts,
  metrics,
  onRangePresetChange,
  onStatusChange,
  openSupport,
  orderDaily,
  outOfStockProducts,
  pendingReviews,
  products,
  range,
  rangePreset,
  recentOrders,
  recentProducts,
  reviews,
  session,
  setCustomEnd,
  setCustomStart,
  supportInRange,
  unreadSupport,
}: {
  activeProducts: AdminProduct[];
  activityInRange: AdminActivityClientRecord[];
  canViewActivity: boolean;
  canViewAnalytics: boolean;
  canViewOrders: boolean;
  canViewProducts: boolean;
  canViewSupport: boolean;
  closedSupport: number;
  customEnd: string;
  customStart: string;
  draftProducts: AdminProduct[];
  lowStockProducts: AdminProduct[];
  metrics: DashboardMetrics;
  onRangePresetChange: (value: DashboardRangePreset) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  openSupport: number;
  orderDaily: ChartDatum[];
  outOfStockProducts: AdminProduct[];
  pendingReviews: AdminReviewClientRecord[];
  products: AdminProduct[];
  range: DashboardRange;
  rangePreset: DashboardRangePreset;
  recentOrders: StoredOrder[];
  recentProducts: AdminProduct[];
  reviews: AdminReviewClientRecord[];
  session: AdminSessionUser;
  setCustomEnd: (value: string) => void;
  setCustomStart: (value: string) => void;
  supportInRange: DashboardSupportConversation[];
  unreadSupport: number;
}) {
  const avgOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0;
  const conversionRate = metrics.totalOrders > 0 && activeProducts.length > 0
    ? Math.min(9.9, (metrics.totalOrders / Math.max(activeProducts.length * 18, 1)) * 100)
    : 0;
  const approvedReviews = reviews.filter((review) => review.status === "approved");
  const hiddenReviews = reviews.filter((review) => review.status === "hidden");
  const rejectedReviews = reviews.filter((review) => review.status === "rejected");
  const cmsProduct = recentProducts[0] ?? products.find((product) => !product.deletedAt) ?? products[0];
  const galleryImages = (cmsProduct?.images?.length ? cmsProduct.images : [cmsProduct?.imageUrl, cmsProduct?.posterUrl])
    .filter((url): url is string => Boolean(url))
    .slice(0, 5);
  const colorOptions = cmsProduct?.colorOptions?.length
    ? cmsProduct.colorOptions
    : (cmsProduct?.colors ?? []).map((name, index) => ({
        id: `${name}-${index}`,
        name,
        hex: ["#111827", "#f4b6d2", "#8759d8", "#e9d5ff", "#67e8f9"][index % 5],
        imageUrl: "",
      }));
  const liveActivity = buildControlRoomActivity(
    recentOrders,
    reviews,
    recentProducts,
    supportInRange,
    activityInRange
  );
  const canEditOrderStatus = hasPermission(session, "orders.editStatus");

  return (
    <div className="aev-admin-dashboard-grid space-y-4">
      <section className="aev-admin-hero-panel rounded-[1.35rem] border p-4 xl:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.9fr)_minmax(320px,1.15fr)_minmax(420px,1.35fr)] xl:items-stretch">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="aev-admin-chip">
                <span className="aev-admin-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                Live
              </span>
              <span className="aev-admin-chip aev-admin-chip-muted">{range.label}</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              Control Room
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
              Real-time overview of your store's performance and operations.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["today", "last7", "last30", "month"] as DashboardRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onRangePresetChange(preset)}
                  className={`aev-admin-range-button rounded-xl border px-3 py-2 text-xs font-semibold ${
                    rangePreset === preset ? "is-active" : ""
                  }`}
                >
                  {preset === "today" ? "Today" : preset === "last7" ? "7 days" : preset === "last30" ? "30 days" : "Month"}
                </button>
              ))}
            </div>
            {rangePreset === "custom" && (
              <div className="mt-3 grid gap-2">
                <TextField label="Start date" value={customStart} onChange={setCustomStart} inputMode="numeric" />
                <TextField label="End date" value={customEnd} onChange={setCustomEnd} inputMode="numeric" />
              </div>
            )}
            {!canViewAnalytics && (
              <p className="mt-3 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] px-3 py-2 text-xs leading-5 text-amber-100/70">
                Full analytics access is limited by staff permissions.
              </p>
            )}
          </div>
          <div className="aev-admin-orb-stage min-h-[150px] rounded-[1.2rem] border">
            <div className="aev-admin-orb-core" />
            <div className="aev-admin-orb-ring ring-one" />
            <div className="aev-admin-orb-ring ring-two" />
            <div className="aev-admin-orb-ring ring-three" />
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <ControlRoomStatCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} trend={`${formatCurrency(metrics.todayRevenue)} today`} tone="pink" data={orderDaily.map((item) => item.amount ?? 0)} />
            <ControlRoomStatCard label="Total Orders" value={String(metrics.totalOrders)} trend={`${metrics.todayOrders} today`} tone="cyan" data={orderDaily.map((item) => item.value)} />
            <ControlRoomStatCard label="Avg. Order Value" value={formatCurrency(avgOrderValue)} trend={`${metrics.deliveredOrders} delivered`} tone="violet" data={orderDaily.map((item) => item.value + 1)} />
            <ControlRoomStatCard label="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} trend={`${activeProducts.length} active products`} tone="green" data={orderDaily.map((item, index) => item.value + index)} />
          </div>
        </div>
      </section>

      <section className="aev-admin-control-grid grid gap-4 2xl:grid-cols-[1.05fr_1.05fr_1.45fr_1fr_1.05fr]">
        <ControlRoomPanel title="Order Operations" badge={`${metrics.pendingOrders} Pending`} actionHref="/admin/orders" actionLabel="View all orders">
          {canViewOrders && recentOrders.length > 0 ? recentOrders.slice(0, 5).map((order) => (
            <div key={order.orderId} className="aev-admin-compact-row">
              <ProductThumb src={orderProductImage(order, products)} label={mainItemSummary(order)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{mainItemSummary(order)}</p>
                <p className="mt-1 text-[0.68rem] text-pink-100/60">{orderReferenceKey(order)} - {formatDate(order.createdAt)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-white">{formatCurrency(orderTotal(order))}</p>
                {canEditOrderStatus ? (
                  <button
                    type="button"
                    onClick={() => onStatusChange(orderReferenceKey(order), order.status === "Pending" ? "Confirmed" : order.status)}
                    className="mt-1 rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[10px] font-bold text-amber-100"
                  >
                    {order.status}
                  </button>
                ) : (
                  <StatusChip label={order.status} tone="amber" />
                )}
              </div>
            </div>
          )) : <NoDataState label="No recent orders in this range." />}
        </ControlRoomPanel>

        <ControlRoomPanel title="Support Radar" badge={`${unreadSupport} Open`} actionHref="/admin/support" actionLabel="Go to support center">
          {canViewSupport && supportInRange.length > 0 ? supportInRange.slice(0, 4).map((conversation) => (
            <div key={conversation.id} className="aev-admin-compact-row">
              <span className="aev-admin-row-icon"><MessageSquare className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{conversation.last_message?.body || `${convStatusLabels[conversation.status]} conversation`}</p>
                <p className="mt-1 text-[0.68rem] text-white/42">{conversation.source_page || "contact form"} - {formatDate(conversation.created_at)}</p>
              </div>
              <StatusChip label={conversation.unread_customer_count ? "High" : conversation.status} tone={conversation.unread_customer_count ? "pink" : "cyan"} />
            </div>
          )) : <NoDataState label="No support conversations in this range." />}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <StatusCount label="Open" value={openSupport} />
            <StatusCount label="Unread" value={unreadSupport} />
            <StatusCount label="Closed" value={closedSupport} />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Review Moderation" badge={`${pendingReviews.length} Pending`} actionHref="/admin/reviews" actionLabel="Manage all reviews">
          <div className="aev-admin-review-tabs grid grid-cols-4 gap-1">
            <span className="is-active">Pending</span>
            <span>{approvedReviews.length} Approved</span>
            <span>{hiddenReviews.length} Hidden</span>
            <span>{rejectedReviews.length} Rejected</span>
          </div>
          {(pendingReviews.length > 0 ? pendingReviews : reviews).slice(0, 2).map((review) => (
            <div key={review.id} className="aev-admin-review-row">
              <ProductThumb src={productImageBySlug(review.productSlug, products)} label={review.productSlug} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{review.customerName}</p>
                  <span className="shrink-0 text-xs text-white/42">{formatDate(review.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-amber-200">{"*".repeat(Math.max(1, review.rating))}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/58">{review.body}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href="/admin/reviews" className="aev-admin-mini-action text-emerald-100"><Check className="h-3 w-3" />Approve</Link>
                  <Link href="/admin/reviews" className="aev-admin-mini-action text-amber-100"><Inbox className="h-3 w-3" />Hide</Link>
                  <Link href="/admin/reviews" className="aev-admin-mini-action text-rose-100"><X className="h-3 w-3" />Reject</Link>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <NoDataState label="No reviews available." />}
        </ControlRoomPanel>

        <ControlRoomPanel title="Product Health" badge="View all" actionHref="/admin/products" actionLabel="View all">
          <ProductHealthBlock label="Low Stock" value={lowStockProducts.length} products={lowStockProducts} />
          <ProductHealthBlock label="Out of Stock" value={outOfStockProducts.length} products={outOfStockProducts} />
          <ProductHealthBlock label="Draft Products" value={draftProducts.length} products={draftProducts} />
        </ControlRoomPanel>

        <ControlRoomPanel title="Live Activity" badge="Live" actionHref="/admin/staff" actionLabel="View full activity log">
          {canViewActivity && liveActivity.length > 0 ? liveActivity.slice(0, 7).map((item) => (
            <div key={`${item.title}-${item.time}`} className="aev-admin-activity-row">
              <span className={`aev-admin-activity-dot tone-${item.tone}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <p className="truncate text-xs text-white/42">{item.meta}</p>
              </div>
              <span className="text-[0.65rem] text-white/35">{item.time}</span>
            </div>
          )) : <NoDataState label="No activity logs yet." />}
        </ControlRoomPanel>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.75fr)]">
        <ProductCmsPreview product={cmsProduct} galleryImages={galleryImages} colorOptions={colorOptions} />
        <div className="grid gap-4">
          <QuickActionsPanel session={session} />
          <SystemHealthPanel
            backupSecure={canViewProducts || canViewOrders}
            databaseHealthy={canViewProducts || canViewOrders || canViewSupport}
            responseTime={activeProducts.length + recentOrders.length > 0 ? 124 : 180}
          />
        </div>
      </section>
    </div>
  );
}

function ControlRoomPanel({
  title,
  badge,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  badge?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <article className="aev-admin-control-panel min-w-0 rounded-[1.25rem] border p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <h3 className="truncate text-base font-semibold text-white">{title}</h3>
        {badge && <span className="aev-admin-panel-badge">{badge}</span>}
      </div>
      <div className="space-y-2">{children}</div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="aev-admin-panel-action mt-3 flex min-h-9 items-center justify-center rounded-xl border text-xs font-semibold">
          {actionLabel}
        </Link>
      )}
    </article>
  );
}

function ControlRoomStatCard({
  label,
  value,
  trend,
  tone,
  data,
}: {
  label: string;
  value: string;
  trend: string;
  tone: "pink" | "cyan" | "violet" | "green";
  data: number[];
}) {
  return (
    <div className={`aev-admin-stat-card tone-${tone} min-w-0 rounded-[1.05rem] border p-4`}>
      <p className="text-xs text-white/52">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-200/80">{trend}</p>
      <MiniSparkline data={data} />
    </div>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  const values = data.length > 1 ? data : [1, 2, 1, 3, 2, 4, 3];
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 32 - (value / max) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="mt-3 h-9 w-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ControlRoomBackground() {
  return (
    <div className="aev-admin-background pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video
        className="aev-admin-video-layer"
        src="/admin/control-room-bg.mp4"
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="aev-admin-bg-gradient" />
      <div className="aev-admin-bg-grid" />
      <div className="aev-admin-bg-radar" />
      <div className="aev-admin-bg-orbit" />
      <div className="aev-admin-particle-field" />
      <div className="aev-admin-light-sweep" />
      <div className="aev-admin-bg-vignette" />
    </div>
  );
}

function AdminNavItem({
  item,
  isActive,
  supportUnreadCount,
  pendingOrderCount,
  pendingReviewCount,
  disabled = false,
}: {
  item: {
    label: string;
    href: string;
    icon: typeof Gauge;
    view?: AdminView;
    badge?: "orders" | "reviews" | "support";
  };
  isActive: boolean;
  supportUnreadCount: number;
  pendingOrderCount?: number;
  pendingReviewCount?: number;
  disabled?: boolean;
}) {
  const Icon = item.icon;
  const badgeValue =
    item.badge === "orders"
      ? pendingOrderCount ?? 0
      : item.badge === "reviews"
        ? pendingReviewCount ?? 0
        : item.badge === "support"
          ? supportUnreadCount
          : 0;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="aev-admin-nav-item is-disabled flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium"
        title="Coming soon"
      >
        <span className="aev-admin-nav-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate">{item.label}</span>
        <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/32">
          Soon
        </span>
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      data-admin-sound="menu"
      data-admin-hover-sound="true"
      className={`aev-admin-nav-item flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium ${
        isActive ? "is-active" : ""
      }`}
    >
      <span className="aev-admin-nav-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{item.label}</span>
      {badgeValue > 0 && (
        <span className="ml-auto rounded-full bg-pink-400/25 px-2 py-0.5 text-[10px] font-bold text-pink-50 ring-1 ring-pink-200/25">
          {badgeValue > 99 ? "99+" : badgeValue}
        </span>
      )}
    </Link>
  );
}

function viewTitle(view: AdminView) {
  if (view === "orders") return "Orders";
  if (view === "products") return "Products";
  if (view === "media") return "Media Vault";
  if (view === "reviews") return "Reviews";
  if (view === "settings") return "Settings";
  if (view === "support") return "Support Inbox";
  if (view === "categories") return "Category Management";
  if (view === "customers") return "Customers";
  if (view === "staff") return "Staff & Permissions";
  if (view === "discounts") return "Promotions";
  if (view === "analytics") return "Analytics";
  if (view === "integrations") return "Integrations";
  if (view === "billing") return "Billing";
  return "Dashboard";
}

function DashboardSection({
  orders,
  products,
  settings,
  reviews,
  onStatusChange,
  session,
}: {
  orders: StoredOrder[];
  products: AdminProduct[];
  settings: AdminSettings;
  reviews: AdminReviewClientRecord[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  session: AdminSessionUser;
}) {
  const [rangePreset, setRangePreset] = useState<DashboardRangePreset>("last7");
  const [customStart, setCustomStart] = useState(dateInputValue(addDays(new Date(), -6)));
  const [customEnd, setCustomEnd] = useState(dateInputValue(new Date()));
  const [supportConversations, setSupportConversations] = useState<DashboardSupportConversation[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityClientRecord[]>([]);
  const [staffRecords, setStaffRecords] = useState<AdminStaffClientRecord[]>([]);
  const canViewOrders = hasPermission(session, "orders.view");
  const canViewProducts = hasPermission(session, "products.view");
  const canViewSupport = hasPermission(session, "support.view");
  const canViewActivity = hasPermission(session, "activity.view");
  const canViewAnalytics = hasPermission(session, "analytics.view");
  const pendingReviews = reviews.filter((review) => review.status === "pending");

  useEffect(() => {
    if (!canViewSupport) return;

    void fetch("/api/admin/support/conversations", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { conversations?: DashboardSupportConversation[] } | null) => {
        if (Array.isArray(payload?.conversations)) {
          setSupportConversations(payload.conversations);
        }
      })
      .catch(() => null);
  }, [canViewSupport]);

  useEffect(() => {
    if (!canViewActivity && !hasPermission(session, "staff.manage")) return;

    void fetch("/api/admin/staff", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { activityLogs?: AdminActivityClientRecord[]; staff?: AdminStaffClientRecord[] } | null) => {
        if (Array.isArray(payload?.activityLogs)) setActivityLogs(payload.activityLogs);
        if (Array.isArray(payload?.staff)) setStaffRecords(payload.staff);
      })
      .catch(() => null);
  }, [canViewActivity, session]);

  const range = useMemo(
    () => buildDashboardRange(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  const rangeOrders = useMemo(
    () => orders.filter((order) => isWithinDashboardRange(order.createdAt, range)),
    [orders, range]
  );

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeOrders = rangeOrders.filter((order) => order.status !== "Cancelled");
    const paidOrders = activeOrders.filter(
      (order) =>
        order.paymentStatus === "verified" ||
        order.paymentVerificationStatus === "Verified" ||
        order.status === "Delivered"
    );
    const pendingPaymentOrders = rangeOrders.filter(
      (order) =>
        order.paymentStatus === "pending" ||
        order.paymentVerificationStatus === "Pending"
    );

    return {
      totalOrders: rangeOrders.length,
      todayOrders: orders.filter((order) => isToday(order.createdAt)).length,
      pendingOrders: rangeOrders.filter((order) => order.status === "Pending").length,
      confirmedOrders: rangeOrders.filter((order) => order.status === "Confirmed").length,
      shippedOrders: rangeOrders.filter((order) => order.status === "Shipped").length,
      deliveredOrders: rangeOrders.filter((order) => order.status === "Delivered").length,
      cancelledOrders: rangeOrders.filter((order) => order.status === "Cancelled").length,
      archivedTestOrders: rangeOrders.filter(
        (order) => Boolean(order.archivedAt) || Boolean(order.isTestOrder)
      ).length,
      totalRevenue: activeOrders.reduce((sum, order) => sum + orderTotal(order), 0),
      todayRevenue: orders
        .filter((order) => isToday(order.createdAt) && order.status !== "Cancelled")
        .reduce((sum, order) => sum + orderTotal(order), 0),
      pendingPaymentAmount: pendingPaymentOrders.reduce(
        (sum, order) => sum + orderTotal(order),
        0
      ),
      paidRevenue: paidOrders.reduce((sum, order) => sum + orderTotal(order), 0),
      mobileWalletOrders: rangeOrders.filter(
        (order) => order.paymentDetails.paymentMethod === "Mobile Wallet Payment"
      ).length,
      codOrders: rangeOrders.filter(
        (order) => order.paymentDetails.paymentMethod === "Cash on Delivery"
      ).length,
      bankTransferOrders: rangeOrders.filter(
        (order) => order.paymentDetails.paymentMethod === "Bank Transfer"
      ).length,
    };
  }, [orders, rangeOrders]);

  const lowStockThreshold = Math.max(
    0,
    Number(settings.orderSettings.lowStockAlertThreshold || 0) || 0
  );
  const activeProducts = products.filter(
    (product) => product.status === "Active" && !product.deletedAt
  );
  const draftProducts = products.filter(
    (product) => product.status === "Draft" && !product.deletedAt
  );
  const outOfStockProducts = products.filter(
    (product) => product.stockStatus === "out_of_stock" && !product.deletedAt
  );
  const lowStockProducts = products.filter((product) => {
    if (product.deletedAt) return false;
    if (product.stockStatus === "low_stock") return true;
    return (
      typeof product.stockQuantity === "number" &&
      lowStockThreshold > 0 &&
      product.stockQuantity <= lowStockThreshold
    );
  });

  const orderDaily = useMemo(() => buildDailySeries(rangeOrders, range), [rangeOrders, range]);
  const statusDistribution = useMemo(
    () => countBy(orderStatuses, rangeOrders.map((order) => order.status)),
    [rangeOrders]
  );
  const paymentDistribution = useMemo(
    () =>
      countBy(
        paymentMethods,
        rangeOrders
          .map((order) => order.paymentDetails.paymentMethod)
          .filter((method): method is (typeof paymentMethods)[number] =>
            paymentMethods.includes(method as never)
          )
      ),
    [rangeOrders]
  );
  const deliveryZoneDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    rangeOrders.forEach((order) => {
      const zone = order.deliveryZone || order.deliveryArea;
      if (!zone) return;
      counts.set(zone, (counts.get(zone) ?? 0) + 1);
    });
    return Array.from(counts, ([label, value]) => ({ label, value })).slice(0, 6);
  }, [rangeOrders]);
  const deliveryStatusDistribution = useMemo(
    () =>
      countBy(
        deliveryStatuses,
        rangeOrders
          .map((order) => order.deliveryStatus)
          .filter((status): status is DeliveryStatus => Boolean(status))
      ),
    [rangeOrders]
  );
  const paymentStatusDistribution = useMemo(
    () =>
      countBy(
        paymentStatuses,
        rangeOrders
          .map((order) => order.paymentStatus)
          .filter((status): status is PaymentStatus => Boolean(status))
      ),
    [rangeOrders]
  );
  const courierDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    rangeOrders.forEach((order) => {
      if (!order.courierName) return;
      counts.set(order.courierName, (counts.get(order.courierName) ?? 0) + 1);
    });
    return Array.from(counts, ([label, value]) => ({ label, value })).slice(0, 6);
  }, [rangeOrders]);
  const bestSellingProducts = useMemo(() => {
    const counts = new Map<string, { label: string; value: number; amount: number }>();
    rangeOrders.forEach((order) => {
      if (order.status === "Cancelled") return;
      order.items.forEach((item) => {
        const label = item.name || item.slug || item.id || "Unnamed product";
        const quantity = item.quantity ?? 0;
        const current = counts.get(label) ?? { label, value: 0, amount: 0 };
        current.value += quantity;
        current.amount += quantity * (item.price ?? 0);
        counts.set(label, current);
      });
    });
    return Array.from(counts.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rangeOrders]);
  const recentProducts = products
    .filter((product) => !product.deletedAt && product.updatedAt)
    .sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""))
    .slice(0, 5);
  const recentOperations = rangeOrders
    .filter(
      (order) =>
        order.deliveryStatus ||
        order.courierName ||
        order.paymentStatus ||
        order.paymentVerificationStatus ||
        order.archivedAt ||
        order.isTestOrder
    )
    .slice(0, 5);
  const supportInRange = supportConversations.filter((conversation) =>
    isWithinDashboardRange(conversation.created_at, range)
  );
  const openSupport = supportInRange.filter((conversation) => conversation.status === "open").length;
  const closedSupport = supportInRange.filter((conversation) => conversation.status === "closed").length;
  const unreadSupport = supportInRange.reduce(
    (sum, conversation) => sum + (conversation.unread_customer_count ?? 0),
    0
  );
  const activityInRange = activityLogs.filter((log) => isWithinDashboardRange(log.createdAt, range));
  const activeStaffCount = staffRecords.filter((staff) => staff.isActive).length;
  const activityDistribution = useMemo(() => {
    const groups = ["order", "product", "settings", "support", "staff"];
    return groups.map((group) => ({
      label: group,
      value: activityInRange.filter((log) =>
        `${log.action} ${log.targetType ?? ""}`.toLowerCase().includes(group)
      ).length,
    }));
  }, [activityInRange]);
  const recentOrders = rangeOrders.slice(0, 5);

  return (
    <ControlRoomDashboard
      activeProducts={activeProducts}
      activityInRange={activityInRange}
      canViewActivity={canViewActivity}
      canViewAnalytics={canViewAnalytics}
      canViewOrders={canViewOrders}
      canViewProducts={canViewProducts}
      canViewSupport={canViewSupport}
      closedSupport={closedSupport}
      customEnd={customEnd}
      customStart={customStart}
      draftProducts={draftProducts}
      lowStockProducts={lowStockProducts}
      metrics={metrics}
      onRangePresetChange={setRangePreset}
      onStatusChange={onStatusChange}
      openSupport={openSupport}
      orderDaily={orderDaily}
      outOfStockProducts={outOfStockProducts}
      pendingReviews={pendingReviews}
      products={products}
      range={range}
      rangePreset={rangePreset}
      recentOrders={recentOrders}
      recentProducts={recentProducts}
      reviews={reviews}
      session={session}
      setCustomEnd={setCustomEnd}
      setCustomStart={setCustomStart}
      supportInRange={supportInRange}
      unreadSupport={unreadSupport}
    />
  );
}

function ProductThumb({
  src,
  label,
  className = "",
}: {
  src?: string;
  label: string;
  className?: string;
}) {
  return (
    <span className={`aev-admin-product-thumb shrink-0 overflow-hidden rounded-xl border ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <PackageCheck className="h-4 w-4 text-white/46" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "pink" | "cyan" | "amber" | "green" }) {
  return <span className={`aev-admin-status-chip tone-${tone}`}>{label}</span>;
}

function StatusCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/35">{label}</p>
    </div>
  );
}

function ProductHealthBlock({
  label,
  value,
  products,
}: {
  label: string;
  value: number;
  products: AdminProduct[];
}) {
  return (
    <div className="aev-admin-health-block rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-pink-100">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
          <p className="text-xs text-white/40">Products</p>
        </div>
        <div className="flex -space-x-2">
          {products.slice(0, 4).map((product) => (
            <ProductThumb key={product.id} src={product.imageUrl || product.images[0]} label={product.name} />
          ))}
          {products.length > 4 && (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-semibold text-white/56">
              +{products.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCmsPreview({
  product,
  galleryImages,
  colorOptions,
}: {
  product?: AdminProduct;
  galleryImages: string[];
  colorOptions: Array<{ id: string; name: string; hex: string; imageUrl?: string }>;
}) {
  const descriptionImages = product?.descriptionMedia?.map((item) => item.url).filter(Boolean).slice(0, 2) ?? [];
  const variantRows = (product?.sizes?.length ? product.sizes : ["S", "M", "L"]).slice(0, 3);

  return (
    <article className="aev-admin-cms-preview min-w-0 rounded-[1.35rem] border p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-semibold text-pink-100/75">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to products
          </Link>
          <h3 className="mt-2 truncate text-lg font-semibold text-white">Product CMS Preview</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Preview", "Save Draft", "Publish"].map((action) => (
            <Link key={action} href="/admin/products" className={`aev-admin-cms-action ${action === "Publish" ? "is-primary" : ""}`}>
              {action}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[96px_minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="aev-admin-cms-tabs grid gap-2">
          {["General", "Media", "Variants", "Pricing", "SEO", "Shipping", "Settings"].map((tab) => (
            <Link key={tab} href="/admin/products" className={tab === "Media" ? "is-active" : ""}>
              {tab}
            </Link>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="aev-admin-cms-card rounded-2xl border p-3">
            <p className="text-sm font-semibold text-white">Media Gallery</p>
            <p className="mt-1 text-xs text-white/42">Drag and drop to upload or click to browse</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {galleryImages.map((image, index) => (
                <ProductThumb key={`${image}-${index}`} src={image} label="Product media" />
              ))}
              <UploadTile />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="aev-admin-cms-card rounded-2xl border p-3">
              <p className="text-sm font-semibold text-white">Color Mapping</p>
              <p className="mt-1 text-xs text-white/42">Manage color swatches and variants</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colorOptions.slice(0, 6).map((color) => (
                  <span key={color.id} className="h-8 w-8 rounded-full border border-white/25" style={{ backgroundColor: safeColorHex(color.hex) }} title={color.name} />
                ))}
                <Link href="/admin/products" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/60">
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="aev-admin-cms-card rounded-2xl border p-3">
              <p className="text-sm font-semibold text-white">Description Gallery</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {descriptionImages.map((image, index) => (
                  <ProductThumb key={`${image}-${index}`} src={image} label="Description media" />
                ))}
                <UploadTile />
              </div>
            </div>
          </div>
        </div>
        <div className="aev-admin-cms-card rounded-2xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Variants</p>
              <p className="mt-1 text-xs text-white/42">Manage size, color and inventory</p>
            </div>
            <Link href="/admin/products" className="aev-admin-mini-action text-pink-100"><Plus className="h-3 w-3" />Add Variant</Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-white/38">
                <tr>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/68">
                {variantRows.map((size, index) => (
                  <tr key={size}>
                    <td className="px-3 py-2">{size}</td>
                    <td className="px-3 py-2">{product?.colors[index % Math.max(product.colors.length, 1)] ?? "Black"}</td>
                    <td className="px-3 py-2">{(product?.slug || "aev-product").slice(0, 10).toUpperCase()}-{size}</td>
                    <td className="px-3 py-2 text-emerald-200">{Math.max(0, (product?.stockQuantity ?? 96) - index * 16)}</td>
                    <td className="px-3 py-2">{product?.price || formatCurrency(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>
  );
}

function UploadTile() {
  return (
    <Link href="/admin/products" className="flex aspect-square min-h-16 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.025] text-white/50">
      <Upload className="h-4 w-4" />
    </Link>
  );
}

function QuickActionsPanel({ session }: { session: AdminSessionUser }) {
  const actions: Array<{
    label: string;
    href: string;
    icon: typeof Gauge;
    permission?: AdminPermission;
    disabled?: boolean;
  }> = [
    { label: "Add Product", href: "/admin/products", icon: Plus, permission: "products.edit" as AdminPermission },
    { label: "Manage Orders", href: "/admin/orders", icon: ShoppingBag, permission: "orders.view" as AdminPermission },
    { label: "Discounts", href: "/admin/discounts", icon: Tag, permission: "settings.view" as AdminPermission },
    { label: "Support Radar", href: "/admin/support", icon: BellIcon, permission: "support.view" as AdminPermission },
    { label: "Media Vault", href: "/admin/media", icon: ImageIcon, permission: "products.view" as AdminPermission },
    { label: "Analytics", href: "/admin/analytics", icon: Rows3, permission: "analytics.view" as AdminPermission },
  ];

  return (
    <ControlRoomPanel title="Quick Actions">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const disabled = action.disabled || (action.permission ? !hasPermission(session, action.permission) : false);
          const className = `aev-admin-quick-action ${disabled ? "is-disabled" : ""}`;
          return disabled ? (
            <button key={action.label} type="button" disabled className={className}>
              <Icon className="h-5 w-5" />
              <span>{action.label}</span>
            </button>
          ) : (
            <Link key={action.label} href={action.href} className={className} data-admin-hover-sound="true">
              <Icon className="h-5 w-5" />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </ControlRoomPanel>
  );
}

function SystemHealthPanel({
  backupSecure,
  databaseHealthy,
  responseTime,
}: {
  backupSecure: boolean;
  databaseHealthy: boolean;
  responseTime: number;
}) {
  return (
    <ControlRoomPanel title="System Health" badge="All systems operational">
      <div className="grid gap-3 md:grid-cols-[1fr_140px] md:items-center">
        <div className="grid grid-cols-2 gap-2">
          <StatusMetric label="Uptime" value="99.98%" tone="green" />
          <StatusMetric label="Response Time" value={`${responseTime}ms`} tone={responseTime < 250 ? "green" : "amber"} />
          <StatusMetric label="Database" value={databaseHealthy ? "Healthy" : "Fallback"} tone={databaseHealthy ? "green" : "amber"} />
          <StatusMetric label="Backup" value={backupSecure ? "Secure" : "Pending"} tone={backupSecure ? "green" : "amber"} />
        </div>
        <div className="aev-admin-system-radar min-h-[140px] rounded-2xl border" />
      </div>
    </ControlRoomPanel>
  );
}

function StatusMetric({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" }) {
  return (
    <div className={`aev-admin-status-metric tone-${tone} rounded-xl border p-3`}>
      <p className="text-[0.65rem] text-white/42">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function orderProductImage(order: StoredOrder, products: AdminProduct[]) {
  const firstItem = order.items[0];
  if (!firstItem) return undefined;
  const product = products.find((item) => item.id === firstItem.productId || item.slug === firstItem.slug || item.name === firstItem.name);
  return product?.imageUrl || product?.images[0];
}

function productImageBySlug(slug: string, products: AdminProduct[]) {
  const product = products.find((item) => item.slug === slug || item.id === slug);
  return product?.imageUrl || product?.images[0];
}

function buildControlRoomActivity(
  orders: StoredOrder[],
  reviews: AdminReviewClientRecord[],
  products: AdminProduct[],
  support: DashboardSupportConversation[],
  logs: AdminActivityClientRecord[]
) {
  const items = [
    ...orders.map((order) => ({
      title: "New order placed",
      meta: `${orderReferenceKey(order)} - ${mainItemSummary(order)}`,
      time: order.createdAt ? formatDate(order.createdAt) : "Now",
      tone: "green",
      date: order.createdAt,
    })),
    ...reviews.map((review) => ({
      title: "Review submitted",
      meta: `${review.customerName} - ${review.status}`,
      time: formatDate(review.createdAt),
      tone: "amber",
      date: review.createdAt,
    })),
    ...products.map((product) => ({
      title: "Product updated",
      meta: product.name,
      time: product.updatedAt ? formatDate(product.updatedAt) : "Recent",
      tone: "cyan",
      date: product.updatedAt,
    })),
    ...support.map((conversation) => ({
      title: "Support ticket created",
      meta: conversation.source_page || "contact form",
      time: formatDate(conversation.created_at),
      tone: "pink",
      date: conversation.created_at,
    })),
    ...logs.map((log) => ({
      title: `${log.actorName || "Admin"} ${log.action}`,
      meta: log.targetType || "operations",
      time: log.createdAt ? formatDate(log.createdAt) : "Recent",
      tone: "violet",
      date: log.createdAt,
    })),
  ];

  return items
    .sort((a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? ""))
    .slice(0, 10);
}

function DailyBars({
  title,
  data,
  valueLabel,
}: {
  title: string;
  data: ChartDatum[];
  valueLabel: (item: ChartDatum) => string;
}) {
  const max = Math.max(...data.map((item) => item.value), 0);

  return (
    <section className="min-w-0 rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
      <SectionHeader title={title} />
      {data.length === 0 || max === 0 ? (
        <NoDataState label="No data yet." />
      ) : (
        <div className="mt-4 flex h-48 min-w-0 items-end gap-2 overflow-hidden">
          {data.map((item) => {
            const height = Math.max(8, Math.round((item.value / max) * 100));

            return (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-xl border border-white/10 bg-white/[0.035] p-1">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-cyan-300/80 to-fuchsia-200/80"
                    style={{ height: `${height}%` }}
                    title={`${item.label}: ${valueLabel(item)}`}
                  />
                </div>
                <p className="w-full truncate text-center text-[10px] text-white/38">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DistributionCard({
  title,
  data,
  emptyLabel = "No data yet.",
}: {
  title: string;
  data: ChartDatum[];
  emptyLabel?: string;
}) {
  const visibleData = data.filter((item) => item.value > 0);
  const max = Math.max(...visibleData.map((item) => item.value), 0);

  return (
    <section className="min-w-0 rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
      <SectionHeader title={title} />
      {visibleData.length === 0 ? (
        <NoDataState label={emptyLabel} />
      ) : (
        <div className="mt-4 space-y-3">
          {visibleData.map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3">
                <p className="truncate text-sm text-white/70">{item.label}</p>
                <p className="shrink-0 text-sm font-semibold text-white">
                  {item.value}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-cyan-200/75"
                  style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InsightList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Array<{ title: string; meta?: string }>;
  emptyLabel: string;
}) {
  return (
    <section className="min-w-0 rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
      <SectionHeader title={title} />
      {items.length === 0 ? (
        <NoDataState label={emptyLabel} />
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
            >
              <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
                {item.title}
              </p>
              {item.meta && (
                <p className="mt-1 break-words text-xs leading-5 text-white/48 [overflow-wrap:anywhere]">
                  {item.meta}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NoDataState({ label }: { label: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5 text-center text-sm text-white/42">
      {label}
    </div>
  );
}

function OrdersSection({
  orders,
  products,
  settings,
  expandedOrderId,
  onToggleDetails,
  onStatusChange,
  onOperationsSave,
  session,
}: {
  orders: StoredOrder[];
  products: AdminProduct[];
  settings: AdminSettings;
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOperationsSave: (
    orderId: string,
    updates: OrderOperationsUpdate
  ) => Promise<boolean>;
  session: AdminSessionUser;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("All");
  const [deliveryStatusFilter, setDeliveryStatusFilter] =
    useState<DeliveryStatusFilter>("All");
  const [specialFilter, setSpecialFilter] = useState<SpecialOrderFilter>("Active");
  const [sortOrder, setSortOrder] = useState<OrderSort>("Newest first");

  const visibleOrders = useMemo(
    () =>
      filterAndSortOrders(
        orders,
        searchTerm,
        statusFilter,
        paymentFilter,
        paymentStatusFilter,
        deliveryStatusFilter,
        specialFilter,
        sortOrder
      ),
    [
      deliveryStatusFilter,
      orders,
      paymentFilter,
      paymentStatusFilter,
      searchTerm,
      sortOrder,
      specialFilter,
      statusFilter,
    ]
  );
  const selectedOrder =
    visibleOrders.find((order) => order.orderId === expandedOrderId) ??
    visibleOrders[0] ??
    null;
  const selectedOrderId = selectedOrder?.orderId ?? null;
  const canExportOrders = hasPermission(session, "orders.export");
  const canEditStatus = hasPermission(session, "orders.editStatus");
  const activeOrders = orders.filter((order) => !order.deletedAt && !order.softDeletedAt);
  const revenueOrders = activeOrders.filter((order) => order.status !== "Cancelled");
  const todayOrders = activeOrders.filter((order) => isToday(order.createdAt));
  const todayRevenue = todayOrders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const pendingCount = activeOrders.filter((order) => order.status === "Pending").length;
  const confirmedCount = activeOrders.filter((order) => order.status === "Confirmed").length;
  const cancelledCount = activeOrders.filter((order) => order.status === "Cancelled").length;
  const deliveredCount = activeOrders.filter((order) => order.status === "Delivered").length;
  const metrics = [
    {
      label: "Total Orders Today",
      value: String(todayOrders.length),
      detail: `${activeOrders.length} active orders in system`,
      tone: "violet",
      icon: ClipboardList,
    },
    {
      label: "Pending Orders",
      value: String(pendingCount),
      detail: "Awaiting confirmation",
      tone: "amber",
      icon: Wallet,
    },
    {
      label: "Confirmed Orders",
      value: String(confirmedCount),
      detail: "Ready for fulfillment",
      tone: "cyan",
      icon: Check,
    },
    {
      label: "Cancelled Orders",
      value: String(cancelledCount),
      detail: "Removed from revenue",
      tone: "rose",
      icon: X,
    },
    {
      label: "Delivered Orders",
      value: String(deliveredCount),
      detail: "Completed handoff",
      tone: "green",
      icon: PackageCheck,
    },
    {
      label: "Total Revenue (Today)",
      value: formatCurrency(todayRevenue),
      detail: `${formatCurrency(revenueOrders.reduce((sum, order) => sum + orderTotal(order), 0))} all-time active`,
      tone: "pink",
      icon: CreditCard,
    },
  ];
  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== "All" ||
    paymentFilter !== "All" ||
    paymentStatusFilter !== "All" ||
    deliveryStatusFilter !== "All" ||
    specialFilter !== "Active" ||
    sortOrder !== "Newest first";

  return (
    <div className="aev-admin-orders-workspace mt-6 space-y-3">
      <section className="aev-admin-page-hero min-w-0 rounded-[1.35rem] border border-pink-200/18 p-4 shadow-[0_0_56px_rgba(255,77,184,0.08)] sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="aev-admin-chip border-emerald-200/24 bg-emerald-300/[0.08] text-emerald-100">
                <span className="aev-admin-live-dot mr-2" />
                Live
              </span>
              <span className="aev-admin-chip aev-admin-chip-muted">
                {visibleOrders.length} in queue
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-white sm:text-3xl">
              Orders Control Room
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
              Command center for managing customer orders, payments, deliveries, and operations.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row xl:justify-end">
            <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-xs font-semibold text-white/66">
              <ClipboardList className="h-4 w-4 text-pink-100/80" />
              {dateInputValue(new Date())}
            </span>
            <button
              type="button"
              onClick={() => exportOrdersCsv(visibleOrders)}
              disabled={!canExportOrders || visibleOrders.length === 0}
              title={
                canExportOrders
                  ? visibleOrders.length === 0
                    ? "No visible orders to export"
                    : "Export visible orders as CSV"
                  : "CSV export is not available for this admin role"
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-200/25 bg-cyan-200/[0.08] px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/45 hover:bg-cyan-200/12 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Upload className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <OrderMetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="aev-admin-orders-filter rounded-[1.1rem] border border-pink-200/18 bg-[#070b1a]/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.25fr)_repeat(3,minmax(150px,0.7fr))] 2xl:grid-cols-[minmax(280px,1.25fr)_repeat(6,minmax(145px,0.65fr))_auto]">
          <label className="relative block min-w-0">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
              Search orders by reference / customer / phone
            </span>
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-pink-100/55" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Reference, customer, phone..."
              className="w-full rounded-xl border border-white/10 bg-[#08111f] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
            />
          </label>
          <SelectField
            label="Status"
            value={statusFilter}
            options={statusFilterOptions}
            onChange={setStatusFilter}
          />
          <SelectField
            label="Payment"
            value={paymentFilter}
            options={paymentFilterOptions}
            onChange={setPaymentFilter}
          />
          <SelectField
            label="Payment status"
            value={paymentStatusFilter}
            options={paymentStatusFilterOptions}
            onChange={setPaymentStatusFilter}
          />
          <SelectField
            label="Delivery status"
            value={deliveryStatusFilter}
            options={deliveryStatusFilterOptions}
            onChange={setDeliveryStatusFilter}
          />
          <SelectField
            label="Queue"
            value={specialFilter}
            options={specialOrderFilterOptions}
            onChange={setSpecialFilter}
          />
          <SelectField
            label="Sort by"
            value={sortOrder}
            options={orderSortOptions}
            onChange={setSortOrder}
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
              setPaymentFilter("All");
              setPaymentStatusFilter("All");
              setDeliveryStatusFilter("All");
              setSpecialFilter("Active");
              setSortOrder("Newest first");
            }}
            disabled={!hasActiveFilters}
            className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-pink-200/25 bg-pink-300/[0.09] px-4 text-sm font-semibold text-pink-50 transition hover:border-pink-200/45 hover:bg-pink-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Command className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleOrders.length} of {orders.length} orders
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setPaymentFilter("All");
                setPaymentStatusFilter("All");
                setDeliveryStatusFilter("All");
                setSpecialFilter("Active");
                setSortOrder("Newest first");
              }}
              className="w-fit rounded-full border border-white/10 px-3 py-2 font-medium text-white/65 transition hover:border-cyan-200/35 hover:text-white"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>
      <div className="grid min-w-0 gap-0 overflow-hidden rounded-[1.35rem] border border-pink-200/16 bg-[#050917]/92 shadow-[0_0_70px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] xl:items-start">
        <section className="aev-admin-orders-queue min-w-0 border-b border-white/10 bg-black/18 p-3 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                Orders Queue
              </p>
              <p className="mt-1 text-xs text-pink-100/68">
                {activeOrders.filter((order) => order.status === "Pending").length} pending
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-100/70">View all</span>
          </div>
          <OrderList
            orders={visibleOrders}
            products={products}
            selectedOrderId={selectedOrderId}
            onToggleDetails={onToggleDetails}
            canEditStatus={canEditStatus}
          />
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-xs text-white/42">
            <span>{visibleOrders.length > 0 ? `Showing 1 to ${visibleOrders.length} of ${orders.length}` : `Showing 0 of ${orders.length}`}</span>
            <span className="font-semibold text-pink-100/70">{pendingCount} pending</span>
          </div>
        </section>
        <div className="min-w-0">
          {selectedOrder ? (
            <OrderDetails
              key={orderReferenceKey(selectedOrder)}
              order={selectedOrder}
              products={products}
              settings={settings}
              onStatusChange={onStatusChange}
              onOperationsSave={onOperationsSave}
              session={session}
            />
          ) : (
            <EmptyDetailPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function OrderMetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: typeof ClipboardList;
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-100 border-amber-200/22 bg-[radial-gradient(circle_at_18%_12%,rgba(251,191,36,0.18),transparent_38%),rgba(251,191,36,0.045)]"
      : tone === "rose"
        ? "text-rose-100 border-rose-200/22 bg-[radial-gradient(circle_at_18%_12%,rgba(251,113,133,0.18),transparent_38%),rgba(251,113,133,0.045)]"
        : tone === "green"
          ? "text-emerald-100 border-emerald-200/22 bg-[radial-gradient(circle_at_18%_12%,rgba(94,240,174,0.16),transparent_38%),rgba(16,185,129,0.045)]"
          : tone === "violet"
            ? "text-violet-100 border-violet-200/24 bg-[radial-gradient(circle_at_18%_12%,rgba(177,140,255,0.18),transparent_38%),rgba(139,92,246,0.045)]"
            : tone === "pink"
              ? "text-pink-100 border-pink-200/24 bg-[radial-gradient(circle_at_18%_12%,rgba(255,119,200,0.18),transparent_38%),rgba(255,119,200,0.045)]"
              : "text-cyan-100 border-cyan-200/22 bg-[radial-gradient(circle_at_18%_12%,rgba(103,247,243,0.16),transparent_38%),rgba(6,182,212,0.045)]";

  return (
    <article className={`aev-admin-metric-card relative min-h-[92px] min-w-0 overflow-hidden rounded-2xl border p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${toneClass}`}>
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-current/25" />
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-current/[0.11] shadow-[0_0_22px_currentColor]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-white/62">{label}</p>
          <p className="mt-1 break-words text-xl font-semibold leading-none text-white">{value}</p>
          <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-white/48">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function ProductsSection({
  products,
  onSaveProducts,
  session,
}: {
  products: AdminProduct[];
  onSaveProducts: (products: AdminProduct[]) => void;
  session: AdminSessionUser;
}) {
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const inlineEditorRef = useRef<HTMLDivElement | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFilter, setProductFilter] = useState<ProductFilter>("All");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [stockFilter, setStockFilter] = useState<"All Stock" | ProductStockStatus>("All Stock");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    () => products.find((product) => !product.deletedAt)?.id ?? products[0]?.id ?? null
  );

  const productFilterOptions: ProductFilter[] = [
    "All",
    "Active",
    "Draft",
    "Out of Stock",
    "Deleted",
  ];
  const categoryOptions = useMemo(
    () => [
      "All Categories",
      ...Array.from(
        new Set(
          products
            .filter((product) => !product.deletedAt && product.category)
            .map((product) => product.category)
        )
      ).sort(),
    ],
    [products]
  );
  const liveProducts = useMemo(
    () => products.filter((product) => !product.deletedAt),
    [products]
  );
  const activeProducts = liveProducts.filter((product) => product.status === "Active");
  const draftProducts = liveProducts.filter((product) => product.status === "Draft");
  const lowStockProducts = liveProducts.filter((product) => {
    const threshold = product.lowStockThreshold ?? 10;
    return (
      product.stockStatus === "low_stock" ||
      (typeof product.stockQuantity === "number" &&
        product.stockQuantity > 0 &&
        product.stockQuantity <= threshold)
    );
  });
  const outOfStockProducts = liveProducts.filter(
    (product) => product.stockStatus === "out_of_stock" || product.stockQuantity === 0
  );
  const recentProducts = [...liveProducts]
    .sort((a, b) => Date.parse(b.updatedAt ?? b.createdAt ?? "") - Date.parse(a.updatedAt ?? a.createdAt ?? ""))
    .slice(0, 5);
  const healthAttention = new Set([...lowStockProducts, ...draftProducts].map((product) => product.id));
  const healthCritical = outOfStockProducts.length;
  const healthyCount = Math.max(0, liveProducts.length - healthAttention.size - healthCritical);
  const healthPercent = liveProducts.length
    ? Math.round((healthyCount / liveProducts.length) * 100)
    : 0;

  const visibleProducts = useMemo(() => {
    const query = productSearchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter =
        productFilter === "Deleted"
          ? Boolean(product.deletedAt)
          : !product.deletedAt &&
            (productFilter === "All" ||
              (productFilter === "Active" && product.status === "Active") ||
              (productFilter === "Draft" && product.status === "Draft") ||
              (productFilter === "Out of Stock" &&
                product.stockStatus === "out_of_stock"));

      if (!matchesFilter) return false;
      if (categoryFilter !== "All Categories" && product.category !== categoryFilter) return false;
      if (stockFilter !== "All Stock" && product.stockStatus !== stockFilter) return false;
      return !query || productSearchText(product).includes(query);
    });
  }, [categoryFilter, productFilter, productSearchTerm, products, stockFilter]);
  const editingProductId = editingProduct?.id;
  const isEditingExistingProduct = Boolean(
    editingProductId && products.some((product) => product.id === editingProductId)
  );
  const canEditProducts = hasPermission(session, "products.edit");
  const canUploadProductMedia = hasPermission(session, "products.media");
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    visibleProducts.find((product) => !product.deletedAt) ??
    liveProducts[0] ??
    products[0] ??
    null;

  useEffect(() => {
    if (!editingProductId || !isEditingExistingProduct) return;

    const scrollTimer = window.setTimeout(() => {
      inlineEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [editingProductId, isEditingExistingProduct]);

  useEffect(() => {
    if (selectedProductId && products.some((product) => product.id === selectedProductId)) return;
    setSelectedProductId(visibleProducts[0]?.id ?? products[0]?.id ?? null);
  }, [products, selectedProductId, visibleProducts]);

  const addProduct = () => {
    if (!canEditProducts) {
      setSaveError(blockedPermissionMessage);
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setProductFilter("All");
    setProductSearchTerm("");
    setCategoryFilter("All Categories");
    setStockFilter("All Stock");
    setEditingProduct({
      ...emptyProduct,
      id: `admin-product-${Date.now()}`,
      slug: `new-product-${Date.now()}`,
    });
  };

  const openEditor = (product: AdminProduct) => {
    if (!canEditProducts) {
      setSaveError(blockedPermissionMessage);
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setSelectedProductId(product.id);
    setEditingProduct(product);
  };

  const replaceSavedProduct = (
    currentProducts: AdminProduct[],
    draftProduct: AdminProduct,
    savedProduct: AdminProduct,
    exists: boolean
  ) => {
    if (!exists) return [savedProduct, ...currentProducts];

    return currentProducts.map((item) =>
      item.id === draftProduct.id || item.id === savedProduct.id ? savedProduct : item
    );
  };

  const saveProduct = async (product: AdminProduct) => {
    if (!canEditProducts) {
      setSaveError(blockedPermissionMessage);
      return;
    }
    const slug = product.slug || slugify(product.name);
    const nextProduct = {
      ...product,
      id: product.id || `admin-product-${slug || Date.now()}`,
      slug,
      visualVariant: product.visualVariant || product.visualTheme,
    };
    const exists = products.some((item) => item.id === nextProduct.id);

    setIsSavingProduct(true);
    setStatusMessage("");
    setSaveError(null);

    try {
      const backendProduct = await saveProductToApi(nextProduct, exists);
      onSaveProducts(replaceSavedProduct(products, nextProduct, backendProduct, exists));
      setEditingProduct(null);
      setSaveError(null);
      setStatusMessage("Product saved to backend.");
    } catch (error) {
      console.error("Failed to save backend product:", error);
      const msg = error instanceof Error ? error.message : "Product could not be saved.";
      setSaveError(msg);
      setStatusMessage(msg);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!canEditProducts) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    if (!window.confirm("Delete this product and move it to Deleted/Trash?")) return;

    setIsSavingProduct(true);
    setStatusMessage("");

    try {
      const backendProduct = await deleteProductInApi(productId);
      onSaveProducts(
        products.map((product) =>
          product.id === backendProduct.id ? backendProduct : product
        )
      );
      setEditingProduct((current) => (current?.id === productId ? null : current));
      setStatusMessage("Product moved to Deleted.");
    } catch (error) {
      console.error("Failed to delete backend product:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Product could not be deleted."
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const restoreProduct = async (productId: string) => {
    if (!canEditProducts) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setIsSavingProduct(true);
    setStatusMessage("");

    try {
      const backendProduct = await restoreProductInApi(productId);
      onSaveProducts(
        products.map((product) =>
          product.id === backendProduct.id ? backendProduct : product
        )
      );
      setStatusMessage("Product restored as Draft.");
    } catch (error) {
      console.error("Failed to restore backend product:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Product could not be restored."
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const permanentlyDeleteProduct = async (product: AdminProduct) => {
    if (!canEditProducts) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    const confirmation = window.prompt(
      `Permanently delete "${product.name}" from Supabase? Type DELETE to confirm.`
    );
    if (confirmation !== "DELETE") return;

    setIsSavingProduct(true);
    setStatusMessage("");

    try {
      await permanentlyDeleteProductInApi(product.id);
      onSaveProducts(products.filter((item) => item.id !== product.id));
      setStatusMessage("Product permanently deleted.");
    } catch (error) {
      console.error("Failed to permanently delete backend product:", error);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Product could not be permanently deleted."
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const setProductStatus = async (productId: string, status: ProductStatus) => {
    if (!canEditProducts) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    const currentProduct = products.find((product) => product.id === productId);
    if (!currentProduct) return;
    if (currentProduct.status === status) {
      setStatusMessage(`Product is already ${status}.`);
      return;
    }

    const nextProduct: AdminProduct = {
      ...currentProduct,
      status,
    };

    setIsSavingProduct(true);
    setStatusMessage("");

    try {
      const backendProduct = await saveProductToApi(nextProduct, true);
      onSaveProducts(
        products.map((product) =>
          product.id === backendProduct.id ? backendProduct : product
        )
      );
      setStatusMessage("Product status saved to backend.");
    } catch (error) {
      console.error("Failed to save backend product status:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Product status could not be saved."
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const toggleStatus = async (productId: string) => {
    const currentProduct = products.find((product) => product.id === productId);
    if (!currentProduct) return;
    await setProductStatus(productId, currentProduct.status === "Active" ? "Draft" : "Active");
  };

  const exportProductsCsv = () => {
    const headers = ["name", "slug", "category", "price", "status", "stockStatus", "stockQuantity"];
    const rows = visibleProducts.map((product) =>
      [
        product.name,
        product.slug,
        product.category,
        product.price,
        product.status,
        product.stockStatus,
        product.stockQuantity ?? "",
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aevyrixa-products.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Visible products exported as CSV.");
  };

  return (
    <div className="aev-admin-page-stack mt-6 space-y-5">
      <section className="aev-admin-page-hero overflow-hidden rounded-[1.35rem] border p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_420px] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="aev-admin-chip">
                <span className="aev-admin-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                Live
              </span>
              <span className="aev-admin-chip aev-admin-chip-muted">
                Catalog systems online
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Products Command Center
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Manage product catalog, inventory, content, and performance from one cinematic CMS workspace.
            </p>
          </div>
          <div className="aev-admin-orb-stage min-h-[170px] rounded-[1.2rem] border">
            <div className="aev-admin-orb-core" />
            <div className="aev-admin-orb-ring ring-one" />
            <div className="aev-admin-orb-ring ring-two" />
            <div className="aev-admin-orb-ring ring-three" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ProductMetricCard label="Total Products" value={String(liveProducts.length)} tone="cyan" icon={<Boxes className="h-4 w-4" />} />
          <ProductMetricCard label="Active Products" value={String(activeProducts.length)} tone="green" icon={<PackageCheck className="h-4 w-4" />} />
          <ProductMetricCard label="Draft Products" value={String(draftProducts.length)} tone="violet" icon={<Inbox className="h-4 w-4" />} />
          <ProductMetricCard label="Low Stock" value={String(lowStockProducts.length)} tone="amber" icon={<Gauge className="h-4 w-4" />} />
          <ProductMetricCard label="Out of Stock" value={String(outOfStockProducts.length)} tone="pink" icon={<X className="h-4 w-4" />} />
        </div>
      </section>

      {statusMessage && (
        <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.055] p-4 text-sm leading-6 text-cyan-50/76">
          {statusMessage}
        </div>
      )}

      <section className="aev-admin-control-panel rounded-[1.25rem] border p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[190px_minmax(240px,1fr)_170px_170px_auto_auto] lg:items-end">
          <SelectField
            label="Category"
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
          />
          <label className="relative block min-w-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Search products
            </span>
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-white/35" />
            <input
              type="search"
              value={productSearchTerm}
              onChange={(event) => setProductSearchTerm(event.target.value)}
              placeholder="Search products by name, slug, SKU..."
              className="w-full rounded-2xl border border-white/10 bg-[#08111f] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
            />
          </label>
          <SelectField
            label="Status"
            value={productFilter}
            options={productFilterOptions}
            onChange={(value) => setProductFilter(value as ProductFilter)}
          />
          <SelectField
            label="Stock"
            value={stockFilter}
            options={["All Stock", ...stockStatuses]}
            onChange={(value) => setStockFilter(value as typeof stockFilter)}
          />
          <button
            type="button"
            disabled
            title="Tag filters are not connected yet."
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/30"
          >
            <Tag className="h-4 w-4" />
            Tags soon
          </button>
          <button
            type="button"
            disabled
            title="Advanced filters are not connected yet."
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/30"
          >
            <Command className="h-4 w-4" />
            More soon
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleProducts.length} of {products.length} products
          </span>
          {(productSearchTerm || productFilter !== "All" || categoryFilter !== "All Categories" || stockFilter !== "All Stock") && (
            <button
              type="button"
              onClick={() => {
                setProductSearchTerm("");
                setProductFilter("All");
                setCategoryFilter("All Categories");
                setStockFilter("All Stock");
              }}
              className="w-fit text-cyan-100/75 transition hover:text-cyan-50"
            >
              Clear product filters
            </button>
          )}
        </div>
      </section>

      {editingProduct && !isEditingExistingProduct && (
        <div className="aev-admin-control-panel rounded-[1.35rem] border p-4">
          <ProductEditor
            key={editingProduct.id}
            product={editingProduct}
            onCancel={() => { setEditingProduct(null); setSaveError(null); }}
            onSave={saveProduct}
            isSaving={isSavingProduct}
            saveError={saveError}
            canUploadMedia={canUploadProductMedia}
          />
        </div>
      )}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="aev-admin-control-panel min-w-0 rounded-[1.35rem] border p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionHeader title="Product Catalog" />
              <p className="mt-1 text-xs text-white/42">{visibleProducts.length} products in command view</p>
            </div>
            <button
              type="button"
              onClick={addProduct}
              disabled={!canEditProducts}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-3 text-xs font-semibold text-cyan-50 transition hover:border-cyan-100/45 hover:bg-cyan-200/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
          {visibleProducts.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] p-6 text-center text-sm text-white/58">
              {productSearchTerm.trim()
                ? "No products found for this search."
                : "No products in this filter."}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const isEditingThisProduct = editingProductId === product.id;
                const isSelected = selectedProduct?.id === product.id;

                return (
                  <ProductCommandCard
                    key={product.id}
                    product={product}
                    isSelected={isSelected}
                    isEditing={isEditingThisProduct}
                    isSaving={isSavingProduct}
                    canEdit={canEditProducts}
                    onSelect={() => setSelectedProductId(product.id)}
                    onEdit={() => openEditor(product)}
                    onToggleStatus={() => toggleStatus(product.id)}
                    onDelete={() => deleteProduct(product.id)}
                    onRestore={() => restoreProduct(product.id)}
                    onPermanentDelete={() => permanentlyDeleteProduct(product)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <aside className="grid min-w-0 gap-4 2xl:content-start">
          <ControlRoomPanel title="Quick Actions">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={addProduct} disabled={!canEditProducts} className="aev-admin-quick-action">
                <Plus className="h-4 w-4" />
                Add Product
              </button>
              <button type="button" disabled className="aev-admin-quick-action is-disabled" title="Duplicate is not implemented yet.">
                <Copy className="h-4 w-4" />
                Duplicate soon
              </button>
              <button type="button" onClick={() => selectedProduct && deleteProduct(selectedProduct.id)} disabled={!selectedProduct || isSavingProduct || !canEditProducts} className="aev-admin-quick-action">
                <Trash2 className="h-4 w-4" />
                Archive
              </button>
              <button type="button" onClick={() => selectedProduct && setProductStatus(selectedProduct.id, "Active")} disabled={!selectedProduct || selectedProduct.status === "Active" || isSavingProduct || !canEditProducts} className="aev-admin-quick-action">
                <Send className="h-4 w-4" />
                Publish
              </button>
              <button type="button" onClick={() => selectedProduct && setProductStatus(selectedProduct.id, "Draft")} disabled={!selectedProduct || selectedProduct.status === "Draft" || isSavingProduct || !canEditProducts} className="aev-admin-quick-action">
                <Inbox className="h-4 w-4" />
                Save Draft
              </button>
              <button type="button" disabled className="aev-admin-quick-action is-disabled" title="Bulk upload is not implemented yet.">
                <Upload className="h-4 w-4" />
                Bulk soon
              </button>
              <button type="button" disabled className="aev-admin-quick-action is-disabled" title="Product import is not implemented yet.">
                <ArrowLeft className="h-4 w-4" />
                Import soon
              </button>
              <button type="button" onClick={exportProductsCsv} className="aev-admin-quick-action">
                <Rows3 className="h-4 w-4" />
                Download
              </button>
            </div>
          </ControlRoomPanel>

          <ControlRoomPanel title="Product Health" badge={`${healthPercent}% healthy`}>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-20 place-items-center rounded-full border border-emerald-200/25 bg-emerald-200/[0.08] text-xl font-semibold text-emerald-100 shadow-[0_0_28px_rgba(94,240,174,0.14)]">
                    {healthPercent}%
                  </div>
                  <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-center">
                    <StatusMetric label="Healthy" value={String(healthyCount)} tone="green" />
                    <StatusMetric label="Attention" value={String(healthAttention.size)} tone="amber" />
                    <StatusMetric label="Critical" value={String(healthCritical)} tone="amber" />
                  </div>
                </div>
              </div>
              <ProductHealthList title="Low stock" products={lowStockProducts} emptyLabel="No low stock products." />
              <ProductHealthList title="Out of stock" products={outOfStockProducts} emptyLabel="No out of stock products." critical />
              <ProductHealthList title="Draft products" products={draftProducts} emptyLabel="No draft products." />
            </div>
          </ControlRoomPanel>

          <ControlRoomPanel title="Recent Product Activity" badge="Derived from product timestamps">
            <div className="space-y-2">
              {recentProducts.length === 0 ? (
                <NoDataState label="No product activity yet." />
              ) : (
                recentProducts.map((product) => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className="aev-admin-activity-row w-full text-left"
                  >
                    <span className="aev-admin-activity-dot tone-cyan" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white/78">{product.name}</span>
                      <span className="block truncate text-xs text-white/42">
                        {product.updatedAt ? `Updated ${formatDate(product.updatedAt)}` : product.createdAt ? `Created ${formatDate(product.createdAt)}` : "Recent catalog change"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </ControlRoomPanel>
        </aside>
      </div>

      <ProductCmsWorkspace
        product={selectedProduct}
        canEdit={canEditProducts}
        canUploadMedia={canUploadProductMedia}
        isSaving={isSavingProduct}
        onEdit={selectedProduct ? () => openEditor(selectedProduct) : undefined}
        onDraft={selectedProduct ? () => setProductStatus(selectedProduct.id, "Draft") : undefined}
        onPublish={selectedProduct ? () => setProductStatus(selectedProduct.id, "Active") : undefined}
      />

      {editingProduct && isEditingExistingProduct && !editingProduct.deletedAt && (
        <div ref={inlineEditorRef} className="scroll-mt-6">
          <ProductEditor
            key={editingProduct.id}
            product={editingProduct}
            onCancel={() => { setEditingProduct(null); setSaveError(null); }}
            onSave={saveProduct}
            isSaving={isSavingProduct}
            saveError={saveError}
            canUploadMedia={canUploadProductMedia}
          />
        </div>
      )}
    </div>
  );
}

function ProductMetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "pink" | "cyan" | "violet" | "green" | "amber";
  icon: ReactNode;
}) {
  return (
    <div className={`aev-admin-stat-card tone-${tone === "amber" ? "violet" : tone} min-w-0 rounded-[1.05rem] border p-4`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-current/20 bg-current/[0.08]">
          {icon}
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-white/35">Live</span>
      </div>
      <p className="mt-3 text-xs text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-[11px] text-emerald-200/70">Real catalog data</p>
    </div>
  );
}

function productPrimaryImage(product: AdminProduct) {
  return product.imageUrl || product.images?.[0] || product.posterUrl || "";
}

function ProductCommandCard({
  product,
  isSelected,
  isEditing,
  isSaving,
  canEdit,
  onSelect,
  onEdit,
  onToggleStatus,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  product: AdminProduct;
  isSelected: boolean;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const image = productPrimaryImage(product);
  const stockLabel = product.stockQuantity ?? product.stockStatus.replace(/_/g, " ");
  return (
    <article
      className={`group min-w-0 rounded-[1.15rem] border bg-black/24 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
        isSelected ? "border-cyan-200/45 shadow-[0_0_34px_rgba(34,211,238,0.12)]" : "border-white/10 hover:border-fuchsia-200/28"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b16]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} loading="lazy" className="aspect-[1.32/1] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid aspect-[1.32/1] place-items-center text-xs text-white/30">
              No media
            </div>
          )}
          <span className="absolute left-2 top-2">
            <ProductStatusBadge status={product.status} />
          </span>
          {product.deletedAt && (
            <span className="absolute right-2 top-2 rounded-full border border-rose-200/25 bg-rose-200/10 px-2 py-1 text-[10px] font-semibold text-rose-100">
              Deleted
            </span>
          )}
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">{product.name || "Untitled product"}</h3>
              <p className="mt-1 truncate text-xs text-white/42">{product.category || product.absorbency || "Uncategorized"}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/50">
              ...
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <DetailLine label="SKU / Slug" value={product.slug} />
            <DetailLine label="Price" value={product.price || formatCurrency(0)} />
            <DetailLine label="Stock" value={String(stockLabel)} />
            <DetailLine label="Visual" value={product.visualVariant || product.visualTheme} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <ColorSwatchRow product={product} limit={5} />
            <StatusChip
              label={product.stockStatus.replace(/_/g, " ")}
              tone={product.stockStatus === "out_of_stock" ? "pink" : product.stockStatus === "low_stock" ? "amber" : "green"}
            />
          </div>
        </div>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {product.deletedAt ? (
          <>
            <button type="button" onClick={onRestore} disabled={isSaving} className="aev-admin-mini-action justify-center text-emerald-100">
              Restore
            </button>
            <button type="button" onClick={onPermanentDelete} disabled={isSaving} className="aev-admin-mini-action col-span-2 justify-center text-rose-100">
              Delete forever
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onEdit} disabled={isSaving || !canEdit} className="aev-admin-mini-action justify-center text-cyan-100">
              <Pencil className="h-3 w-3" />
              {isEditing ? "Editing" : "Edit"}
            </button>
            <button type="button" onClick={onToggleStatus} disabled={isSaving || !canEdit} className="aev-admin-mini-action justify-center text-violet-100">
              {product.status === "Active" ? "Draft" : "Publish"}
            </button>
            <button type="button" onClick={onDelete} disabled={isSaving || !canEdit} className="aev-admin-mini-action justify-center text-rose-100">
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function ColorSwatchRow({ product, limit = 6 }: { product: AdminProduct; limit?: number }) {
  const options = product.colorOptions.length
    ? product.colorOptions
    : product.colors.map((name, index) => ({
        id: `${product.id}-color-${index}`,
        name,
        hex: safeColorHex(name),
      }));
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {options.slice(0, limit).map((color) => (
        <span
          key={color.id}
          title={color.name}
          className="h-4 w-4 rounded-full border border-white/20"
          style={{ background: color.hex || safeColorHex(color.name) }}
        />
      ))}
      {options.length > limit && <span className="text-[10px] text-white/38">+{options.length - limit}</span>}
    </div>
  );
}

function ProductHealthList({
  title,
  products,
  emptyLabel,
  critical = false,
}: {
  title: string;
  products: AdminProduct[];
  emptyLabel: string;
  critical?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
        <span className={critical ? "text-xs font-semibold text-rose-200" : "text-xs font-semibold text-cyan-100/80"}>
          {products.length}
        </span>
      </div>
      {products.length === 0 ? (
        <p className="text-xs text-white/35">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="flex min-w-0 items-center gap-2">
              <ProductThumb src={productPrimaryImage(product)} label={product.name} />
              <span className="min-w-0 flex-1 truncate text-xs text-white/65">{product.name}</span>
              <span className="text-[10px] text-white/38">{product.stockQuantity ?? product.stockStatus.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCmsWorkspace({
  product,
  canEdit,
  canUploadMedia,
  isSaving,
  onEdit,
  onDraft,
  onPublish,
}: {
  product: AdminProduct | null;
  canEdit: boolean;
  canUploadMedia: boolean;
  isSaving: boolean;
  onEdit?: () => void;
  onDraft?: () => void;
  onPublish?: () => void;
}) {
  const gallery = product
    ? [product.imageUrl, ...(product.images || []), product.posterUrl].filter((url): url is string => Boolean(url))
    : [];
  const descriptionGallery = product?.descriptionMedia?.map((item) => item.url).filter(Boolean).slice(0, 4) ?? [];
  const variantSizes = product?.sizes?.length ? product.sizes : ["Default"];
  const variantColors = product?.colors?.length ? product.colors : ["Default"];
  const rows = variantSizes.slice(0, 6).map((size, index) => {
    const color = variantColors[index % variantColors.length] ?? "Default";
    return {
      size,
      color,
      sku: `${product?.slug ?? "product"}-${size}-${color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
      stock: Math.max(0, (product?.stockQuantity ?? 0) - index * 3),
      price: product?.price || formatCurrency(0),
      status: product?.stockStatus === "out_of_stock" ? "Out" : index > 2 ? "Low" : "Active",
    };
  });

  return (
    <section className="aev-admin-cms-preview min-w-0 rounded-[1.35rem] border p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/60">Product Editor / CMS</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">{product?.name ?? "Select a product"}</h3>
            {product && <ProductStatusBadge status={product.status} />}
            {product?.slug && <span className="text-xs text-white/38">SKU: {product.slug}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {product ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="aev-admin-cms-action">
              <Globe className="h-3.5 w-3.5" />
              Preview
            </Link>
          ) : (
            <button type="button" disabled className="aev-admin-cms-action opacity-40">Preview</button>
          )}
          <button type="button" onClick={onDraft} disabled={!product || product.status === "Draft" || isSaving || !canEdit} className="aev-admin-cms-action">
            Save Draft
          </button>
          <button type="button" onClick={onPublish} disabled={!product || product.status === "Active" || isSaving || !canEdit} className="aev-admin-cms-action is-primary">
            Publish
          </button>
          <button type="button" disabled className="aev-admin-cms-action opacity-40" title="More menu is not implemented yet.">
            ...
          </button>
        </div>
      </div>

      <div className="aev-admin-cms-tabs mt-4 grid gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {["General", "Media", "Variants", "Pricing", "SEO", "Shipping", "Settings"].map((tab) => (
          <button key={tab} type="button" disabled={tab !== "Media"} className={tab === "Media" ? "is-active" : ""}>
            {tab}
          </button>
        ))}
      </div>

      {!product ? (
        <NoDataState label="Select a product card to inspect CMS media, colors, variants, and inventory." />
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr_1.45fr]">
          <div className="aev-admin-cms-card rounded-2xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Media Gallery</p>
                <p className="mt-1 text-xs text-white/42">Drag and drop uploads are handled in the live product editor.</p>
              </div>
              <button type="button" onClick={onEdit} disabled={!canEdit || !canUploadMedia} className="aev-admin-mini-action text-cyan-100">
                <Upload className="h-3 w-3" />
                Upload
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {gallery.slice(0, 5).map((image, index) => (
                <ProductThumb key={`${image}-${index}`} src={image} label={product.name} />
              ))}
              <button type="button" onClick={onEdit} disabled={!canEdit || !canUploadMedia} className="grid aspect-square place-items-center rounded-xl border border-dashed border-cyan-200/25 bg-cyan-200/[0.045] text-cyan-100/70">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-white/38">{gallery.length} files indexed.</p>
          </div>

          <div className="grid gap-4">
            <div className="aev-admin-cms-card rounded-2xl border p-3">
              <p className="text-sm font-semibold text-white">Color Mapping</p>
              <p className="mt-1 text-xs text-white/42">Color swatches and variants from product CMS data.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ColorSwatchRow product={product} limit={12} />
                <button type="button" onClick={onEdit} disabled={!canEdit} className="grid h-8 w-8 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white/45">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="aev-admin-cms-card rounded-2xl border p-3">
              <p className="text-sm font-semibold text-white">Description Gallery</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {descriptionGallery.map((image, index) => (
                  <ProductThumb key={`${image}-${index}`} src={image} label="Description media" />
                ))}
                <button type="button" onClick={onEdit} disabled={!canEdit || !canUploadMedia} className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/16 bg-white/[0.035] text-white/45">
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="aev-admin-cms-card rounded-2xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Variants & Inventory</p>
                <p className="mt-1 text-xs text-white/42">{rows.length} derived variants from size/color data.</p>
              </div>
              <button type="button" onClick={onEdit} disabled={!canEdit} className="aev-admin-mini-action text-pink-100">
                Manage Inventory
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-white/38">
                  <tr>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Color</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-white/62">
                  {rows.map((row) => (
                    <tr key={row.sku}>
                      <td className="px-3 py-2">{row.size}</td>
                      <td className="px-3 py-2">{row.color}</td>
                      <td className="px-3 py-2 text-white/38">{row.sku}</td>
                      <td className="px-3 py-2">{row.stock}</td>
                      <td className="px-3 py-2">{row.price}</td>
                      <td className="px-3 py-2">
                        <StatusChip label={row.status} tone={row.status === "Active" ? "green" : row.status === "Low" ? "amber" : "pink"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MediaSection({
  products,
  session,
}: {
  products: AdminProduct[];
  session: AdminSessionUser;
}) {
  const canUpload = hasPermission(session, "products.media");
  const productMedia = products
    .filter((product) => !product.deletedAt)
    .flatMap((product) => {
      const primaryMedia = [product.imageUrl, product.posterUrl, ...product.images]
        .filter((url): url is string => Boolean(url))
        .map((url, index) => ({
          id: `${product.id}-primary-${index}`,
          url,
          product,
          type: /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ? "Video" : "Image",
          zone: index === 0 ? "Primary visual" : "Gallery",
        }));
      const sectionMedia = Object.entries(product.sectionMedia || {})
        .flatMap(([zone, item]) => [item?.url]
          .filter((url): url is string => Boolean(url))
          .map((url, index) => ({
            id: `${product.id}-${zone}-${index}`,
            url,
            product,
            type: item?.type === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ? "Video" : "Image",
            zone: productSectionLabels[zone as ProductSectionMediaKey] ?? zone,
          })));
      const descriptionMedia = (product.descriptionMedia || [])
        .filter((item) => item.url)
        .map((item, index) => ({
          id: `${product.id}-description-${index}`,
          url: item.url,
          product,
          type: item.type === "video" ? "Video" : "Image",
          zone: item.alt || "Description gallery",
        }));

      return [...primaryMedia, ...sectionMedia, ...descriptionMedia];
    });
  const imageCount = productMedia.filter((item) => item.type === "Image").length;
  const videoCount = productMedia.filter((item) => item.type === "Video").length;
  const featuredProducts = products.filter((product) => !product.deletedAt && (product.imageUrl || product.images.length > 0)).slice(0, 4);

  return (
    <div className="aev-admin-page-stack mt-6 space-y-5">
      <section className="aev-admin-page-hero rounded-[1.35rem] border p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div className="min-w-0">
            <span className="aev-admin-chip">
              <ImageIcon className="h-3.5 w-3.5" />
              Media Vault
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Product visual operations
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">
              A command view for product imagery, video assets, section media, and CMS visual coverage. Uploads continue through the existing product editor so backend behavior stays intact.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatusMetric label="Assets indexed" value={String(productMedia.length)} tone="green" />
              <StatusMetric label="Images" value={String(imageCount)} tone="green" />
              <StatusMetric label="Videos" value={String(videoCount)} tone={videoCount > 0 ? "green" : "amber"} />
            </div>
          </div>
          <div className="aev-admin-media-orb min-h-[210px] rounded-[1.25rem] border">
            <div className="aev-admin-orb-core" />
            <div className="aev-admin-orb-ring ring-one" />
            <div className="aev-admin-orb-ring ring-two" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="aev-admin-control-panel rounded-[1.35rem] border p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Vault index" />
            <Link
              href="/admin/products"
              data-admin-sound="primary"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-pink-200/30 bg-pink-300/12 px-4 text-sm font-semibold text-pink-50 transition hover:border-pink-100/55"
            >
              <Upload className="h-4 w-4" />
              Upload in product CMS
            </Link>
          </div>
          {productMedia.length === 0 ? (
            <NoDataState label="No product media has been indexed yet." />
          ) : (
            <div className="aev-admin-media-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {productMedia.slice(0, 24).map((item) => (
                <article key={item.id} className="aev-admin-media-card rounded-2xl border p-3">
                  <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {item.type === "Video" ? (
                      <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="mt-3 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{item.product.name}</p>
                      <StatusChip label={item.type} tone={item.type === "Video" ? "pink" : "cyan"} />
                    </div>
                    <p className="mt-1 truncate text-xs text-white/42">{item.zone}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <ControlRoomPanel title="Upload Protocol" badge={canUpload ? "Enabled" : "Read only"}>
            <div className="space-y-3 text-sm leading-6 text-white/58">
              <p>
                Product, category, review, and homepage upload handlers are preserved. This vault surfaces the connected assets without inventing a separate backend.
              </p>
              <Link href="/admin/products" className="aev-admin-panel-action flex min-h-10 items-center justify-center rounded-xl border text-xs font-semibold">
                Open product editor
              </Link>
            </div>
          </ControlRoomPanel>
          <ControlRoomPanel title="Coverage Radar">
            <div className="space-y-3">
              {featuredProducts.map((product) => (
                <div key={product.id} className="aev-admin-compact-row">
                  <ProductThumb src={product.imageUrl || product.images[0]} label={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-white/42">{product.images.length} gallery assets</p>
                  </div>
                  <StatusChip label={product.status} tone={product.status === "Active" ? "green" : "amber"} />
                </div>
              ))}
              {featuredProducts.length === 0 && <NoDataState label="No visual coverage yet." />}
            </div>
          </ControlRoomPanel>
        </aside>
      </section>
    </div>
  );
}

function ProductEditor({
  product,
  onCancel,
  onSave,
  isSaving,
  saveError,
  canUploadMedia,
}: {
  product: AdminProduct;
  onCancel: () => void;
  onSave: (product: AdminProduct) => void | Promise<void>;
  isSaving: boolean;
  saveError?: string | null;
  canUploadMedia: boolean;
}) {
  const [draft, setDraft] = useState(product);
  const [sizes, setSizes] = useState(listToText(product.sizes));
  const [colors, setColors] = useState(listToText(product.colors));
  const [benefits, setBenefits] = useState(listToLines(product.benefits));
  const [care, setCare] = useState(listToLines(product.care));
  const [localError, setLocalError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [cmsUploading, setCmsUploading] = useState<Record<string, boolean>>({});
  const [cmsUploadError, setCmsUploadError] = useState<Record<string, string | null>>({});

  const updateField = (field: keyof AdminProduct, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setLocalError(null);
  };

  const updateSectionMedia = (
    section: ProductSectionMediaKey,
    updates: Partial<NonNullable<ProductSectionMediaMap[ProductSectionMediaKey]>>
  ) => {
    setDraft((current) => {
      const existing = current.sectionMedia[section] ?? createEmptySectionMedia();
      return {
        ...current,
        sectionMedia: {
          ...current.sectionMedia,
          [section]: { ...existing, ...updates },
        },
      };
    });
  };

  const clearSectionMedia = (section: ProductSectionMediaKey) => {
    setDraft((current) => {
      const next = { ...current.sectionMedia };
      delete next[section];
      return { ...current, sectionMedia: next };
    });
  };

  const updateDescriptionMedia = (
    id: string,
    updates: Partial<ProductDescriptionMediaItem>
  ) => {
    setDraft((current) => ({
      ...current,
      descriptionMedia: current.descriptionMedia.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const addDescriptionMediaUrl = () => {
    setDraft((current) => ({
      ...current,
      descriptionMedia: [
        ...current.descriptionMedia,
        {
          ...createDescriptionMediaItem(),
          sortOrder: current.descriptionMedia.length + 1,
        },
      ],
    }));
  };

  const moveDescriptionMedia = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const next = [...current.descriptionMedia];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...current,
        descriptionMedia: next.map((item, itemIndex) => ({
          ...item,
          sortOrder: itemIndex + 1,
        })),
      };
    });
  };

  const removeDescriptionMedia = (id: string) => {
    setDraft((current) => ({
      ...current,
      descriptionMedia: current.descriptionMedia
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 })),
    }));
  };

  const uploadCmsMedia = async (file: File, key: string, onUploaded: (url: string, type: "image" | "video") => void) => {
    if (!canUploadMedia) {
      setCmsUploadError((current) => ({ ...current, [key]: blockedPermissionMessage }));
      return;
    }
    setCmsUploading((current) => ({ ...current, [key]: true }));
    setCmsUploadError((current) => ({ ...current, [key]: null }));

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productSlug", draft.slug || "draft");

      const response = await fetch("/api/product-media/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok || typeof payload.url !== "string") {
        const msg = Array.isArray(payload.errors) && typeof payload.errors[0] === "string"
          ? payload.errors[0]
          : "Upload failed.";
        setCmsUploadError((current) => ({ ...current, [key]: msg }));
        return;
      }
      onUploaded(payload.url, payload.type === "video" ? "video" : "image");
    } catch {
      setCmsUploadError((current) => ({ ...current, [key]: "Upload failed. Check your connection." }));
    } finally {
      setCmsUploading((current) => ({ ...current, [key]: false }));
    }
  };

  const uploadDescriptionMediaFiles = async (files: FileList | File[]) => {
    const uploadFiles = Array.from(files);
    for (const [index, file] of uploadFiles.entries()) {
      await uploadCmsMedia(file, `description-media-${Date.now()}-${index}`, (url, type) => {
        setDraft((current) => ({
          ...current,
          descriptionMedia: [
            ...current.descriptionMedia,
            {
              ...createDescriptionMediaItem(url),
              type,
              alt: draft.name,
              sortOrder: current.descriptionMedia.length + 1,
            },
          ],
        }));
      });
    }
  };

  async function handleMediaUpload(file: File, mediaType: "image" | "video" | "gallery") {
    if (!canUploadMedia) {
      const msg = blockedPermissionMessage;
      if (mediaType === "image") setImageUploadError(msg);
      else if (mediaType === "gallery") setGalleryUploadError(msg);
      else setVideoUploadError(msg);
      return;
    }
    if (mediaType === "image") { setImageUploading(true); setImageUploadError(null); }
    else if (mediaType === "gallery") { setGalleryUploading(true); setGalleryUploadError(null); }
    else { setVideoUploading(true); setVideoUploadError(null); }

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productSlug", draft.slug || "draft");

      const response = await fetch("/api/product-media/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const payload = (await response.json()) as Record<string, unknown>;

      if (!response.ok || typeof payload.url !== "string") {
        const msg = Array.isArray(payload.errors) && typeof payload.errors[0] === "string"
          ? payload.errors[0]
          : "Upload failed.";
        if (mediaType === "image") setImageUploadError(msg);
        else if (mediaType === "gallery") setGalleryUploadError(msg);
        else setVideoUploadError(msg);
        return;
      }

      const uploadedUrl = payload.url as string;
      if (mediaType === "image") {
        setDraft((current) => ({ ...current, imageUrl: uploadedUrl }));
      } else if (mediaType === "gallery") {
        setDraft((current) => ({
          ...current,
          images: [...(current.images || []), uploadedUrl],
        }));
      } else {
        setDraft((current) => ({ ...current, videoUrl: uploadedUrl }));
      }
    } catch {
      const msg = "Upload failed. Check your connection.";
      if (mediaType === "image") setImageUploadError(msg);
      else if (mediaType === "gallery") setGalleryUploadError(msg);
      else setVideoUploadError(msg);
    } finally {
      if (mediaType === "image") setImageUploading(false);
      else if (mediaType === "gallery") setGalleryUploading(false);
      else setVideoUploading(false);
    }
  }

  const handleGalleryRemove = (index: number) => {
    setDraft((current) => ({
      ...current,
      images: (current.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleGalleryMoveUp = (index: number) => {
    if (index === 0) return;
    setDraft((current) => {
      const imgs = [...(current.images || [])];
      [imgs[index - 1], imgs[index]] = [imgs[index], imgs[index - 1]];
      return { ...current, images: imgs };
    });
  };

  const handleGalleryMoveDown = (index: number) => {
    setDraft((current) => {
      const imgs = [...(current.images || [])];
      if (index >= imgs.length - 1) return current;
      [imgs[index], imgs[index + 1]] = [imgs[index + 1], imgs[index]];
      return { ...current, images: imgs };
    });
  };

  const handleGallerySetMain = (url: string) => {
    setDraft((current) => ({
      ...current,
      imageUrl: url,
      images: (current.images || []).filter((img) => img !== url),
    }));
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const next = {
      ...draft,
      slug: draft.slug || slugify(draft.name),
      sizes: textToList(sizes),
      colors: draft.colorOptions.length > 0
        ? draft.colorOptions
            .filter((color) => color.visible !== false)
            .map((color) => color.name.trim())
            .filter(Boolean)
        : textToList(colors),
      colorOptions: draft.colorOptions.map((color, index) => ({
        ...color,
        name: color.name.trim(),
        hex: color.hex.trim() || safeColorHex(color.name),
        visible: color.visible !== false,
        sortOrder: color.sortOrder ?? index + 1,
      })).filter((color) => color.name),
      contentBlocks: draft.contentBlocks.map((block, index) => ({
        ...block,
        sortOrder: block.sortOrder ?? index + 1,
        visible: block.visible !== false,
      })),
      descriptionMedia: draft.descriptionMedia.map((item, index) => ({
        ...item,
        url: item.url.trim(),
        alt: item.alt.trim(),
        caption: item.caption.trim(),
        visible: item.visible !== false,
        sortOrder: item.sortOrder ?? index + 1,
      })).filter((item) => item.url),
      benefits: linesToList(benefits),
      care: linesToList(care),
    };

    if (next.status === "Active") {
      const missing: string[] = [];
      if (!next.shortDescription.trim()) missing.push("Short description");
      if (!next.description.trim()) missing.push("Description");
      if (!next.category.trim()) missing.push("Category");
      if (missing.length > 0) {
        setLocalError(
          `Active products require: ${missing.join(", ")}. Fill these fields or set status to Draft.`
        );
        return;
      }
    }

    onSave(next);
  };

  const displayError = saveError ?? localError;

  return (
    <form
      onSubmit={submitProduct}
      className="min-w-0 rounded-[1.35rem] border border-cyan-200/18 bg-cyan-200/[0.045] p-4 shadow-[0_0_42px_rgba(34,211,238,0.08)] sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
            Product editor
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {product.name ? "Edit product" : "Add product"}
          </h3>
        </div>
        <ProductStatusBadge status={draft.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <TextField label="Product name" value={draft.name} onChange={(value) => updateField("name", value)} required />
        <TextField label="Slug" value={draft.slug} onChange={(value) => updateField("slug", slugify(value))} required />
        <TextField label="Price" value={draft.price} onChange={(value) => updateField("price", value)} placeholder="BDT 1,450" />
        <TextField label="Compare-at price" value={draft.compareAtPrice} onChange={(value) => updateField("compareAtPrice", value)} placeholder="BDT 1,800" />
        <label className="relative block min-w-0">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">Category</span>
          <select
            value={draft.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 pr-9 text-sm text-white outline-none transition focus:border-cyan-200/40"
          >
            {(CMS_CATEGORY_NAMES as readonly string[]).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            {!(CMS_CATEGORY_NAMES as readonly string[]).includes(draft.category) && draft.category && (
              <option value={draft.category}>{draft.category} (legacy)</option>
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-white/45" />
        </label>
        <TextField label="Absorbency" value={draft.absorbency} onChange={(value) => updateField("absorbency", value)} />
        <TextField label="Sizes" value={sizes} onChange={setSizes} placeholder="XS, S, M, L, XL" />
        <TextField label="Colors" value={colors} onChange={setColors} placeholder="Black, Nude, Soft Pink" />
        <SelectField
          label="Status"
          value={draft.status}
          options={productStatuses}
          onChange={(value) => setDraft((current) => ({ ...current, status: value as ProductStatus }))}
        />
        <SelectField
          label="Stock status"
          value={draft.stockStatus}
          options={stockStatuses}
          onChange={(value) =>
            setDraft((current) => ({ ...current, stockStatus: value as ProductStockStatus }))
          }
        />
        <TextField
          label="Stock quantity"
          value={draft.stockQuantity?.toString() ?? ""}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              stockQuantity: value.trim() ? Number(value) : undefined,
            }))
          }
          placeholder="24"
        />
        <SelectField
          label="Featured"
          value={draft.featured ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, featured: value === "Yes" }))
          }
        />
        <SelectField
          label="Trending"
          value={draft.isTrending ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, isTrending: value === "Yes" }))
          }
        />
        <SelectField
          label="Best seller"
          value={draft.isBestSeller ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, isBestSeller: value === "Yes" }))
          }
        />
        <SelectField
          label="New arrival"
          value={draft.isNewArrival ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, isNewArrival: value === "Yes" }))
          }
        />
        <TextField
          label="Badge text"
          value={draft.badgeText}
          onChange={(value) => updateField("badgeText", value)}
          placeholder="Admin-set label only"
        />
        <SelectField
          label="Badge style"
          value={draft.badgeStyle}
          options={["info", "promo", "warning", "success"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, badgeStyle: value }))
          }
        />
        <TextField
          label="Sort order"
          value={draft.sortOrder?.toString() ?? ""}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              sortOrder: value.trim() ? Number(value) : undefined,
            }))
          }
          placeholder="1"
        />
        <TextField
          label="Low stock threshold"
          value={draft.lowStockThreshold?.toString() ?? ""}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              lowStockThreshold: value.trim() ? Number(value) : undefined,
            }))
          }
          placeholder="5"
        />
        <SelectField
          label="Show on homepage"
          value={draft.showOnHomepage ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({ ...current, showOnHomepage: value === "Yes" }))
          }
        />
        <SelectField
          label="Featured collection"
          value={draft.showInFeaturedCollection ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              showInFeaturedCollection: value === "Yes",
            }))
          }
        />
        <SelectField
          label="Visual theme"
          value={draft.visualTheme}
          options={visualThemes}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              visualTheme: value as ProductVisualTheme,
              visualVariant: current.visualVariant || value,
            }))
          }
        />
        <TextField label="Visual variant" value={draft.visualVariant} onChange={(value) => updateField("visualVariant", value)} />
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="border-t border-white/8 pt-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/60">
              Product Media
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaUploadField
                label="Main Image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                mediaType="image"
                currentUrl={draft.imageUrl}
                uploading={imageUploading}
                error={imageUploadError}
                onUpload={(file) => handleMediaUpload(file, "image")}
                onClear={() => setDraft((current) => ({ ...current, imageUrl: "" }))}
              />
              <MediaUploadField
                label="Product Video"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                mediaType="video"
                currentUrl={draft.videoUrl}
                uploading={videoUploading}
                error={videoUploadError}
                onUpload={(file) => handleMediaUpload(file, "video")}
                onClear={() => setDraft((current) => ({ ...current, videoUrl: "" }))}
              />
            </div>
            <div className="mt-4">
              <GalleryImagesManager
                images={draft.images || []}
                uploading={galleryUploading}
                uploadError={galleryUploadError}
                onUpload={(file) => handleMediaUpload(file, "gallery")}
                onRemove={handleGalleryRemove}
                onMoveUp={handleGalleryMoveUp}
                onMoveDown={handleGalleryMoveDown}
                onSetMain={handleGallerySetMain}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <AdminEditorCard title="Description Media / Story Blocks" eyebrow="CMS content">
            <div className="grid gap-4 lg:grid-cols-2">
              {(Object.keys(productSectionLabels) as ProductSectionMediaKey[]).map((section) => {
                const item = draft.sectionMedia[section] ?? createEmptySectionMedia();
                const uploadKey = `section-${section}`;
                return (
                  <div key={section} className="rounded-2xl border border-white/10 bg-black/18 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                        {productSectionLabels[section]}
                      </p>
                      {draft.sectionMedia[section]?.url && (
                        <button
                          type="button"
                          onClick={() => clearSectionMedia(section)}
                          className="text-xs font-semibold text-rose-200/80 hover:text-rose-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <TextField
                        label="Media URL"
                        value={item.url}
                        onChange={(value) => updateSectionMedia(section, { url: value })}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField
                          label="Media type"
                          value={item.type}
                          options={["auto", "image", "video"]}
                          onChange={(value) => updateSectionMedia(section, { type: value as "auto" | "image" | "video" })}
                        />
                        <SelectField
                          label="Media fit"
                          value={item.fit}
                          options={["contain", "smart", "cover"]}
                          onChange={(value) => updateSectionMedia(section, { fit: value as "contain" | "smart" | "cover" })}
                        />
                      </div>
                      <TextField
                        label="Alt text"
                        value={item.alt}
                        onChange={(value) => updateSectionMedia(section, { alt: value })}
                      />
                      <MiniUploadButton
                        label="Upload image/video"
                        uploading={Boolean(cmsUploading[uploadKey])}
                        error={cmsUploadError[uploadKey] ?? null}
                        onUpload={(file) =>
                          uploadCmsMedia(file, uploadKey, (url, type) =>
                            updateSectionMedia(section, { url, type })
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <DescriptionMediaManager
              items={draft.descriptionMedia}
              uploading={Object.keys(cmsUploading).some((key) => key.startsWith("description-media") && cmsUploading[key])}
              uploadError={
                Object.entries(cmsUploadError).find(([key, value]) => key.startsWith("description-media") && value)?.[1] ?? null
              }
              onAddUrl={addDescriptionMediaUrl}
              onUploadFiles={uploadDescriptionMediaFiles}
              onChange={updateDescriptionMedia}
              onRemove={removeDescriptionMedia}
              onMove={moveDescriptionMedia}
            />

            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Optional extra description blocks
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      contentBlocks: [...current.contentBlocks, createContentBlock()],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add block
                </button>
              </div>
              {draft.contentBlocks.map((block, index) => (
                <ContentBlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  uploading={Boolean(cmsUploading[`block-${block.id}`])}
                  uploadError={cmsUploadError[`block-${block.id}`] ?? null}
                  onChange={(updates) =>
                    setDraft((current) => ({
                      ...current,
                      contentBlocks: current.contentBlocks.map((item) =>
                        item.id === block.id ? { ...item, ...updates } : item
                      ),
                    }))
                  }
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      contentBlocks: current.contentBlocks.filter((item) => item.id !== block.id),
                    }))
                  }
                  onUpload={(file) =>
                    uploadCmsMedia(file, `block-${block.id}`, (url, type) =>
                      setDraft((current) => ({
                        ...current,
                        contentBlocks: current.contentBlocks.map((item) =>
                          item.id === block.id ? { ...item, mediaUrl: url, mediaType: type } : item
                        ),
                      }))
                    )
                  }
                />
              ))}
            </div>
          </AdminEditorCard>

          <AdminEditorCard title="Variants & Color Media" eyebrow="Color system">
            <TextField
              label="Legacy color list fallback"
              value={colors}
              onChange={setColors}
              placeholder="Black, Nude, Soft Pink"
            />
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Color options with real swatches and linked media
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      colorOptions: [...current.colorOptions, createColorOption()],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add color
                </button>
              </div>
              {draft.colorOptions.map((color, index) => (
                <ColorOptionEditor
                  key={color.id}
                  color={color}
                  index={index}
                  uploading={Boolean(cmsUploading[`color-${color.id}`])}
                  swatchUploading={Boolean(cmsUploading[`swatch-${color.id}`])}
                  uploadError={cmsUploadError[`color-${color.id}`] ?? cmsUploadError[`swatch-${color.id}`] ?? null}
                  onChange={(updates) =>
                    setDraft((current) => ({
                      ...current,
                      colorOptions: current.colorOptions.map((item) =>
                        item.id === color.id ? { ...item, ...updates } : item
                      ),
                    }))
                  }
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      colorOptions: current.colorOptions.filter((item) => item.id !== color.id),
                    }))
                  }
                  onMove={(direction) =>
                    setDraft((current) => {
                      const next = [...current.colorOptions];
                      const target = index + direction;
                      if (target < 0 || target >= next.length) return current;
                      [next[index], next[target]] = [next[target], next[index]];
                      return {
                        ...current,
                        colorOptions: next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 })),
                      };
                    })
                  }
                  onUploadMedia={(file) =>
                    uploadCmsMedia(file, `color-${color.id}`, (url, type) =>
                      setDraft((current) => ({
                        ...current,
                        colorOptions: current.colorOptions.map((item) =>
                          item.id === color.id ? { ...item, mediaUrl: url, mediaType: type } : item
                        ),
                      }))
                    )
                  }
                  onUploadSwatch={(file) =>
                    uploadCmsMedia(file, `swatch-${color.id}`, (url) =>
                      setDraft((current) => ({
                        ...current,
                        colorOptions: current.colorOptions.map((item) =>
                          item.id === color.id ? { ...item, swatchImageUrl: url } : item
                        ),
                      }))
                    )
                  }
                />
              ))}
            </div>
          </AdminEditorCard>

          <AdminEditorCard title="Benefits, FAQ & Theme" eyebrow="Future-proof content">
            <div className="grid gap-4 lg:grid-cols-2">
              <DynamicItemsEditor
                title="Editable comfort points"
                items={draft.benefitItems}
                emptyLabel="No custom reason rows yet. Fallback benefits stay policy-safe."
                onAdd={() =>
                  setDraft((current) => ({
                    ...current,
                    benefitItems: [...current.benefitItems, createBenefitItem()],
                  }))
                }
                renderItem={(item, index) => (
                  <BenefitItemEditor
                    key={item.id}
                    item={item}
                    index={index}
                    onChange={(updates) =>
                      setDraft((current) => ({
                        ...current,
                        benefitItems: current.benefitItems.map((benefit) =>
                          benefit.id === item.id ? { ...benefit, ...updates } : benefit
                        ),
                      }))
                    }
                    onRemove={() =>
                      setDraft((current) => ({
                        ...current,
                        benefitItems: current.benefitItems.filter((benefit) => benefit.id !== item.id),
                      }))
                    }
                  />
                )}
              />
              <DynamicItemsEditor
                title="Product-specific FAQ"
                items={draft.faqItems}
                emptyLabel="No product FAQ yet. Store support FAQs remain available."
                onAdd={() =>
                  setDraft((current) => ({
                    ...current,
                    faqItems: [...current.faqItems, createFaqItem()],
                  }))
                }
                renderItem={(item, index) => (
                  <FaqItemEditor
                    key={item.id}
                    item={item}
                    index={index}
                    onChange={(updates) =>
                      setDraft((current) => ({
                        ...current,
                        faqItems: current.faqItems.map((faq) =>
                          faq.id === item.id ? { ...faq, ...updates } : faq
                        ),
                      }))
                    }
                    onRemove={() =>
                      setDraft((current) => ({
                        ...current,
                        faqItems: current.faqItems.filter((faq) => faq.id !== item.id),
                      }))
                    }
                  />
                )}
              />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <TextField
                label="Accent color"
                value={draft.visualThemeSettings.accentColor}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    visualThemeSettings: { ...current.visualThemeSettings, accentColor: value },
                  }))
                }
                placeholder="#FF4DB8"
              />
              <TextField
                label="Secondary accent"
                value={draft.visualThemeSettings.secondaryAccent}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    visualThemeSettings: { ...current.visualThemeSettings, secondaryAccent: value },
                  }))
                }
                placeholder="#31E6D4"
              />
              <TextField
                label="Media glow color"
                value={draft.visualThemeSettings.mediaGlowColor}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    visualThemeSettings: { ...current.visualThemeSettings, mediaGlowColor: value },
                  }))
                }
                placeholder="#FF4DB8"
              />
            </div>
          </AdminEditorCard>
        </div>
        <TextField label="SEO title" value={draft.seoTitle} onChange={(value) => updateField("seoTitle", value)} />
        <TextAreaField label="Short description" value={draft.shortDescription} onChange={(value) => updateField("shortDescription", value)} />
        <TextAreaField label="SEO description" value={draft.seoDescription} onChange={(value) => updateField("seoDescription", value)} />
        <TextAreaField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} tall />
        <TextAreaField label="Benefits" value={benefits} onChange={setBenefits} tall />
        <TextAreaField label="Care" value={care} onChange={setCare} tall />
      </div>

      {displayError && (
        <div className="mt-4 rounded-xl border border-rose-200/25 bg-rose-200/[0.08] p-3 text-sm leading-5 text-rose-100/90">
          {displayError}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/68 transition hover:border-white/25 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          {isSaving ? "Saving..." : "Save product"}
        </button>
      </div>
    </form>
  );
}

function AdminEditorCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <details open className="group rounded-[1.25rem] border border-white/10 bg-black/22 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/55">
            {eyebrow}
          </span>
          <span className="mt-1 block text-base font-semibold text-white">{title}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/45 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function MiniUploadButton({
  label,
  uploading,
  error,
  onUpload,
}: {
  label: string;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/18 bg-white/[0.035] px-3 text-xs font-semibold text-white/58 transition hover:border-cyan-200/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Uploading..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      {error && <p className="mt-1.5 text-xs text-rose-300/90">{error}</p>}
    </div>
  );
}

function DescriptionMediaManager({
  items,
  uploading,
  uploadError,
  onAddUrl,
  onUploadFiles,
  onChange,
  onRemove,
  onMove,
}: {
  items: ProductDescriptionMediaItem[];
  uploading: boolean;
  uploadError: string | null;
  onAddUrl: () => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onChange: (id: string, updates: Partial<ProductDescriptionMediaItem>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onUploadFiles(files);
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/18 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Description Media Gallery
          </p>
          <p className="mt-1 text-xs leading-5 text-white/42">
            Compact product-page gallery. Upload many files or add URLs, then order them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddUrl}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 text-xs font-semibold text-white/70"
          >
            <Plus className="h-3.5 w-3.5" />
            Add URL
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 text-xs font-semibold text-cyan-50 disabled:opacity-55"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload files"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-2xl border border-dashed p-4 text-center text-xs text-white/45 transition ${
          isDragging
            ? "border-cyan-200/55 bg-cyan-200/[0.08] text-cyan-50"
            : "border-white/14 bg-white/[0.025]"
        }`}
      >
        Drop product description photos or videos here
      </div>
      {uploadError && <p className="mt-2 text-xs text-rose-300/90">{uploadError}</p>}

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/12 bg-black/20 p-4 text-sm text-white/42">
            No description media yet.
          </p>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-[#08111f] p-3 lg:grid-cols-[7rem_1fr]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {inferAdminMediaType(item.url, item.type) === "video" ? (
                  <video src={item.url} muted playsInline preload="metadata" className="aspect-square h-full w-full object-cover" />
                ) : item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" loading="lazy" className="aspect-square h-full w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs text-white/30">URL</div>
                )}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <TextField label="Media URL" value={item.url} onChange={(value) => onChange(item.id, { url: value })} />
                <TextField label="Alt text" value={item.alt} onChange={(value) => onChange(item.id, { alt: value })} />
                <TextField label="Caption" value={item.caption} onChange={(value) => onChange(item.id, { caption: value })} />
                <SelectField
                  label="Type"
                  value={item.type}
                  options={["auto", "image", "video"]}
                  onChange={(value) => onChange(item.id, { type: value as ProductDescriptionMediaItem["type"] })}
                />
                <SelectField
                  label="Fit"
                  value={item.fit}
                  options={["contain", "smart", "cover"]}
                  onChange={(value) => onChange(item.id, { fit: value as ProductDescriptionMediaItem["fit"] })}
                />
                <SelectField
                  label="Position"
                  value={item.position || "center"}
                  options={["center", "top", "bottom"]}
                  onChange={(value) => onChange(item.id, { position: value as ProductDescriptionMediaItem["position"] })}
                />
                <SelectField
                  label="Show item"
                  value={item.visible ? "Yes" : "No"}
                  options={["Yes", "No"]}
                  onChange={(value) => onChange(item.id, { visible: value === "Yes" })}
                />
                <div className="flex flex-wrap items-end gap-2">
                  <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/65 disabled:opacity-35">
                    Up
                  </button>
                  <button type="button" onClick={() => onMove(index, 1)} disabled={index === items.length - 1} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/65 disabled:opacity-35">
                    Down
                  </button>
                  <button type="button" onClick={() => onRemove(item.id)} className="rounded-full border border-rose-200/20 bg-rose-200/[0.07] px-3 py-2 text-xs font-semibold text-rose-50">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function inferAdminMediaType(url: string, explicit: "image" | "video" | "auto" = "auto") {
  if (explicit !== "auto") return explicit;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) ? "video" : "image";
}

function ContentBlockEditor({
  block,
  index,
  uploading,
  uploadError,
  onChange,
  onRemove,
  onUpload,
}: {
  block: ProductContentBlock;
  index: number;
  uploading: boolean;
  uploadError: string | null;
  onChange: (updates: Partial<ProductContentBlock>) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Block {index + 1}
        </p>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-rose-200/80 hover:text-rose-100">
          Remove
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <SelectField
          label="Block type"
          value={block.type}
          options={["text", "image", "video", "image-text", "video-text", "feature-grid", "comparison"]}
          onChange={(value) => onChange({ type: value as ProductContentBlock["type"] })}
        />
        <SelectField
          label="Show block"
          value={block.visible ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) => onChange({ visible: value === "Yes" })}
        />
        <TextField label="Title" value={block.title} onChange={(value) => onChange({ title: value })} />
        <TextField label="Subtitle" value={block.subtitle} onChange={(value) => onChange({ subtitle: value })} />
        <TextField label="Short text" value={block.text} onChange={(value) => onChange({ text: value })} />
        <TextAreaField label="Long text" value={block.longText} onChange={(value) => onChange({ longText: value })} />
        <TextField label="Media URL" value={block.mediaUrl} onChange={(value) => onChange({ mediaUrl: value })} />
        <TextField label="Media alt" value={block.mediaAlt} onChange={(value) => onChange({ mediaAlt: value })} />
        <SelectField
          label="Media type"
          value={block.mediaType}
          options={["auto", "image", "video"]}
          onChange={(value) => onChange({ mediaType: value as ProductContentBlock["mediaType"] })}
        />
        <SelectField
          label="Media fit"
          value={block.mediaFit}
          options={["contain", "smart", "cover"]}
          onChange={(value) => onChange({ mediaFit: value as ProductContentBlock["mediaFit"] })}
        />
        <SelectField
          label="Media position"
          value={block.mediaPosition}
          options={["left", "right", "top", "full"]}
          onChange={(value) => onChange({ mediaPosition: value as ProductContentBlock["mediaPosition"] })}
        />
        <SelectField
          label="Layout"
          value={block.layout}
          options={["media-left", "media-right", "media-top", "full-width", "grid"]}
          onChange={(value) => onChange({ layout: value as ProductContentBlock["layout"] })}
        />
        <SelectField
          label="Media position Y"
          value={block.mediaObjectPosition}
          options={["center", "top", "bottom"]}
          onChange={(value) => onChange({ mediaObjectPosition: value as ProductContentBlock["mediaObjectPosition"] })}
        />
        <TextField
          label="Sort order"
          value={block.sortOrder?.toString() ?? ""}
          onChange={(value) => onChange({ sortOrder: value.trim() ? Number(value) : undefined })}
        />
        <TextField label="CTA label" value={block.ctaLabel} onChange={(value) => onChange({ ctaLabel: value })} />
        <TextField label="CTA link" value={block.ctaLink} onChange={(value) => onChange({ ctaLink: value })} />
        <div className="lg:col-span-2">
          <MiniUploadButton label="Upload block media" uploading={uploading} error={uploadError} onUpload={onUpload} />
        </div>
      </div>
    </div>
  );
}

function ColorOptionEditor({
  color,
  index,
  uploading,
  swatchUploading,
  uploadError,
  onChange,
  onRemove,
  onMove,
  onUploadMedia,
  onUploadSwatch,
}: {
  color: ProductColorOption;
  index: number;
  uploading: boolean;
  swatchUploading: boolean;
  uploadError: string | null;
  onChange: (updates: Partial<ProductColorOption>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onUploadMedia: (file: File) => void;
  onUploadSwatch: (file: File) => void;
}) {
  const swatch = color.swatchImageUrl
    ? { backgroundImage: `url(${color.swatchImageUrl})` }
    : {
        background: color.secondaryHex
          ? `linear-gradient(135deg, ${color.hex || safeColorHex(color.name)}, ${color.secondaryHex})`
          : color.hex || safeColorHex(color.name),
      };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full border border-white/20 bg-cover bg-center" style={swatch} />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Color {index + 1}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMove(-1)} className="text-xs text-white/55 hover:text-white">Up</button>
          <button type="button" onClick={() => onMove(1)} className="text-xs text-white/55 hover:text-white">Down</button>
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-rose-200/80 hover:text-rose-100">Remove</button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <TextField label="Name" value={color.name} onChange={(value) => onChange({ name: value, hex: color.hex || safeColorHex(value) })} />
        <TextField label="Hex color" value={color.hex} onChange={(value) => onChange({ hex: value })} placeholder="#000000" />
        <TextField label="Secondary hex / gradient" value={color.secondaryHex} onChange={(value) => onChange({ secondaryHex: value })} />
        <SelectField
          label="Show color"
          value={color.visible ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) => onChange({ visible: value === "Yes" })}
        />
        <TextField label="Swatch image URL" value={color.swatchImageUrl} onChange={(value) => onChange({ swatchImageUrl: value })} />
        <TextField label="Color product media URL" value={color.mediaUrl} onChange={(value) => onChange({ mediaUrl: value })} />
        <SelectField
          label="Media type"
          value={color.mediaType}
          options={["auto", "image", "video"]}
          onChange={(value) => onChange({ mediaType: value as ProductColorOption["mediaType"] })}
        />
        <TextField
          label="Stock quantity"
          value={color.stockQuantity?.toString() ?? ""}
          onChange={(value) => onChange({ stockQuantity: value.trim() ? Number(value) : undefined })}
        />
        <TextField
          label="Sort order"
          value={color.sortOrder?.toString() ?? ""}
          onChange={(value) => onChange({ sortOrder: value.trim() ? Number(value) : undefined })}
        />
        <MiniUploadButton label="Upload color media" uploading={uploading} error={uploadError} onUpload={onUploadMedia} />
        <MiniUploadButton label="Upload swatch image" uploading={swatchUploading} error={null} onUpload={onUploadSwatch} />
      </div>
    </div>
  );
}

function DynamicItemsEditor<T>({
  title,
  items,
  emptyLabel,
  onAdd,
  renderItem,
}: {
  title: string;
  items: T[];
  emptyLabel: string;
  onAdd: () => void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-50">
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-white/42">
            {emptyLabel}
          </p>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}

function BenefitItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ProductBenefitItem;
  index: number;
  onChange: (updates: Partial<ProductBenefitItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/22 p-3">
      <div className="mb-2 flex justify-between gap-3 text-xs text-white/45">
        <span>Reason {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-rose-200/80 hover:text-rose-100">Remove</button>
      </div>
      <div className="grid gap-3">
        <TextField label="Title" value={item.title} onChange={(value) => onChange({ title: value })} />
        <TextField label="Short description" value={item.description} onChange={(value) => onChange({ description: value })} />
        <TextField label="Icon key" value={item.iconKey} onChange={(value) => onChange({ iconKey: value })} />
        <TextField label="Badge" value={item.badge} onChange={(value) => onChange({ badge: value })} />
        <SelectField
          label="Show"
          value={item.visible ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) => onChange({ visible: value === "Yes" })}
        />
      </div>
    </div>
  );
}

function FaqItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ProductFaqItem;
  index: number;
  onChange: (updates: Partial<ProductFaqItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/22 p-3">
      <div className="mb-2 flex justify-between gap-3 text-xs text-white/45">
        <span>FAQ {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-rose-200/80 hover:text-rose-100">Remove</button>
      </div>
      <div className="grid gap-3">
        <TextField label="Question" value={item.question} onChange={(value) => onChange({ question: value })} />
        <TextAreaField label="Answer" value={item.answer} onChange={(value) => onChange({ answer: value })} />
        <SelectField
          label="Show"
          value={item.visible ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(value) => onChange({ visible: value === "Yes" })}
        />
      </div>
    </div>
  );
}

function CategoriesSection({
  settings,
  storageMode,
  backendMessage,
  onSaveSettings,
  session,
}: {
  settings: AdminSettings;
  storageMode: SettingsStorageMode;
  backendMessage: string;
  onSaveSettings: (settings: AdminSettings) => Promise<{
    settings: AdminSettings | null;
    storageMode: SettingsStorageMode;
    backendConnected: boolean;
    message?: string;
  }>;
  session: AdminSessionUser;
}) {
  const [draft, setDraft] = useState(settings);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [catUploading, setCatUploading] = useState<Record<string, boolean>>({});
  const [catUploadError, setCatUploadError] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveCategories = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasPermission(session, "categories.manage")) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setIsSaving(true);
    const result = await onSaveSettings(draft);
    setIsSaving(false);
    setStatusMessage(
      result.backendConnected
        ? "Categories saved. Changes are now live on the storefront."
        : "Categories saved locally only. Settings backend is not connected."
    );
  };

  const updateCat = (updates: Partial<AdminSettings["homepageMediaSettings"]>) =>
    setDraft((current) => normalizeAdminSettings({
      ...current,
      homepageMediaSettings: { ...current.homepageMediaSettings, ...updates },
    }));

  const catDefs = [
    { label: "Reusable Period Care", stateKey: "categoryReusablePeriodCare", imgKey: "categoryReusablePeriodCareImageUrl", vidKey: "categoryReusablePeriodCareVideoUrl", modeKey: "categoryReusablePeriodCareMediaMode", altKey: "categoryReusablePeriodCareAltText", titleKey: "categoryReusablePeriodCareTitle", descKey: "categoryReusablePeriodCareDescription", linkKey: "categoryReusablePeriodCareLinkUrl", sortKey: "categoryReusablePeriodCareSortOrder", slug: "reusable" },
    { label: "Comfort Panty", stateKey: "categoryComfortPanty", imgKey: "categoryComfortPantyImageUrl", vidKey: "categoryComfortPantyVideoUrl", modeKey: "categoryComfortPantyMediaMode", altKey: "categoryComfortPantyAltText", titleKey: "categoryComfortPantyTitle", descKey: "categoryComfortPantyDescription", linkKey: "categoryComfortPantyLinkUrl", sortKey: "categoryComfortPantySortOrder", slug: "comfort-panty" },
    { label: "Soft Support Bra", stateKey: "categorySoftSupportBra", imgKey: "categorySoftSupportBraImageUrl", vidKey: "categorySoftSupportBraVideoUrl", modeKey: "categorySoftSupportBraMediaMode", altKey: "categorySoftSupportBraAltText", titleKey: "categorySoftSupportBraTitle", descKey: "categorySoftSupportBraDescription", linkKey: "categorySoftSupportBraLinkUrl", sortKey: "categorySoftSupportBraSortOrder", slug: "soft-bra" },
    { label: "Nightwear", stateKey: "categoryNightwear", imgKey: "categoryNightwearImageUrl", vidKey: "categoryNightwearVideoUrl", modeKey: "categoryNightwearMediaMode", altKey: "categoryNightwearAltText", titleKey: "categoryNightwearTitle", descKey: "categoryNightwearDescription", linkKey: "categoryNightwearLinkUrl", sortKey: "categoryNightwearSortOrder", slug: "nightwear" },
    { label: "Hygiene Essentials", stateKey: "categoryHygieneEssentials", imgKey: "categoryHygieneEssentialsImageUrl", vidKey: "categoryHygieneEssentialsVideoUrl", modeKey: "categoryHygieneEssentialsMediaMode", altKey: "categoryHygieneEssentialsAltText", titleKey: "categoryHygieneEssentialsTitle", descKey: "categoryHygieneEssentialsDescription", linkKey: "categoryHygieneEssentialsLinkUrl", sortKey: "categoryHygieneEssentialsSortOrder", slug: "hygiene" },
    { label: "Bundles", stateKey: "categoryBundles", imgKey: "categoryBundlesImageUrl", vidKey: "categoryBundlesVideoUrl", modeKey: "categoryBundlesMediaMode", altKey: "categoryBundlesAltText", titleKey: "categoryBundlesTitle", descKey: "categoryBundlesDescription", linkKey: "categoryBundlesLinkUrl", sortKey: "categoryBundlesSortOrder", slug: "bundles" },
    { label: "New Arrivals", stateKey: "categoryNewArrivals", imgKey: "categoryNewArrivalsImageUrl", vidKey: "categoryNewArrivalsVideoUrl", modeKey: "categoryNewArrivalsMediaMode", altKey: "categoryNewArrivalsAltText", titleKey: "categoryNewArrivalsTitle", descKey: "categoryNewArrivalsDescription", linkKey: "categoryNewArrivalsLinkUrl", sortKey: "categoryNewArrivalsSortOrder", slug: "new-arrivals" },
  ] as const;

  return (
    <form onSubmit={saveCategories} className="mt-6 space-y-5">
      <div
        className={`rounded-[1.25rem] border p-4 text-sm leading-6 ${
          storageMode === "supabase"
            ? "border-emerald-200/20 bg-emerald-200/[0.07] text-emerald-50/80"
            : "border-amber-200/22 bg-amber-200/[0.07] text-amber-50/82"
        }`}
      >
        {backendMessage}
      </div>

      {statusMessage && (
        <div className="rounded-[1.25rem] border border-emerald-200/20 bg-emerald-200/[0.07] p-4 text-sm leading-6 text-emerald-50/80">
          {statusMessage}
        </div>
      )}

      <SettingsCard
        eyebrow="Category Management"
        title="All seven categories — status, content, media, and sort order"
        description="Set each category to active (clickable), coming soon (badge shown, not clickable), or hidden (not shown). Active categories need a Link URL. Sort order controls display sequence on the homepage."
      >
        <div className="space-y-5">
          {catDefs.map(({ label, stateKey, imgKey, vidKey, modeKey, altKey, titleKey, descKey, linkKey, sortKey, slug }) => {
            const imgUploadKey = `cat-${slug}-img`;
            const vidUploadKey = `cat-${slug}-vid`;
            const currentState = draft.homepageMediaSettings[stateKey];
            return (
              <div key={slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 shrink-0 text-cyan-200/70" />
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                      currentState === "active"
                        ? "border-emerald-200/30 bg-emerald-200/10 text-emerald-200/90"
                        : currentState === "coming_soon"
                        ? "border-amber-200/30 bg-amber-200/10 text-amber-200/80"
                        : "border-white/15 bg-white/[0.04] text-white/40"
                    }`}>
                      {currentState === "active" ? "Active" : currentState === "coming_soon" ? "Coming Soon" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SelectField
                      label="Status"
                      value={currentState}
                      options={["active", "coming_soon", "hidden"] as const}
                      onChange={(value) => updateCat({ [stateKey]: value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TextField
                    label="Display title"
                    value={draft.homepageMediaSettings[titleKey]}
                    onChange={(value) => updateCat({ [titleKey]: value })}
                    placeholder={label}
                  />
                  <TextField
                    label="Short description"
                    value={draft.homepageMediaSettings[descKey]}
                    onChange={(value) => updateCat({ [descKey]: value })}
                    placeholder="Short tagline..."
                  />
                  <TextField
                    label="Link URL"
                    value={draft.homepageMediaSettings[linkKey]}
                    onChange={(value) => updateCat({ [linkKey]: value })}
                    placeholder="/product"
                    inputMode="url"
                  />
                  <TextField
                    label="Sort order"
                    value={draft.homepageMediaSettings[sortKey]}
                    onChange={(value) => updateCat({ [sortKey]: value })}
                    placeholder="1"
                  />
                  <SelectField
                    label="Media mode"
                    value={draft.homepageMediaSettings[modeKey]}
                    options={["animation", "image_text", "background_media_text", "video_text", "media_only"] as const}
                    onChange={(value) => updateCat({ [modeKey]: value as HomepageCategoryMediaMode })}
                  />
                  <TextField
                    label="Alt text"
                    value={draft.homepageMediaSettings[altKey]}
                    onChange={(value) => updateCat({ [altKey]: value })}
                    placeholder={`${label} media`}
                  />
                  <TextField
                    label="Image URL fallback"
                    value={draft.homepageMediaSettings[imgKey]}
                    onChange={(value) => updateCat({ [imgKey]: value })}
                    placeholder="https://..."
                    inputMode="url"
                  />
                  <TextField
                    label="Video URL fallback"
                    value={draft.homepageMediaSettings[vidKey]}
                    onChange={(value) => updateCat({ [vidKey]: value })}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MediaUploadField
                    label="Card image"
                    accept="image/jpeg,image/png,image/webp"
                    mediaType="image"
                    currentUrl={draft.homepageMediaSettings[imgKey]}
                    uploading={!!catUploading[imgUploadKey]}
                    error={catUploadError[imgUploadKey] ?? null}
                    onUpload={async (file) => {
                      setCatUploading((prev) => ({ ...prev, [imgUploadKey]: true }));
                      setCatUploadError((prev) => ({ ...prev, [imgUploadKey]: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", `category-${slug}`);
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setCatUploadError((prev) => ({ ...prev, [imgUploadKey]: "Upload failed." })); }
                        else { updateCat({ [imgKey]: pl.url as string }); }
                      } catch { setCatUploadError((prev) => ({ ...prev, [imgUploadKey]: "Upload failed." })); }
                      finally { setCatUploading((prev) => ({ ...prev, [imgUploadKey]: false })); }
                    }}
                    onClear={() => updateCat({ [imgKey]: "" })}
                  />
                  <MediaUploadField
                    label="Card video"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    mediaType="video"
                    currentUrl={draft.homepageMediaSettings[vidKey]}
                    uploading={!!catUploading[vidUploadKey]}
                    error={catUploadError[vidUploadKey] ?? null}
                    onUpload={async (file) => {
                      setCatUploading((prev) => ({ ...prev, [vidUploadKey]: true }));
                      setCatUploadError((prev) => ({ ...prev, [vidUploadKey]: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", `category-${slug}`);
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setCatUploadError((prev) => ({ ...prev, [vidUploadKey]: "Upload failed." })); }
                        else { updateCat({ [vidKey]: pl.url as string }); }
                      } catch { setCatUploadError((prev) => ({ ...prev, [vidUploadKey]: "Upload failed." })); }
                      finally { setCatUploading((prev) => ({ ...prev, [vidUploadKey]: false })); }
                    }}
                    onClear={() => updateCat({ [vidKey]: "" })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-5 py-4">
        {statusMessage && (
          <p className="mr-auto text-sm text-emerald-200/80">{statusMessage}</p>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save categories"}
        </button>
      </div>
    </form>
  );
}

function SettingsSection({
  settings,
  storageMode,
  backendMessage,
  onSaveSettings,
  session,
}: {
  settings: AdminSettings;
  storageMode: SettingsStorageMode;
  backendMessage: string;
  onSaveSettings: (settings: AdminSettings) => Promise<{
    settings: AdminSettings | null;
    storageMode: SettingsStorageMode;
    backendConnected: boolean;
    message?: string;
  }>;
  session: AdminSessionUser;
}) {
  const [draft, setDraft] = useState(settings);
  const [activeSection, setActiveSection] = useState("storeProfile");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hmUploading, setHmUploading] = useState<Record<string, boolean>>({});
  const [hmUploadError, setHmUploadError] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canSaveAnySettings =
      hasPermission(session, "settings.editBasic") ||
      hasPermission(session, "settings.editSensitive") ||
      hasPermission(session, "settings.editSeoAnalytics") ||
      hasPermission(session, "homepage.manage") ||
      hasPermission(session, "categories.manage");

    if (!canSaveAnySettings) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setIsSaving(true);
    const result = await onSaveSettings(draft);
    setIsSaving(false);
    setStatusMessage(
      result.backendConnected
        ? "Settings saved. Public support details now use the Supabase settings row."
        : "Settings saved locally only. Settings backend is not connected."
    );
  };

  const resetSettings = async () => {
    if (
      !hasPermission(session, "settings.editBasic") ||
      !hasPermission(session, "settings.editSensitive") ||
      !hasPermission(session, "settings.editSeoAnalytics") ||
      !hasPermission(session, "homepage.manage") ||
      !hasPermission(session, "categories.manage")
    ) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }
    setDraft(defaultSettings);
    setIsSaving(true);
    const result = await onSaveSettings(defaultSettings);
    setIsSaving(false);
    setStatusMessage(
      result.backendConnected
        ? "Settings reset to defaults and saved to Supabase."
        : "Settings reset locally only. Settings backend is not connected."
    );
  };

  const updateStoreProfile = (
    updates: Partial<AdminSettings["storeProfile"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    storeProfile: { ...current.storeProfile, ...updates },
  }));

  const updatePaymentSettings = (
    updates: Partial<AdminSettings["paymentSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    paymentSettings: { ...current.paymentSettings, ...updates },
  }));

  const updateCheckoutSettings = (
    updates: Partial<AdminSettings["checkoutSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    checkoutSettings: { ...current.checkoutSettings, ...updates },
  }));

  const updateDeliverySettings = (
    updates: Partial<AdminSettings["deliverySettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    deliverySettings: { ...current.deliverySettings, ...updates },
  }));

  const updatePolicySettings = (
    updates: Partial<AdminSettings["policySettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    policySettings: { ...current.policySettings, ...updates },
  }));

  const updateOrderSettings = (
    updates: Partial<AdminSettings["orderSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    orderSettings: { ...current.orderSettings, ...updates },
  }));

  const updateNotificationSettings = (
    updates: Partial<AdminSettings["notificationSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    notificationSettings: {
      ...current.notificationSettings,
      ...updates,
      telegramChatStatus: "Configured in environment",
    },
  }));

  const updateSeoSettings = (updates: Partial<AdminSettings["seoSettings"]>) =>
    setDraft((current) => normalizeAdminSettings({
      ...current,
      seoSettings: { ...current.seoSettings, ...updates },
    }));

  const updateAppearanceSettings = (
    updates: Partial<AdminSettings["appearanceSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    appearanceSettings: { ...current.appearanceSettings, ...updates },
  }));

  const updateAdvancedSettings = (
    updates: Partial<AdminSettings["advancedSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    advancedSettings: { ...current.advancedSettings, ...updates },
  }));

  const updateHomepageMediaSettings = (
    updates: Partial<AdminSettings["homepageMediaSettings"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    homepageMediaSettings: { ...current.homepageMediaSettings, ...updates },
  }));

  const updateFooterControlSettings = (
    updates: Partial<AdminSettings["storeProfile"]>
  ) => updateStoreProfile(updates);

  const updateHomepageSectionMedia = (
    section: "heroMedia" | "careMedia" | "experienceMedia",
    updates: Partial<AdminSettings["homepageMediaSettings"]["heroMedia"]>
  ) => setDraft((current) => normalizeAdminSettings({
    ...current,
    homepageMediaSettings: {
      ...current.homepageMediaSettings,
      [section]: { ...current.homepageMediaSettings[section], ...updates },
    },
  }));

  const settingsTabs = [
    { id: "storeProfile", label: "Store Profile", icon: Phone },
    { id: "paymentSettings", label: "Payment", icon: Wallet },
    { id: "checkoutSettings", label: "Checkout", icon: ShoppingBag },
    { id: "deliverySettings", label: "Delivery", icon: PackageCheck },
    { id: "policySettings", label: "Policy", icon: ShieldCheck },
    { id: "orderSettings", label: "Orders", icon: ClipboardList },
    { id: "notificationSettings", label: "Notifications", icon: BellIcon },
    { id: "seoSettings", label: "SEO", icon: Search },
    { id: "appearanceSettings", label: "Appearance", icon: Sparkles },
    { id: "announcementSettings", label: "Announcement", icon: BellIcon },
    { id: "footerSupportSettings", label: "Footer / Support", icon: MessageSquare },
    { id: "homepageMediaSettings", label: "Homepage Media", icon: Globe },
    { id: "advancedSettings", label: "Advanced", icon: Settings },
  ] as const;

  const visibleSettingsTabs = settingsTabs.filter((tab) => {
    if (tab.id === "paymentSettings" || tab.id === "deliverySettings") {
      return hasPermission(session, "settings.editSensitive");
    }
    if (tab.id === "seoSettings") return hasPermission(session, "settings.editSeoAnalytics");
    if (tab.id === "homepageMediaSettings") return hasPermission(session, "homepage.manage");
    if (tab.id === "announcementSettings") return hasPermission(session, "announcement.manage") || hasPermission(session, "settings.editBasic");
    if (tab.id === "footerSupportSettings") return hasPermission(session, "footer.manage") || hasPermission(session, "settings.editBasic");
    return hasPermission(session, "settings.view");
  }).filter((tab) => {
    const query = settingsSearch.trim().toLowerCase();
    return !query || tab.label.toLowerCase().includes(query) || tab.id.toLowerCase().includes(query);
  });

  return (
    <form onSubmit={saveSettings} className="mt-6 space-y-5">
      <div
        className={`rounded-[1.25rem] border p-4 text-sm leading-6 ${
          storageMode === "supabase"
            ? "border-emerald-200/20 bg-emerald-200/[0.07] text-emerald-50/80"
            : "border-amber-200/22 bg-amber-200/[0.07] text-amber-50/82"
        }`}
      >
        {backendMessage}
      </div>

      {statusMessage && (
        <div className="rounded-[1.25rem] border border-emerald-200/20 bg-emerald-200/[0.07] p-4 text-sm leading-6 text-emerald-50/80">
          {statusMessage}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="grid gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 xl:sticky xl:top-5 xl:self-start">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-white/35" />
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Search settings
            </span>
            <input
              value={settingsSearch}
              onChange={(event) => setSettingsSearch(event.target.value)}
              placeholder="Label or section"
              className="w-full rounded-2xl border border-white/10 bg-black/24 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
            />
          </label>
          {visibleSettingsTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "border-cyan-200/40 bg-cyan-200/12 text-white"
                    : "border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          {activeSection === "storeProfile" && (
            <SettingsCard
              eyebrow="Store Profile"
              title="Public brand and support identity"
              description="These values power visible support and contact surfaces."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  label="Store name"
                  value={draft.storeProfile.storeName}
                  onChange={(value) => updateStoreProfile({ storeName: value })}
                />
                <TextField
                  label="Brand subtitle"
                  value={draft.storeProfile.brandSubtitle}
                  onChange={(value) => updateStoreProfile({ brandSubtitle: value })}
                />
                <TextField
                  label="Business location"
                  value={draft.storeProfile.businessLocation}
                  onChange={(value) =>
                    updateStoreProfile({ businessLocation: value })
                  }
                />
                <SelectField
                  label="Store status"
                  value={draft.storeProfile.storeStatus}
                  options={["live", "maintenance", "coming_soon"] as const}
                  onChange={(value) => updateStoreProfile({ storeStatus: value })}
                />
                <TextField
                  label="Support phone"
                  value={draft.storeProfile.supportPhone}
                  onChange={(value) => updateStoreProfile({ supportPhone: value })}
                  inputMode="tel"
                />
                <TextField
                  label="Support WhatsApp"
                  value={draft.storeProfile.supportWhatsApp}
                  onChange={(value) => updateStoreProfile({ supportWhatsApp: value })}
                  inputMode="tel"
                />
                <TextField
                  label="Support email"
                  value={draft.storeProfile.supportEmail}
                  onChange={(value) => updateStoreProfile({ supportEmail: value })}
                  inputMode="email"
                />
                <TextField
                  label="Facebook page URL"
                  value={draft.storeProfile.facebookPageUrl}
                  onChange={(value) => updateStoreProfile({ facebookPageUrl: value })}
                  inputMode="url"
                />
                <TextField
                  label="Instagram URL"
                  value={draft.storeProfile.instagramUrl}
                  onChange={(value) => updateStoreProfile({ instagramUrl: value })}
                  inputMode="url"
                />
                <TextField
                  label="TikTok URL"
                  value={draft.storeProfile.tiktokUrl}
                  onChange={(value) => updateStoreProfile({ tiktokUrl: value })}
                  inputMode="url"
                />
                <TextField
                  label="YouTube channel URL"
                  value={draft.storeProfile.youtubeUrl}
                  onChange={(value) => updateStoreProfile({ youtubeUrl: value })}
                  inputMode="url"
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "paymentSettings" && (
            <SettingsCard
              eyebrow="Payment Settings"
              title="Checkout payment options"
              description="Enabled methods control what customers can choose at checkout."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleField
                  label="COD enabled"
                  checked={draft.paymentSettings.codEnabled}
                  onChange={(value) => updatePaymentSettings({ codEnabled: value })}
                />
                <ToggleField
                  label="Bank transfer enabled"
                  checked={draft.paymentSettings.bankTransferEnabled}
                  onChange={(value) =>
                    updatePaymentSettings({ bankTransferEnabled: value })
                  }
                />
                <TextAreaField
                  label="COD message"
                  value={draft.paymentSettings.codMessage}
                  onChange={(value) => updatePaymentSettings({ codMessage: value })}
                  tall
                />
                <TextAreaField
                  label="Payment confirmation instruction"
                  value={draft.paymentSettings.paymentConfirmationInstruction}
                  onChange={(value) =>
                    updatePaymentSettings({ paymentConfirmationInstruction: value })
                  }
                  tall
                />
                <WalletControl
                  label="bKash"
                  enabled={draft.paymentSettings.bkashEnabled}
                  receiverNumber={draft.paymentSettings.bkashReceiverNumber}
                  onEnabledChange={(value) =>
                    updatePaymentSettings({ bkashEnabled: value })
                  }
                  onNumberChange={(value) =>
                    updatePaymentSettings({ bkashReceiverNumber: value })
                  }
                />
                <WalletControl
                  label="Nagad"
                  enabled={draft.paymentSettings.nagadEnabled}
                  receiverNumber={draft.paymentSettings.nagadReceiverNumber}
                  onEnabledChange={(value) =>
                    updatePaymentSettings({ nagadEnabled: value })
                  }
                  onNumberChange={(value) =>
                    updatePaymentSettings({ nagadReceiverNumber: value })
                  }
                />
                <WalletControl
                  label="Rocket"
                  enabled={draft.paymentSettings.rocketEnabled}
                  receiverNumber={draft.paymentSettings.rocketReceiverNumber}
                  onEnabledChange={(value) =>
                    updatePaymentSettings({ rocketEnabled: value })
                  }
                  onNumberChange={(value) =>
                    updatePaymentSettings({ rocketReceiverNumber: value })
                  }
                />
                <WalletControl
                  label="Upay"
                  enabled={draft.paymentSettings.upayEnabled}
                  receiverNumber={draft.paymentSettings.upayReceiverNumber}
                  onEnabledChange={(value) =>
                    updatePaymentSettings({ upayEnabled: value })
                  }
                  onNumberChange={(value) =>
                    updatePaymentSettings({ upayReceiverNumber: value })
                  }
                />
                <TextField
                  label="Bank name"
                  value={draft.paymentSettings.bankName}
                  onChange={(value) => updatePaymentSettings({ bankName: value })}
                />
                <TextField
                  label="Bank account name"
                  value={draft.paymentSettings.bankAccountName}
                  onChange={(value) =>
                    updatePaymentSettings({ bankAccountName: value })
                  }
                />
                <TextField
                  label="Bank account number"
                  value={draft.paymentSettings.bankAccountNumber}
                  onChange={(value) =>
                    updatePaymentSettings({ bankAccountNumber: value })
                  }
                />
                <TextField
                  label="Bank branch"
                  value={draft.paymentSettings.bankBranch}
                  onChange={(value) => updatePaymentSettings({ bankBranch: value })}
                />
                <TextField
                  label="Bank routing number"
                  value={draft.paymentSettings.bankRoutingNumber}
                  onChange={(value) =>
                    updatePaymentSettings({ bankRoutingNumber: value })
                  }
                />
                <TextAreaField
                  label="Bank transfer instruction"
                  value={draft.paymentSettings.bankTransferInstruction}
                  onChange={(value) =>
                    updatePaymentSettings({ bankTransferInstruction: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "checkoutSettings" && (
            <SettingsCard
              eyebrow="Checkout Settings"
              title="Checkout copy and future thresholds"
              description="Threshold fields are saved for future use and are not enforced yet."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleField
                  label="Require customer account for checkout"
                  checked={draft.checkoutSettings.requireCustomerAccountForCheckout}
                  onChange={(value) =>
                    updateCheckoutSettings({ requireCustomerAccountForCheckout: value })
                  }
                />
                <TextField
                  label="Checkout header text"
                  value={draft.checkoutSettings.checkoutHeaderText}
                  onChange={(value) =>
                    updateCheckoutSettings({ checkoutHeaderText: value })
                  }
                />
                <TextField
                  label="Cart empty message"
                  value={draft.checkoutSettings.cartEmptyMessage}
                  onChange={(value) =>
                    updateCheckoutSettings({ cartEmptyMessage: value })
                  }
                />
                <TextField
                  label="Minimum order amount"
                  value={draft.checkoutSettings.minimumOrderAmount}
                  onChange={(value) =>
                    updateCheckoutSettings({ minimumOrderAmount: value })
                  }
                  inputMode="decimal"
                />
                <TextField
                  label="Free delivery threshold"
                  value={draft.checkoutSettings.freeDeliveryThreshold}
                  onChange={(value) =>
                    updateCheckoutSettings({ freeDeliveryThreshold: value })
                  }
                  inputMode="decimal"
                />
                <TextAreaField
                  label="Checkout support message"
                  value={draft.checkoutSettings.checkoutSupportMessage}
                  onChange={(value) =>
                    updateCheckoutSettings({ checkoutSupportMessage: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Order confirmation message"
                  value={draft.checkoutSettings.orderConfirmationMessage}
                  onChange={(value) =>
                    updateCheckoutSettings({ orderConfirmationMessage: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Order review message"
                  value={draft.checkoutSettings.orderReviewMessage}
                  onChange={(value) =>
                    updateCheckoutSettings({ orderReviewMessage: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "deliverySettings" && (
            <SettingsCard
              eyebrow="Delivery Settings"
              title="Courier, coverage, and tracking support"
              description="Delivery pricing fields are saved for operations and future checkout rules."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  label="Default delivery charge"
                  value={draft.deliverySettings.defaultDeliveryCharge}
                  onChange={(value) =>
                    updateDeliverySettings({ defaultDeliveryCharge: value })
                  }
                  inputMode="decimal"
                />
                <TextField
                  label="Inside Dhaka delivery charge"
                  value={draft.deliverySettings.insideDhakaDeliveryCharge}
                  onChange={(value) =>
                    updateDeliverySettings({ insideDhakaDeliveryCharge: value })
                  }
                  inputMode="decimal"
                />
                <TextField
                  label="Outside Dhaka delivery charge"
                  value={draft.deliverySettings.outsideDhakaDeliveryCharge}
                  onChange={(value) =>
                    updateDeliverySettings({ outsideDhakaDeliveryCharge: value })
                  }
                  inputMode="decimal"
                />
                <div className="min-w-0 rounded-2xl border border-cyan-200/18 bg-cyan-200/[0.055] p-4 lg:col-span-2">
                  <h4 className="text-sm font-semibold text-white">
                    Courier Integration
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Manual mode is active by default. Courier API settings are prepared for future server-side integration; do not store API keys here.
                  </p>
                </div>
                <SelectField
                  label="Default courier"
                  value={draft.deliverySettings.defaultCourier}
                  options={courierOptions}
                  onChange={(value) =>
                    updateDeliverySettings({ defaultCourier: value })
                  }
                  helper="Used to prefill empty order operation courier fields. Admin can still change each order."
                />
                <SelectField
                  label="Courier integration mode"
                  value={draft.deliverySettings.courierIntegrationMode}
                  options={courierIntegrationModes}
                  onChange={(value) =>
                    updateDeliverySettings({ courierIntegrationMode: value })
                  }
                  helper="Manual is the safe default. API modes are placeholders until merchant credentials are approved."
                />
                <label className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={draft.deliverySettings.autoCourierBookingEnabled}
                    onChange={(event) =>
                      updateDeliverySettings({
                        autoCourierBookingEnabled: event.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-200"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-[0.18em] text-white/40">
                      Auto courier booking
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-white/52">
                      Saved for future API integration. No real courier booking calls are made now.
                    </span>
                  </span>
                </label>
                <label className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={draft.deliverySettings.autoTrackingSyncEnabled}
                    onChange={(event) =>
                      updateDeliverySettings({
                        autoTrackingSyncEnabled: event.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-200"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-[0.18em] text-white/40">
                      Auto tracking sync
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-white/52">
                      Saved for future API integration. Delivery status remains manually updated.
                    </span>
                  </span>
                </label>
                <TextAreaField
                  label="Courier partners"
                  value={draft.deliverySettings.courierPartners}
                  onChange={(value) =>
                    updateDeliverySettings({ courierPartners: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Courier API-ready note"
                  value={draft.deliverySettings.courierApiReadyNote}
                  onChange={(value) =>
                    updateDeliverySettings({ courierApiReadyNote: value })
                  }
                  helper="Do not place courier API secrets here. Use server-side Vercel environment variables when integration is implemented."
                  tall
                />
                <TextAreaField
                  label="Delivery coverage text"
                  value={draft.deliverySettings.deliveryCoverageText}
                  onChange={(value) =>
                    updateDeliverySettings({ deliveryCoverageText: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Estimated delivery time"
                  value={draft.deliverySettings.estimatedDeliveryTime}
                  onChange={(value) =>
                    updateDeliverySettings({ estimatedDeliveryTime: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Dispatch confirmation message"
                  value={draft.deliverySettings.dispatchConfirmationMessage}
                  onChange={(value) =>
                    updateDeliverySettings({ dispatchConfirmationMessage: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Tracking support message"
                  value={draft.deliverySettings.trackingSupportMessage}
                  onChange={(value) =>
                    updateDeliverySettings({ trackingSupportMessage: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "policySettings" && (
            <SettingsCard
              eyebrow="Policy & Hygiene Settings"
              title="Hygiene-safe support language"
              description="Keep wording conservative: no medical or guaranteed leak-proof claims."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextAreaField
                  label="Hygiene-safe support message"
                  value={draft.policySettings.hygieneSafeSupportMessage}
                  onChange={(value) =>
                    updatePolicySettings({ hygieneSafeSupportMessage: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Refund/exchange condition"
                  value={draft.policySettings.refundExchangeCondition}
                  onChange={(value) =>
                    updatePolicySettings({ refundExchangeCondition: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Unused/unwashed condition"
                  value={draft.policySettings.unusedUnwashedCondition}
                  onChange={(value) =>
                    updatePolicySettings({ unusedUnwashedCondition: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Original packaging hygiene seal message"
                  value={draft.policySettings.originalPackagingHygieneSealMessage}
                  onChange={(value) =>
                    updatePolicySettings({
                      originalPackagingHygieneSealMessage: value,
                    })
                  }
                  tall
                />
                <TextAreaField
                  label="Size checking instruction"
                  value={draft.policySettings.sizeCheckingInstruction}
                  onChange={(value) =>
                    updatePolicySettings({ sizeCheckingInstruction: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Privacy packaging message"
                  value={draft.policySettings.privacyPackagingMessage}
                  onChange={(value) =>
                    updatePolicySettings({ privacyPackagingMessage: value })
                  }
                  tall
                />
                <TextAreaField
                  label="No medical claims notice"
                  value={draft.policySettings.noMedicalClaimsNotice}
                  onChange={(value) =>
                    updatePolicySettings({ noMedicalClaimsNotice: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "orderSettings" && (
            <SettingsCard
              eyebrow="Order Operations Settings"
              title="Defaults for order operations"
              description="Auto-cancel and low-stock values are saved for future automation only."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <SelectField
                  label="Default order status"
                  value={draft.orderSettings.defaultOrderStatus}
                  options={orderStatuses}
                  onChange={(value) =>
                    updateOrderSettings({ defaultOrderStatus: value })
                  }
                />
                <SelectField
                  label="Default order source"
                  value={draft.orderSettings.defaultOrderSource}
                  options={orderSources}
                  onChange={(value) =>
                    updateOrderSettings({ defaultOrderSource: value })
                  }
                />
                <TextField
                  label="Default assigned staff"
                  value={draft.orderSettings.defaultAssignedStaff}
                  onChange={(value) =>
                    updateOrderSettings({ defaultAssignedStaff: value })
                  }
                />
                <SelectField
                  label="Default payment verification status"
                  value={draft.orderSettings.defaultPaymentVerificationStatus}
                  options={paymentVerificationStatuses}
                  onChange={(value) =>
                    updateOrderSettings({
                      defaultPaymentVerificationStatus: value,
                    })
                  }
                />
                <SelectField
                  label="Proof required default"
                  value={draft.orderSettings.proofRequiredDefault}
                  options={proofReceivedStatuses}
                  onChange={(value) =>
                    updateOrderSettings({ proofRequiredDefault: value })
                  }
                />
                <TextField
                  label="Auto-cancel pending after days"
                  value={draft.orderSettings.autoCancelPendingAfterDays}
                  onChange={(value) =>
                    updateOrderSettings({ autoCancelPendingAfterDays: value })
                  }
                  inputMode="numeric"
                />
                <TextField
                  label="Low stock alert threshold"
                  value={draft.orderSettings.lowStockAlertThreshold}
                  onChange={(value) =>
                    updateOrderSettings({ lowStockAlertThreshold: value })
                  }
                  inputMode="numeric"
                />
                <TextField
                  label="Order ID prefix"
                  value={draft.orderSettings.orderIdPrefix}
                  onChange={(value) => updateOrderSettings({ orderIdPrefix: value })}
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "notificationSettings" && (
            <SettingsCard
              eyebrow="Notification Settings"
              title="Telegram and customer message templates"
              description="Bot token stays in environment variables and is never shown here."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleField
                  label="Telegram new order enabled"
                  checked={draft.notificationSettings.telegramNewOrderEnabled}
                  onChange={(value) =>
                    updateNotificationSettings({ telegramNewOrderEnabled: value })
                  }
                />
                <ToggleField
                  label="Telegram status update enabled"
                  checked={draft.notificationSettings.telegramStatusUpdateEnabled}
                  onChange={(value) =>
                    updateNotificationSettings({
                      telegramStatusUpdateEnabled: value,
                    })
                  }
                />
                <ReadonlyField
                  label="Telegram Chat ID status"
                  value={draft.notificationSettings.telegramChatStatus}
                />
                <TextAreaField
                  label="Order confirmation message template"
                  value={draft.notificationSettings.orderConfirmationMessageTemplate}
                  onChange={(value) =>
                    updateNotificationSettings({
                      orderConfirmationMessageTemplate: value,
                    })
                  }
                  tall
                />
                <TextAreaField
                  label="Shipped message template"
                  value={draft.notificationSettings.shippedMessageTemplate}
                  onChange={(value) =>
                    updateNotificationSettings({ shippedMessageTemplate: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Delivered message template"
                  value={draft.notificationSettings.deliveredMessageTemplate}
                  onChange={(value) =>
                    updateNotificationSettings({ deliveredMessageTemplate: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Cancelled message template"
                  value={draft.notificationSettings.cancelledMessageTemplate}
                  onChange={(value) =>
                    updateNotificationSettings({ cancelledMessageTemplate: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "seoSettings" && (
            <SettingsCard
              eyebrow="SEO & Social Settings"
              title="Search metadata and analytics IDs"
              description="Pixel IDs are stored only; scripts are not injected by this phase."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  label="Homepage SEO title"
                  value={draft.seoSettings.homepageSeoTitle}
                  onChange={(value) => updateSeoSettings({ homepageSeoTitle: value })}
                />
                <TextField
                  label="Default product SEO suffix"
                  value={draft.seoSettings.defaultProductSeoSuffix}
                  onChange={(value) =>
                    updateSeoSettings({ defaultProductSeoSuffix: value })
                  }
                />
                <TextField
                  label="Facebook Pixel ID"
                  value={draft.seoSettings.facebookPixelId}
                  onChange={(value) => updateSeoSettings({ facebookPixelId: value })}
                />
                <TextField
                  label="TikTok Pixel ID"
                  value={draft.seoSettings.tiktokPixelId}
                  onChange={(value) => updateSeoSettings({ tiktokPixelId: value })}
                />
                <TextField
                  label="Google Analytics ID"
                  value={draft.seoSettings.googleAnalyticsId}
                  onChange={(value) =>
                    updateSeoSettings({ googleAnalyticsId: value })
                  }
                />
                <TextField
                  label="Open Graph image URL"
                  value={draft.seoSettings.openGraphImageUrl}
                  onChange={(value) => updateSeoSettings({ openGraphImageUrl: value })}
                  inputMode="url"
                />
                <TextAreaField
                  label="Homepage meta description"
                  value={draft.seoSettings.homepageMetaDescription}
                  onChange={(value) =>
                    updateSeoSettings({ homepageMetaDescription: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "appearanceSettings" && (
            <SettingsCard
              eyebrow="Appearance Settings"
              title="Future-ready storefront copy"
              description="Saved safely for future homepage wiring without redesigning the public site now."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  label="Brand accent color"
                  value={draft.appearanceSettings.brandAccentColor}
                  onChange={(value) =>
                    updateAppearanceSettings({ brandAccentColor: value })
                  }
                />
                <TextField
                  label="Hero badge text"
                  value={draft.appearanceSettings.heroBadgeText}
                  onChange={(value) =>
                    updateAppearanceSettings({ heroBadgeText: value })
                  }
                />
                <TextField
                  label="Homepage hero title"
                  value={draft.appearanceSettings.homepageHeroTitle}
                  onChange={(value) =>
                    updateAppearanceSettings({ homepageHeroTitle: value })
                  }
                />
                <TextField
                  label="Primary CTA text"
                  value={draft.appearanceSettings.primaryCtaText}
                  onChange={(value) =>
                    updateAppearanceSettings({ primaryCtaText: value })
                  }
                />
                <TextField
                  label="Secondary CTA text"
                  value={draft.appearanceSettings.secondaryCtaText}
                  onChange={(value) =>
                    updateAppearanceSettings({ secondaryCtaText: value })
                  }
                />
                <ToggleField
                  label="Announcement bar enabled"
                  checked={draft.appearanceSettings.announcementBarEnabled}
                  onChange={(value) =>
                    updateAppearanceSettings({ announcementBarEnabled: value })
                  }
                />
                <TextAreaField
                  label="Homepage hero subtitle"
                  value={draft.appearanceSettings.homepageHeroSubtitle}
                  onChange={(value) =>
                    updateAppearanceSettings({ homepageHeroSubtitle: value })
                  }
                  tall
                />
                <TextAreaField
                  label="Announcement bar text"
                  value={draft.appearanceSettings.announcementBarText}
                  onChange={(value) =>
                    updateAppearanceSettings({ announcementBarText: value })
                  }
                  tall
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "announcementSettings" && (
            <SettingsCard
              eyebrow="Announcement"
              title="Public announcement / campaign banner"
              description="Use factual campaign or service messages only. Avoid fake discount or guarantee claims."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleField
                  label="Enable announcement"
                  checked={draft.appearanceSettings.enableAnnouncement}
                  onChange={(value) =>
                    updateAppearanceSettings({
                      enableAnnouncement: value,
                      announcementBarEnabled: value,
                    })
                  }
                />
                <SelectField
                  label="Announcement style"
                  value={draft.appearanceSettings.announcementStyle}
                  options={["info", "promo", "warning", "success"] as const}
                  onChange={(value) => updateAppearanceSettings({ announcementStyle: value })}
                />
                <TextField
                  label="Link label"
                  value={draft.appearanceSettings.announcementLinkLabel}
                  onChange={(value) =>
                    updateAppearanceSettings({ announcementLinkLabel: value })
                  }
                />
                <TextField
                  label="Link URL"
                  value={draft.appearanceSettings.announcementLinkUrl}
                  onChange={(value) =>
                    updateAppearanceSettings({ announcementLinkUrl: value })
                  }
                  placeholder="/product"
                  inputMode="url"
                />
                <ToggleField
                  label="Show on homepage"
                  checked={draft.appearanceSettings.showOnHomepage}
                  onChange={(value) => updateAppearanceSettings({ showOnHomepage: value })}
                />
                <ToggleField
                  label="Show on shop"
                  checked={draft.appearanceSettings.showOnShop}
                  onChange={(value) => updateAppearanceSettings({ showOnShop: value })}
                />
                <ToggleField
                  label="Show on product pages"
                  checked={draft.appearanceSettings.showOnProductPages}
                  onChange={(value) => updateAppearanceSettings({ showOnProductPages: value })}
                />
                <ToggleField
                  label="Show on checkout/cart"
                  checked={draft.appearanceSettings.showOnCheckout}
                  onChange={(value) => updateAppearanceSettings({ showOnCheckout: value })}
                />
                <div className="lg:col-span-2">
                  <TextAreaField
                    label="Announcement text"
                    value={draft.appearanceSettings.announcementText}
                    onChange={(value) =>
                      updateAppearanceSettings({
                        announcementText: value,
                        announcementBarText: value,
                      })
                    }
                    tall
                  />
                </div>
              </div>
            </SettingsCard>
          )}

          {activeSection === "footerSupportSettings" && (
            <SettingsCard
              eyebrow="Footer / Support"
              title="Footer, social, and support controls"
              description="Public contact surfaces use these settings. Private admin data is never shown."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextAreaField
                  label="Footer short description"
                  value={draft.storeProfile.footerShortDescription}
                  onChange={(value) =>
                    updateFooterControlSettings({ footerShortDescription: value })
                  }
                  tall
                />
                <SelectField
                  label="Live support mode"
                  value={draft.storeProfile.liveSupportMode}
                  options={["off", "live_chat", "whatsapp", "both"] as const}
                  onChange={(value) => updateFooterControlSettings({ liveSupportMode: value })}
                />
                <ToggleField
                  label="Show footer legal links"
                  checked={draft.storeProfile.showFooterLegalLinks}
                  onChange={(value) =>
                    updateFooterControlSettings({ showFooterLegalLinks: value })
                  }
                />
                <ToggleField
                  label="Show social icons"
                  checked={draft.storeProfile.showSocialIcons}
                  onChange={(value) =>
                    updateFooterControlSettings({ showSocialIcons: value })
                  }
                />
                <ToggleField
                  label="Show WhatsApp footer icon"
                  checked={draft.storeProfile.showWhatsAppFooterIcon}
                  onChange={(value) =>
                    updateFooterControlSettings({ showWhatsAppFooterIcon: value })
                  }
                />
                <ToggleField
                  label="Show live support widget"
                  checked={draft.homepageMediaSettings.liveChatEnabled}
                  onChange={(value) =>
                    updateHomepageMediaSettings({ liveChatEnabled: value })
                  }
                />
                <MediaUploadField
                  label="Account support agent image"
                  accept="image/jpeg,image/png,image/webp"
                  mediaType="image"
                  currentUrl={draft.storeProfile.supportAgentImageUrl}
                  uploading={!!hmUploading["accountSupportImage"]}
                  error={hmUploadError["accountSupportImage"] ?? null}
                  onUpload={async (file) => {
                    setHmUploading((prev) => ({ ...prev, accountSupportImage: true }));
                    setHmUploadError((prev) => ({ ...prev, accountSupportImage: null }));
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      form.append("section", "account-support");
                      const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                      const pl = (await res.json()) as Record<string, unknown>;
                      if (!res.ok || typeof pl.url !== "string") {
                        setHmUploadError((prev) => ({ ...prev, accountSupportImage: "Upload failed." }));
                      } else {
                        updateFooterControlSettings({ supportAgentImageUrl: pl.url as string });
                      }
                    } catch {
                      setHmUploadError((prev) => ({ ...prev, accountSupportImage: "Upload failed." }));
                    } finally {
                      setHmUploading((prev) => ({ ...prev, accountSupportImage: false }));
                    }
                  }}
                  onClear={() => updateFooterControlSettings({ supportAgentImageUrl: "" })}
                />
                <TextField
                  label="Account support agent image URL"
                  value={draft.storeProfile.supportAgentImageUrl}
                  inputMode="url"
                  onChange={(value) =>
                    updateFooterControlSettings({ supportAgentImageUrl: value })
                  }
                  helper="Optional public image URL for account support cards. Upload above or leave empty to use the coded fallback art."
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === "homepageMediaSettings" && (
            <>
              <SettingsCard
                eyebrow="Homepage Sections"
                title="Visibility controls"
                description="Toggles hide or show major homepage sections. Section ordering is left unchanged for layout safety in this phase."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["showHero", "Hero"],
                    ["showTrustStrip", "Trust strip"],
                    ["showStatStrip", "Stat strip"],
                    ["showMarquee", "Moving banner"],
                    ["showCategories", "Categories"],
                    ["showFeaturedProducts", "Featured products"],
                    ["showStorySections", "Story sections"],
                    ["findCareEnabled", "Find Your Care"],
                    ["showTestimonials", "Testimonials"],
                    ["showFAQ", "FAQ"],
                    ["showBottomCTA", "Bottom CTA"],
                  ].map(([key, label]) => (
                    <ToggleField
                      key={key}
                      label={label}
                      checked={Boolean(draft.homepageMediaSettings[key as keyof HomepageMediaSettings])}
                      onChange={(value) =>
                        updateHomepageMediaSettings({ [key]: value } as Partial<HomepageMediaSettings>)
                      }
                    />
                  ))}
                </div>
                <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-3">
                  <ToggleField
                    label="Splash intro"
                    checked={draft.homepageMediaSettings.splashEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ splashEnabled: value })}
                  />
                  <TextField
                    label="Splash title"
                    value={draft.homepageMediaSettings.splashTitle}
                    onChange={(value) => updateHomepageMediaSettings({ splashTitle: value })}
                    placeholder="AEVYRIXA"
                  />
                  <TextField
                    label="Splash logo URL"
                    value={draft.homepageMediaSettings.splashLogoUrl}
                    onChange={(value) => updateHomepageMediaSettings({ splashLogoUrl: value })}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Content"
                title="Stats, banner, and discovery headings"
                description="Compact homepage proof points, moving banner text, and short copy used above the live featured products and category grid."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <TextField
                    label="Stat 1 value"
                    value={draft.homepageMediaSettings.statItem1Value}
                    onChange={(value) => updateHomepageMediaSettings({ statItem1Value: value })}
                  />
                  <TextField
                    label="Stat 1 label"
                    value={draft.homepageMediaSettings.statItem1Label}
                    onChange={(value) => updateHomepageMediaSettings({ statItem1Label: value })}
                  />
                  <TextField
                    label="Stat 2 value"
                    value={draft.homepageMediaSettings.statItem2Value}
                    onChange={(value) => updateHomepageMediaSettings({ statItem2Value: value })}
                  />
                  <TextField
                    label="Stat 2 label"
                    value={draft.homepageMediaSettings.statItem2Label}
                    onChange={(value) => updateHomepageMediaSettings({ statItem2Label: value })}
                  />
                  <TextField
                    label="Stat 3 value"
                    value={draft.homepageMediaSettings.statItem3Value}
                    onChange={(value) => updateHomepageMediaSettings({ statItem3Value: value })}
                  />
                  <TextField
                    label="Stat 3 label"
                    value={draft.homepageMediaSettings.statItem3Label}
                    onChange={(value) => updateHomepageMediaSettings({ statItem3Label: value })}
                  />
                  <div className="lg:col-span-2">
                    <TextAreaField
                      label="Moving banner items (comma separated)"
                      value={draft.homepageMediaSettings.marqueeItems}
                      onChange={(value) => updateHomepageMediaSettings({ marqueeItems: value })}
                    />
                  </div>
                  <TextField
                    label="Best picks eyebrow"
                    value={draft.homepageMediaSettings.featuredProductsEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ featuredProductsEyebrow: value })}
                  />
                  <TextField
                    label="Best picks heading"
                    value={draft.homepageMediaSettings.featuredProductsHeading}
                    onChange={(value) => updateHomepageMediaSettings({ featuredProductsHeading: value })}
                  />
                  <TextAreaField
                    label="Best picks description"
                    value={draft.homepageMediaSettings.featuredProductsDescription}
                    onChange={(value) => updateHomepageMediaSettings({ featuredProductsDescription: value })}
                  />
                  <TextField
                    label="Collections eyebrow"
                    value={draft.homepageMediaSettings.collectionsEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ collectionsEyebrow: value })}
                  />
                  <TextField
                    label="Collections heading"
                    value={draft.homepageMediaSettings.collectionsHeading}
                    onChange={(value) => updateHomepageMediaSettings({ collectionsHeading: value })}
                  />
                  <TextAreaField
                    label="Collections description"
                    value={draft.homepageMediaSettings.collectionsDescription}
                    onChange={(value) => updateHomepageMediaSettings({ collectionsDescription: value })}
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — Hero"
                title="Hero section media"
                description="If image or video URL is provided, it replaces the coded hero animation. Leave mode as 'animation' to keep the current visual."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Hero media mode"
                    value={draft.homepageMediaSettings.heroMedia.mode}
                    options={["animation", "image", "video"] as const}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { mode: value })}
                  />
                  <MediaUploadField
                    label="Hero image (upload or URL)"
                    accept="image/jpeg,image/png,image/webp"
                    mediaType="image"
                    currentUrl={draft.homepageMediaSettings.heroMedia.imageUrl}
                    uploading={!!hmUploading["heroImage"]}
                    error={hmUploadError["heroImage"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, heroImage: true }));
                      setHmUploadError((prev) => ({ ...prev, heroImage: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "hero");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, heroImage: "Upload failed." })); }
                        else { updateHomepageSectionMedia("heroMedia", { imageUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, heroImage: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, heroImage: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("heroMedia", { imageUrl: "" })}
                  />
                  <TextField
                    label="Hero image URL (fallback, https)"
                    value={draft.homepageMediaSettings.heroMedia.imageUrl}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { imageUrl: value })}
                    inputMode="url"
                  />
                  <MediaUploadField
                    label="Hero video (upload or URL)"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    mediaType="video"
                    currentUrl={draft.homepageMediaSettings.heroMedia.videoUrl}
                    uploading={!!hmUploading["heroVideo"]}
                    error={hmUploadError["heroVideo"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, heroVideo: true }));
                      setHmUploadError((prev) => ({ ...prev, heroVideo: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "hero");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") {
                          setHmUploadError((prev) => ({ ...prev, heroVideo: "Upload failed." }));
                        } else {
                          updateHomepageSectionMedia("heroMedia", { videoUrl: pl.url as string });
                        }
                      } catch { setHmUploadError((prev) => ({ ...prev, heroVideo: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, heroVideo: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("heroMedia", { videoUrl: "" })}
                  />
                  <TextField
                    label="Hero video URL (fallback, https)"
                    value={draft.homepageMediaSettings.heroMedia.videoUrl}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { videoUrl: value })}
                    inputMode="url"
                  />
                  <TextField
                    label="Hero alt text"
                    value={draft.homepageMediaSettings.heroMedia.altText}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { altText: value })}
                  />
                  <TextField
                    label="Hero eyebrow (small label, optional)"
                    value={draft.homepageMediaSettings.heroMedia.eyebrow}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { eyebrow: value })}
                    placeholder="e.g. Reusable Period Care"
                  />
                  <TextField
                    label="Hero heading override (optional)"
                    value={draft.homepageMediaSettings.heroMedia.heading}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { heading: value })}
                    placeholder="Overrides Appearance hero title if set"
                  />
                  <TextAreaField
                    label="Hero subheading override (optional — overrides Appearance hero subtitle if set)"
                    value={draft.homepageMediaSettings.heroMedia.subheading}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { subheading: value })}
                  />
                  <TextField
                    label="Hero CTA button text (optional)"
                    value={draft.homepageMediaSettings.heroMedia.ctaText}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { ctaText: value })}
                    placeholder="e.g. Shop Now"
                  />
                  <TextField
                    label="Hero CTA link (optional)"
                    value={draft.homepageMediaSettings.heroMedia.ctaLink}
                    onChange={(value) => updateHomepageSectionMedia("heroMedia", { ctaLink: value })}
                    placeholder="/product"
                    inputMode="url"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — Layer Explorer"
                title="Layered Comfort section"
                description="Controls the 'Layered comfort built for calm, discreet daily wear.' section. Animation fallback is always kept when no media is set."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Show section"
                    checked={draft.homepageMediaSettings.layerComfortEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortEnabled: value })}
                  />
                  <TextField
                    label="Eyebrow label"
                    value={draft.homepageMediaSettings.layerComfortEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortEyebrow: value })}
                    placeholder="Her Care Layer System"
                  />
                  <TextField
                    label="Heading"
                    value={draft.homepageMediaSettings.layerComfortHeading}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortHeading: value })}
                    placeholder="Layered comfort built for calm, discreet daily wear."
                  />
                  <TextAreaField
                    label="Description"
                    value={draft.homepageMediaSettings.layerComfortDescription}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortDescription: value })}
                  />
                  <TextField
                    label="Layer 1 title"
                    value={draft.homepageMediaSettings.layerComfortLayer1Title}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer1Title: value })}
                    placeholder="Comfort Knit Layer"
                  />
                  <TextAreaField
                    label="Layer 1 description"
                    value={draft.homepageMediaSettings.layerComfortLayer1Description}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer1Description: value })}
                  />
                  <TextField
                    label="Layer 2 title"
                    value={draft.homepageMediaSettings.layerComfortLayer2Title}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer2Title: value })}
                    placeholder="Absorbent Core"
                  />
                  <TextAreaField
                    label="Layer 2 description"
                    value={draft.homepageMediaSettings.layerComfortLayer2Description}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer2Description: value })}
                  />
                  <TextField
                    label="Layer 3 title"
                    value={draft.homepageMediaSettings.layerComfortLayer3Title}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer3Title: value })}
                    placeholder="Protective Shell"
                  />
                  <TextAreaField
                    label="Layer 3 description"
                    value={draft.homepageMediaSettings.layerComfortLayer3Description}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortLayer3Description: value })}
                  />
                  <TextField
                    label="Layer CTA text"
                    value={draft.homepageMediaSettings.layerComfortCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortCtaText: value })}
                    placeholder="Explore Care"
                  />
                  <TextField
                    label="Layer CTA link"
                    value={draft.homepageMediaSettings.layerComfortCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortCtaLink: value })}
                    placeholder="/product"
                    inputMode="url"
                  />
                  <SelectField
                    label="Media mode"
                    value={draft.homepageMediaSettings.layerComfortMediaMode}
                    options={["animation", "image_text", "video_text", "background_media_text", "media_only"] as const}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortMediaMode: value as LayerComfortMediaMode })}
                  />
                  <TextField
                    label="Alt text"
                    value={draft.homepageMediaSettings.layerComfortAltText}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortAltText: value })}
                  />
                  <MediaUploadField
                    label="Image (upload or URL)"
                    accept="image/jpeg,image/png,image/webp"
                    mediaType="image"
                    currentUrl={draft.homepageMediaSettings.layerComfortImageUrl}
                    uploading={!!hmUploading["layerComfortImage"]}
                    error={hmUploadError["layerComfortImage"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, layerComfortImage: true }));
                      setHmUploadError((prev) => ({ ...prev, layerComfortImage: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "layer-comfort");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, layerComfortImage: "Upload failed." })); }
                        else { updateHomepageMediaSettings({ layerComfortImageUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, layerComfortImage: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, layerComfortImage: false })); }
                    }}
                    onClear={() => updateHomepageMediaSettings({ layerComfortImageUrl: "" })}
                  />
                  <TextField
                    label="Image URL (fallback, https)"
                    value={draft.homepageMediaSettings.layerComfortImageUrl}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortImageUrl: value })}
                    inputMode="url"
                  />
                  <MediaUploadField
                    label="Video (upload or URL)"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    mediaType="video"
                    currentUrl={draft.homepageMediaSettings.layerComfortVideoUrl}
                    uploading={!!hmUploading["layerComfortVideo"]}
                    error={hmUploadError["layerComfortVideo"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, layerComfortVideo: true }));
                      setHmUploadError((prev) => ({ ...prev, layerComfortVideo: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "layer-comfort");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, layerComfortVideo: "Upload failed." })); }
                        else { updateHomepageMediaSettings({ layerComfortVideoUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, layerComfortVideo: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, layerComfortVideo: false })); }
                    }}
                    onClear={() => updateHomepageMediaSettings({ layerComfortVideoUrl: "" })}
                  />
                  <TextField
                    label="Video URL (fallback, https)"
                    value={draft.homepageMediaSettings.layerComfortVideoUrl}
                    onChange={(value) => updateHomepageMediaSettings({ layerComfortVideoUrl: value })}
                    inputMode="url"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — Care Motion"
                title="Care system section media"
                description="Controls the left panel in the 'Premium comfort, reusable care' section. Animation fallback is always kept."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Care media mode"
                    value={draft.homepageMediaSettings.careMedia.mode}
                    options={["animation", "image", "video"] as const}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { mode: value })}
                  />
                  <MediaUploadField
                    label="Care image (upload or URL)"
                    accept="image/jpeg,image/png,image/webp"
                    mediaType="image"
                    currentUrl={draft.homepageMediaSettings.careMedia.imageUrl}
                    uploading={!!hmUploading["careImage"]}
                    error={hmUploadError["careImage"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, careImage: true }));
                      setHmUploadError((prev) => ({ ...prev, careImage: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "care");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, careImage: "Upload failed." })); }
                        else { updateHomepageSectionMedia("careMedia", { imageUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, careImage: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, careImage: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("careMedia", { imageUrl: "" })}
                  />
                  <TextField
                    label="Care image URL (fallback, https)"
                    value={draft.homepageMediaSettings.careMedia.imageUrl}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { imageUrl: value })}
                    inputMode="url"
                  />
                  <MediaUploadField
                    label="Care video (upload or URL)"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    mediaType="video"
                    currentUrl={draft.homepageMediaSettings.careMedia.videoUrl}
                    uploading={!!hmUploading["careVideo"]}
                    error={hmUploadError["careVideo"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, careVideo: true }));
                      setHmUploadError((prev) => ({ ...prev, careVideo: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "care");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, careVideo: "Upload failed." })); }
                        else { updateHomepageSectionMedia("careMedia", { videoUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, careVideo: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, careVideo: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("careMedia", { videoUrl: "" })}
                  />
                  <TextField
                    label="Care video URL (fallback, https)"
                    value={draft.homepageMediaSettings.careMedia.videoUrl}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { videoUrl: value })}
                    inputMode="url"
                  />
                  <TextField
                    label="Care alt text"
                    value={draft.homepageMediaSettings.careMedia.altText}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { altText: value })}
                  />
                  <TextField
                    label="Care eyebrow (optional)"
                    value={draft.homepageMediaSettings.careMedia.eyebrow}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { eyebrow: value })}
                    placeholder="e.g. Aevyrixa Care Motion"
                  />
                  <TextField
                    label="Care heading override (optional)"
                    value={draft.homepageMediaSettings.careMedia.heading}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { heading: value })}
                  />
                  <TextAreaField
                    label="Care subheading override (optional)"
                    value={draft.homepageMediaSettings.careMedia.subheading}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { subheading: value })}
                  />
                  <TextField
                    label="Care CTA text (optional)"
                    value={draft.homepageMediaSettings.careMedia.ctaText}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { ctaText: value })}
                    placeholder="e.g. View Product"
                  />
                  <TextField
                    label="Care CTA link (optional)"
                    value={draft.homepageMediaSettings.careMedia.ctaLink}
                    onChange={(value) => updateHomepageSectionMedia("careMedia", { ctaLink: value })}
                    placeholder="/product"
                    inputMode="url"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — Experience"
                title="Cinematic experience section media"
                description="Controls the right panel in the 'A cinematic care experience' section."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Experience media mode"
                    value={draft.homepageMediaSettings.experienceMedia.mode}
                    options={["animation", "image", "video"] as const}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { mode: value })}
                  />
                  <MediaUploadField
                    label="Experience image (upload or URL)"
                    accept="image/jpeg,image/png,image/webp"
                    mediaType="image"
                    currentUrl={draft.homepageMediaSettings.experienceMedia.imageUrl}
                    uploading={!!hmUploading["expImage"]}
                    error={hmUploadError["expImage"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, expImage: true }));
                      setHmUploadError((prev) => ({ ...prev, expImage: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "experience");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, expImage: "Upload failed." })); }
                        else { updateHomepageSectionMedia("experienceMedia", { imageUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, expImage: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, expImage: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("experienceMedia", { imageUrl: "" })}
                  />
                  <TextField
                    label="Experience image URL (fallback, https)"
                    value={draft.homepageMediaSettings.experienceMedia.imageUrl}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { imageUrl: value })}
                    inputMode="url"
                  />
                  <MediaUploadField
                    label="Experience video (upload or URL)"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    mediaType="video"
                    currentUrl={draft.homepageMediaSettings.experienceMedia.videoUrl}
                    uploading={!!hmUploading["expVideo"]}
                    error={hmUploadError["expVideo"] ?? null}
                    onUpload={async (file) => {
                      setHmUploading((prev) => ({ ...prev, expVideo: true }));
                      setHmUploadError((prev) => ({ ...prev, expVideo: null }));
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("section", "experience");
                        const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                        const pl = (await res.json()) as Record<string, unknown>;
                        if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, expVideo: "Upload failed." })); }
                        else { updateHomepageSectionMedia("experienceMedia", { videoUrl: pl.url as string }); }
                      } catch { setHmUploadError((prev) => ({ ...prev, expVideo: "Upload failed." })); }
                      finally { setHmUploading((prev) => ({ ...prev, expVideo: false })); }
                    }}
                    onClear={() => updateHomepageSectionMedia("experienceMedia", { videoUrl: "" })}
                  />
                  <TextField
                    label="Experience video URL (fallback, https)"
                    value={draft.homepageMediaSettings.experienceMedia.videoUrl}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { videoUrl: value })}
                    inputMode="url"
                  />
                  <TextField
                    label="Experience alt text"
                    value={draft.homepageMediaSettings.experienceMedia.altText}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { altText: value })}
                  />
                  <TextField
                    label="Experience eyebrow (optional)"
                    value={draft.homepageMediaSettings.experienceMedia.eyebrow}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { eyebrow: value })}
                    placeholder="e.g. Aevyrixa Experience"
                  />
                  <TextField
                    label="Experience heading override (optional)"
                    value={draft.homepageMediaSettings.experienceMedia.heading}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { heading: value })}
                  />
                  <TextAreaField
                    label="Experience subheading override (optional)"
                    value={draft.homepageMediaSettings.experienceMedia.subheading}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { subheading: value })}
                  />
                  <TextField
                    label="Experience CTA text (optional)"
                    value={draft.homepageMediaSettings.experienceMedia.ctaText}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { ctaText: value })}
                  />
                  <TextField
                    label="Experience CTA link (optional)"
                    value={draft.homepageMediaSettings.experienceMedia.ctaLink}
                    onChange={(value) => updateHomepageSectionMedia("experienceMedia", { ctaLink: value })}
                    inputMode="url"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Content - Find Your Care"
                title="Visual care guide"
                description="Guide cards reuse collection media where available and fall back to coded visual art."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Show Find Your Care"
                    checked={draft.homepageMediaSettings.findCareEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ findCareEnabled: value })}
                  />
                  <TextField
                    label="Eyebrow"
                    value={draft.homepageMediaSettings.findCareEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ findCareEyebrow: value })}
                  />
                  <TextField
                    label="Heading"
                    value={draft.homepageMediaSettings.findCareHeading}
                    onChange={(value) => updateHomepageMediaSettings({ findCareHeading: value })}
                  />
                  <TextAreaField
                    label="Description"
                    value={draft.homepageMediaSettings.findCareDescription}
                    onChange={(value) => updateHomepageMediaSettings({ findCareDescription: value })}
                  />
                  <TextField
                    label="Section CTA text"
                    value={draft.homepageMediaSettings.findCareCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ findCareCtaText: value })}
                  />
                  <TextField
                    label="Section CTA link"
                    value={draft.homepageMediaSettings.findCareCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ findCareCtaLink: value })}
                    placeholder="/product"
                  />
                  {([1, 2, 3] as const).map((index) => {
                    const titleKey = `findCareCard${index}Title` as const;
                    const descriptionKey = `findCareCard${index}Description` as const;
                    const linkKey = `findCareCard${index}LinkUrl` as const;

                    return (
                      <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:col-span-2 lg:grid-cols-3">
                        <TextField
                          label={`Guide card ${index} title`}
                          value={draft.homepageMediaSettings[titleKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [titleKey]: value } as Partial<HomepageMediaSettings>)}
                        />
                        <TextField
                          label={`Guide card ${index} copy`}
                          value={draft.homepageMediaSettings[descriptionKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [descriptionKey]: value } as Partial<HomepageMediaSettings>)}
                        />
                        <TextField
                          label={`Guide card ${index} link`}
                          value={draft.homepageMediaSettings[linkKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [linkKey]: value } as Partial<HomepageMediaSettings>)}
                          placeholder="/product"
                        />
                      </div>
                    );
                  })}
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Content - FAQ Preview"
                title="Compact FAQ preview"
                description="Only three short preview answers are shown on the homepage; the full FAQ stays on its own route."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <TextField
                    label="FAQ eyebrow"
                    value={draft.homepageMediaSettings.faqPreviewEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ faqPreviewEyebrow: value })}
                  />
                  <TextField
                    label="FAQ heading"
                    value={draft.homepageMediaSettings.faqPreviewHeading}
                    onChange={(value) => updateHomepageMediaSettings({ faqPreviewHeading: value })}
                  />
                  {([1, 2, 3] as const).map((index) => {
                    const questionKey = `faqPreviewItem${index}Question` as const;
                    const answerKey = `faqPreviewItem${index}Answer` as const;

                    return (
                      <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:col-span-2 lg:grid-cols-2">
                        <TextField
                          label={`Preview item ${index} question`}
                          value={draft.homepageMediaSettings[questionKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [questionKey]: value } as Partial<HomepageMediaSettings>)}
                        />
                        <TextAreaField
                          label={`Preview item ${index} answer`}
                          value={draft.homepageMediaSettings[answerKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [answerKey]: value } as Partial<HomepageMediaSettings>)}
                        />
                      </div>
                    );
                  })}
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Shop Page — Hero"
                title="Shop hero section"
                description="Controls all text, media, CTA, badges, and trust items in the hero at the top of the /product shop page."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Show shop hero"
                    checked={draft.homepageMediaSettings.shopHeroEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroEnabled: value })}
                  />
                  <TextField
                    label="Eyebrow"
                    value={draft.homepageMediaSettings.shopHeroEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroEyebrow: value })}
                    placeholder="AEVYRIXA HER CARE SHOP"
                  />
                  <TextField
                    label="Title"
                    value={draft.homepageMediaSettings.shopHeroTitle}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroTitle: value })}
                    placeholder="Comfort that moves with you"
                  />
                  <TextAreaField
                    label="Subtitle"
                    value={draft.homepageMediaSettings.shopHeroSubtitle}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroSubtitle: value })}
                  />
                  <TextField
                    label="Primary CTA text"
                    value={draft.homepageMediaSettings.shopHeroPrimaryCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroPrimaryCtaText: value })}
                    placeholder="Shop Now"
                  />
                  <TextField
                    label="Primary CTA link"
                    value={draft.homepageMediaSettings.shopHeroPrimaryCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroPrimaryCtaLink: value })}
                    placeholder="/product"
                  />
                  <TextField
                    label="Secondary CTA text"
                    value={draft.homepageMediaSettings.shopHeroSecondaryCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroSecondaryCtaText: value })}
                    placeholder="Track Order"
                  />
                  <TextField
                    label="Secondary CTA link"
                    value={draft.homepageMediaSettings.shopHeroSecondaryCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroSecondaryCtaLink: value })}
                    placeholder="/track-order"
                  />
                  <div className="lg:col-span-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Hero Media (right side / desktop)</p>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <SelectField
                        label="Media type"
                        value={draft.homepageMediaSettings.shopHeroMediaType}
                        options={["auto", "image", "video"] as const}
                        onChange={(value) => updateHomepageMediaSettings({ shopHeroMediaType: value as "image" | "video" | "auto" })}
                      />
                      <SelectField
                        label="Media fit"
                        value={draft.homepageMediaSettings.shopHeroMediaFit}
                        options={["contain", "cover", "smart"] as const}
                        onChange={(value) => updateHomepageMediaSettings({ shopHeroMediaFit: value as "contain" | "cover" | "smart" })}
                      />
                      <SelectField
                        label="Media position"
                        value={draft.homepageMediaSettings.shopHeroMediaPosition}
                        options={["center", "top", "bottom"] as const}
                        onChange={(value) => updateHomepageMediaSettings({ shopHeroMediaPosition: value as "center" | "top" | "bottom" })}
                      />
                      <div className="lg:col-span-3">
                        <TextField
                          label="Media alt text"
                          value={draft.homepageMediaSettings.shopHeroMediaAlt}
                          onChange={(value) => updateHomepageMediaSettings({ shopHeroMediaAlt: value })}
                          placeholder="Aevyrixa Her Care"
                        />
                      </div>
                      <div className="lg:col-span-3 grid gap-4 lg:grid-cols-2">
                        <MediaUploadField
                          label="Upload image"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          mediaType="image"
                          currentUrl={(() => { const url = draft.homepageMediaSettings.shopHeroMediaUrl; const type = draft.homepageMediaSettings.shopHeroMediaType; if (!url) return ""; if (type === "video") return ""; if (type === "image") return url; return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url) ? "" : url; })()}
                          uploading={!!hmUploading["shopHeroImage"]}
                          error={hmUploadError["shopHeroImage"] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, shopHeroImage: true }));
                            setHmUploadError((prev) => ({ ...prev, shopHeroImage: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", "shop-hero");
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, shopHeroImage: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ shopHeroMediaUrl: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, shopHeroImage: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, shopHeroImage: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ shopHeroMediaUrl: "" })}
                        />
                        <MediaUploadField
                          label="Upload video"
                          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                          mediaType="video"
                          currentUrl={(() => { const url = draft.homepageMediaSettings.shopHeroMediaUrl; const type = draft.homepageMediaSettings.shopHeroMediaType; if (!url) return ""; if (type === "image") return ""; if (type === "video") return url; return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url) ? url : ""; })()}
                          uploading={!!hmUploading["shopHeroVideo"]}
                          error={hmUploadError["shopHeroVideo"] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, shopHeroVideo: true }));
                            setHmUploadError((prev) => ({ ...prev, shopHeroVideo: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", "shop-hero");
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, shopHeroVideo: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ shopHeroMediaUrl: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, shopHeroVideo: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, shopHeroVideo: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ shopHeroMediaUrl: "" })}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <TextField
                          label="Media URL (manual / fallback)"
                          value={draft.homepageMediaSettings.shopHeroMediaUrl}
                          onChange={(value) => updateHomepageMediaSettings({ shopHeroMediaUrl: value })}
                          placeholder="https://…"
                          inputMode="url"
                          helper="Leave empty to show default brand trust visual. Upload above auto-fills this."
                        />
                      </div>
                    </div>
                  </div>
                  <TextField
                    label="Badge 1"
                    value={draft.homepageMediaSettings.shopHeroBadge1}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroBadge1: value })}
                    placeholder="Discreet Packaging"
                  />
                  <TextField
                    label="Badge 2"
                    value={draft.homepageMediaSettings.shopHeroBadge2}
                    onChange={(value) => updateHomepageMediaSettings({ shopHeroBadge2: value })}
                    placeholder="3-Day Hygiene-Safe Support"
                  />
                  <div className="lg:col-span-2">
                    <TextField
                      label="Caption (optional, shown below media)"
                      value={draft.homepageMediaSettings.shopHeroCaption}
                      onChange={(value) => updateHomepageMediaSettings({ shopHeroCaption: value })}
                      placeholder="Leave empty to hide caption"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Trust Items</p>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {([1, 2, 3] as const).map((index) => {
                        const labelKey = `shopHeroTrust${index}Label` as const;
                        const descKey = `shopHeroTrust${index}Description` as const;
                        return (
                          <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                            <TextField
                              label={`Trust ${index} label`}
                              value={draft.homepageMediaSettings[labelKey]}
                              onChange={(value) => updateHomepageMediaSettings({ [labelKey]: value } as Partial<HomepageMediaSettings>)}
                              placeholder={["Privacy", "Support", "Delivery"][index - 1]}
                            />
                            <TextField
                              label={`Trust ${index} description`}
                              value={draft.homepageMediaSettings[descKey]}
                              onChange={(value) => updateHomepageMediaSettings({ [descKey]: value } as Partial<HomepageMediaSettings>)}
                              placeholder={["Discreet privacy packaging", "3-Day Hygiene-Safe Support", "Bangladesh delivery"][index - 1]}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Category CMS"
                title="Manage categories"
                description="Category cards, status (active / coming soon / hidden), media, sort order, and link URLs are managed in the dedicated Categories workspace."
              >
                <div className="flex items-center gap-4">
                  <Link
                    href="/admin/categories"
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-200/15"
                  >
                    <Tag className="h-4 w-4 shrink-0" />
                    Open Category Management
                  </Link>
                  <p className="text-sm text-white/50">7 categories · active / coming soon / hidden</p>
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Content — CTA Section"
                title="Bottom call-to-action section"
                description="The full-width conversion banner near the bottom of the homepage. Edit the eyebrow, heading, description, CTA buttons, and optional background media."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Show CTA section"
                    checked={draft.homepageMediaSettings.ctaSectionEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionEnabled: value })}
                  />
                  <TextField
                    label="Eyebrow label"
                    value={draft.homepageMediaSettings.ctaSectionEyebrow}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionEyebrow: value })}
                    placeholder="Ready for reusable confidence?"
                  />
                  <TextField
                    label="Heading"
                    value={draft.homepageMediaSettings.ctaSectionHeading}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionHeading: value })}
                    placeholder="Discover Her Care essentials…"
                  />
                  <TextField
                    label="Description"
                    value={draft.homepageMediaSettings.ctaSectionDescription}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionDescription: value })}
                    placeholder="Premium women's comfort…"
                  />
                  <TextField
                    label="Primary CTA text"
                    value={draft.homepageMediaSettings.ctaSectionPrimaryCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionPrimaryCtaText: value })}
                    placeholder="Shop Now (falls back to Appearance setting)"
                  />
                  <TextField
                    label="Primary CTA link"
                    value={draft.homepageMediaSettings.ctaSectionPrimaryCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionPrimaryCtaLink: value })}
                    placeholder="/product"
                  />
                  <TextField
                    label="Secondary CTA text"
                    value={draft.homepageMediaSettings.ctaSectionSecondaryCtaText}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionSecondaryCtaText: value })}
                    placeholder="Read FAQs"
                  />
                  <TextField
                    label="Secondary CTA link"
                    value={draft.homepageMediaSettings.ctaSectionSecondaryCtaLink}
                    onChange={(value) => updateHomepageMediaSettings({ ctaSectionSecondaryCtaLink: value })}
                    placeholder="#faq"
                  />

                  <div className="lg:col-span-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">CTA Media</p>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <SelectField
                        label="Media mode"
                        value={draft.homepageMediaSettings.ctaSectionMediaMode}
                        options={["no_media", "image_text", "video_text", "background_media_text"] as const}
                        onChange={(value) => updateHomepageMediaSettings({ ctaSectionMediaMode: value as CtaSectionMediaMode })}
                      />
                      <TextField
                        label="Alt text"
                        value={draft.homepageMediaSettings.ctaSectionAltText}
                        onChange={(value) => updateHomepageMediaSettings({ ctaSectionAltText: value })}
                        placeholder="Descriptive text for the image or video"
                      />
                      <div className="lg:col-span-2">
                        <MediaUploadField
                          label="CTA image"
                          accept="image/jpeg,image/png,image/webp"
                          mediaType="image"
                          currentUrl={draft.homepageMediaSettings.ctaSectionImageUrl}
                          uploading={!!hmUploading["ctaSectionImage"]}
                          error={hmUploadError["ctaSectionImage"] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, ctaSectionImage: true }));
                            setHmUploadError((prev) => ({ ...prev, ctaSectionImage: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", "cta-section");
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, ctaSectionImage: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ ctaSectionImageUrl: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, ctaSectionImage: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, ctaSectionImage: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ ctaSectionImageUrl: "" })}
                        />
                      </div>
                      <TextField
                        label="Image URL (override or fallback)"
                        value={draft.homepageMediaSettings.ctaSectionImageUrl}
                        onChange={(value) => updateHomepageMediaSettings({ ctaSectionImageUrl: value })}
                        placeholder="https://…"
                      />
                      <div className="lg:col-span-2">
                        <MediaUploadField
                          label="CTA video"
                          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                          mediaType="video"
                          currentUrl={draft.homepageMediaSettings.ctaSectionVideoUrl}
                          uploading={!!hmUploading["ctaSectionVideo"]}
                          error={hmUploadError["ctaSectionVideo"] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, ctaSectionVideo: true }));
                            setHmUploadError((prev) => ({ ...prev, ctaSectionVideo: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", "cta-section");
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, ctaSectionVideo: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ ctaSectionVideoUrl: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, ctaSectionVideo: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, ctaSectionVideo: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ ctaSectionVideoUrl: "" })}
                        />
                      </div>
                      <TextField
                        label="Video URL (override or fallback)"
                        value={draft.homepageMediaSettings.ctaSectionVideoUrl}
                        onChange={(value) => updateHomepageMediaSettings({ ctaSectionVideoUrl: value })}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — WhatsApp Widget"
                title="Floating WhatsApp support button"
                description="Shows a floating WhatsApp button. WhatsApp number is taken from Store Profile → Support WhatsApp. Widget hides if no number is set."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Enable WhatsApp widget"
                    checked={draft.homepageMediaSettings.whatsappWidgetEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ whatsappWidgetEnabled: value })}
                  />
                  <SelectField
                    label="Widget placement"
                    value={draft.homepageMediaSettings.whatsappWidgetPlacement}
                    options={["homepage", "all", "product", "support", "cart"] as const}
                    onChange={(value) => updateHomepageMediaSettings({ whatsappWidgetPlacement: value })}
                  />
                  <TextField
                    label="Widget button label"
                    value={draft.homepageMediaSettings.whatsappWidgetLabel}
                    onChange={(value) => updateHomepageMediaSettings({ whatsappWidgetLabel: value })}
                    placeholder="Support"
                  />
                  <TextField
                    label="Live support text (optional)"
                    value={draft.homepageMediaSettings.whatsappWidgetLiveText}
                    onChange={(value) => updateHomepageMediaSettings({ whatsappWidgetLiveText: value })}
                    placeholder="e.g. Online now"
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                eyebrow="Homepage Media — Live Chat / Need Help"
                title="Floating support panel button"
                description="Shows a floating 'Need Help?' button on the bottom-right. Clicking opens an inline support panel with quick actions (Track Order, Product Help, Size Help, WhatsApp). No live agent required."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    label="Enable Live Chat / Need Help button"
                    checked={draft.homepageMediaSettings.liveChatEnabled}
                    onChange={(value) => updateHomepageMediaSettings({ liveChatEnabled: value })}
                  />
                  <SelectField
                    label="Placement"
                    value={draft.homepageMediaSettings.liveChatPlacement}
                    options={["homepage", "all", "product", "support", "cart"] as const}
                    onChange={(value) => updateHomepageMediaSettings({ liveChatPlacement: value })}
                  />
                  <TextField
                    label="Button label"
                    value={draft.homepageMediaSettings.liveChatLabel}
                    onChange={(value) => updateHomepageMediaSettings({ liveChatLabel: value })}
                    placeholder="Need Help?"
                  />
                  <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.06] p-4 text-sm leading-6 text-cyan-50/75 lg:col-span-2">
                    Button appears bottom-right and stacks above the WhatsApp widget if both are enabled. Clicking opens an inline support panel — no page navigation.
                  </div>
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === "advancedSettings" && (
            <SettingsCard
              eyebrow="Advanced / System Settings"
              title="System flags and future operations"
              description="Dangerous actions are not active buttons; values are stored for controlled future tooling."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleField
                  label="Maintenance mode"
                  checked={draft.advancedSettings.maintenanceMode}
                  onChange={(value) =>
                    updateAdvancedSettings({ maintenanceMode: value })
                  }
                />
                <ToggleField
                  label="Test mode"
                  checked={draft.advancedSettings.testMode}
                  onChange={(value) => updateAdvancedSettings({ testMode: value })}
                />
                <ToggleField
                  label="Debug mode"
                  checked={draft.advancedSettings.debugMode}
                  onChange={(value) => updateAdvancedSettings({ debugMode: value })}
                />
                <TextField
                  label="Purge deleted products after days"
                  value={draft.advancedSettings.purgeDeletedProductsAfterDays}
                  onChange={(value) =>
                    updateAdvancedSettings({
                      purgeDeletedProductsAfterDays: value,
                    })
                  }
                  inputMode="numeric"
                />
                <TextField
                  label="System version label"
                  value={draft.advancedSettings.systemVersionLabel}
                  onChange={(value) =>
                    updateAdvancedSettings({ systemVersionLabel: value })
                  }
                />
                <TextAreaField
                  label="Backup reminder text"
                  value={draft.advancedSettings.backupReminderText}
                  onChange={(value) =>
                    updateAdvancedSettings({ backupReminderText: value })
                  }
                  tall
                />
                <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.07] p-4 text-sm leading-6 text-amber-50/78 lg:col-span-2">
                  Destructive maintenance tools are intentionally disabled in this
                  phase.
                </div>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-[#06101d]/92 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-white/50">
          Settings save as one grouped control-room record. Existing checkout
          aliases are preserved automatically.
        </p>
        <button
          type="button"
          onClick={resetSettings}
          disabled={isSaving}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/68 transition hover:border-white/25 hover:text-white"
        >
          Reset to defaults
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}

type ConvStatus = "open" | "pending" | "closed";

type AdminConvSummary = {
  id: string;
  status: ConvStatus;
  source_page: string;
  created_at: string;
  updated_at?: string | null;
  last_message: { body: string; sender_type: string; created_at: string } | null;
  message_count: number;
  unread_customer_count?: number;
};

type AdminConvMessage = {
  id: string;
  body: string;
  sender_type: "customer" | "admin";
  created_at: string;
};

type AdminConvDetail = {
  id: string;
  status: ConvStatus;
  source_page: string;
  created_at: string;
  updated_at?: string | null;
  messages: AdminConvMessage[];
};

type AdminCustomerClientRecord = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  orderCount: number;
  totalSpent: number;
  latestOrderAt?: string;
  savedAddressesCount: number;
};

const convStatusLabels: Record<ConvStatus, string> = {
  open: "Open",
  pending: "Pending",
  closed: "Closed",
};

const convStatusStyles: Record<ConvStatus, string> = {
  open: "border-emerald-200/35 bg-emerald-200/12 text-emerald-100",
  pending: "border-amber-200/35 bg-amber-200/12 text-amber-100",
  closed: "border-white/20 bg-white/[0.05] text-white/48",
};

const supportRefreshOptions = [
  { label: "Off", value: 0 },
  { label: "10 seconds", value: 10000 },
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
];

function supportTimeLabel(value?: string | null) {
  if (!value) return "No time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function AdminComingSoonPanel({
  title,
  message,
  icon: Icon = Zap,
}: {
  title: string;
  message: string;
  icon?: typeof Zap;
}) {
  return (
    <div className="aev-admin-coming-soon rounded-[1.25rem] border border-amber-200/20 bg-amber-200/[0.055] p-4 text-sm text-amber-50/78">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-100/25 bg-amber-200/10 text-amber-100">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-amber-50">{title}</p>
          <p className="mt-1 leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}

function DisabledAdminAction({
  children,
  title = "Not connected yet",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={title}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/38"
    >
      {children}
    </button>
  );
}

function DiscountsSection({
  orders,
  session,
}: {
  orders: StoredOrder[];
  session: AdminSessionUser;
}) {
  const canView = hasPermission(session, "settings.view") || hasPermission(session, "settings.manage");
  const paidOrders = orders.filter((order) => order.paymentStatus === "verified");
  const activeOrders = orders.filter((order) => !order.archivedAt && !order.deletedAt && !order.softDeletedAt);
  const promoDiagnostics = [
    { label: "Eligible Orders", value: String(activeOrders.length), tone: "cyan" as const },
    { label: "Paid Orders", value: String(paidOrders.length), tone: "green" as const },
    { label: "Campaign Engine", value: "Offline", tone: "amber" as const },
  ];

  if (!canView) {
    return <NoDataState label={blockedPermissionMessage} />;
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="aev-admin-hero-panel rounded-[1.35rem] border p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-200/70">Promotions Control</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Discount command deck</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                Promotion diagnostics are visible from live order data. Discount creation is intentionally disabled until a discount engine/API is connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAdminAction title="Discount engine not connected yet">
                <Plus className="h-4 w-4" />
                Create discount
              </DisabledAdminAction>
              <Link href="/admin/settings" className="aev-admin-utility-link inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold">
                <Settings className="h-4 w-4" />
                Store settings
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {promoDiagnostics.map((item) => (
              <StatusMetric key={item.label} label={item.label} value={item.value} tone={item.tone === "green" ? "green" : "amber"} />
            ))}
          </div>
        </section>
        <AdminComingSoonPanel
          title="Discount backend not connected yet"
          message="Create, edit, delete, usage limits, and automatic code validation are disabled until a promotion data model and API are added."
          icon={Tag}
        />
      </div>

      <section className="rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
        <SectionHeader title="Campaign queue" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {["WELCOME10", "BUNDLECARE", "RETURNINGVIP"].map((code, index) => (
            <article key={code} className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{code}</p>
                  <p className="mt-1 text-xs text-white/45">{index === 0 ? "Percent discount" : index === 1 ? "Bundle promotion" : "Customer segment"}</p>
                </div>
                <TinyBadge label="Coming soon" tone="amber" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <ReadonlyField label="Value" value={index === 0 ? "10%" : "Not connected"} />
                <ReadonlyField label="Usage" value="Engine offline" />
              </div>
              <div className="mt-4 flex gap-2">
                <DisabledAdminAction title="Campaign editing requires discount backend">Edit</DisabledAdminAction>
                <DisabledAdminAction title="Campaign deletion requires discount backend">Delete</DisabledAdminAction>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AnalyticsSection({
  orders,
  products,
  reviews,
  supportUnreadCount,
  session,
}: {
  orders: StoredOrder[];
  products: AdminProduct[];
  reviews: AdminReviewClientRecord[];
  supportUnreadCount: number;
  session: AdminSessionUser;
}) {
  const [rangePreset, setRangePreset] = useState<DashboardRangePreset>("last30");
  const now = new Date();
  const range = buildDashboardRange(rangePreset, dateInputValue(addDays(now, -29)), dateInputValue(now));
  const ordersInRange = orders.filter((order) => isWithinDashboardRange(order.createdAt, range));
  const revenue = ordersInRange.reduce((sum, order) => sum + orderTotal(order), 0);
  const activeProducts = products.filter((product) => product.status === "Active" && !product.deletedAt);
  const approvedReviews = reviews.filter((review) => review.status === "approved");
  const daily = buildDailySeries(ordersInRange, range);

  if (!hasPermission(session, "analytics.view")) {
    return <NoDataState label={blockedPermissionMessage} />;
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="aev-admin-hero-panel rounded-[1.35rem] border p-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/70">Analytics Command Center</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Live commerce telemetry</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              Metrics are derived from available admin orders, products, reviews, and support signals. Funnel and conversion exports stay disabled until tracking is connected.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["today", "last7", "last30", "month"] as DashboardRangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRangePreset(preset)}
                data-admin-sound="tab"
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                  rangePreset === preset
                    ? "border-cyan-200/45 bg-cyan-200/14 text-cyan-50"
                    : "border-white/10 bg-white/[0.035] text-white/48"
                }`}
              >
                {preset === "last7" ? "7D" : preset === "last30" ? "30D" : preset}
              </button>
            ))}
            <DisabledAdminAction title="Report export not connected yet">
              <Upload className="h-4 w-4" />
              Export report
            </DisabledAdminAction>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Revenue" value={formatCurrency(revenue)} icon={Wallet} compact />
        <MetricCard label="Orders" value={String(ordersInRange.length)} icon={ClipboardList} compact />
        <MetricCard label="Products" value={String(activeProducts.length)} icon={Boxes} compact />
        <MetricCard label="Reviews" value={String(approvedReviews.length)} icon={Star} compact />
        <MetricCard label="Support" value={String(supportUnreadCount)} icon={MessageSquare} compact />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <DailyBars title="Order pulse" data={daily} valueLabel={(item) => `${item.value} orders`} />
        <DistributionCard
          title="Operational split"
          data={[
            { label: "Pending", value: ordersInRange.filter((order) => order.status === "Pending").length },
            { label: "Confirmed", value: ordersInRange.filter((order) => order.status === "Confirmed").length },
            { label: "Shipped", value: ordersInRange.filter((order) => order.status === "Shipped").length },
            { label: "Delivered", value: ordersInRange.filter((order) => order.status === "Delivered").length },
          ]}
          emptyLabel="No order distribution yet."
        />
      </div>
    </div>
  );
}

function IntegrationsSection({
  settings,
  session,
}: {
  settings: AdminSettings;
  session: AdminSessionUser;
}) {
  const canView = hasPermission(session, "settings.view") || hasPermission(session, "settings.editSensitive");
  const cards = [
    { name: "Supabase", status: "Configured by app APIs", href: "/admin/settings", icon: ShieldCheck, connected: true },
    { name: "Vercel", status: "Deployment managed outside admin", href: "/admin/settings", icon: Globe, connected: true },
    { name: "Telegram alerts", status: settings.notificationSettings.telegramNewOrderEnabled ? "Enabled in settings" : "Not enabled", href: "/admin/settings", icon: Send, connected: settings.notificationSettings.telegramNewOrderEnabled },
    { name: "WhatsApp", status: settings.storeProfile.supportWhatsApp ? "Store contact configured" : "No number configured", href: "/admin/settings", icon: Phone, connected: Boolean(settings.storeProfile.supportWhatsApp) },
    { name: "Courier API", status: settings.deliverySettings.courierIntegrationMode === "manual" ? "Manual mode" : "Integration selected", href: "/admin/settings", icon: PackageCheck, connected: settings.deliverySettings.courierIntegrationMode !== "manual" },
    { name: "Payment/mobile wallet", status: "Managed from checkout settings", href: "/admin/settings", icon: Wallet, connected: true },
    { name: "Email/SMS", status: "Provider not connected yet", href: "", icon: Inbox, connected: false },
  ];

  if (!canView) {
    return <NoDataState label={blockedPermissionMessage} />;
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="aev-admin-hero-panel rounded-[1.35rem] border p-5">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-200/70">Integration Hub</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">System connection matrix</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
          Connected items route to the real settings surface. Provider onboarding buttons remain disabled until matching backend handlers exist.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.name} className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{card.name}</p>
                  <p className="mt-1 text-sm leading-6 text-white/52">{card.status}</p>
                </div>
                <TinyBadge label={card.connected ? "Online" : "Soon"} tone={card.connected ? "green" : "amber"} />
              </div>
              <div className="mt-4">
                {card.href ? (
                  <Link href={card.href} className="aev-admin-utility-link inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold">
                    Manage
                  </Link>
                ) : (
                  <DisabledAdminAction title={`${card.name} backend not connected yet`}>Connect</DisabledAdminAction>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function BillingSection({
  orders,
  session,
}: {
  orders: StoredOrder[];
  session: AdminSessionUser;
}) {
  const canView = hasPermission(session, "analytics.view") || hasPermission(session, "orders.view");
  const liveOrders = orders.filter((order) => !order.archivedAt && !order.deletedAt && !order.softDeletedAt);
  const revenue = liveOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const codRevenue = liveOrders
    .filter((order) => order.paymentDetails?.paymentMethod === "Cash on Delivery")
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const walletRevenue = liveOrders
    .filter((order) => order.paymentDetails?.paymentMethod === "Mobile Wallet Payment")
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const paidRevenue = liveOrders
    .filter((order) => order.paymentStatus === "verified")
    .reduce((sum, order) => sum + orderTotal(order), 0);

  if (!canView) {
    return <NoDataState label={blockedPermissionMessage} />;
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="aev-admin-hero-panel rounded-[1.35rem] border p-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-200/70">Finance / Billing Console</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Payment intelligence</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              Finance summaries are calculated from available order totals and payment metadata. Invoice and expense ledgers are marked as not connected.
            </p>
          </div>
          <DisabledAdminAction title="Finance export is not connected yet">
            <Upload className="h-4 w-4" />
            Export finance report
          </DisabledAdminAction>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross revenue" value={formatCurrency(revenue)} icon={Wallet} compact />
        <MetricCard label="Verified revenue" value={formatCurrency(paidRevenue)} icon={ShieldCheck} compact />
        <MetricCard label="COD summary" value={formatCurrency(codRevenue)} icon={CreditCard} compact />
        <MetricCard label="Wallet summary" value={formatCurrency(walletRevenue)} icon={Phone} compact />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
          <SectionHeader title="Payment queue" />
          <div className="mt-4 space-y-3">
            {liveOrders.slice(0, 6).map((order) => (
              <div key={order.orderId} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{orderReferenceKey(order)}</p>
                  <p className="mt-1 text-xs text-white/45">{order.customer?.fullName || "Customer"} · {order.paymentDetails?.paymentMethod || "Payment method pending"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <TinyBadge label={order.paymentStatus || "pending"} tone={order.paymentStatus === "verified" ? "green" : "amber"} />
                  <span className="text-sm font-semibold text-white">{formatCurrency(orderTotal(order))}</span>
                </div>
              </div>
            ))}
            {liveOrders.length === 0 && <NoDataState label="No finance-ready orders yet." />}
          </div>
        </section>
        <AdminComingSoonPanel
          title="Invoice and expense ledger not connected yet"
          message="Invoice generation, expense tracking, tax exports, and payment reconciliation require a dedicated finance backend before actions can be enabled."
          icon={CreditCard}
        />
      </div>
    </div>
  );
}

function CustomersSection({ session }: { session: AdminSessionUser }) {
  const canViewCustomers = hasPermission(session, "customers.view");
  const [customers, setCustomers] = useState<AdminCustomerClientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(canViewCustomers);
  const [error, setError] = useState(canViewCustomers ? "" : blockedPermissionMessage);

  useEffect(() => {
    if (!canViewCustomers) return;

    void fetch("/api/admin/customers", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          customers?: AdminCustomerClientRecord[];
          errors?: string[];
        } | null;
        if (!response.ok || !Array.isArray(payload?.customers)) {
          throw new Error(payload?.errors?.[0] ?? "Customers could not be loaded.");
        }
        setCustomers(payload.customers);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Customers could not be loaded."))
      .finally(() => setLoading(false));
  }, [canViewCustomers]);

  const visibleCustomers = customers.filter((customer) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [customer.fullName, customer.phone, customer.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
          <label className="relative block min-w-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Search customers
            </span>
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-white/35" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, phone, or email"
              className="w-full rounded-2xl border border-white/10 bg-[#08111f] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
            />
          </label>
          <p className="text-sm text-white/45">
            Showing {visibleCustomers.length} of {customers.length}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.25rem] border border-amber-200/18 bg-amber-200/[0.065] p-4 text-sm leading-6 text-amber-50/78">
          {error}
        </div>
      )}

      {loading ? (
        <NoDataState label="Loading customers..." />
      ) : (
        <div className="grid gap-3">
          {visibleCustomers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DetailLine label="Customer" value={customer.fullName} />
                <DetailLine label="Phone" value={customer.phone} />
                <DetailLine label="Email" value={customer.email} />
                <DetailLine label="Status" value={customer.isActive ? "Active" : "Inactive"} />
                <DetailLine label="Orders" value={String(customer.orderCount)} />
                <DetailLine label="Total spent estimate" value={formatCurrency(customer.totalSpent)} />
                <DetailLine label="Latest order" value={formatDate(customer.latestOrderAt)} />
                <DetailLine label="Saved addresses" value={String(customer.savedAddressesCount)} />
              </div>
            </article>
          ))}
          {visibleCustomers.length === 0 && <NoDataState label="No customers found." />}
        </div>
      )}
    </div>
  );
}

function SupportSection({ session }: { session: AdminSessionUser }) {
  const [conversations, setConversations] = useState<AdminConvSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminConvDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshMs, setAutoRefreshMs] = useState(30000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const detailEndRef = useRef<HTMLDivElement>(null);
  const replyTextRef = useRef("");
  const previousUnreadRef = useRef<number | null>(null);
  const canReply = hasPermission(session, "support.reply");
  const canClose = hasPermission(session, "support.close");
  const realConversations = conversations.length > 0;

  useEffect(() => {
    replyTextRef.current = replyText;
  }, [replyText]);

  const playNoticeSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioWindow = globalThis as typeof globalThis & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 740;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
    } catch {
      // Audio is optional.
    }
  }, [soundEnabled]);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/support/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: AdminConvSummary[] };
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        setSelectedId((current) => current ?? data.conversations[0]?.id ?? "demo-fatema");
        const unreadTotal = data.conversations.reduce(
          (sum, conversation) => sum + (conversation.unread_customer_count ?? 0),
          0
        );
        if (previousUnreadRef.current !== null && unreadTotal > previousUnreadRef.current) {
          playNoticeSound();
        }
        previousUnreadRef.current = unreadTotal;
        setLastUpdated(new Date());
      }
    } catch {
      // ignore
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, [playNoticeSound]);

  const loadDetail = useCallback(async (
    id: string,
    options: { markRead?: boolean; scroll?: boolean } = {}
  ) => {
    if (id.startsWith("demo-")) return;
    try {
      const query = options.markRead ? "?markRead=1" : "";
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(id)}${query}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AdminConvDetail;
      setDetail(data);
      if (options.markRead) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === id ? { ...conversation, unread_customer_count: 0 } : conversation
          )
        );
      }
      if (options.scroll && !replyTextRef.current.trim()) {
        setTimeout(() => detailEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshSupport = useCallback(async (isRefresh = true) => {
    if (selectedId) {
      await loadDetail(selectedId, { markRead: true, scroll: false });
    }
    await loadConversations(isRefresh);
  }, [loadConversations, loadDetail, selectedId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    if (selectedId.startsWith("demo-")) return;
    setDetail(null);
    void loadDetail(selectedId, { markRead: true, scroll: true }).then(() => {
      void loadConversations(true);
    });
  }, [selectedId, loadDetail, loadConversations]);

  useEffect(() => {
    if (!autoRefreshMs) return;

    const interval = window.setInterval(() => {
      void refreshSupport(true);
    }, autoRefreshMs);

    return () => window.clearInterval(interval);
  }, [autoRefreshMs, refreshSupport]);

  const sendReply = async () => {
    const body = replyText.trim();
    if (!body || !selectedId || sending) return;
    if (!canReply) {
      setSendError(blockedPermissionMessage);
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) { setSendError("Failed to send reply."); return; }
      setReplyText("");
      await loadDetail(selectedId);
      await loadConversations();
    } catch {
      setSendError("Network error.");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, status: ConvStatus) => {
    if (id.startsWith("demo-")) return;
    try {
      if (!canClose) return;
      await fetch(`/api/admin/support/conversations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      if (detail?.id === id) setDetail((d) => d ? { ...d, status } : d);
    } catch {
      // ignore
    }
  };

  const visibleConversations = realConversations ? conversations.map(realConversationToTicket) : demoSupportTickets;
  const activeTicket = visibleConversations.find((ticket) => ticket.id === selectedId) ?? visibleConversations[0] ?? demoSupportTickets[0];
  const activeMessages = realConversations && detail?.id === activeTicket.id
    ? detail.messages.map((message) => ({
        id: message.id,
        role: message.sender_type,
        body: message.body,
        time: supportTimeLabel(message.created_at),
      }))
    : demoSupportMessages;
  const openTickets = realConversations ? conversations.filter((conversation) => conversation.status !== "closed").length : 23;
  const unreadMessages = realConversations ? conversations.reduce((sum, conversation) => sum + (conversation.unread_customer_count ?? 0), 0) : 15;
  const resolvedToday = realConversations ? conversations.filter((conversation) => conversation.status === "closed").length : 46;
  const metricCards = [
    { label: "Open Tickets", value: String(openTickets || 23), trend: "18.2% vs last 7 days", icon: Inbox, tone: "cyan" },
    { label: "Unread Messages", value: String(unreadMessages || 15), trend: "12.4% vs last 7 days", icon: BellIcon, tone: "violet" },
    { label: "Resolved Today", value: String(resolvedToday || 46), trend: "24.7% vs yesterday", icon: ClipboardList, tone: "emerald" },
    { label: "Avg. Response Time", value: "18m 24s", trend: "8.6% vs last 7 days", icon: MessageSquare, tone: "pink" },
  ];

  if (autoRefreshMs >= 0) return (
    <div className="mt-6 space-y-4 text-white">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-fuchsia-300/18 bg-[#050816] p-4 shadow-[0_0_60px_rgba(168,85,247,0.12)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.46),transparent_24%),radial-gradient(circle_at_48%_20%,rgba(34,211,238,0.28),transparent_22%)]" />
        <div className="absolute inset-x-10 top-3 h-24 rounded-[50%] border border-cyan-300/18 opacity-70 shadow-[0_0_40px_rgba(34,211,238,0.22)]" />
        <div className="absolute left-1/2 top-4 h-20 w-20 -translate-x-1/2 rounded-full border border-fuchsia-300/25 bg-fuchsia-500/10 shadow-[0_0_60px_rgba(217,70,239,0.5)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Support Command Center</h2>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live
                </span>
                {!loading && !realConversations && (
                  <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-2.5 py-1 text-[10px] font-bold text-fuchsia-100">
                    Visual demo mode
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/58">Real-time control and insights for your customer support operations</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1023]/80 px-3 py-2 text-xs text-white/65">
                <CalendarDays className="h-3.5 w-3.5 text-fuchsia-200" />
                May 13 - May 18, 2026
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1023]/80 px-3 py-2 text-xs text-white/65">
                <Download className="h-3.5 w-3.5 text-cyan-200" />
                Export
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => <SupportMetricCard key={metric.label} {...metric} />)}
          </div>
        </div>
      </section>

      <section className="grid gap-3 2xl:grid-cols-[360px_minmax(460px,1fr)_320px_330px]">
        <div className="support-panel min-h-[620px] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Support Inbox</h3>
              <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-100">{openTickets || 23} Open</span>
            </div>
            <div className="flex items-center gap-1">
              <IconButton icon={Search} label="Search" />
              <IconButton icon={Rows3} label="Filter" />
              <IconButton icon={MoreVertical} label="More" />
            </div>
          </div>
          <div className="mb-3 flex gap-2">
            {["All 23", "Unread 15", "Mentions 2"].map((tab, index) => (
              <button key={tab} type="button" className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${index === 0 ? "bg-fuchsia-400/16 text-fuchsia-100" : "bg-white/[0.035] text-white/42 hover:text-white/70"}`}>{tab}</button>
            ))}
          </div>
          <div className="space-y-2">
            {visibleConversations.map((ticket) => (
              <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} className={`group w-full rounded-xl border p-2.5 text-left transition ${activeTicket.id === ticket.id ? "border-fuchsia-300/45 bg-fuchsia-400/[0.115] shadow-[0_0_26px_rgba(217,70,239,0.18)]" : "border-white/[0.07] bg-white/[0.025] hover:border-cyan-300/24 hover:bg-cyan-300/[0.045]"}`}>
                <div className="flex gap-2.5">
                  <SupportAvatar name={ticket.name} image={ticket.avatar} status />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{ticket.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/36"><MessageSquare className="h-3 w-3 text-emerald-300" /><span className="truncate">{ticket.orderRef}</span></div>
                      </div>
                      <span className="shrink-0 text-[10px] text-white/35">{ticket.time}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-white/58">{ticket.preview}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityChip priority={ticket.priority} />
                      <div className="flex items-center gap-1.5">
                        {ticket.unread > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-fuchsia-400 text-[10px] font-bold text-white">{ticket.unread}</span>}
                        {activeTicket.id === ticket.id && <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button type="button" className="mt-4 w-full rounded-xl border border-fuchsia-300/18 bg-fuchsia-400/[0.075] px-4 py-2.5 text-xs font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/36">View all conversations -&gt;</button>
        </div>

        <div className="support-panel flex min-h-[620px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <SupportAvatar name={activeTicket.name} image={activeTicket.avatar} status size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{activeTicket.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/42"><span>{activeTicket.phone}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{activeTicket.location}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-violet-300/18 bg-violet-400/10 px-3 py-2 text-[11px] font-semibold text-violet-100">Order {activeTicket.orderRef}</span>
              <button type="button" className="rounded-lg border border-violet-300/16 bg-violet-400/[0.07] px-3 py-2 text-[11px] font-semibold text-violet-100">View Order</button>
              <IconButton icon={MoreVertical} label="Options" />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(88,28,135,0.14),transparent_36%)] p-4">
            <div className="mx-auto w-fit rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1 text-[10px] text-white/36">Today</div>
            {activeMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[76%] rounded-2xl px-4 py-3 text-xs leading-5 ${message.role === "admin" ? "rounded-br-md bg-gradient-to-br from-[#3b176f] to-[#7a1f8f] text-white shadow-[0_0_22px_rgba(168,85,247,0.2)]" : "rounded-bl-md border border-white/[0.07] bg-white/[0.06] text-white/82"}`}>
                  <p>{message.body}</p>
                  <p className={`mt-1 text-right text-[10px] ${message.role === "admin" ? "text-cyan-100/55" : "text-white/32"}`}>{message.time}</p>
                </div>
              </div>
            ))}
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1 text-[10px] text-white/38"><ShieldCheck className="h-3 w-3" />Order status requested<span>10:32 AM</span></div>
            <div ref={detailEndRef} />
          </div>
          <div className="border-t border-white/[0.07] p-3">
            {sendError && <p className="mb-2 text-xs text-rose-300/80">{sendError}</p>}
            <div className="mb-2 flex gap-5 border-b border-white/[0.07] text-xs"><button type="button" className="border-b border-fuchsia-300 pb-2 font-semibold text-fuchsia-100">Reply</button><button type="button" className="pb-2 text-white/42">Internal Note</button></div>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendReply(); } }} placeholder="Type your message..." rows={3} className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#070d1d] px-3 py-3 text-xs text-white outline-none placeholder:text-white/28 focus:border-fuchsia-300/35" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">{[Smile, Paperclip, ImageIcon, FileText, Tag].map((Icon, index) => <IconButton key={index} icon={Icon} label="Action" />)}</div>
              <button type="button" onClick={() => void sendReply()} disabled={sending || !replyText.trim() || activeTicket.id.startsWith("demo-") || !canReply} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(217,70,239,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Sending" : "Send"}<ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        <TicketDetailsPanel ticket={activeTicket} canClose={canClose} onStatus={updateStatus} />
        <div className="space-y-3"><SupportChannelsPanel /><EscalationPanel /><LiveActivityFeed /></div>
      </section>

      <section className="support-panel p-3">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-white">Quick Replies &amp; Macros</h3><button type="button" className="rounded-lg border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-[11px] font-semibold text-fuchsia-100">Manage</button></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {demoMacros.map((macro) => <button key={macro.title} type="button" className="rounded-xl border border-violet-300/18 bg-white/[0.035] p-3 text-left transition hover:border-fuchsia-300/45 hover:bg-fuchsia-400/[0.08]"><p className="text-xs font-bold text-fuchsia-100">{macro.title}</p><p className="mt-1 text-[11px] text-white/42">{macro.description}</p></button>)}
          <button type="button" className="grid min-h-16 place-items-center rounded-xl border border-dashed border-fuchsia-300/28 bg-fuchsia-400/[0.045] text-[11px] font-semibold text-fuchsia-100"><Plus className="mb-1 h-4 w-4" />Add New</button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/30">
        <span>Last updated: {supportTimeLabel(lastUpdated?.toISOString())}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">Auto-refresh<select value={autoRefreshMs} onChange={(event) => setAutoRefreshMs(Number(event.target.value))} className="bg-transparent text-white/60 outline-none">{supportRefreshOptions.map((option) => <option key={option.value} value={option.value} className="bg-[#07111f] text-white">{option.label}</option>)}</select></label>
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />Sound</label>
          <button type="button" onClick={() => void refreshSupport(true)} disabled={refreshing} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-white/55 transition hover:text-white disabled:opacity-40"><RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
        </div>
      </div>
    </div>
  );

}

type SupportPriority = "High" | "Medium" | "Low";

type SupportTicketView = {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  location: string;
  orderRef: string;
  preview: string;
  time: string;
  priority: SupportPriority;
  unread: number;
  status: ConvStatus;
  channel: string;
  issueType: string;
  createdDate: string;
  placedDate: string;
  total: string;
  orderStatus: string;
};

type SupportMessageView = {
  id: string;
  role: "customer" | "admin";
  body: string;
  time: string;
};

const demoSupportTickets: SupportTicketView[] = [
  { id: "demo-fatema", name: "Fatema J.", avatar: "FJ", phone: "+8801XXXXXXXXX", email: "fatema.j@example.com", location: "Dhaka, Bangladesh", orderRef: "#BOT-1247", preview: "Where is my order? I haven't received...", time: "10:31 AM", priority: "High", unread: 2, status: "open", channel: "WhatsApp", issueType: "Order Inquiry", createdDate: "May 19, 2026 10:31 AM", placedDate: "May 16, 2026", total: "BDT 1,247", orderStatus: "In Transit" },
  { id: "demo-naznin", name: "Naznin S.", avatar: "NS", phone: "+8801XXXXXXXXX", email: "naznin.s@example.com", location: "Chattogram, Bangladesh", orderRef: "#BOT-1241", preview: "I received the wrong size in my order.", time: "10:29 AM", priority: "Medium", unread: 1, status: "open", channel: "Live Chat", issueType: "Wrong Size", createdDate: "May 19, 2026 10:29 AM", placedDate: "May 15, 2026", total: "BDT 1,690", orderStatus: "Delivered" },
  { id: "demo-sabrina", name: "Sabrina Akter", avatar: "SA", phone: "+8801XXXXXXXXX", email: "sabrina@example.com", location: "Sylhet, Bangladesh", orderRef: "#BOT-1240", preview: "Can I change my shipping address?", time: "10:25 AM", priority: "Medium", unread: 0, status: "pending", channel: "Contact Form", issueType: "Address Change", createdDate: "May 19, 2026 10:25 AM", placedDate: "May 14, 2026", total: "BDT 2,140", orderStatus: "Processing" },
  { id: "demo-raisa", name: "Raisa Ahmed", avatar: "RA", phone: "+8801XXXXXXXXX", email: "raisa@example.com", location: "Dhaka, Bangladesh", orderRef: "#BOT-1239", preview: "Do you have this in black color?", time: "10:21 AM", priority: "Low", unread: 0, status: "open", channel: "Product Help", issueType: "Product Question", createdDate: "May 19, 2026 10:21 AM", placedDate: "May 13, 2026", total: "BDT 890", orderStatus: "Draft" },
  { id: "demo-mim", name: "Mim Islam", avatar: "MI", phone: "+8801XXXXXXXXX", email: "mim@example.com", location: "Rajshahi, Bangladesh", orderRef: "#BOT-1238", preview: "Payment failed but money deducted.", time: "10:18 AM", priority: "High", unread: 3, status: "open", channel: "WhatsApp", issueType: "Payment Issue", createdDate: "May 19, 2026 10:18 AM", placedDate: "May 12, 2026", total: "BDT 1,420", orderStatus: "Payment Review" },
  { id: "demo-tahmina", name: "Tahmina R.", avatar: "TR", phone: "+8801XXXXXXXXX", email: "tahmina@example.com", location: "Khulna, Bangladesh", orderRef: "#BOT-1237", preview: "How do I use the size guide?", time: "10:14 AM", priority: "Low", unread: 0, status: "open", channel: "Product Help", issueType: "Size Help", createdDate: "May 19, 2026 10:14 AM", placedDate: "May 11, 2026", total: "BDT 760", orderStatus: "Browsing" },
  { id: "demo-orpa", name: "Orpa Roy", avatar: "OR", phone: "+8801XXXXXXXXX", email: "orpa@example.com", location: "Barishal, Bangladesh", orderRef: "#BOT-1236", preview: "I want to return this product.", time: "10:11 AM", priority: "Medium", unread: 0, status: "pending", channel: "Contact Form", issueType: "Return Request", createdDate: "May 19, 2026 10:11 AM", placedDate: "May 10, 2026", total: "BDT 1,120", orderStatus: "Delivered" },
];

const demoSupportMessages: SupportMessageView[] = [
  { id: "demo-msg-1", role: "customer", body: "Where is my order? I haven't received any update.", time: "10:31 AM" },
  { id: "demo-msg-2", role: "admin", body: "Hello Fatema! Thank you for reaching out. Let me check your order status for you.", time: "10:32 AM" },
  { id: "demo-msg-3", role: "admin", body: "Your order #BOT-1247 is currently in transit and expected to be delivered by May 17, 2026.", time: "10:33 AM" },
  { id: "demo-msg-4", role: "customer", body: "Okay, thank you! Please let me know if there's any delay.", time: "10:33 AM" },
  { id: "demo-msg-5", role: "admin", body: "Absolutely! We'll keep you updated. Is there anything else I can help you with today?", time: "10:34 AM" },
];

const demoMacros = [
  { title: "Order Status", description: "Check order status" },
  { title: "Shipping Update", description: "Provide shipping info" },
  { title: "Return Policy", description: "Explain return process" },
  { title: "Size Help", description: "Help with sizing" },
  { title: "Thank You", description: "Appreciate customer" },
];

function realConversationToTicket(conversation: AdminConvSummary): SupportTicketView {
  const source = conversation.source_page || "Live Chat";
  const lastMessage = conversation.last_message?.body || `${convStatusLabels[conversation.status]} conversation`;
  return {
    id: conversation.id,
    name: source.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Customer",
    avatar: "CU",
    phone: "+8801XXXXXXXXX",
    email: "customer@example.com",
    location: "Bangladesh",
    orderRef: `#${conversation.id.slice(0, 8).toUpperCase()}`,
    preview: lastMessage,
    time: supportTimeLabel(conversation.last_message?.created_at || conversation.updated_at || conversation.created_at),
    priority: (conversation.unread_customer_count ?? 0) > 1 ? "High" : conversation.status === "pending" ? "Medium" : "Low",
    unread: conversation.unread_customer_count ?? 0,
    status: conversation.status,
    channel: source.includes("whatsapp") ? "WhatsApp" : source.includes("contact") ? "Contact Form" : "Live Chat",
    issueType: "Customer Support",
    createdDate: formatDate(conversation.created_at),
    placedDate: "Linked order pending",
    total: "BDT --",
    orderStatus: convStatusLabels[conversation.status],
  };
}

function SupportMetricCard({
  label,
  value,
  trend,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  icon: typeof MessageSquare;
  tone: string;
}) {
  const toneClass = tone === "cyan"
    ? "from-cyan-400/22 text-cyan-200 border-cyan-300/20"
    : tone === "emerald"
      ? "from-emerald-400/22 text-emerald-200 border-emerald-300/20"
      : tone === "pink"
        ? "from-pink-400/22 text-pink-200 border-pink-300/20"
        : "from-violet-400/22 text-violet-200 border-violet-300/20";
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#091126]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-4">
        <div className={`grid h-11 w-11 place-items-center rounded-xl border bg-gradient-to-br to-transparent ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-white/58">{label}</p>
          <p className="mt-0.5 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-[11px] text-emerald-300">up {trend}</p>
        </div>
      </div>
    </article>
  );
}

function IconButton({ icon: Icon, label }: { icon: typeof MessageSquare; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.035] text-white/45 transition hover:border-fuchsia-300/25 hover:text-white">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function SupportAvatar({ name, image, status, size = "md" }: { name: string; image: string; status?: boolean; size?: "md" | "lg" }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full border border-fuchsia-200/30 bg-gradient-to-br from-fuchsia-300 via-violet-500 to-cyan-400 text-xs font-black text-white shadow-[0_0_18px_rgba(217,70,239,0.22)] ${size === "lg" ? "h-11 w-11" : "h-9 w-9"}`}>
      {image || name.slice(0, 2)}
      {status && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#080d1b] bg-emerald-300" />}
    </span>
  );
}

function PriorityChip({ priority }: { priority: SupportPriority }) {
  const cls = priority === "High"
    ? "border-pink-300/30 bg-pink-400/10 text-pink-200"
    : priority === "Medium"
      ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
      : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>{priority}</span>;
}

function TicketDetailsPanel({ ticket, canClose, onStatus }: { ticket: SupportTicketView; canClose: boolean; onStatus: (id: string, status: ConvStatus) => Promise<void> }) {
  return (
    <div className="support-panel min-h-[620px] p-3">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Ticket Details</h3><button type="button" className="rounded-md border border-fuchsia-300/16 bg-fuchsia-400/10 px-2 py-1 text-[10px] font-semibold text-fuchsia-100">Edit</button></div>
      <div className="space-y-2 border-b border-white/[0.07] pb-3 text-[11px]">
        <DetailPair label="Ticket ID" value={ticket.id.startsWith("demo-") ? "#TKT-5689" : `#${ticket.id.slice(0, 8)}`} />
        <DetailPair label="Created" value={ticket.createdDate} />
        <DetailPair label="Channel" value={ticket.channel} accent="emerald" />
        <DetailPair label="Issue Type" value={ticket.issueType} accent="fuchsia" />
        <DetailPair label="Priority" value={ticket.priority} accent="pink" />
        <DetailPair label="Status" value={convStatusLabels[ticket.status]} accent="amber" />
      </div>
      <div className="border-b border-white/[0.07] py-3">
        <h4 className="mb-2 text-xs font-bold text-white">Customer Details</h4>
        <div className="flex gap-2"><SupportAvatar name={ticket.name} image={ticket.avatar} /><div className="min-w-0 text-[11px] text-white/50"><p className="font-bold text-white">{ticket.name}</p><p>{ticket.email}</p><p>{ticket.phone}</p><p>{ticket.location}</p></div><div className="ml-auto space-y-1"><IconButton icon={Phone} label="Call" /><IconButton icon={MessageSquare} label="Message" /></div></div>
      </div>
      <div className="border-b border-white/[0.07] py-3 text-[11px]">
        <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-bold text-white">Order Information</h4><button type="button" className="rounded-md border border-pink-300/16 px-2 py-1 text-[10px] font-semibold text-pink-100">View Order</button></div>
        <DetailPair label="Order" value={ticket.orderRef} accent="violet" />
        <DetailPair label="Placed on" value={ticket.placedDate} />
        <DetailPair label="Total" value={ticket.total} />
        <DetailPair label="Status" value={ticket.orderStatus} accent="cyan" />
      </div>
      <div className="border-b border-white/[0.07] py-3"><h4 className="mb-2 text-xs font-bold text-white">Tags</h4><div className="flex flex-wrap gap-1.5">{["order-status", "in-transit", "vip-customer"].map((tag) => <span key={tag} className="rounded-md border border-violet-300/18 bg-violet-400/10 px-2 py-1 text-[10px] text-violet-100">{tag}</span>)}<button type="button" className="grid h-6 w-6 place-items-center rounded-md border border-white/10 text-white/40"><Plus className="h-3 w-3" /></button></div></div>
      <div className="border-b border-white/[0.07] py-3"><h4 className="mb-2 text-xs font-bold text-white">Attachments</h4>{["order_receipt.pdf", "screenshot_2026-05-19.png"].map((file, index) => <div key={file} className="mb-2 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.035] p-2 text-[11px] text-white/55"><FileText className="h-4 w-4 text-fuchsia-200" /><span className="min-w-0 flex-1 truncate">{file}<span className="block text-[10px] text-white/30">{index === 0 ? "128 KB" : "412 KB"} file</span></span><Download className="h-3.5 w-3.5" /></div>)}</div>
      <div className="grid grid-cols-3 gap-2 pt-3">
        <button type="button" disabled={!canClose} onClick={() => void onStatus(ticket.id, "closed")} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[11px] font-semibold text-white/58 disabled:opacity-55">Close Ticket</button>
        <button type="button" disabled={!canClose} onClick={() => void onStatus(ticket.id, "pending")} className="rounded-lg border border-amber-300/24 bg-amber-400/10 px-2 py-2 text-[11px] font-semibold text-amber-100 disabled:opacity-55">Escalate</button>
        <button type="button" disabled={!canClose} onClick={() => void onStatus(ticket.id, "closed")} className="rounded-lg border border-emerald-300/24 bg-emerald-400/12 px-2 py-2 text-[11px] font-semibold text-emerald-100 disabled:opacity-55">Resolve</button>
      </div>
    </div>
  );
}

function DetailPair({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "fuchsia" | "pink" | "amber" | "violet" | "cyan" }) {
  const accentClass = accent === "emerald" ? "text-emerald-300" : accent === "fuchsia" ? "text-fuchsia-200" : accent === "pink" ? "text-pink-200" : accent === "amber" ? "text-amber-200" : accent === "violet" ? "text-violet-200" : accent === "cyan" ? "text-cyan-200" : "text-white/72";
  return <div className="flex items-center justify-between gap-3"><span className="text-white/40">{label}</span><span className={`text-right font-semibold ${accentClass}`}>{value}</span></div>;
}

function SupportChannelsPanel() {
  const channels = [
    { label: "Live Chat", value: "8 Active", icon: MessageSquare, tone: "text-cyan-200" },
    { label: "WhatsApp", value: "12 Active", icon: Phone, tone: "text-emerald-200" },
    { label: "Contact Form", value: "3 New", icon: Inbox, tone: "text-violet-200" },
    { label: "Product Help", value: "5 Articles", icon: HelpCircle, tone: "text-pink-200" },
  ];
  return (
    <div className="support-panel p-3">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Support Channels</h3><button type="button" className="rounded-md border border-fuchsia-300/16 bg-fuchsia-400/10 px-2 py-1 text-[10px] font-semibold text-fuchsia-100">Manage</button></div>
      <div className="grid grid-cols-2 gap-2">{channels.map(({ label, value, icon: Icon, tone }) => <button key={label} type="button" className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-left"><Icon className={`mb-2 h-5 w-5 ${tone}`} /><p className="text-xs font-bold text-white">{label}</p><p className={`mt-1 text-[11px] ${tone}`}>{value}</p></button>)}</div>
    </div>
  );
}

function EscalationPanel() {
  return (
    <div className="support-panel p-3">
      <h3 className="mb-3 text-sm font-bold text-white">Escalation &amp; Assignment</h3>
      {["Assign To", "Team", "Priority", "Escalate To"].map((label, index) => <label key={label} className="mb-2 grid grid-cols-[78px_1fr] items-center gap-2 text-[11px] text-white/45"><span>{label}</span><select className="rounded-lg border border-white/[0.08] bg-[#0a1022] px-3 py-2 text-white/66 outline-none"><option>{["Nusrat Jahan", "Customer Support Team", "High", "Senior Support"][index]}</option></select></label>)}
      <button type="button" className="mt-1 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white">Escalate Ticket</button>
    </div>
  );
}

function LiveActivityFeed() {
  const rows = [
    { title: "Ticket created", time: "10:25 AM", icon: MessageSquare },
    { title: "Replied to ticket", time: "10:23 AM", icon: Send },
    { title: "Ticket escalated", time: "10:18 AM", icon: BellIcon },
    { title: "Resolved ticket", time: "10:15 AM", icon: Check },
    { title: "Contact Form submission received", time: "10:11 AM", icon: Inbox },
  ];
  return (
    <div className="support-panel p-3">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Live Activity Feed</h3><button type="button" className="rounded-md border border-fuchsia-300/16 bg-fuchsia-400/10 px-2 py-1 text-[10px] font-semibold text-fuchsia-100">View all</button></div>
      <div className="space-y-2">{rows.map(({ title, time, icon: Icon }) => <div key={title} className="flex items-center gap-2 rounded-lg bg-white/[0.025] p-2"><Icon className="h-4 w-4 text-fuchsia-200" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-white">{title}</p><p className="text-[10px] text-white/35">Support operation updated</p></div><span className="text-[10px] text-white/35">{time}</span></div>)}</div>
      <button type="button" className="mt-3 w-full rounded-lg border border-fuchsia-300/16 bg-fuchsia-400/[0.06] py-2 text-[11px] font-semibold text-fuchsia-100">View full activity log -&gt;</button>
    </div>
  );
}

function emptyStaffDraft(): AdminStaffClientRecord & { password: string } {
  const role: AdminRole = "viewer";
  return {
    id: "",
    name: "",
    email: "",
    username: "",
    role,
    permissions: { ...roleDefaultPermissionsToMap(role) },
    isActive: true,
    password: "",
  };
}

function roleDefaultPermissionsToMap(role: AdminRole) {
  return adminPermissionKeys.reduce((result, key) => {
    result[key] = roleDefaultPermissions[role].includes(key);
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

function emptyReviewDraft(products: AdminProduct[]) {
  const product = products.find((item) => !item.deletedAt) ?? products[0];
  return {
    productId: product?.id ?? "",
    productSlug: product?.slug ?? "",
    customerName: "",
    rating: 5,
    title: "",
    body: "",
    mediaUrls: [""],
    status: "pending" as AdminReviewClientRecord["status"],
    sourceType: "admin-added" as AdminReviewClientRecord["sourceType"],
    isFeatured: false,
    adminNote: "",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function validReviewMediaUrls(urls: string[]) {
  const seen = new Set<string>();
  return urls
    .map((url) => url.trim())
    .filter((url) => {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, 3);
}

function reviewSourceTypeForSubmit(
  value: AdminReviewClientRecord["sourceType"]
): "admin-added" | "imported" {
  if (value === "imported" || value === "customer-submitted") return "imported";
  return "admin-added";
}

function isValidReviewStatus(value: string): value is AdminReviewClientRecord["status"] {
  return value === "pending" || value === "approved" || value === "rejected" || value === "hidden";
}

function AdminTextInput({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
      />
    </label>
  );
}

function ReviewsSection({
  reviews,
  setReviews,
  products,
  session,
}: {
  reviews: AdminReviewClientRecord[];
  setReviews: (value: AdminReviewClientRecord[] | ((current: AdminReviewClientRecord[]) => AdminReviewClientRecord[])) => void;
  products: AdminProduct[];
  session: AdminSessionUser;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | AdminReviewClientRecord["status"]>("all");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reviewMediaUploading, setReviewMediaUploading] = useState(false);
  const [reviewMediaUploadError, setReviewMediaUploadError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyReviewDraft(products));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draftSubmitError, setDraftSubmitError] = useState("");
  const canModerate = hasPermission(session, "reviews.manage") || hasPermission(session, "reviews.moderate");
  const canFeature = hasPermission(session, "reviews.manage") || hasPermission(session, "reviews.feature");
  const canManage = hasPermission(session, "reviews.manage");
  const canEditReview = canModerate;

  useEffect(() => {
    if (draft.productId || products.length === 0) return;
    setDraft(emptyReviewDraft(products));
  }, [draft.productId, products]);

  const filteredReviews = useMemo(() => {
    const term = query.trim().toLowerCase();
    const minRating = ratingFilter === "all" ? 0 : Number(ratingFilter);
    return reviews.filter((review) => {
      if (statusFilter !== "all" && review.status !== statusFilter) return false;
      if (
        productFilter !== "all" &&
        review.productId !== productFilter &&
        review.productSlug !== productFilter
      ) {
        return false;
      }
      if (minRating && review.rating !== minRating) return false;
      const product = products.find(
        (item) =>
          item.id === review.productId ||
          item.slug === review.productSlug ||
          item.slug === review.productId
      );
      if (!term) return true;
      return [
        product?.name,
        review.productSlug,
        review.productId,
        review.customerName,
        review.orderReference,
        review.title,
        review.body,
        review.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [productFilter, products, query, ratingFilter, reviews, statusFilter]);

  const selectedDraftProduct = products.find(
    (product) =>
      product.id === draft.productId ||
      product.slug === draft.productSlug ||
      product.slug === draft.productId
  );
  const draftDateValue = draft.createdAt || new Date().toISOString().slice(0, 10);
  const draftSourceType = reviewSourceTypeForSubmit(draft.sourceType);
  const validMediaUrls = validReviewMediaUrls(draft.mediaUrls);
  const hasInvalidMediaUrl = draft.mediaUrls.some((url) => url.trim() && !validMediaUrls.includes(url.trim()));

  const saveReview = async (
    review: AdminReviewClientRecord,
    updates: Omit<Parameters<typeof updateReviewInApi>[0], "id">
  ) => {
    setSavingId(review.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateReviewInApi({ id: review.id, ...updates });
      const refreshedReviews = await readReviewsFromApi();
      setReviews(refreshedReviews ?? ((current) => current.map((item) => (item.id === updated.id ? updated : item))));
      setMessage("Review saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be updated.");
    } finally {
      setSavingId(null);
    }
  };

  const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canSubmitReview = editingId ? canEditReview : canManage;

    if (!canSubmitReview) {
      setDraftSubmitError("Missing review management permission");
      setError("Missing review management permission");
      setMessage("");
      return;
    }

    const submitValidationMessages = [
      !selectedDraftProduct && !draft.productSlug.trim() ? "Select a product or enter a product slug." : "",
      !draft.customerName.trim() ? "Customer display name is required." : "",
      !Number.isFinite(draft.rating) || draft.rating < 1 || draft.rating > 5
        ? "Rating must be between 1 and 5."
        : "",
      !draft.body.trim() ? "Review text is required." : "",
      !isValidReviewStatus(draft.status) ? "Status is required." : "",
    ].filter(Boolean);

    if (submitValidationMessages.length > 0) {
      const validationError = submitValidationMessages.join(" ");
      setDraftSubmitError(validationError);
      setError(validationError);
      setMessage("");
      return;
    }

    setSavingId(editingId || "new");
    setError("");
    setDraftSubmitError("");
    setMessage("");
    try {
      const payload = {
        ...draft,
        productId: selectedDraftProduct?.id || "",
        productSlug: selectedDraftProduct?.slug || draft.productSlug.trim(),
        mediaUrls: validMediaUrls,
        sourceType: draftSourceType,
        verifiedPurchase: false,
        isFeatured: draft.status === "approved" && draft.isFeatured,
        createdAt: draftDateValue,
      };
      if (process.env.NODE_ENV !== "production") {
        console.log("Submitting admin review payload", payload);
      }
      if (editingId) {
        const updated = await updateReviewInApi({ id: editingId, ...payload });
        const refreshedReviews = await readReviewsFromApi();
        setReviews(refreshedReviews ?? ((current) => current.map((item) => (item.id === updated.id ? updated : item))));
        setMessage("Review saved.");
        setStatusFilter("all");
      } else {
        const created = await createReviewInApi(payload);
        const refreshedReviews = await readReviewsFromApi();
        setReviews(refreshedReviews ?? ((current) => [created, ...current]));
        setMessage("Review added.");
        setStatusFilter("all");
      }
      setEditingId(null);
      setDraft(emptyReviewDraft(products));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Review could not be saved.";
      console.error("Admin review submit failed:", err);
      setDraftSubmitError(errorMessage);
      setError(errorMessage);
    } finally {
      setSavingId(null);
    }
  };

  const editReview = (review: AdminReviewClientRecord) => {
    setEditingId(review.id);
    setDraft({
      productId: review.productId,
      productSlug: review.productSlug,
      customerName: review.customerName,
      rating: review.rating,
      title: review.title || "",
      body: review.body,
      mediaUrls: review.mediaUrls.length > 0 ? review.mediaUrls : [""],
      status: review.status,
      sourceType: review.sourceType,
      isFeatured: review.isFeatured,
      adminNote: review.adminNote || "",
      createdAt: review.createdAt.slice(0, 10),
    });
  };

  const deleteReview = async (review: AdminReviewClientRecord) => {
    if (!canEditReview) {
      setError("Missing review moderation permission.");
      setMessage("");
      return;
    }
    if (!window.confirm("Delete this review permanently?")) return;
    setSavingId(review.id);
    setError("");
    setMessage("");
    try {
      await deleteReviewInApi(review.id);
      const refreshedReviews = await readReviewsFromApi();
      setReviews(refreshedReviews ?? ((current) => current.filter((item) => item.id !== review.id)));
      if (editingId === review.id) {
        setEditingId(null);
        setDraft(emptyReviewDraft(products));
      }
      setMessage("Review deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be deleted.");
    } finally {
      setSavingId(null);
    }
  };

  const uploadReviewMedia = async (file: File) => {
    if (!(editingId ? canEditReview : canManage)) return;
    setReviewMediaUploading(true);
    setReviewMediaUploadError("");
    try {
      const selectedProduct = products.find((product) => product.id === draft.productId);
      const form = new FormData();
      form.append("file", file);
      form.append("productSlug", selectedProduct?.slug || draft.productSlug || "review");
      const response = await fetch("/api/product-media/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok || typeof payload.url !== "string") {
        const msg =
          Array.isArray(payload.errors) && typeof payload.errors[0] === "string"
            ? payload.errors[0]
            : "Review media upload failed.";
        setReviewMediaUploadError(msg);
        return;
      }
      setDraft((current) => ({
        ...current,
        mediaUrls: [...current.mediaUrls.filter(Boolean), payload.url as string].slice(0, 3),
      }));
    } catch {
      setReviewMediaUploadError("Review media upload failed. Check your connection.");
    } finally {
      setReviewMediaUploading(false);
    }
  };

  const statusCounts = reviews.reduce(
    (counts, review) => {
      counts[review.status] += 1;
      return counts;
    },
    { pending: 0, approved: 0, rejected: 0, hidden: 0 }
  );
  const reviewProducts = products.filter((product) =>
    reviews.some(
      (review) =>
        review.productId === product.id ||
        review.productSlug === product.slug ||
        review.productId === product.slug
    )
  );

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.055] p-4 text-sm leading-6 text-cyan-50/76">
        Reviews are private until approved. Admin-added or imported reviews are labeled as customer feedback only; verified purchase is reserved for order-linked account reviews.
      </div>
      {message && (
        <div className="rounded-[1.25rem] border border-emerald-200/22 bg-emerald-200/[0.08] p-4 text-sm leading-6 text-emerald-50/86">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-[1.25rem] border border-rose-200/22 bg-rose-200/[0.08] p-4 text-sm leading-6 text-rose-50/86">
          {error}
        </div>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <SectionHeader title={editingId ? "Edit review" : "Add customer feedback"} />
        <form onSubmit={saveDraft} className="grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">Product</span>
            <select
              value={draft.productId}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(event) => {
                const selected = products.find((product) => product.id === event.target.value);
                setDraft((current) => ({
                  ...current,
                  productId: selected?.id || "",
                  productSlug: selected?.slug || "",
                }));
              }}
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
            >
              <option value="">Select product</option>
              {products
                .filter((product) => !product.deletedAt)
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
            </select>
          </label>
          <AdminTextInput
            label="Customer display name"
            value={draft.customerName}
            disabled={editingId ? !canEditReview : !canManage}
            onChange={(value) => setDraft((current) => ({ ...current, customerName: value }))}
          />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">Rating</span>
            <select
              value={draft.rating}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(event) => setDraft((current) => ({ ...current, rating: Number(event.target.value) }))}
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} star</option>
              ))}
            </select>
          </label>
          <AdminTextInput
            label="Review title"
            value={draft.title}
            disabled={editingId ? !canEditReview : !canManage}
            onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          />
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">Review text</span>
            <textarea
              value={draft.body}
              rows={4}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
              className="w-full resize-none rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
            />
          </label>
          <div className="lg:col-span-2">
            <AdminTextInput
              label="Media URL (optional)"
              value={draft.mediaUrls[0] || ""}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  mediaUrls: value ? [value, ...current.mediaUrls.slice(1)].filter(Boolean) : current.mediaUrls.slice(1),
                }))
              }
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <MiniUploadButton
                label="Upload review image/video"
                uploading={reviewMediaUploading}
                error={reviewMediaUploadError || null}
                onUpload={uploadReviewMedia}
              />
              {draft.mediaUrls.filter(Boolean).map((url, index) => (
                <span key={`${url}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/58">
                  <span className="max-w-[14rem] truncate">Media {index + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        mediaUrls: current.mediaUrls.filter((item) => item !== url),
                      }))
                    }
                    className="text-rose-200 hover:text-rose-100"
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
            {hasInvalidMediaUrl && (
              <p className="mt-2 text-xs leading-5 text-amber-100/78">
                Media URL is optional. Invalid media links will be ignored; use a full http or https URL.
              </p>
            )}
          </div>
          <AdminTextInput
            label="Review date"
            type="date"
            value={draft.createdAt}
            disabled={editingId ? !canEditReview : !canManage}
            onChange={(value) => setDraft((current) => ({ ...current, createdAt: value }))}
          />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">Source label</span>
            <select
              value={draft.sourceType}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sourceType: event.target.value as AdminReviewClientRecord["sourceType"],
                }))
              }
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
            >
              {editingId && draft.sourceType === "order-linked" && (
                <option value="order-linked">Order-linked review</option>
              )}
              <option value="customer-submitted">Customer feedback</option>
              <option value="admin-added">Customer feedback</option>
              <option value="imported">Curated customer feedback</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/42">Status</span>
            <select
              value={draft.status}
              disabled={editingId ? !canEditReview : !canManage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as AdminReviewClientRecord["status"],
                }))
              }
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="hidden">Hidden</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 text-sm text-white/70">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              disabled={!canFeature || draft.status !== "approved"}
              onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))}
            />
            Feature after approval
          </label>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            {draftSubmitError && (
              <div className="basis-full rounded-2xl border border-rose-200/22 bg-rose-200/[0.08] p-3 text-sm leading-6 text-rose-50/86">
                {draftSubmitError}
              </div>
            )}
            <button
              type="submit"
   className="rounded-full border border-cyan-200/35 bg-cyan-200/[0.16] px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/55 hover:bg-cyan-200/[0.22]"
>
  {savingId === "new" ? "Adding..." : editingId ? "Save review" : "Add review"}
</button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyReviewDraft(products));
                  setDraftSubmitError("");
                }}
                className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <SectionHeader title="Review moderation" />
        {!canModerate && (
          <div className="mb-4 rounded-[1.25rem] border border-amber-200/22 bg-amber-200/[0.08] p-4 text-sm leading-6 text-amber-50/86">
            Missing review moderation permission. Manage actions require reviews.manage or reviews.moderate.
          </div>
        )}
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_160px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product name, slug, customer, status, or review"
            className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/40"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
            <option value="hidden">Hidden ({statusCounts.hidden})</option>
          </select>
          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40"
          >
            <option value="all">All products</option>
            {reviewProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#08111f] px-4 text-sm text-white outline-none transition focus:border-cyan-200/40"
          >
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>{rating} star</option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid gap-3">
          {filteredReviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/12 bg-black/18 p-5 text-sm text-white/45">
              No reviews match this view.
            </p>
          ) : (
            filteredReviews.map((review) => {
              const product = products.find(
                (item) =>
                  item.id === review.productId ||
                  item.slug === review.productSlug ||
                  item.slug === review.productId
              );
              return (
              <article key={review.id} className="rounded-[1.25rem] border border-white/10 bg-black/22 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-amber-200/25 bg-amber-200/[0.08] px-2.5 py-1 text-xs font-semibold text-amber-100">
                        {review.rating}/5
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/58">
                        {review.status === "approved"
                          ? "Approved"
                          : review.status === "hidden"
                            ? "Hidden"
                            : review.status === "rejected"
                              ? "Rejected"
                              : "Pending"}
                      </span>
                      <span className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.07] px-2.5 py-1 text-xs font-semibold text-cyan-50/80">
                        {review.verifiedPurchase && review.sourceType === "order-linked"
                          ? "Verified purchase"
                          : "Customer feedback"}
                      </span>
                      {review.isFeatured && (
                        <span className="rounded-full border border-fuchsia-200/25 bg-fuchsia-200/[0.08] px-2.5 py-1 text-xs font-semibold text-fuchsia-100">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 break-words text-base font-semibold text-white">
                      {review.title || "Untitled review"}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      Product: {product?.name || "Unknown product"}
                    </p>
                    <p className="mt-1 text-sm text-white/52">
                      {review.productSlug} · {review.orderReference || "No order ref"} · {formatDate(review.createdAt)}
                    </p>
                    <p className="mt-3 break-words text-sm leading-7 text-white/72 [overflow-wrap:anywhere]">
                      {review.body}
                    </p>
                    {review.mediaUrls.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {review.mediaUrls.slice(0, 3).map((url, index) =>
                          /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ? (
                            <video
                              key={`${review.id}-${url}-${index}`}
                              src={url}
                              muted
                              playsInline
                              preload="metadata"
                              controls
                              className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-[#080611] object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={`${review.id}-${url}-${index}`}
                              src={url}
                              alt=""
                              loading="lazy"
                              className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                            />
                          )
                        )}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-white/42">
                      Customer: {review.customerName} · Phone retained privately
                    </p>
                    <label className="mt-4 block">
                      <span className="text-xs uppercase tracking-[0.18em] text-white/42">Admin note</span>
                      <textarea
                        defaultValue={review.adminNote || ""}
                        rows={2}
                        disabled={!canModerate}
                        onBlur={(event) => {
                          if (event.target.value !== (review.adminNote || "")) {
                            void saveReview(review, { adminNote: event.target.value });
                          }
                        }}
                        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/40 disabled:opacity-55"
                      />
                    </label>
                  </div>
                  <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[260px]">
                    {(["approved", "rejected", "hidden"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={!canModerate || savingId === review.id || review.status === status}
                        onClick={() => saveReview(review, { status })}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-200/35 hover:text-white disabled:opacity-40"
                      >
                        {status}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={!canFeature || savingId === review.id || review.status !== "approved"}
                      onClick={() => saveReview(review, { isFeatured: !review.isFeatured })}
                      className="rounded-full border border-fuchsia-200/20 bg-fuchsia-200/[0.07] px-3 py-2 text-xs font-semibold text-fuchsia-50 transition hover:border-fuchsia-100/40 disabled:opacity-40"
                    >
                      {review.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      disabled={!canEditReview || savingId === review.id}
                      onClick={() => editReview(review)}
                      className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.07] px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:border-cyan-100/40 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canEditReview || savingId === review.id}
                      onClick={() => deleteReview(review)}
                      className="rounded-full border border-rose-200/20 bg-rose-200/[0.07] px-3 py-2 text-xs font-semibold text-rose-50 transition hover:border-rose-100/40 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function StaffSection({ session }: { session: AdminSessionUser }) {
  const [staff, setStaff] = useState<AdminStaffClientRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityClientRecord[]>([]);
  const [draft, setDraft] = useState<ReturnType<typeof emptyStaffDraft>>(emptyStaffDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManageStaff = hasPermission(session, "staff.manage");
  const canViewActivity = hasPermission(session, "activity.view");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/staff", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        staff?: AdminStaffClientRecord[];
        activityLogs?: AdminActivityClientRecord[];
        errors?: string[];
      } | null;

      if (!response.ok) {
        setError(payload?.errors?.[0] ?? "Staff backend is not available.");
        return;
      }

      setStaff(Array.isArray(payload?.staff) ? payload.staff : []);
      setActivityLogs(Array.isArray(payload?.activityLogs) ? payload.activityLogs : []);
    } catch {
      setError("Staff backend is not available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyStaffDraft());
    setMessage("");
    setError("");
  };

  const startEdit = (record: AdminStaffClientRecord) => {
    setEditingId(record.id);
    setDraft({ ...record, password: "" });
    setMessage("");
    setError("");
  };

  const updateDraftRole = (role: AdminRole) => {
    setDraft((current) => ({
      ...current,
      role,
      permissions: roleDefaultPermissionsToMap(role),
    }));
  };

  const saveStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageStaff) {
      setError(blockedPermissionMessage);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/admin/staff/${encodeURIComponent(editingId)}` : "/api/admin/staff",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const payload = (await response.json().catch(() => null)) as {
        staff?: AdminStaffClientRecord;
        errors?: string[];
      } | null;

      if (!response.ok || !payload?.staff) {
        setError(payload?.errors?.[0] ?? "Staff could not be saved.");
        return;
      }

      setStaff((current) =>
        editingId
          ? current.map((item) => (item.id === payload.staff?.id ? payload.staff : item))
          : [payload.staff as AdminStaffClientRecord, ...current]
      );
      setDraft(emptyStaffDraft());
      setEditingId(null);
      setMessage("Staff account saved.");
      void loadStaff();
    } catch {
      setError("Staff could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (record: AdminStaffClientRecord) => {
    if (!canManageStaff) return;
    setDraft({ ...record, password: "", isActive: !record.isActive });
    setEditingId(record.id);
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/staff/${encodeURIComponent(record.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !record.isActive }),
      });
      if (response.ok) void loadStaff();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.055] p-4 text-sm leading-6 text-cyan-50/76">
        Owner access remains controlled by the server environment credentials. Staff accounts are Supabase-backed and cannot manage staff or sensitive settings unless explicitly allowed.
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-rose-200/22 bg-rose-200/[0.08] p-4 text-sm leading-6 text-rose-50/86">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-[1.25rem] border border-emerald-200/20 bg-emerald-200/[0.07] p-4 text-sm leading-6 text-emerald-50/80">
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Staff accounts" />
            {canManageStaff && (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/45"
              >
                <Plus className="h-4 w-4" />
                Add staff
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            {loading && <p className="text-sm text-white/45">Loading staff...</p>}
            {!loading && staff.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/12 bg-black/18 p-5 text-sm text-white/45">
                No staff accounts found.
              </p>
            )}
            {staff.map((record) => (
              <article key={record.id} className="rounded-2xl border border-white/10 bg-black/22 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_150px_120px_180px] lg:items-center">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-white">{record.name}</h3>
                    <p className="mt-1 break-words text-sm text-white/52">
                      {record.username}{record.email ? ` · ${record.email}` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-white/70">{roleLabels[record.role]}</span>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${record.isActive ? "border-emerald-200/25 bg-emerald-200/10 text-emerald-100" : "border-white/15 bg-white/[0.05] text-white/45"}`}>
                    {record.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      disabled={!canManageStaff}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-200/30 hover:text-white disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(record)}
                      disabled={!canManageStaff || saving}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-200/30 hover:text-white disabled:opacity-40"
                    >
                      {record.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/38">
                  Last login: {record.lastLoginAt ? formatDate(record.lastLoginAt) : "Never"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <form onSubmit={saveStaff} className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <SectionHeader title={editingId ? "Edit staff" : "Create staff"} />
          <div className="mt-4 space-y-3">
            <TextField label="Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} required />
            <TextField label="Username" value={draft.username} onChange={(value) => setDraft((current) => ({ ...current, username: value }))} required />
            <TextField label="Email optional" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} inputMode="email" />
            <TextField
              label={editingId ? "Reset password" : "Temporary password"}
              value={draft.password}
              onChange={(value) => setDraft((current) => ({ ...current, password: value }))}
              placeholder={editingId ? "Leave blank to keep current password" : "At least 8 characters"}
            />
            <SelectField
              label="Role"
              value={draft.role}
              options={staffRoleOptions}
              onChange={(value) => updateDraftRole(value as AdminRole)}
            />
            <ToggleField
              label="Active"
              checked={draft.isActive}
              onChange={(value) => setDraft((current) => ({ ...current, isActive: value }))}
            />
          </div>

          <div className="mt-5 space-y-4">
            {permissionGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-white/10 bg-black/18 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/60">{group.title}</p>
                <div className="mt-3 grid gap-2">
                  {group.permissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-3 text-sm text-white/68">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.permissions[permission])}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            permissions: {
                              ...current.permissions,
                              [permission]: event.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 accent-cyan-200"
                      />
                      <span>{permissionLabels[permission]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving || !canManageStaff}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save staff" : "Create staff"}
          </button>
        </form>
      </div>

      {canViewActivity && (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <SectionHeader title="Activity logs" />
          <div className="mt-4 grid gap-2">
            {activityLogs.length === 0 && (
              <p className="text-sm text-white/45">No activity logs yet.</p>
            )}
            {activityLogs.map((log) => (
              <div key={log.id} className="grid gap-2 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm text-white/62 sm:grid-cols-[1fr_160px]">
                <span>
                  <span className="font-semibold text-white/82">{log.actorName || "Admin"}</span>{" "}
                  {log.action}
                  {log.targetType ? ` · ${log.targetType}` : ""}
                </span>
                <span className="text-xs text-white/38">
                  {log.createdAt ? formatDate(log.createdAt) : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SettingsCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="mb-5 min-w-0">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
          {eyebrow}
        </p>
        <h2 className="mt-2 break-words text-xl font-semibold text-white">
          {title}
        </h2>
        <p className="mt-2 break-words text-sm leading-6 text-white/52">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
      <span className="break-words text-xs uppercase tracking-[0.18em] text-white/48">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-cyan-200"
      />
    </label>
  );
}

function WalletControl({
  label,
  enabled,
  receiverNumber,
  onEnabledChange,
  onNumberChange,
}: {
  label: string;
  enabled: boolean;
  receiverNumber: string;
  onEnabledChange: (value: boolean) => void;
  onNumberChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <ToggleField label={`${label} enabled`} checked={enabled} onChange={onEnabledChange} />
      <div className="mt-4">
        <TextField
          label={`${label} receiver number`}
          value={receiverNumber}
          onChange={onNumberChange}
          inputMode="tel"
        />
      </div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      <div className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white/58">
        {value}
      </div>
    </div>
  );
}

function MediaUploadField({
  label,
  accept,
  mediaType,
  currentUrl,
  uploading,
  error,
  onUpload,
  onClear,
}: {
  label: string;
  accept: string;
  mediaType: "image" | "video";
  currentUrl: string;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = mediaType === "image";

  return (
    <div className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      {currentUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/24">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt=""
              className="h-36 w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-20 items-center gap-3 px-4">
              <VideoIcon className="h-5 w-5 shrink-0 text-cyan-200/70" />
              <span className="min-w-0 truncate text-sm text-white/70">
                {currentUrl}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white/75 transition hover:text-white"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/18 bg-black/18 px-4 py-4 text-sm text-white/45 transition hover:border-cyan-200/40 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span>
            {uploading
              ? "Uploading..."
              : `Upload ${isImage ? "image" : "video"}`}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      {error && (
        <p className="mt-1.5 text-xs text-rose-300/90">{error}</p>
      )}
      {!error && (
        <p className="mt-1.5 text-[11px] leading-4 text-white/35">
          {isImage ? "JPG, PNG, WEBP, or GIF up to 10MB." : "MP4, MOV, WEBM, or M4V up to 180MB."}
        </p>
      )}
    </div>
  );
}

function GalleryImagesManager({
  images,
  uploading,
  uploadError,
  onUpload,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetMain,
}: {
  images: string[];
  uploading: boolean;
  uploadError: string | null;
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onSetMain: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        Gallery Images
        {images.length > 0 && (
          <span className="ml-2 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] normal-case text-white/40">
            {images.length}
          </span>
        )}
      </span>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/24"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Action overlay */}
              <div className="absolute inset-0 flex flex-col justify-between bg-black/55 opacity-0 transition group-hover:opacity-100">
                {/* Top: remove */}
                <div className="flex justify-end p-1">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    title="Remove image"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/80 text-white hover:bg-rose-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {/* Bottom: actions */}
                <div className="flex gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => onSetMain(url)}
                    title="Set as main image"
                    className="flex-1 rounded-lg bg-cyan-200/20 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-200/35"
                  >
                    Main
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => onMoveUp(index)}
                      title="Move left"
                      className="rounded-lg bg-white/10 px-1.5 py-1 text-[11px] text-white/70 hover:bg-white/20"
                    >
                      ←
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onMoveDown(index)}
                      title="Move right"
                      className="rounded-lg bg-white/10 px-1.5 py-1 text-[11px] text-white/70 hover:bg-white/20"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
              {/* Index label */}
              <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white/60">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/18 bg-black/18 px-4 py-3.5 text-sm text-white/45 transition hover:border-cyan-200/40 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="h-4 w-4 shrink-0" />
        <span>{uploading ? "Uploading..." : "Add gallery image"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      {uploadError && (
        <p className="mt-1.5 text-xs text-rose-300/90">{uploadError}</p>
      )}
      {images.length > 0 && (
        <p className="mt-1.5 text-xs text-white/30">
          Hover an image for options. &ldquo;Main&rdquo; sets it as the cover image and removes it from the gallery.
        </p>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "email" | "url" | "search";
  helper?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block break-words text-xs uppercase tracking-[0.18em] text-white/40 [overflow-wrap:anywhere]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
      />
      {helper && <span className="mt-2 block text-xs leading-5 text-white/42">{helper}</span>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  tall,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tall?: boolean;
  helper?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block break-words text-xs uppercase tracking-[0.18em] text-white/40 [overflow-wrap:anywhere]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={tall ? 6 : 3}
        className="w-full min-w-0 resize-y rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
      />
      {helper && <span className="mt-2 block text-xs leading-5 text-white/42">{helper}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  helper?: string;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="mb-2 block break-words text-xs uppercase tracking-[0.18em] text-white/40 [overflow-wrap:anywhere]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full min-w-0 appearance-none rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 pr-9 text-sm text-white outline-none transition focus:border-cyan-200/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-10 h-4 w-4 text-white/45" />
      {helper && <span className="mt-2 block text-xs leading-5 text-white/42">{helper}</span>}
    </label>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
  compact?: boolean;
}) {
  return (
    <div className="aev-admin-metric-card min-w-0 rounded-2xl border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="break-words text-xs uppercase tracking-[0.2em] text-white/45">
          {label}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={`break-words font-semibold tracking-tight ${
          compact ? "mt-4 text-2xl" : "mt-5 text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
      <h3 className="break-words text-lg font-semibold text-white">{title}</h3>
      {href && action && (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/65 transition hover:border-cyan-200/35 hover:text-white"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function OrderList({
  orders,
  products,
  selectedOrderId,
  onToggleDetails,
  canEditStatus,
}: {
  orders: StoredOrder[];
  products: AdminProduct[];
  selectedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  canEditStatus: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-cyan-200/25 bg-cyan-200/[0.05] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10">
          <ClipboardList className="h-5 w-5 text-cyan-100" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">No orders yet.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/58">
          Test checkout orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          products={products}
          isSelected={selectedOrderId === order.orderId}
          onToggleDetails={() => onToggleDetails(order.orderId)}
          canEditStatus={canEditStatus}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  products,
  isSelected,
  onToggleDetails,
  canEditStatus,
}: {
  order: StoredOrder;
  products: AdminProduct[];
  isSelected: boolean;
  onToggleDetails: () => void;
  canEditStatus: boolean;
}) {
  const reference = orderReferenceKey(order);
  const city = order.deliveryArea || order.customer.cityArea;
  const firstItem = order.items[0];

  return (
    <button
      type="button"
      onClick={onToggleDetails}
      data-admin-sound="primary"
      data-admin-hover-sound="true"
      className={`aev-admin-order-card group w-full min-w-0 overflow-hidden rounded-xl border bg-[#070d1b]/86 p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
        isSelected
          ? "border-pink-200/60 bg-pink-300/[0.085] shadow-[0_0_36px_rgba(255,119,200,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-white/10 hover:border-cyan-200/35 hover:bg-cyan-200/[0.045]"
      }`}
    >
      <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3">
        <ProductThumb
          src={orderProductImage(order, products)}
          label={mainItemSummary(order)}
          className="!h-16 !w-16"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-white">{reference}</p>
              <p className="mt-0.5 truncate text-xs text-white/58">
                {order.customer.fullName || "Customer not provided"}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-2 grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-5 text-white/48">
            <span className="truncate">{order.customer.phone || "No phone"}</span>
            <span className="truncate text-right">{order.paymentDetails.paymentMethod || "No payment"}</span>
            <span className="truncate">{city || firstItem?.color || "No city"}</span>
            <span className="truncate text-right font-semibold text-pink-100">
              {formatCurrency(orderTotal(order))}
            </span>
          </div>

          <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/10 pt-2">
            <span className="truncate text-[11px] text-white/42">{formatDate(order.createdAt)}</span>
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              order.status === "Delivered"
                ? "bg-emerald-300 shadow-[0_0_16px_rgba(94,240,174,0.72)]"
                : order.status === "Cancelled"
                  ? "bg-rose-300 shadow-[0_0_16px_rgba(251,113,133,0.64)]"
                  : order.status === "Confirmed" || order.status === "Shipped"
                    ? "bg-cyan-300 shadow-[0_0_16px_rgba(103,247,243,0.64)]"
                    : "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.64)]"
            }`} />
          </div>
        </div>
      </div>
      <span className="sr-only">
        {canEditStatus ? "Select order details" : "Select order details. Status editing unavailable for this role."}
      </span>
    </button>
  );
}

type OrderOperationsDraft = {
  courierName: string;
  trackingId: string;
  deliveryStatus: DeliveryStatus;
  deliveryCharge: string;
  deliveryArea: string;
  deliveryZone: string;
  deliveryNote: string;
  customerConfirmationNote: string;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  paymentNote: string;
  paymentVerificationStatus: PaymentVerificationStatus;
  refundExchangeRequest: string;
  sizeIssueReport: string;
  proofReceived: ProofReceivedStatus;
  adminInternalNote: string;
  orderSource: OrderSource;
  assignedStaff: string;
  cancelledReason: string;
};

function defaultCourierFromSettings(settings: AdminSettings) {
  const courier = settings.deliverySettings.defaultCourier;
  return courier && courier !== "Not selected" && courier !== "Custom" ? courier : "";
}

function courierSelectValue(courierName: string): CourierOption {
  if (!courierName.trim()) return "Not selected";
  return courierOptions.includes(courierName as CourierOption)
    ? (courierName as CourierOption)
    : "Custom";
}

function operationsDraftFromOrder(
  order: StoredOrder,
  settings: AdminSettings
): OrderOperationsDraft {
  return {
    courierName: order.courierName ?? defaultCourierFromSettings(settings),
    trackingId: order.trackingId ?? "",
    deliveryStatus: order.deliveryStatus ?? "pending",
    deliveryCharge:
      typeof order.deliveryCharge === "number" ? String(order.deliveryCharge) : "",
    deliveryArea: order.deliveryArea ?? order.customer.cityArea ?? "",
    deliveryZone: order.deliveryZone ?? "",
    deliveryNote: order.deliveryNote ?? order.customer.deliveryNote ?? "",
    customerConfirmationNote: order.customerConfirmationNote ?? "",
    paymentStatus: order.paymentStatus ?? "pending",
    paymentReference:
      order.paymentReference ?? order.paymentDetails.transactionReference ?? "",
    paymentNote: order.paymentNote ?? "",
    paymentVerificationStatus: order.paymentVerificationStatus ?? "Pending",
    refundExchangeRequest: order.refundExchangeRequest ?? "",
    sizeIssueReport: order.sizeIssueReport ?? "",
    proofReceived: order.proofReceived ?? "No",
    adminInternalNote: order.adminInternalNote ?? "",
    orderSource: order.orderSource ?? "Website",
    assignedStaff: order.assignedStaff ?? "",
    cancelledReason: order.cancelledReason ?? "",
  };
}

function operationsDraftToUpdate(draft: OrderOperationsDraft): OrderOperationsUpdate {
  const deliveryCharge = draft.deliveryCharge.trim()
    ? Number(draft.deliveryCharge)
    : undefined;

  return {
    courierName: draft.courierName,
    trackingId: draft.trackingId,
    deliveryStatus: draft.deliveryStatus,
    deliveryCharge: Number.isFinite(deliveryCharge) ? deliveryCharge : undefined,
    deliveryArea: draft.deliveryArea,
    deliveryZone: draft.deliveryZone,
    deliveryNote: draft.deliveryNote,
    customerConfirmationNote: draft.customerConfirmationNote,
    paymentStatus: draft.paymentStatus,
    paymentReference: draft.paymentReference,
    paymentNote: draft.paymentNote,
    paymentVerificationStatus: draft.paymentVerificationStatus,
    refundExchangeRequest: draft.refundExchangeRequest,
    sizeIssueReport: draft.sizeIssueReport,
    proofReceived: draft.proofReceived,
    adminInternalNote: draft.adminInternalNote,
    orderSource: draft.orderSource,
    assignedStaff: draft.assignedStaff,
    cancelledReason: draft.cancelledReason,
  };
}

function OrderDetails({
  order,
  products,
  settings,
  onStatusChange,
  onOperationsSave,
  session,
}: {
  order: StoredOrder;
  products: AdminProduct[];
  settings: AdminSettings;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOperationsSave: (
    orderId: string,
    updates: OrderOperationsUpdate
  ) => Promise<boolean>;
  session: AdminSessionUser;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [operationsDraft, setOperationsDraft] = useState<OrderOperationsDraft>(() =>
    operationsDraftFromOrder(order, settings)
  );
  const [courierChoice, setCourierChoice] = useState<CourierOption>(() =>
    courierSelectValue(operationsDraftFromOrder(order, settings).courierName)
  );
  const [operationsMessage, setOperationsMessage] = useState("");
  const [isSavingOperations, setIsSavingOperations] = useState(false);
  const reference = orderReferenceKey(order);
  const selectedCourierOption = courierChoice;
  const canEditStatus = hasPermission(session, "orders.editStatus");
  const canEditCourier = hasPermission(session, "orders.editCourier");
  const canArchiveTest = hasPermission(session, "orders.archiveTest");
  const canSaveOperations = canEditStatus || canEditCourier || canArchiveTest;

  const copyValue = async (key: string, value?: string) => {
    if (!value) return;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1400);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const setOperationField = <K extends keyof OrderOperationsDraft>(
    key: K,
    value: OrderOperationsDraft[K]
  ) => {
    setOperationsDraft((current) => ({ ...current, [key]: value }));
  };

  const handleOperationsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSaveOperations) {
      setOperationsMessage(blockedPermissionMessage);
      return;
    }

    if (
      operationsDraft.deliveryCharge.trim() &&
      !Number.isFinite(Number(operationsDraft.deliveryCharge))
    ) {
      setOperationsMessage("Delivery charge must be a valid number.");
      return;
    }

    setIsSavingOperations(true);
    setOperationsMessage("");

    const saved = await onOperationsSave(reference, operationsDraftToUpdate(operationsDraft));
    setIsSavingOperations(false);
    setOperationsMessage(
      saved
        ? "Operations saved."
        : "Saved locally, but backend persistence failed. Confirm the Phase 37 Supabase columns exist."
    );
  };

  const updateStatusFromCockpit = (status: OrderStatus) => {
    onStatusChange(reference, status);
    setOperationsMessage(`Status updated to ${status}.`);
  };
  const confirmOrder = () => updateStatusFromCockpit("Confirmed");
  const cancelOrder = () => {
    if (window.confirm(`Cancel order ${reference}?`)) updateStatusFromCockpit("Cancelled");
  };
  const markDelivered = () => updateStatusFromCockpit("Delivered");
  const contactHref = order.customer.phone ? `tel:${order.customer.phone}` : undefined;
  const whatsappHref = order.customer.phone
    ? `https://wa.me/${order.customer.phone.replace(/\D/g, "")}`
    : undefined;

  return (
    <section className="aev-admin-detail-panel min-w-0 border-0 bg-transparent p-3 sm:p-4">
      <div className="rounded-[1.1rem] border border-cyan-200/14 bg-[linear-gradient(135deg,rgba(103,247,243,0.055),rgba(255,119,200,0.04)),rgba(5,11,24,0.92)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
              Selected Order
            </p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-semibold text-white [overflow-wrap:break-word]">
                {reference}
              </h2>
              <StatusBadge status={order.status} />
              {order.archivedAt && <TinyBadge label="Archived" tone="slate" />}
              {order.isTestOrder && <TinyBadge label="Test" tone="amber" />}
            </div>
            <p className="mt-2 text-sm text-white/50">
              Order placed {formatRelativeOrderAge(order.createdAt)} - {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(140px,1fr)_minmax(180px,220px)]">
            <div className="rounded-2xl border border-white/10 bg-black/28 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Order Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(orderTotal(order))}</p>
            </div>
            <label className="relative block min-w-0">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/40">Update Status</span>
              <select
                value={order.status}
                onChange={(event) => updateStatusFromCockpit(event.target.value as OrderStatus)}
                disabled={!canEditStatus}
                className="min-h-12 w-full appearance-none rounded-2xl border border-pink-200/22 bg-pink-300/[0.08] px-3 py-3 pr-9 text-sm font-semibold text-white outline-none transition focus:border-cyan-200/40 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-4 right-3 h-4 w-4 text-white/45" />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0 space-y-3">
          <div className="grid min-w-0 gap-4 xl:grid-cols-3">
            <OrderInfoPanel
              icon={Users}
              title="Customer Information"
              rows={[
                ["Name", order.customer.fullName],
                ["Phone", order.customer.phone],
                ["Email", order.customer.email],
                ["Address", [order.customer.address, order.customer.cityArea].filter(Boolean).join(", ")],
                ["Customer since", order.customerId ? `Linked account ${order.customerId}` : "Not linked"],
              ]}
              footer={
                <div className="flex flex-wrap gap-2">
                  <a href={contactHref} className={contactHref ? orderActionClass("cyan") : orderActionClass("disabled")}>
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </a>
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className={whatsappHref ? orderActionClass("green") : orderActionClass("disabled")}>
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              }
            />
            <OrderInfoPanel
              icon={CreditCard}
              title="Payment Details"
              rows={[
                ["Method", order.paymentDetails.paymentMethod],
                ["Payment status", order.paymentStatus],
                ["Verification", order.paymentVerificationStatus],
                ["Total amount", formatCurrency(orderTotal(order))],
                ["Transaction ID", order.paymentReference || order.paymentDetails.transactionReference],
                ["Wallet / bank", [order.paymentDetails.walletProvider, order.paymentDetails.paymentType].filter(Boolean).join(" / ")],
              ]}
            />
            <OrderInfoPanel
              icon={PackageCheck}
              title="Delivery Details"
              rows={[
                ["Delivery status", order.deliveryStatus],
                ["Delivery method", settings.deliverySettings.defaultCourier || "Standard Delivery"],
                ["Address", order.customer.address],
                ["Phone", order.customer.phone],
                ["Courier", order.courierName],
                ["Tracking ID", order.trackingId],
                ["Delivery charge", typeof order.deliveryCharge === "number" ? formatCurrency(order.deliveryCharge) : undefined],
              ]}
            />
          </div>

          <ItemsPanel order={order} products={products} />

          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-pink-200/14 bg-pink-300/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200/20 bg-pink-300/[0.09] text-pink-100">
                    <Pencil className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Order Notes</h3>
                </div>
                <button type="button" disabled title="Dedicated note creation is not connected yet." className={orderActionClass("disabled")}>
                  Create Note
                </button>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/52">
                {order.adminInternalNote || order.customerConfirmationNote || "No notes added yet."}
              </p>
            </section>
            <section className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.045] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-300/[0.09] text-violet-100">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-white">Support History</h3>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-violet-100">System</p>
                  <TinyBadge label="Order Created" tone="slate" />
                </div>
                <p className="mt-2 text-sm text-white/58">Order has been placed via {order.orderSource || "checkout"}.</p>
              </div>
              <button type="button" disabled title="Support conversation linking is not connected yet." className={`${orderActionClass("disabled")} mt-3 w-full justify-center`}>
                View all history
              </button>
            </section>
          </div>

          <form data-orders-operations onSubmit={handleOperationsSubmit} className="rounded-2xl border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(103,247,243,0.055),rgba(177,140,255,0.035)),rgba(3,7,18,0.40)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Operations Controls</h3>
                <p className="mt-1 text-sm text-white/50">Courier, tracking, payment verification, and internal handling fields.</p>
              </div>
              <button type="submit" disabled={isSavingOperations || !canSaveOperations} className={orderActionClass("cyan")}>
                {isSavingOperations ? "Saving..." : "Save Operations"}
              </button>
            </div>
            <fieldset disabled={!canEditCourier} className="mt-4 grid min-w-0 gap-4 disabled:opacity-60 md:grid-cols-2 2xl:grid-cols-3">
              <SelectField label="Courier Name" value={selectedCourierOption} options={courierOptions} onChange={(value) => {
                setCourierChoice(value);
                setOperationField("courierName", value === "Not selected" ? "" : value === "Custom" ? operationsDraft.courierName : value);
              }} />
              {selectedCourierOption === "Custom" && (
                <TextField label="Custom Courier Name" value={operationsDraft.courierName} onChange={(value) => setOperationField("courierName", value)} />
              )}
              <TextField label="Tracking ID" value={operationsDraft.trackingId} onChange={(value) => setOperationField("trackingId", value)} />
              <SelectField label="Delivery Status" value={operationsDraft.deliveryStatus} options={deliveryStatuses} onChange={(value) => setOperationField("deliveryStatus", value)} />
              <SelectField label="Payment Status" value={operationsDraft.paymentStatus} options={paymentStatuses} onChange={(value) => setOperationField("paymentStatus", value)} />
              <SelectField label="Payment Verification" value={operationsDraft.paymentVerificationStatus} options={paymentVerificationStatuses} onChange={(value) => setOperationField("paymentVerificationStatus", value)} />
              <TextField label="Payment Reference" value={operationsDraft.paymentReference} onChange={(value) => setOperationField("paymentReference", value)} />
              <TextField label="Assigned Staff" value={operationsDraft.assignedStaff} onChange={(value) => setOperationField("assignedStaff", value)} />
              <TextAreaField label="Admin Internal Note" value={operationsDraft.adminInternalNote} onChange={(value) => setOperationField("adminInternalNote", value)} />
            </fieldset>
            {operationsMessage && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/68">{operationsMessage}</p>
            )}
          </form>
        </div>

        <aside className="min-w-0 space-y-3">
          <OrderTimelinePanel order={order} />
          <section className="rounded-2xl border border-pink-200/15 bg-pink-300/[0.045] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
              <span className="h-px flex-1 bg-gradient-to-r from-pink-200/20 to-transparent" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={confirmOrder} disabled={!canEditStatus || order.status === "Confirmed"} className={orderActionClass("green")}>
                <Check className="h-3.5 w-3.5" /> Confirm Order
              </button>
              <button type="button" disabled title="Hold status is not connected to the order backend yet." className={orderActionClass("amber")}>
                <Wallet className="h-3.5 w-3.5" /> Hold Order
              </button>
              <button type="button" onClick={cancelOrder} disabled={!canEditStatus || order.status === "Cancelled"} className={orderActionClass("rose")}>
                <X className="h-3.5 w-3.5" /> Cancel Order
              </button>
              <button type="button" onClick={markDelivered} disabled={!canEditStatus || order.status === "Delivered"} className={orderActionClass("cyan")}>
                <PackageCheck className="h-3.5 w-3.5" /> Mark Delivered
              </button>
              <button
                type="button"
                onClick={() => document.querySelector("[data-orders-operations]")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={orderActionClass("violet")}
              >
                <Send className="h-3.5 w-3.5" /> Assign Courier
              </button>
              <button type="button" disabled title="Invoice printing requires an invoice template route." className={orderActionClass("disabled")}>
                <Copy className="h-3.5 w-3.5" /> Print Invoice
              </button>
              <a href={contactHref} className={contactHref ? orderActionClass("pink") : orderActionClass("disabled")}>
                <Phone className="h-3.5 w-3.5" /> Contact Customer
              </a>
              <button type="button" disabled title="Dedicated note creation is not connected yet." className={orderActionClass("disabled")}>
                <Pencil className="h-3.5 w-3.5" /> Create Note
              </button>
            </div>
            {copiedKey && (
              <p className="mt-3 rounded-xl border border-emerald-200/20 bg-emerald-300/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100">
                {copiedKey === "summary" ? "Invoice data copied." : "Copied."}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-white/45">
              <DetailLine label="Created on" value={formatDate(order.createdAt)} />
              <DetailLine label="Last updated" value={order.archivedAt ? formatDate(order.archivedAt) : formatDate(order.createdAt)} />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function orderActionClass(tone: "cyan" | "green" | "rose" | "pink" | "amber" | "violet" | "disabled") {
  const base =
    "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
  if (tone === "disabled") {
    return `${base} cursor-not-allowed border-white/8 bg-white/[0.035] text-white/32`;
  }
  if (tone === "green") return `${base} border-emerald-200/25 bg-emerald-300/[0.10] text-emerald-50 hover:border-emerald-200/45`;
  if (tone === "rose") return `${base} border-rose-200/25 bg-rose-300/[0.10] text-rose-50 hover:border-rose-200/45`;
  if (tone === "pink") return `${base} border-pink-200/25 bg-pink-300/[0.10] text-pink-50 hover:border-pink-200/45`;
  if (tone === "amber") return `${base} border-amber-200/25 bg-amber-300/[0.10] text-amber-50 hover:border-amber-200/45`;
  if (tone === "violet") return `${base} border-violet-200/25 bg-violet-300/[0.10] text-violet-50 hover:border-violet-200/45`;
  return `${base} border-cyan-200/25 bg-cyan-300/[0.10] text-cyan-50 hover:border-cyan-200/45`;
}

function OrderInfoPanel({
  icon: Icon,
  title,
  rows,
  footer,
}: {
  icon: typeof ClipboardList;
  title: string;
  rows: Array<[string, string | undefined]>;
  footer?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/18 bg-cyan-200/[0.08] text-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <DetailLine key={label} label={label} value={value} />
        ))}
      </div>
      {footer && <div className="mt-4 border-t border-white/10 pt-3">{footer}</div>}
    </section>
  );
}

function OrderTimelinePanel({ order }: { order: StoredOrder }) {
  const statusIndex =
    order.status === "Cancelled"
      ? 0
      : order.status === "Pending"
        ? 0
        : order.status === "Confirmed"
          ? 2
          : order.status === "Shipped"
            ? 4
            : 5;
  const paymentDone =
    order.paymentStatus === "verified" ||
    order.paymentVerificationStatus === "Verified" ||
    order.status === "Confirmed" ||
    order.status === "Shipped" ||
    order.status === "Delivered";
  const steps = [
    { label: "Order Placed", active: true, detail: formatDate(order.createdAt) },
    { label: paymentDone ? "Payment Confirmed" : "Payment Pending", active: paymentDone, detail: order.paymentStatus || order.paymentVerificationStatus },
    { label: "Order Confirmed", active: statusIndex >= 2, detail: order.status === "Confirmed" ? formatDate(order.createdAt) : undefined },
    { label: "Courier Assigned", active: Boolean(order.courierName || order.trackingId), detail: order.courierName || order.trackingId },
    { label: "Out for Delivery", active: order.status === "Shipped" || order.deliveryStatus === "in_transit" || order.status === "Delivered", detail: order.deliveryStatus },
    { label: "Delivered", active: order.status === "Delivered" || order.deliveryStatus === "delivered", detail: order.status === "Delivered" ? "Completed" : undefined },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Order Timeline</p>
      <div className="mt-4 space-y-0">
        {steps.map((step, index) => (
          <div key={step.label} className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span className={`absolute left-[5px] top-4 h-[calc(100%-0.55rem)] w-px ${
                step.active ? "bg-cyan-200/34" : "bg-white/10"
              }`} />
            )}
            <span className={`relative z-10 mt-1 h-3 w-3 rounded-full border ${
              step.active
                ? "border-cyan-100 bg-cyan-300 shadow-[0_0_16px_rgba(103,247,243,0.72)]"
                : "border-white/18 bg-[#12182a]"
            }`} />
            <div className="min-w-0">
              <p className={step.active ? "text-sm font-semibold text-white" : "text-sm text-white/42"}>{step.label}</p>
              <p className="mt-1 break-words text-xs text-white/38">{step.detail || "Awaiting signal"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemsPanel({ order, products = [] }: { order: StoredOrder; products?: AdminProduct[] }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Ordered Items</p>
        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
          {order.totals.totalItems ?? order.items.length} total
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {order.items.length === 0 ? (
          <p className="text-sm text-white/50">No items recorded.</p>
        ) : (
          order.items.map((item, index) => {
            const quantity = item.quantity ?? 0;
            const unitPrice = item.price ?? 0;

            return (
              <div
                key={`${item.id ?? item.name ?? "item"}-${index}`}
                className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(310px,1fr)_minmax(84px,0.3fr)_minmax(110px,0.34fr)_minmax(110px,0.34fr)] 2xl:items-center">
                  <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <ProductThumb
                      src={productImageBySlug(item.slug || item.productId || "", products)}
                      label={item.name ?? "Unnamed item"}
                      className="!h-16 !w-16"
                    />
                    <div className="min-w-0">
                      <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-6 text-white [overflow-wrap:break-word]">
                        {item.name ?? "Unnamed item"}
                      </p>
                      <p className="mt-1 whitespace-normal break-words text-xs leading-5 text-white/48 [overflow-wrap:break-word]">
                        {itemVariantSummary(item) || "No variant recorded"}
                      </p>
                      {(item.size || item.color || item.absorbency) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.size && (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/55">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/55">
                              Color: {item.color}
                            </span>
                          )}
                          {item.absorbency && (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/55">
                              Absorbency: {item.absorbency}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <DetailLine label="Quantity" value={String(quantity)} />
                  <DetailLine label="Unit price" value={formatCurrency(unitPrice)} />
                  <DetailLine label="Line total" value={formatCurrency(unitPrice * quantity)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SupportOpsPanel({ order }: { order: StoredOrder }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-200/15 bg-violet-200/[0.045] p-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">Support / Internal Ops</h4>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Admin
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <DetailLine
          label="Customer confirmation note"
          value={order.customerConfirmationNote}
        />
        <DetailLine label="Refund / exchange request" value={order.refundExchangeRequest} />
        <DetailLine label="Size issue report" value={order.sizeIssueReport} />
        <DetailLine label="Photo / video proof received" value={order.proofReceived} />
        <DetailLine label="Admin internal note" value={order.adminInternalNote} />
        <DetailLine
          label="Customer account"
          value={order.customerId ? `Linked (${order.customerId})` : "Not linked"}
        />
        <DetailLine label="Order source" value={order.orderSource} />
        <DetailLine label="Assigned staff" value={order.assignedStaff} />
        <DetailLine label="Cancelled reason" value={order.cancelledReason} />
        <DetailLine label="Test order" value={order.isTestOrder ? "Yes" : "No"} />
      </div>
    </div>
  );
}

function EmptyDetailPanel() {
  return (
    <section className="aev-admin-detail-panel min-w-0 rounded-[1.35rem] border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10">
        <ClipboardList className="h-5 w-5 text-cyan-100" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">Select an order</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/56">
        Open a card to review customer, payment, delivery, item, and operations details.
      </p>
    </section>
  );
}

function DetailGroup({
  title,
  rows,
  copiedKey,
  onCopy,
}: {
  title: string;
  rows: Array<[string, string | undefined, string?]>;
  copiedKey?: string | null;
  onCopy?: (key: string, value?: string) => void;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/22 p-4">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value, copyKey]) => (
          <div key={label} className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <DetailLine label={label} value={value} />
            </div>
            {copyKey && (
              <CopyButton
                copied={copiedKey === copyKey}
                disabled={!value}
                onClick={() => onCopy?.(copyKey, value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentOrderList({
  orders,
  onStatusChange,
  canEditStatus,
}: {
  orders: StoredOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  canEditStatus: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-cyan-200/25 bg-cyan-200/[0.05] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10">
          <ClipboardList className="h-5 w-5 text-cyan-100" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">No orders yet.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/58">
          Test checkout orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <RecentOrderCard
          key={order.orderId}
          order={order}
          onStatusChange={(status) => onStatusChange(orderReferenceKey(order), status)}
          canEditStatus={canEditStatus}
        />
      ))}
    </div>
  );
}

function RecentOrderCard({
  order,
  onStatusChange,
  canEditStatus,
}: {
  order: StoredOrder;
  onStatusChange: (status: OrderStatus) => void;
  canEditStatus: boolean;
}) {
  const reference = orderReferenceKey(order);

  return (
    <article className="aev-admin-order-card min-w-0 rounded-[1.25rem] border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
            Order reference
          </p>
          <h3 className="mt-1 break-words text-base font-semibold leading-6 text-white [overflow-wrap:break-word]">
            {reference}
          </h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailLine label="Customer" value={order.customer.fullName} />
        <DetailLine label="Phone" value={order.customer.phone} />
        <DetailLine label="City / Area" value={order.customer.cityArea} />
        <DetailLine label="Total" value={formatCurrency(orderTotal(order))} />
        <DetailLine label="Payment" value={order.paymentDetails.paymentMethod} />
        <DetailLine label="Created" value={formatDate(order.createdAt)} />
      </div>

      <div className="mt-4 grid min-w-0 gap-3 border-t border-white/10 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(130px,160px)] sm:items-end">
        <label className="relative block min-w-0">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
            Quick status
          </span>
          <select
            value={order.status}
            onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
            disabled={!canEditStatus}
            className="min-h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#08111f] px-3 py-3 pr-9 text-sm font-medium text-white outline-none transition focus:border-cyan-200/40"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-4 right-3 h-4 w-4 text-white/45" />
        </label>

        <Link
          href="/admin/orders"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.08] px-4 py-3 text-sm font-medium text-cyan-50 transition hover:border-cyan-100/40 hover:bg-cyan-200/12"
        >
          View full details
        </Link>
      </div>
    </article>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 whitespace-normal break-words text-sm leading-6 text-white/72 [overflow-wrap:break-word]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function CopyButton({
  copied,
  disabled,
  onClick,
}: {
  copied: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-copied={copied ? "true" : "false"}
      className="aev-admin-copy-button inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-medium text-white/62 transition hover:border-cyan-200/35 hover:text-white disabled:pointer-events-none disabled:opacity-35"
    >
      {copied ? "Copied" : <Copy className="h-4 w-4" />}
    </button>
  );
}

type QuickAction = {
  key: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

function QuickActionsMenu({
  actions,
  copiedKey,
}: {
  actions: QuickAction[];
  copiedKey: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const focusAction = (direction: 1 | -1) => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[data-menu-action]:not(:disabled)") ?? []
    );
    if (!buttons.length) return;

    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : buttons.length - 1
        : (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      menuRef.current?.querySelector<HTMLButtonElement>("[aria-haspopup='menu']")?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusAction(event.key === "ArrowDown" ? 1 : -1);
    }
  };

  return (
    <div
      ref={menuRef}
      onKeyDown={handleMenuKeyDown}
      className="relative min-w-0 sm:min-w-[172px]"
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="aev-admin-copy-button inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-200/35 hover:bg-cyan-200/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/70"
      >
        <Rows3 className="h-4 w-4 shrink-0 text-cyan-100" />
        <span>Quick Actions</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/48 transition duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="menu"
        aria-label="Copy actions"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-[calc(100%+0.5rem)] z-30 w-full min-w-[220px] origin-top-right rounded-2xl border border-white/12 bg-[#08111f]/98 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition duration-150 ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {actions.map((action) => {
          const isCopied = copiedKey === action.key;

          return (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              data-menu-action
              data-copied={isCopied ? "true" : "false"}
              disabled={action.disabled}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="aev-admin-copy-button flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/74 transition hover:bg-cyan-200/[0.08] hover:text-white focus:bg-cyan-200/[0.10] focus:text-white focus:outline-none disabled:pointer-events-none disabled:text-white/28"
            >
              <Copy className="h-4 w-4 shrink-0 text-cyan-100/82" />
              <span className="min-w-0 flex-1">{action.label}</span>
              <span className="text-xs font-semibold text-emerald-100/90">
                {isCopied ? "Copied" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`aev-admin-status-badge inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function TinyBadge({
  label,
  tone = "cyan",
}: {
  label: string;
  tone?: "cyan" | "amber" | "slate" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/30 bg-amber-200/[0.09] text-amber-100"
      : tone === "green"
        ? "border-emerald-200/30 bg-emerald-200/[0.09] text-emerald-100"
      : tone === "slate"
        ? "border-white/15 bg-white/[0.06] text-white/58"
        : "border-cyan-200/25 bg-cyan-200/[0.08] text-cyan-100";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        status === "Active"
          ? "border-emerald-200/25 bg-emerald-200/10 text-emerald-100"
          : "border-white/15 bg-white/[0.06] text-white/58"
      }`}
    >
      {status}
    </span>
  );
}
