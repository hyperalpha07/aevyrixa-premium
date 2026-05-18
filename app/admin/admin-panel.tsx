"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell as BellIcon,
  Boxes,
  ChevronDown,
  ClipboardList,
  Copy,
  CreditCard,
  Gauge,
  Globe,
  LogOut,
  PackageCheck,
  Phone,
  Pencil,
  Plus,
  Rows3,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  Video as VideoIcon,
  Wallet,
  X,
} from "lucide-react";
import { products as seedProducts, type ProductVisualTheme } from "@/app/lib/products";
import { formatCurrency, SITE_CURRENCY } from "@/app/lib/currency";
import {
  ADMIN_SETTINGS_KEY,
  defaultAdminSettings,
  normalizeAdminSettings,
  type AdminSettings,
  type HomepageMediaSettings,
} from "@/app/lib/admin-settings";
import {
  orderSources,
  orderStatuses,
  paymentMethods,
  paymentVerificationStatuses,
  proofReceivedStatuses,
  type OrderOperationsUpdate,
  type OrderSource,
  type OrderStatus,
  type PaymentVerificationStatus,
  type ProofReceivedStatus,
} from "@/app/lib/order-types";
import type {
  ProductCatalogItem,
  ProductStockStatus,
  ProductStatus as StoreProductStatus,
} from "@/app/lib/product-types";

const LATEST_DRAFT_ORDER_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_KEY = "aevyrixa-draft-orders";
const ADMIN_PRODUCTS_KEY = "aevyrixa-admin-products";

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
type AdminView = "dashboard" | "orders" | "products" | "settings";
type PaymentFilter = "All" | (typeof paymentMethods)[number];
type StatusFilter = "All" | OrderStatus;
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
  deliveryCharge?: number;
  customerConfirmationNote?: string;
  paymentVerificationStatus?: PaymentVerificationStatus;
  refundExchangeRequest?: string;
  sizeIssueReport?: string;
  proofReceived?: ProofReceivedStatus;
  adminInternalNote?: string;
  orderSource?: OrderSource;
  assignedStaff?: string;
};

type DashboardMetrics = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  estimatedRevenue: number;
  todayOrders: number;
  mobileWalletOrders: number;
  codOrders: number;
  bankTransferOrders: number;
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
  stockStatus: ProductStockStatus;
  stockQuantity?: number;
  visualTheme: ProductVisualTheme;
  visualVariant: string;
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  images: string[];
  deletedAt?: string;
  deletedReason?: string;
};

type UnknownRecord = Record<string, unknown>;

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge, view: "dashboard" },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, view: "orders" },
  { label: "Products", href: "/admin/products", icon: Boxes, view: "products" },
  { label: "Settings", href: "/admin/settings", icon: Settings, view: "settings" },
] satisfies Array<{
  label: string;
  href: string;
  icon: typeof Gauge;
  view: AdminView;
}>;

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
  stockStatus: "in_stock",
  stockQuantity: undefined,
  visualTheme: "blush-violet",
  visualVariant: "default",
  imageUrl: "",
  videoUrl: "",
  posterUrl: "",
  images: [],
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
    deliveryCharge: numberValue(value.deliveryCharge),
    customerConfirmationNote: textValue(value.customerConfirmationNote),
    paymentVerificationStatus: paymentVerificationStatuses.includes(
      value.paymentVerificationStatus as never
    )
      ? (value.paymentVerificationStatus as PaymentVerificationStatus)
      : undefined,
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
    colors: stringArrayValue(value.colors),
    absorbency: textValue(value.absorbency) || "",
    benefits: stringArrayValue(value.benefits),
    care: stringArrayValue(value.care),
    seoTitle: textValue(value.seoTitle) || "",
    seoDescription: textValue(value.seoDescription) || "",
    status: value.status === "Active" || value.status === "active" ? "Active" : "Draft",
    featured: Boolean(value.featured),
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
    deletedAt: textValue(value.deletedAt),
    deletedReason: textValue(value.deletedReason),
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
    stockStatus: "in_stock",
    stockQuantity: undefined,
    visualTheme: product.visualTheme,
    visualVariant: product.visualTheme,
    imageUrl: "",
    videoUrl: "",
    posterUrl: "",
    images: [],
    deletedAt: undefined,
    deletedReason: undefined,
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
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    sizes: product.sizes,
    colors: product.colors,
    absorbency: product.absorbency,
    absorbencyOptions: product.absorbency ? [product.absorbency] : [],
    visual: product.visualTheme,
    visualTheme: product.visualTheme,
    visualVariant: product.visualVariant,
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    imageUrl: product.imageUrl || undefined,
    videoUrl: product.videoUrl || undefined,
    posterUrl: product.posterUrl || undefined,
    images: product.images.length > 0 ? product.images : undefined,
  };
}

