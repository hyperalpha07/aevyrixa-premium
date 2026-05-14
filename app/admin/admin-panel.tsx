"use client";

import Link from "next/link";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ClipboardList,
  Copy,
  CreditCard,
  Gauge,
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
  Wallet,
} from "lucide-react";
import { products as seedProducts, type ProductVisualTheme } from "@/app/lib/products";
import {
  ADMIN_SETTINGS_KEY,
  defaultAdminSettings,
  normalizeAdminSettings,
  type AdminSettings,
  walletProviders,
  type WalletProvider,
} from "@/app/lib/admin-settings";
import { orderStatuses, paymentMethods, type OrderStatus } from "@/app/lib/order-types";
import type {
  ProductCatalogItem,
  ProductStockStatus,
  ProductStatus as StoreProductStatus,
} from "@/app/lib/product-types";

const LATEST_DRAFT_ORDER_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_KEY = "aevyrixa-draft-orders";
const ADMIN_SESSION_KEY = "aevyrixa-admin-session";
const ADMIN_PRODUCTS_KEY = "aevyrixa-admin-products";
const ADMIN_PASSCODE = "AEV-ADMIN-2026";

const productStatuses = ["Active", "Draft"] as const;
const stockStatuses: ProductStockStatus[] = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "preorder",
];
const visualThemes: ProductVisualTheme[] = ["blush-violet", "cyan-night", "rose-gold"];

type ProductStatus = (typeof productStatuses)[number];
type AdminView = "dashboard" | "orders" | "products" | "settings";
type PaymentFilter = "All" | (typeof paymentMethods)[number];
type StatusFilter = "All" | OrderStatus;
type OrderSort = "Newest first" | "Oldest first" | "Highest total" | "Lowest total";

type StoredOrderItem = {
  id?: string;
  name?: string;
  price?: number;
  size?: string;
  color?: string;
  absorbency?: string;
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
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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
        name: textValue(item.name),
        price: numberValue(item.price),
        size: textValue(item.size),
        color: textValue(item.color),
        absorbency: textValue(item.absorbency),
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
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload)) return null;

    return normalizeOrder(payload.order);
  } catch (error) {
    console.error("Failed to update backend order status:", error);
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

function formatAdminPrice(value?: number, currency = "USD") {
  if (typeof value !== "number") return "";
  const symbol = currency === "BDT" ? "৳" : "$";
  return `${symbol}${value.toFixed(2)}`;
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
    currency: "USD",
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
  };
}

function apiProductToAdminProduct(product: ProductCatalogItem): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: formatAdminPrice(product.price, product.currency),
    compareAtPrice: formatAdminPrice(product.compareAtPrice, product.currency),
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
  };
}

async function readProductsFromApi() {
  try {
    const response = await fetch("/api/products?admin=1", { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload) || !Array.isArray(payload.products)) return null;

    return payload.products.map(apiProductToAdminProduct);
  } catch (error) {
    console.error("Failed to load backend products:", error);
    return null;
  }
}

async function saveProductToApi(product: AdminProduct, exists: boolean) {
  try {
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

    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload) || !isRecord(payload.product)) return null;

    return apiProductToAdminProduct(payload.product as ProductCatalogItem);
  } catch (error) {
    console.error("Failed to save backend product:", error);
    return null;
  }
}

async function disableProductInApi(productId: string) {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    if (!isRecord(payload) || !isRecord(payload.product)) return null;

    return apiProductToAdminProduct(payload.product as ProductCatalogItem);
  } catch (error) {
    console.error("Failed to disable backend product:", error);
    return null;
  }
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

function formatCurrency(value?: number) {
  return `$${(value ?? 0).toFixed(2)}`;
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
  return [item.size, item.color, item.absorbency].filter(Boolean).join(" / ");
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
      .map((item) => `${item.name ?? "Unnamed item"} x ${item.quantity ?? 0}`)
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
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsAuthenticated(localStorage.getItem(ADMIN_SESSION_KEY) === "active");
      setAdminProducts(readProductsFromStorage());
      setSettings(readSettingsFromStorage());
      setIsLoaded(true);

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
        if (!backendProducts || backendProducts.length === 0) return;
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

  const saveProducts = (nextProducts: AdminProduct[]) => {
    setAdminProducts(nextProducts);
    writeProductsToStorage(nextProducts);
  };

  const saveSettings = (nextSettings: AdminSettings) => {
    setSettings(nextSettings);
    writeSettingsToStorage(nextSettings);
  };

  const handleLogin = (passcode: string) => {
    if (passcode !== ADMIN_PASSCODE) return false;

    // Temporary local testing gate only. This localStorage session is not production security.
    localStorage.setItem(ADMIN_SESSION_KEY, "active");
    setIsAuthenticated(true);
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setExpandedOrderId(null);
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

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
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
              />
            ) : view === "products" ? (
              <ProductsSection products={adminProducts} onSaveProducts={saveProducts} />
            ) : view === "settings" ? (
              <SettingsSection settings={settings} onSaveSettings={saveSettings} />
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

function AdminLogin({ onLogin }: { onLogin: (passcode: string) => boolean }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const accepted = onLogin(passcode.trim());
    setError(accepted ? "" : "Passcode not recognized.");
  };

  return (
    <main className="grid min-h-screen place-items-center overflow-x-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-10%] h-[340px] w-[340px] rounded-full bg-cyan-400/16 blur-[130px]" />
        <div className="absolute right-[-18%] top-[22%] h-[360px] w-[360px] rounded-full bg-fuchsia-400/14 blur-[150px]" />
      </div>
      <form
        onSubmit={submitLogin}
        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_0_70px_rgba(34,211,238,0.10)] backdrop-blur-2xl sm:p-7"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Aevyrixa Admin
        </p>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">
          Access gate
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/56">
          Temporary local testing access for the custom admin panel.
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
            Admin Passcode
          </span>
          <input
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45"
            placeholder="Enter passcode"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-2xl border border-rose-200/20 bg-rose-200/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          Enter Admin
        </button>

        <Link
          href="/"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-cyan-200/35 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </form>
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
  const activeProducts = products.filter((product) => product.status === "Active").length;

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
            value={`${activeProducts}/${products.length} active`}
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
}: {
  orders: StoredOrder[];
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
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
            <OrderDetails order={selectedOrder} />
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
  const [statusMessage, setStatusMessage] = useState("");

  const addProduct = () => {
    setEditingProduct({
      ...emptyProduct,
      id: `admin-product-${Date.now()}`,
      slug: `new-product-${products.length + 1}`,
    });
  };

  const saveProduct = (product: AdminProduct) => {
    const slug = product.slug || slugify(product.name);
    const nextProduct = {
      ...product,
      id: product.id || `admin-product-${slug || Date.now()}`,
      slug,
      visualVariant: product.visualVariant || product.visualTheme,
    };
    const exists = products.some((item) => item.id === nextProduct.id);
    const nextProducts = exists
      ? products.map((item) => (item.id === nextProduct.id ? nextProduct : item))
      : [nextProduct, ...products];

    onSaveProducts(nextProducts);
    setEditingProduct(null);
    setStatusMessage("Product saved locally. Backend sync is running when available.");

    void saveProductToApi(nextProduct, exists).then((backendProduct) => {
      if (!backendProduct) return;
      const syncedProducts = nextProducts.map((item) =>
        item.id === nextProduct.id || item.id === backendProduct.id
          ? backendProduct
          : item
      );
      onSaveProducts(syncedProducts);
      setStatusMessage("Product saved to backend.");
    });
  };

  const deleteProduct = (productId: string) => {
    if (!window.confirm("Set this product to Draft instead of deleting it?")) return;

    const nextProducts = products.map((product) =>
      product.id === productId ? { ...product, status: "Draft" as ProductStatus } : product
    );
    onSaveProducts(nextProducts);
    setEditingProduct((current) => (current?.id === productId ? null : current));
    setStatusMessage("Product moved to Draft locally. Backend sync is running when available.");

    void disableProductInApi(productId).then((backendProduct) => {
      if (!backendProduct) return;
      onSaveProducts(
        nextProducts.map((product) =>
          product.id === backendProduct.id ? backendProduct : product
        )
      );
      setStatusMessage("Product moved to Draft in backend.");
    });
  };

  const toggleStatus = (productId: string) => {
    const nextProducts: AdminProduct[] = products.map((product) =>
      product.id === productId
        ? {
            ...product,
            status: product.status === "Active" ? "Draft" : "Active",
          }
        : product
    );
    const nextProduct = nextProducts.find((product) => product.id === productId);

    onSaveProducts(nextProducts);
    setStatusMessage("Product status updated locally. Backend sync is running when available.");

    if (!nextProduct) return;

    void saveProductToApi(nextProduct, true).then((backendProduct) => {
      if (!backendProduct) return;
      onSaveProducts(
        nextProducts.map((product) =>
          product.id === backendProduct.id ? backendProduct : product
        )
      );
      setStatusMessage("Product status saved to backend.");
    });
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

      {editingProduct && (
        <ProductEditor
          key={editingProduct.id}
          product={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onSave={saveProduct}
        />
      )}

      <div className="grid gap-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/24 p-4"
          >
            <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_120px_130px_160px] xl:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3 className="break-words text-base font-semibold text-white [overflow-wrap:break-word]">
                    {product.name}
                  </h3>
                  <ProductStatusBadge status={product.status} />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-white/58 sm:grid-cols-2">
                  <DetailLine label="Slug" value={product.slug} />
                  <DetailLine label="Category" value={product.category} />
                  <DetailLine label="Absorbency" value={product.absorbency} />
                  <DetailLine label="Stock" value={product.stockStatus.replace(/_/g, " ")} />
                  <DetailLine label="Visual" value={product.visualVariant || product.visualTheme} />
                </div>
              </div>
              <DetailLine label="Price" value={product.price || "$0.00"} />
              <DetailLine label="Compare-at" value={product.compareAtPrice || "None"} />
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(product)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm font-medium text-white/76 transition hover:border-cyan-200/30 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(product.id)}
                  className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2.5 text-sm font-medium text-violet-50/80 transition hover:border-violet-100/35 hover:text-white"
                >
                  {product.status === "Active" ? "Set Draft" : "Set Active"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteProduct(product.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-200/[0.06] px-3 py-2.5 text-sm font-medium text-rose-100/80 transition hover:border-rose-100/35 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  Set Draft
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  onCancel,
  onSave,
}: {
  product: AdminProduct;
  onCancel: () => void;
  onSave: (product: AdminProduct) => void;
}) {
  const [draft, setDraft] = useState(product);
  const [sizes, setSizes] = useState(listToText(product.sizes));
  const [colors, setColors] = useState(listToText(product.colors));
  const [benefits, setBenefits] = useState(listToLines(product.benefits));
  const [care, setCare] = useState(listToLines(product.care));

  const updateField = (field: keyof AdminProduct, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...draft,
      slug: draft.slug || slugify(draft.name),
      sizes: textToList(sizes),
      colors: textToList(colors),
      benefits: linesToList(benefits),
      care: linesToList(care),
    });
  };

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
        <TextField label="Price" value={draft.price} onChange={(value) => updateField("price", value)} placeholder="$39.00" />
        <TextField label="Compare-at price" value={draft.compareAtPrice} onChange={(value) => updateField("compareAtPrice", value)} placeholder="$52.00" />
        <TextField label="Category" value={draft.category} onChange={(value) => updateField("category", value)} />
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
        <TextField label="SEO title" value={draft.seoTitle} onChange={(value) => updateField("seoTitle", value)} />
        <TextAreaField label="Short description" value={draft.shortDescription} onChange={(value) => updateField("shortDescription", value)} />
        <TextAreaField label="SEO description" value={draft.seoDescription} onChange={(value) => updateField("seoDescription", value)} />
        <TextAreaField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} tall />
        <TextAreaField label="Benefits" value={benefits} onChange={setBenefits} tall />
        <TextAreaField label="Care" value={care} onChange={setCare} tall />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/68 transition hover:border-white/25 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          Save product
        </button>
      </div>
    </form>
  );
}