function apiProductToAdminProduct(product: ProductCatalogItem): AdminProduct {
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
    deletedAt: product.deletedAt,
    deletedReason: product.deletedReason,
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
    !hms.whatsappWidgetEnabled
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

function orderSearchText(order: StoredOrder) {
  return [
    orderReferenceKey(order),
    order.orderId,
    order.customer.fullName,
    order.customer.phone,
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
  sortOrder: OrderSort
) {
  const query = searchTerm.trim().toLowerCase();

  return orders
    .filter((order) => {
      const matchesSearch = !query || orderSearchText(order).includes(query);
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All" || order.paymentDetails.paymentMethod === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
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

export default function AdminPanel({ view }: { view: AdminView }) {
  const router = useRouter();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [settingsStorageMode, setSettingsStorageMode] =
    useState<SettingsStorageMode>("fallback-default");
  const [settingsBackendMessage, setSettingsBackendMessage] = useState(
    "Settings backend not connected. Using safe local fallback."
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setSettings(readSettingsFromStorage());
      setIsLoaded(true);

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

      void readProductsFromApi().then((backendProducts) => {
        if (!backendProducts) {
          setAdminProducts(readProductsFromStorage());
          return;
        }
        setAdminProducts(backendProducts);
        writeProductsToStorage(backendProducts);
      });
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "Cancelled");

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "Pending").length,
      confirmedOrders: orders.filter((order) => order.status === "Confirmed").length,
      shippedOrders: orders.filter((order) => order.status === "Shipped").length,
      deliveredOrders: orders.filter((order) => order.status === "Delivered").length,
      cancelledOrders: orders.filter((order) => order.status === "Cancelled").length,
      estimatedRevenue: activeOrders.reduce(
        (sum, order) => sum + orderTotal(order),
        0
      ),
      todayOrders: orders.filter((order) => isToday(order.createdAt)).length,
      mobileWalletOrders: orders.filter(
        (order) => order.paymentDetails.paymentMethod === "Mobile Wallet Payment"
      ).length,
      codOrders: orders.filter(
        (order) => order.paymentDetails.paymentMethod === "Cash on Delivery"
      ).length,
      bankTransferOrders: orders.filter(
        (order) => order.paymentDetails.paymentMethod === "Bank Transfer"
      ).length,
    };
  }, [orders]);

  const updateOrderStatus = (orderKey: string, status: OrderStatus) => {
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

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center overflow-x-hidden bg-[#030712] px-4 text-white">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-5 text-sm text-white/60">
          Loading admin control room...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[-8%] h-[340px] w-[340px] rounded-full bg-cyan-400/16 blur-[130px]" />
        <div className="absolute right-[-20%] top-[18%] h-[360px] w-[360px] rounded-full bg-violet-500/18 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[22%] h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[140px]" />
      </div>

      <div className="flex w-full flex-col gap-4 px-3 py-3 sm:px-4 lg:min-h-screen lg:flex-row lg:items-start lg:px-5 lg:py-5">
        <aside className="min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-2xl lg:sticky lg:top-5 lg:w-[260px] lg:shrink-0">
          <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between lg:block">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                Aevyrixa
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">
                Aevyrixa Admin
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/75 transition hover:border-cyan-200/35 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Link>
          </div>

          <nav className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.view === view;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-cyan-200/35 bg-cyan-200/10 text-white shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-black/20 text-white/58 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-w-0 items-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-200/[0.06] px-3 py-3 text-left text-sm font-medium text-rose-100/78 transition hover:border-rose-100/35 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl sm:p-5 xl:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200/70">
                  Control Room
                </p>
                <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight [overflow-wrap:break-word]">
                  {viewTitle(view)}
                </h2>
              </div>
              <p className="max-w-3xl break-words text-sm leading-6 text-white/56 [overflow-wrap:break-word]">
                Supabase-backed order operations with local fallback for development.
              </p>
            </div>

            {view === "orders" ? (
              <OrdersSection
                orders={orders}
                expandedOrderId={expandedOrderId}
                onToggleDetails={(orderId) =>
                  setExpandedOrderId((current) =>
                    current === orderId ? null : orderId
                  )
                }
                onStatusChange={updateOrderStatus}
                onOperationsSave={updateOrderOperations}
              />
            ) : view === "products" ? (
              <ProductsSection products={adminProducts} onSaveProducts={saveProducts} />
            ) : view === "settings" ? (
              <SettingsSection
                settings={settings}
                storageMode={settingsStorageMode}
                backendMessage={settingsBackendMessage}
                onSaveSettings={saveSettings}
              />
            ) : (
              <DashboardSection
                metrics={metrics}
                orders={orders}
                products={adminProducts}
                onStatusChange={updateOrderStatus}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function viewTitle(view: AdminView) {
  if (view === "orders") return "Orders";
  if (view === "products") return "Products";
  if (view === "settings") return "Settings";
  return "Dashboard";
}

function DashboardSection({
  metrics,
  orders,
  products,
  onStatusChange,
}: {
  metrics: DashboardMetrics;
  orders: StoredOrder[];
  products: AdminProduct[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const recentOrders = orders.slice(0, 5);
  const activeProducts = products.filter(
    (product) => product.status === "Active" && !product.deletedAt
  ).length;
  const availableProducts = products.filter((product) => !product.deletedAt).length;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard label="Total Orders" value={String(metrics.totalOrders)} icon={ShoppingBag} />
        <MetricCard label="Pending" value={String(metrics.pendingOrders)} icon={Sparkles} />
        <MetricCard label="Confirmed" value={String(metrics.confirmedOrders)} icon={ShieldCheck} />
        <MetricCard label="Shipped" value={String(metrics.shippedOrders)} icon={PackageCheck} />
        <MetricCard label="Delivered" value={String(metrics.deliveredOrders)} icon={ShieldCheck} />
        <MetricCard label="Cancelled" value={String(metrics.cancelledOrders)} icon={ClipboardList} />
        <MetricCard
          label="Estimated Revenue"
          value={formatCurrency(metrics.estimatedRevenue)}
          icon={PackageCheck}
        />
        <MetricCard label="Today Orders" value={String(metrics.todayOrders)} icon={Gauge} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Mobile Wallet Orders"
          value={String(metrics.mobileWalletOrders)}
          icon={Wallet}
          compact
        />
        <MetricCard
          label="COD Orders"
          value={String(metrics.codOrders)}
          icon={PackageCheck}
          compact
        />
        <MetricCard
          label="Bank Transfer Orders"
          value={String(metrics.bankTransferOrders)}
          icon={CreditCard}
          compact
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <SectionHeader title="Recent order preview" href="/admin/orders" action="Open orders workspace" />
          <RecentOrderList
            orders={recentOrders}
            onStatusChange={onStatusChange}
          />
        </div>
        <div className="grid gap-4">
          <AdminSummaryCard
            title="Products"
            value={`${activeProducts}/${availableProducts} active`}
            href="/admin/products"
            icon={Boxes}
          />
          <AdminSummaryCard
            title="Settings"
            value="Local placeholders"
            href="/admin/settings"
            icon={Settings}
          />
        </div>
      </div>
    </div>
  );
}

function OrdersSection({
  orders,
  expandedOrderId,
  onToggleDetails,
  onStatusChange,
  onOperationsSave,
}: {
  orders: StoredOrder[];
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOperationsSave: (
    orderId: string,
    updates: OrderOperationsUpdate
  ) => Promise<boolean>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [sortOrder, setSortOrder] = useState<OrderSort>("Newest first");

  const visibleOrders = useMemo(
    () => filterAndSortOrders(orders, searchTerm, statusFilter, paymentFilter, sortOrder),
    [orders, paymentFilter, searchTerm, sortOrder, statusFilter]
  );
  const selectedOrder =
    visibleOrders.find((order) => order.orderId === expandedOrderId) ?? null;

  return (
    <div className="mt-6 space-y-5">
      <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <SectionHeader title="Order command workspace" />
          <p className="max-w-4xl text-sm leading-6 text-white/50">
            Select an order from the operations queue to manage customer, payment, delivery, item, and support details in the command panel.
          </p>
        </div>
      </div>
      <section className="rounded-[1.25rem] border border-white/10 bg-black/20 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1.5fr)_minmax(150px,0.7fr)_minmax(220px,0.9fr)_minmax(160px,0.7fr)]">
          <label className="relative block min-w-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Search orders
            </span>
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-white/35" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Reference, name, or phone"
              className="w-full rounded-2xl border border-white/10 bg-[#08111f] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
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
            label="Sort"
            value={sortOrder}
            options={orderSortOptions}
            onChange={setSortOrder}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleOrders.length} of {orders.length} orders
          </span>
          {(searchTerm || statusFilter !== "All" || paymentFilter !== "All" || sortOrder !== "Newest first") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setPaymentFilter("All");
                setSortOrder("Newest first");
              }}
              className="w-fit rounded-full border border-white/10 px-3 py-2 font-medium text-white/65 transition hover:border-cyan-200/35 hover:text-white"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(380px,520px)_minmax(0,1fr)] xl:items-start">
        <div className="min-w-0 xl:max-h-[calc(100vh-13rem)] xl:overflow-y-auto xl:pr-1">
          <OrderList
            orders={visibleOrders}
            expandedOrderId={expandedOrderId}
            onToggleDetails={onToggleDetails}
            onStatusChange={onStatusChange}
          />
        </div>
        <div className="min-w-0 xl:sticky xl:top-6">
          {selectedOrder ? (
            <OrderDetails
              key={orderReferenceKey(selectedOrder)}
              order={selectedOrder}
              onOperationsSave={onOperationsSave}
            />
          ) : (
            <EmptyDetailPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function ProductsSection({
  products,
  onSaveProducts,
}: {
  products: AdminProduct[];
  onSaveProducts: (products: AdminProduct[]) => void;
}) {
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const inlineEditorRef = useRef<HTMLDivElement | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFilter, setProductFilter] = useState<ProductFilter>("All");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const productFilterOptions: ProductFilter[] = [
    "All",
    "Active",
    "Draft",
    "Out of Stock",
    "Deleted",
  ];

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
      return !query || productSearchText(product).includes(query);
    });
  }, [productFilter, productSearchTerm, products]);
  const editingProductId = editingProduct?.id;
  const isEditingExistingProduct = Boolean(
    editingProductId && products.some((product) => product.id === editingProductId)
  );

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

  const addProduct = () => {
    setProductFilter("All");
    setProductSearchTerm("");
    setEditingProduct({
      ...emptyProduct,
      id: `admin-product-${Date.now()}`,
      slug: `new-product-${Date.now()}`,
    });
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

  const toggleStatus = async (productId: string) => {
    const currentProduct = products.find((product) => product.id === productId);
    if (!currentProduct) return;

    const nextProduct: AdminProduct = {
      ...currentProduct,
      status: currentProduct.status === "Active" ? "Draft" : "Active",
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

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Product catalog" />
        <button
          type="button"
          onClick={addProduct}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/45 hover:bg-cyan-200/15"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.055] p-4 text-sm leading-6 text-cyan-50/76">
          {statusMessage}
        </div>
      )}

      <section className="rounded-[1.25rem] border border-white/10 bg-black/20 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-end">
          <label className="relative block min-w-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Search products
            </span>
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-white/35" />
            <input
              type="search"
              value={productSearchTerm}
              onChange={(event) => setProductSearchTerm(event.target.value)}
              placeholder="Search products by name, slug, category..."
              className="w-full rounded-2xl border border-white/10 bg-[#08111f] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
            />
          </label>
          <div className="flex min-w-0 flex-wrap gap-2">
            {productFilterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setProductFilter(option)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  productFilter === option
                    ? "border-cyan-100/45 bg-cyan-200/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/58 hover:border-cyan-200/25 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleProducts.length} of {products.length} products
          </span>
          {(productSearchTerm || productFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setProductSearchTerm("");
                setProductFilter("All");
              }}
              className="w-fit text-cyan-100/75 transition hover:text-cyan-50"
            >
              Clear product filters
            </button>
          )}
        </div>
      </section>

      {editingProduct && !isEditingExistingProduct && (
        <ProductEditor
          key={editingProduct.id}
          product={editingProduct}
          onCancel={() => { setEditingProduct(null); setSaveError(null); }}
          onSave={saveProduct}
          isSaving={isSavingProduct}
          saveError={saveError}
        />
      )}

      <div className="grid gap-3">
        {visibleProducts.length === 0 && (
          <div className="rounded-[1.25rem] border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] p-6 text-center text-sm text-white/58">
            {productSearchTerm.trim()
              ? "No products found for this search."
              : "No products in this filter."}
          </div>
        )}

        {visibleProducts.map((product) => {
          const isEditingThisProduct = editingProductId === product.id;

          return (
            <div key={product.id} className="grid min-w-0 gap-3">
              <article className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/24 p-4">
                <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_120px_130px_160px] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="break-words text-base font-semibold text-white [overflow-wrap:break-word]">
                        {product.name}
                      </h3>
                      <ProductStatusBadge status={product.status} />
                      {product.deletedAt && (
                        <span className="inline-flex w-fit items-center rounded-full border border-rose-200/25 bg-rose-200/10 px-3 py-1 text-xs font-semibold text-rose-100">
                          Deleted
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-white/58 sm:grid-cols-2">
                      <DetailLine label="Slug" value={product.slug} />
                      <DetailLine label="Category" value={product.category} />
                      <DetailLine label="Absorbency" value={product.absorbency} />
                      <DetailLine label="Stock" value={product.stockStatus.replace(/_/g, " ")} />
                      <DetailLine label="Visual" value={product.visualVariant || product.visualTheme} />
                      {product.deletedAt && (
                        <DetailLine label="Deleted" value={formatDate(product.deletedAt)} />
                      )}
                    </div>
                  </div>
                  <DetailLine label="Price" value={product.price || formatCurrency(0)} />
                  <DetailLine label="Compare-at" value={product.compareAtPrice || "None"} />
                  <div className="grid gap-2">
                    {product.deletedAt ? (
                      <>
                        <button
                          type="button"
                          onClick={() => restoreProduct(product.id)}
                          disabled={isSavingProduct}
                          className="rounded-2xl border border-emerald-200/20 bg-emerald-200/[0.08] px-3 py-2.5 text-sm font-medium text-emerald-50/85 transition hover:border-emerald-100/40 hover:text-white"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentlyDeleteProduct(product)}
                          disabled={isSavingProduct}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200/20 bg-rose-200/[0.08] px-3 py-2.5 text-sm font-medium text-rose-100/85 transition hover:border-rose-100/40 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          Permanently Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          disabled={isSavingProduct}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                            isEditingThisProduct
                              ? "border-cyan-100/40 bg-cyan-200/12 text-white"
                              : "border-white/10 bg-white/[0.05] text-white/76 hover:border-cyan-200/30 hover:text-white"
                          }`}
                        >
                          <Pencil className="h-4 w-4" />
                          {isEditingThisProduct ? "Editing" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(product.id)}
                          disabled={isSavingProduct}
                          className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2.5 text-sm font-medium text-violet-50/80 transition hover:border-violet-100/35 hover:text-white"
                        >
                          {product.status === "Active" ? "Set Draft" : "Set Active"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          disabled={isSavingProduct}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-200/[0.06] px-3 py-2.5 text-sm font-medium text-rose-100/80 transition hover:border-rose-100/35 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
              {editingProduct && isEditingThisProduct && !product.deletedAt && (
                <div ref={inlineEditorRef} className="scroll-mt-6">
                  <ProductEditor
                    key={editingProduct.id}
                    product={editingProduct}
                    onCancel={() => { setEditingProduct(null); setSaveError(null); }}
                    onSave={saveProduct}
                    isSaving={isSavingProduct}
                    saveError={saveError}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  onCancel,
  onSave,
  isSaving,
  saveError,
}: {
  product: AdminProduct;
  onCancel: () => void;
  onSave: (product: AdminProduct) => void | Promise<void>;
  isSaving: boolean;
  saveError?: string | null;
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

  const updateField = (field: keyof AdminProduct, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setLocalError(null);
  };

  async function handleMediaUpload(file: File, mediaType: "image" | "video" | "gallery") {
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
      colors: textToList(colors),
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
                accept="video/mp4,video/webm,video/quicktime"
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

function SettingsSection({
  settings,
  storageMode,
  backendMessage,
  onSaveSettings,
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
}) {
  const [draft, setDraft] = useState(settings);
  const [activeSection, setActiveSection] = useState("storeProfile");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hmUploading, setHmUploading] = useState<Record<string, boolean>>({});
  const [hmUploadError, setHmUploadError] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    { id: "homepageMediaSettings", label: "Media & Categories", icon: Globe },
    { id: "advancedSettings", label: "Advanced", icon: Settings },
  ] as const;

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
          {settingsTabs.map((item) => {
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
                <TextField
                  label="Default courier"
                  value={draft.deliverySettings.defaultCourier}
                  onChange={(value) =>
                    updateDeliverySettings({ defaultCourier: value })
                  }
                />
                <TextAreaField
                  label="Courier partners"
                  value={draft.deliverySettings.courierPartners}
                  onChange={(value) =>
                    updateDeliverySettings({ courierPartners: value })
                  }
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

          {activeSection === "homepageMediaSettings" && (
            <>
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
                    accept="video/mp4,video/webm"
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
                    accept="video/mp4,video/webm"
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
                    accept="video/mp4,video/webm"
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
                eyebrow="Category CMS"
                title="Category cards — content, status, and media"
                description="Control each category's display title, tagline, link, status (active / coming soon / hidden), and optional image or video overlay. Hidden categories are not shown on the storefront. Link URL is required for active categories to be clickable."
              >
                <div className="space-y-4">
                {(
                  [
                    { label: "Reusable Period Care", stateKey: "categoryReusablePeriodCare", imgKey: "categoryReusablePeriodCareImageUrl", vidKey: "categoryReusablePeriodCareVideoUrl", titleKey: "categoryReusablePeriodCareTitle", descKey: "categoryReusablePeriodCareDescription", linkKey: "categoryReusablePeriodCareLinkUrl", slug: "reusable" },
                    { label: "Comfort Panty", stateKey: "categoryComfortPanty", imgKey: "categoryComfortPantyImageUrl", vidKey: "categoryComfortPantyVideoUrl", titleKey: "categoryComfortPantyTitle", descKey: "categoryComfortPantyDescription", linkKey: "categoryComfortPantyLinkUrl", slug: "comfort-panty" },
                    { label: "Soft Support Bra", stateKey: "categorySoftSupportBra", imgKey: "categorySoftSupportBraImageUrl", vidKey: "categorySoftSupportBraVideoUrl", titleKey: "categorySoftSupportBraTitle", descKey: "categorySoftSupportBraDescription", linkKey: "categorySoftSupportBraLinkUrl", slug: "soft-bra" },
                    { label: "Nightwear", stateKey: "categoryNightwear", imgKey: "categoryNightwearImageUrl", vidKey: "categoryNightwearVideoUrl", titleKey: "categoryNightwearTitle", descKey: "categoryNightwearDescription", linkKey: "categoryNightwearLinkUrl", slug: "nightwear" },
                    { label: "Hygiene Essentials", stateKey: "categoryHygieneEssentials", imgKey: "categoryHygieneEssentialsImageUrl", vidKey: "categoryHygieneEssentialsVideoUrl", titleKey: "categoryHygieneEssentialsTitle", descKey: "categoryHygieneEssentialsDescription", linkKey: "categoryHygieneEssentialsLinkUrl", slug: "hygiene" },
                    { label: "Bundles", stateKey: "categoryBundles", imgKey: "categoryBundlesImageUrl", vidKey: "categoryBundlesVideoUrl", titleKey: "categoryBundlesTitle", descKey: "categoryBundlesDescription", linkKey: "categoryBundlesLinkUrl", slug: "bundles" },
                    { label: "New Arrivals", stateKey: "categoryNewArrivals", imgKey: "categoryNewArrivalsImageUrl", vidKey: "categoryNewArrivalsVideoUrl", titleKey: "categoryNewArrivalsTitle", descKey: "categoryNewArrivalsDescription", linkKey: "categoryNewArrivalsLinkUrl", slug: "new-arrivals" },
                  ] as const
                ).map(({ label, stateKey, imgKey, vidKey, titleKey, descKey, linkKey, slug }) => {
                  const imgUploadKey = `cat-${slug}-img`;
                  const vidUploadKey = `cat-${slug}-vid`;
                  return (
                    <div key={slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{label}</span>
                        <SelectField
                          label=""
                          value={draft.homepageMediaSettings[stateKey]}
                          options={["active", "coming_soon", "hidden"] as const}
                          onChange={(value) => updateHomepageMediaSettings({ [stateKey]: value })}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <TextField
                          label="Display title"
                          value={draft.homepageMediaSettings[titleKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [titleKey]: value })}
                          placeholder={label}
                        />
                        <TextField
                          label="Short description"
                          value={draft.homepageMediaSettings[descKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [descKey]: value })}
                          placeholder="Short tagline for this category..."
                        />
                        <TextField
                          label="Link URL (active)"
                          value={draft.homepageMediaSettings[linkKey]}
                          onChange={(value) => updateHomepageMediaSettings({ [linkKey]: value })}
                          placeholder="/product"
                          inputMode="url"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <MediaUploadField
                          label="Card image"
                          accept="image/jpeg,image/png,image/webp"
                          mediaType="image"
                          currentUrl={draft.homepageMediaSettings[imgKey]}
                          uploading={!!hmUploading[imgUploadKey]}
                          error={hmUploadError[imgUploadKey] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, [imgUploadKey]: true }));
                            setHmUploadError((prev) => ({ ...prev, [imgUploadKey]: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", `category-${slug}`);
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, [imgUploadKey]: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ [imgKey]: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, [imgUploadKey]: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, [imgUploadKey]: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ [imgKey]: "" })}
                        />
                        <MediaUploadField
                          label="Card video"
                          accept="video/mp4,video/webm"
                          mediaType="video"
                          currentUrl={draft.homepageMediaSettings[vidKey]}
                          uploading={!!hmUploading[vidUploadKey]}
                          error={hmUploadError[vidUploadKey] ?? null}
                          onUpload={async (file) => {
                            setHmUploading((prev) => ({ ...prev, [vidUploadKey]: true }));
                            setHmUploadError((prev) => ({ ...prev, [vidUploadKey]: null }));
                            try {
                              const form = new FormData();
                              form.append("file", file);
                              form.append("section", `category-${slug}`);
                              const res = await fetch("/api/homepage-media/upload", { method: "POST", body: form, credentials: "include" });
                              const pl = (await res.json()) as Record<string, unknown>;
                              if (!res.ok || typeof pl.url !== "string") { setHmUploadError((prev) => ({ ...prev, [vidUploadKey]: "Upload failed." })); }
                              else { updateHomepageMediaSettings({ [vidKey]: pl.url as string }); }
                            } catch { setHmUploadError((prev) => ({ ...prev, [vidUploadKey]: "Upload failed." })); }
                            finally { setHmUploading((prev) => ({ ...prev, [vidUploadKey]: false })); }
                          }}
                          onClear={() => updateHomepageMediaSettings({ [vidKey]: "" })}
                        />
                      </div>
                    </div>
                  );
                })}
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
                title="Floating support link button"
                description="Shows a floating 'Need Help?' button. Use to link to your support page or a live chat URL. No real-time chat backend is required."
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
                  <TextField
                    label="Link / URL"
                    value={draft.homepageMediaSettings.liveChatLink}
                    onChange={(value) => updateHomepageMediaSettings({ liveChatLink: value })}
                    placeholder="/support"
                    inputMode="url"
                  />
                  <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.06] p-4 text-sm leading-6 text-cyan-50/75 lg:col-span-2">
                    If a third-party live chat widget is installed separately, you can hide this button. Otherwise use /support or a WhatsApp link as the fallback.
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "email" | "url" | "search";
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  tall,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tall?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={tall ? 6 : 3}
        className="w-full resize-y rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/40"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full appearance-none rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 pr-9 text-sm text-white outline-none transition focus:border-cyan-200/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-white/45" />
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

function AdminSummaryCard({
  title,
  value,
  href,
  icon: Icon,
}: {
  title: string;
  value: string;
  href: string;
  icon: typeof Boxes;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/24 p-5 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.06]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200/20 bg-violet-200/10 text-violet-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/56">{value}</p>
    </Link>
  );
}

function OrderList({
  orders,
  expandedOrderId,
  onToggleDetails,
  onStatusChange,
}: {
  orders: StoredOrder[];
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
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
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          isExpanded={expandedOrderId === order.orderId}
          onToggleDetails={() => onToggleDetails(order.orderId)}
          onStatusChange={(status) => onStatusChange(orderReferenceKey(order), status)}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggleDetails,
  onStatusChange,
}: {
  order: StoredOrder;
  isExpanded: boolean;
  onToggleDetails: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const reference = orderReferenceKey(order);

  return (
    <article
      className={`aev-admin-order-card min-w-0 overflow-hidden rounded-[1.25rem] border bg-black/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
        isExpanded
          ? "border-cyan-200/45 shadow-[0_0_34px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-white/10"
      }`}
    >
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
              Order reference
            </p>
            <h3 className="mt-1 break-words text-base font-semibold leading-6 text-white [overflow-wrap:break-word]">
              {reference}
            </h3>
          </div>
          <div className="shrink-0">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
          <DetailLine label="Customer" value={order.customer.fullName} />
          <DetailLine label="Phone" value={order.customer.phone} />
          <DetailLine label="City / Area" value={order.customer.cityArea} />
          <DetailLine label="Total" value={formatCurrency(orderTotal(order))} />
          <DetailLine label="Payment" value={order.paymentDetails.paymentMethod} />
          <DetailLine label="Created" value={formatDate(order.createdAt)} />
        </div>

        <div className="mt-4 min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 sm:px-4">
          <DetailLine label="Main item" value={mainItemSummary(order)} />
        </div>

        <div className="mt-4 grid min-w-0 gap-3 border-t border-white/10 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,180px)] sm:items-end">
          <label className="relative block min-w-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
              Quick status
            </span>
            <select
              value={order.status}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
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

          <button
            type="button"
            onClick={onToggleDetails}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/76 transition hover:border-cyan-200/30 hover:bg-cyan-200/10 hover:text-white"
          >
            {isExpanded ? "Viewing details" : "View details"}
          </button>
        </div>
      </div>
    </article>
  );
}

type OrderOperationsDraft = {
  courierName: string;
  trackingId: string;
  deliveryCharge: string;
  customerConfirmationNote: string;
  paymentVerificationStatus: PaymentVerificationStatus;
  refundExchangeRequest: string;
  sizeIssueReport: string;
  proofReceived: ProofReceivedStatus;
  adminInternalNote: string;
  orderSource: OrderSource;
  assignedStaff: string;
};

function operationsDraftFromOrder(order: StoredOrder): OrderOperationsDraft {
  return {
    courierName: order.courierName ?? "",
    trackingId: order.trackingId ?? "",
    deliveryCharge:
      typeof order.deliveryCharge === "number" ? String(order.deliveryCharge) : "",
    customerConfirmationNote: order.customerConfirmationNote ?? "",
    paymentVerificationStatus: order.paymentVerificationStatus ?? "Pending",
    refundExchangeRequest: order.refundExchangeRequest ?? "",
    sizeIssueReport: order.sizeIssueReport ?? "",
    proofReceived: order.proofReceived ?? "No",
    adminInternalNote: order.adminInternalNote ?? "",
    orderSource: order.orderSource ?? "Website",
    assignedStaff: order.assignedStaff ?? "",
  };
}

function operationsDraftToUpdate(draft: OrderOperationsDraft): OrderOperationsUpdate {
  const deliveryCharge = draft.deliveryCharge.trim()
    ? Number(draft.deliveryCharge)
    : undefined;

  return {
    courierName: draft.courierName,
    trackingId: draft.trackingId,
    deliveryCharge: Number.isFinite(deliveryCharge) ? deliveryCharge : undefined,
    customerConfirmationNote: draft.customerConfirmationNote,
    paymentVerificationStatus: draft.paymentVerificationStatus,
    refundExchangeRequest: draft.refundExchangeRequest,
    sizeIssueReport: draft.sizeIssueReport,
    proofReceived: draft.proofReceived,
    adminInternalNote: draft.adminInternalNote,
    orderSource: draft.orderSource,
    assignedStaff: draft.assignedStaff,
  };
}

function OrderDetails({
  order,
  onOperationsSave,
}: {
  order: StoredOrder;
  onOperationsSave: (
    orderId: string,
    updates: OrderOperationsUpdate
  ) => Promise<boolean>;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [operationsDraft, setOperationsDraft] = useState<OrderOperationsDraft>(() =>
    operationsDraftFromOrder(order)
  );
  const [operationsMessage, setOperationsMessage] = useState("");
  const [isSavingOperations, setIsSavingOperations] = useState(false);
  const reference = orderReferenceKey(order);
  const transactionReference = order.paymentDetails.transactionReference;
  const copiedLabel =
    copiedKey === "summary"
      ? "Order summary copied"
      : copiedKey === "contact"
        ? "Customer contact copied"
        : copiedKey === "address-action"
          ? "Delivery address copied"
          : copiedKey === "payment-action"
            ? "Payment summary copied"
            : null;

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
        : "Saved locally, but backend persistence failed. Confirm the Phase 19 Supabase columns exist."
    );
  };

  return (
    <section className="aev-admin-detail-panel min-w-0 rounded-[1.35rem] border border-cyan-200/20 bg-[#07101f]/95 p-4 shadow-[0_0_48px_rgba(34,211,238,0.10),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
      <div className="min-w-0 rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(280px,0.9fr)_minmax(420px,1.1fr)] 2xl:items-start">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/65">
              Order command strip
            </p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <h4 className="break-words text-xl font-semibold text-white [overflow-wrap:break-word]">
                {reference}
              </h4>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
              <DetailLine label="Created" value={formatDate(order.createdAt)} />
              <DetailLine label="Total" value={formatCurrency(orderTotal(order))} />
            </div>
          </div>
          <div className="relative flex min-w-0 flex-col gap-2 sm:flex-row sm:justify-end">
            <QuickActionsMenu
              copiedKey={copiedKey}
              actions={[
                {
                  key: "summary",
                  label: "Copy Summary",
                  onClick: () => copyValue("summary", buildOrderSummary(order)),
                },
                {
                  key: "contact",
                  label: "Copy Contact",
                  onClick: () => copyValue("contact", buildCustomerContact(order)),
                },
                {
                  key: "address-action",
                  label: "Copy Address",
                  disabled: !order.customer.address,
                  onClick: () => copyValue("address-action", buildDeliveryAddress(order)),
                },
                {
                  key: "payment-action",
                  label: "Copy Payment",
                  onClick: () => copyValue("payment-action", buildPaymentSummary(order)),
                },
              ]}
            />
            <a
              href={order.customer.phone ? `tel:${order.customer.phone}` : undefined}
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/70 sm:min-w-[150px] ${
                order.customer.phone
                  ? "border-cyan-200/30 bg-cyan-200/[0.10] text-cyan-50 hover:border-cyan-100/55 hover:bg-cyan-200/[0.16] hover:text-white"
                  : "pointer-events-none border-white/5 bg-white/[0.025] text-white/25"
              }`}
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span>Call Customer</span>
            </a>
            <p
              role="status"
              aria-live="polite"
              className={`pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-20 rounded-full border border-emerald-200/30 bg-emerald-200/12 px-3 py-1.5 text-xs font-semibold text-emerald-100 shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition duration-200 ${
                copiedLabel ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
              {copiedLabel ?? "Copied"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        <DetailGroup
          title="Customer"
          rows={[
            ["Name", order.customer.fullName, "name"],
            ["Phone", order.customer.phone, "phone"],
            ["Email", order.customer.email],
            ["City / area", order.customer.cityArea],
            ["Delivery address", order.customer.address, "address"],
          ]}
          copiedKey={copiedKey}
          onCopy={copyValue}
        />
        <DetailGroup
          title="Payment"
          rows={[
            ["Payment method", order.paymentDetails.paymentMethod],
            ["Wallet provider", order.paymentDetails.walletProvider],
            ["Payment type", order.paymentDetails.paymentType],
            ["Receiver number", order.paymentDetails.receiverNumber],
            ["Sender number", order.paymentDetails.walletSenderNumber],
            ["Transaction / reference ID", transactionReference, "payment-reference"],
            ["Total", formatCurrency(orderTotal(order))],
            ["Payment verification", order.paymentVerificationStatus],
          ]}
          copiedKey={copiedKey}
          onCopy={copyValue}
        />
        <DetailGroup
          title="Delivery"
          rows={[
            ["Delivery address", order.customer.address, "delivery-address"],
            ["Delivery note", order.customer.deliveryNote],
            ["Courier name", order.courierName],
            ["Tracking ID", order.trackingId],
            [
              "Delivery charge",
              typeof order.deliveryCharge === "number"
                ? formatCurrency(order.deliveryCharge)
                : undefined,
            ],
            ["Assigned staff", order.assignedStaff],
          ]}
          copiedKey={copiedKey}
          onCopy={copyValue}
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <ItemsPanel order={order} />
        <SupportOpsPanel order={order} />
      </div>

      <form
        onSubmit={handleOperationsSubmit}
        className="mt-4 min-w-0 rounded-2xl border border-cyan-200/18 bg-cyan-200/[0.045] p-4"
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white">Order Operations</h4>
            <p className="mt-1 text-sm leading-6 text-white/52">
              Fulfillment, payment verification, support, and internal handling fields.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSavingOperations}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/[0.12] px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/[0.18] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            {isSavingOperations ? "Saving..." : "Save Operations"}
          </button>
        </div>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <TextField
            label="Courier Name"
            value={operationsDraft.courierName}
            onChange={(value) => setOperationField("courierName", value)}
            placeholder="Pathao, RedX, Steadfast"
          />
          <TextField
            label="Tracking ID"
            value={operationsDraft.trackingId}
            onChange={(value) => setOperationField("trackingId", value)}
            placeholder="Courier tracking number"
          />
          <TextField
            label="Delivery Charge"
            value={operationsDraft.deliveryCharge}
            onChange={(value) => setOperationField("deliveryCharge", value)}
            placeholder="0"
            inputMode="decimal"
          />
          <SelectField
            label="Payment Verification Status"
            value={operationsDraft.paymentVerificationStatus}
            options={paymentVerificationStatuses}
            onChange={(value) => setOperationField("paymentVerificationStatus", value)}
          />
          <TextField
            label="Assigned Staff"
            value={operationsDraft.assignedStaff}
            onChange={(value) => setOperationField("assignedStaff", value)}
            placeholder="Team member name"
          />
          <SelectField
            label="Order Source"
            value={operationsDraft.orderSource}
            options={orderSources}
            onChange={(value) => setOperationField("orderSource", value)}
          />
          <SelectField
            label="Proof Received"
            value={operationsDraft.proofReceived}
            options={proofReceivedStatuses}
            onChange={(value) => setOperationField("proofReceived", value)}
          />
          <TextAreaField
            label="Customer Confirmation Note"
            value={operationsDraft.customerConfirmationNote}
            onChange={(value) => setOperationField("customerConfirmationNote", value)}
          />
          <TextAreaField
            label="Refund / Exchange Request"
            value={operationsDraft.refundExchangeRequest}
            onChange={(value) => setOperationField("refundExchangeRequest", value)}
          />
          <TextAreaField
            label="Size Issue Report"
            value={operationsDraft.sizeIssueReport}
            onChange={(value) => setOperationField("sizeIssueReport", value)}
          />
          <div className="md:col-span-2">
            <TextAreaField
              label="Admin Internal Note"
              value={operationsDraft.adminInternalNote}
              onChange={(value) => setOperationField("adminInternalNote", value)}
              tall
            />
          </div>
        </div>
        {operationsMessage && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm leading-6 text-white/68">
            {operationsMessage}
          </p>
        )}
      </form>
    </section>
  );
}

function ItemsPanel({ order }: { order: StoredOrder }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/22 p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-semibold text-white">Items</h4>
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
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(260px,1fr)_minmax(84px,0.35fr)_minmax(110px,0.4fr)_minmax(110px,0.4fr)] 2xl:items-start">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                      Product
                    </p>
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
        <DetailLine label="Order source" value={order.orderSource} />
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
}: {
  orders: StoredOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
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
        />
      ))}
    </div>
  );
}

function RecentOrderCard({
  order,
  onStatusChange,
}: {
  order: StoredOrder;
  onStatusChange: (status: OrderStatus) => void;
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