function SettingsSection({
  settings,
  onSaveSettings,
}: {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveSettings(draft);
    setStatusMessage("Settings saved. Checkout will use these local payment details.");
  };

  const resetSettings = () => {
    setDraft(defaultSettings);
    onSaveSettings(defaultSettings);
    setStatusMessage("Settings reset to defaults.");
  };

  const updateWalletNumber = (provider: WalletProvider, value: string) => {
    setDraft((current) => ({
      ...current,
      walletReceiverNumbers: {
        ...current.walletReceiverNumbers,
        [provider]: value,
      },
    }));
  };

  return (
    <form onSubmit={saveSettings} className="mt-6 space-y-5">
      <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.045] p-4 text-sm leading-6 text-cyan-50/72">
        These settings are stored locally for testing. Backend/database sync will be added later.
      </div>

      {statusMessage && (
        <div className="rounded-[1.25rem] border border-emerald-200/20 bg-emerald-200/[0.07] p-4 text-sm leading-6 text-emerald-50/80">
          {statusMessage}
        </div>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="mb-5 min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
            Store Messaging
          </p>
          <h2 className="mt-2 break-words text-xl font-semibold text-white">
            Checkout trust and delivery text
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Store name"
            value={draft.storeName}
            onChange={(value) => setDraft((current) => ({ ...current, storeName: value }))}
          />
          <TextField
            label="Guarantee text"
            value={draft.guaranteeText}
            onChange={(value) => setDraft((current) => ({ ...current, guaranteeText: value }))}
          />
          <TextAreaField
            label="Delivery note"
            value={draft.deliveryNote}
            onChange={(value) => setDraft((current) => ({ ...current, deliveryNote: value }))}
            tall
          />
          <TextAreaField
            label="COD instruction"
            value={draft.codInstruction}
            onChange={(value) => setDraft((current) => ({ ...current, codInstruction: value }))}
            tall
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="mb-5 min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/70">
            Payment Configuration
          </p>
          <h2 className="mt-2 break-words text-xl font-semibold text-white">
            Wallet receivers and bank instructions
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {walletProviders.map((provider) => (
            <TextField
              key={provider}
              label={`${provider} receiver number`}
              value={draft.walletReceiverNumbers[provider]}
              onChange={(value) => updateWalletNumber(provider, value)}
            />
          ))}
          <TextAreaField
            label="Bank transfer instruction"
            value={draft.bankTransferInstruction}
            onChange={(value) =>
              setDraft((current) => ({ ...current, bankTransferInstruction: value }))
            }
            tall
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetSettings}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/68 transition hover:border-white/25 hover:text-white"
        >
          Reset to defaults
        </button>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          Save settings
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
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

function OrderDetails({ order }: { order: StoredOrder }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
            ["Payment verification", "Payment verification will be added in a future operations phase."],
          ]}
          copiedKey={copiedKey}
          onCopy={copyValue}
        />
        <DetailGroup
          title="Delivery"
          rows={[
            ["Delivery address", order.customer.address, "delivery-address"],
            ["Delivery note", order.customer.deliveryNote],
            ["Courier name", "Not assigned yet"],
            ["Tracking ID", "Not assigned yet"],
            ["Delivery charge", "To be confirmed"],
            ["Assigned staff", "Not assigned yet"],
          ]}
          copiedKey={copiedKey}
          onCopy={copyValue}
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <ItemsPanel order={order} />
        <FutureOpsPanel />
      </div>
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

function FutureOpsPanel() {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-200/15 bg-violet-200/[0.045] p-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">Support / Future Ops</h4>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Planned
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <DetailLine label="Customer confirmation note" value="Not added yet" />
        <DetailLine label="Refund / exchange request" value="None" />
        <DetailLine label="Size issue report" value="None" />
        <DetailLine label="Photo / video proof received" value="Not uploaded" />
        <DetailLine label="Admin internal note" value="Not added yet" />
        <DetailLine label="Order source" value="Website" />
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
        Open a card to review customer, payment, delivery, item, and future operations details.
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

