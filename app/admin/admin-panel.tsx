"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ClipboardList,
  Gauge,
  LogOut,
  PackageCheck,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { products as seedProducts, type ProductVisualTheme } from "@/app/lib/products";

const LATEST_DRAFT_ORDER_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_KEY = "aevyrixa-draft-orders";
const ADMIN_SESSION_KEY = "aevyrixa-admin-session";
const ADMIN_PRODUCTS_KEY = "aevyrixa-admin-products";
const ADMIN_SETTINGS_KEY = "aevyrixa-admin-settings";
const ADMIN_PASSCODE = "AEV-ADMIN-2026";

const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

const productStatuses = ["Active", "Draft"] as const;
const visualThemes: ProductVisualTheme[] = ["blush-violet", "cyan-night", "rose-gold"];

type OrderStatus = (typeof orderStatuses)[number];
type ProductStatus = (typeof productStatuses)[number];
type AdminView = "dashboard" | "orders" | "products" | "settings";

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
  status: OrderStatus;
  createdAt?: string;
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
  visualTheme: ProductVisualTheme;
  visualVariant: string;
};

type AdminSettings = {
  storeName: string;
  guaranteeText: string;
  walletNumbers: string;
  deliveryNote: string;
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
  visualTheme: "blush-violet",
  visualVariant: "default",
};

const defaultSettings: AdminSettings = {
  storeName: "Aevyrixa Her Care",
  guaranteeText: "7-Day Money Back Guarantee",
  walletNumbers: "JazzCash / EasyPaisa numbers will be managed here in the backend phase.",
  deliveryNote: "Discreet delivery notes will be tested locally before backend wiring.",
};

const statusStyles: Record<OrderStatus, string> = {
  Pending: "border-amber-200/25 bg-amber-200/10 text-amber-100",
  Confirmed: "border-cyan-200/25 bg-cyan-200/10 text-cyan-100",
  Shipped: "border-violet-200/25 bg-violet-200/10 text-violet-100",
  Delivered: "border-emerald-200/25 bg-emerald-200/10 text-emerald-100",
  Cancelled: "border-rose-200/25 bg-rose-200/10 text-rose-100",
};

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

  const orderId = textValue(value.orderId);
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
    status: normalizeStatus(value.status),
    createdAt: textValue(value.createdAt),
  };
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
    status: value.status === "Active" ? "Active" : "Draft",
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
    visualTheme: product.visualTheme,
    visualVariant: product.visualTheme,
  }));
}

function readOrdersFromStorage() {
  const orders: StoredOrder[] = [];
  const seen = new Set<string>();

  const pushOrder = (value: unknown) => {
    const order = normalizeOrder(value);
    if (!order || seen.has(order.orderId)) return;
    seen.add(order.orderId);
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

function writeOrdersToStorage(orders: StoredOrder[]) {
  localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(orders));

  const latestStored = localStorage.getItem(LATEST_DRAFT_ORDER_KEY);
  if (!latestStored) return;

  try {
    const latest = normalizeOrder(JSON.parse(latestStored) as unknown);
    const updatedLatest = orders.find((order) => order.orderId === latest?.orderId);
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
      const parsed = JSON.parse(stored) as unknown;
      if (isRecord(parsed)) {
        return {
          storeName: textValue(parsed.storeName) || defaultSettings.storeName,
          guaranteeText: textValue(parsed.guaranteeText) || defaultSettings.guaranteeText,
          walletNumbers: textValue(parsed.walletNumbers) || defaultSettings.walletNumbers,
          deliveryNote: textValue(parsed.deliveryNote) || defaultSettings.deliveryNote,
        };
      }
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

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
      setOrders(readOrdersFromStorage());
      setAdminProducts(readProductsFromStorage());
      setSettings(readSettingsFromStorage());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "Cancelled");

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "Pending").length,
      confirmedOrders: orders.filter((order) => order.status === "Confirmed").length,
      estimatedRevenue: activeOrders.reduce(
        (sum, order) => sum + (order.totals.subtotal ?? 0),
        0
      ),
    };
  }, [orders]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((current) => {
      const nextOrders = current.map((order) =>
        order.orderId === orderId ? { ...order, status } : order
      );
      writeOrdersToStorage(nextOrders);
      return nextOrders;
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

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:min-h-screen lg:flex-row lg:py-6">
        <aside className="min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-2xl lg:w-72 lg:shrink-0">
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
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200/70">
                  Control Room
                </p>
                <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight">
                  {viewTitle(view)}
                </h2>
              </div>
              <p className="max-w-xl break-words text-sm leading-6 text-white/56 [overflow-wrap:anywhere]">
                Admin data is local to this browser for Phase 6 and structured for later API/database wiring.
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
                expandedOrderId={expandedOrderId}
                onToggleDetails={(orderId) =>
                  setExpandedOrderId((current) =>
                    current === orderId ? null : orderId
                  )
                }
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
  expandedOrderId,
  onToggleDetails,
  onStatusChange,
}: {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    estimatedRevenue: number;
  };
  orders: StoredOrder[];
  products: AdminProduct[];
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const recentOrders = orders.slice(0, 5);
  const activeProducts = products.filter((product) => product.status === "Active").length;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total orders" value={String(metrics.totalOrders)} icon={ShoppingBag} />
        <MetricCard label="Pending orders" value={String(metrics.pendingOrders)} icon={Sparkles} />
        <MetricCard label="Confirmed orders" value={String(metrics.confirmedOrders)} icon={ShieldCheck} />
        <MetricCard
          label="Estimated revenue"
          value={formatCurrency(metrics.estimatedRevenue)}
          icon={PackageCheck}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <SectionHeader title="Recent orders" href="/admin/orders" action="View all" />
          <OrderList
            orders={recentOrders}
            expandedOrderId={expandedOrderId}
            onToggleDetails={onToggleDetails}
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
  return (
    <div className="mt-6">
      <SectionHeader title="Saved local orders" />
      <OrderList
        orders={orders}
        expandedOrderId={expandedOrderId}
        onToggleDetails={onToggleDetails}
        onStatusChange={onStatusChange}
      />
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
  };

  const deleteProduct = (productId: string) => {
    onSaveProducts(products.filter((product) => product.id !== productId));
    setEditingProduct((current) => (current?.id === productId ? null : current));
  };

  const toggleStatus = (productId: string) => {
    onSaveProducts(
      products.map((product) =>
        product.id === productId
          ? { ...product, status: product.status === "Active" ? "Draft" : "Active" }
          : product
      )
    );
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Local product catalog" />
        <button
          type="button"
          onClick={addProduct}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/45 hover:bg-cyan-200/15"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

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
                  <h3 className="break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
                    {product.name}
                  </h3>
                  <ProductStatusBadge status={product.status} />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-white/58 sm:grid-cols-2">
                  <DetailLine label="Slug" value={product.slug} />
                  <DetailLine label="Category" value={product.category} />
                  <DetailLine label="Absorbency" value={product.absorbency} />
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
                  Delete
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

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveSettings(draft);
  };

  return (
    <form onSubmit={saveSettings} className="mt-6 space-y-5">
      <div className="rounded-[1.25rem] border border-cyan-200/18 bg-cyan-200/[0.045] p-4 text-sm leading-6 text-cyan-50/72">
        These are local admin settings for the next backend phase. They are saved in this browser and are not wired into checkout yet.
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
          label="Wallet numbers"
          value={draft.walletNumbers}
          onChange={(value) => setDraft((current) => ({ ...current, walletNumbers: value }))}
          tall
        />
        <TextAreaField
          label="Delivery note"
          value={draft.deliveryNote}
          onChange={(value) => setDraft((current) => ({ ...current, deliveryNote: value }))}
          tall
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
      >
        Save local settings
      </button>
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
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="break-words text-xs uppercase tracking-[0.2em] text-white/45">
          {label}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 break-words text-3xl font-semibold tracking-tight">
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
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          isExpanded={expandedOrderId === order.orderId}
          onToggleDetails={() => onToggleDetails(order.orderId)}
          onStatusChange={(status) => onStatusChange(order.orderId, status)}
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
  return (
    <article className="min-w-0 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/24">
      <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[1fr_170px_170px] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="min-w-0 break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
              {order.orderId}
            </p>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-3 grid gap-3 text-sm text-white/58 md:grid-cols-2">
            <DetailLine label="Customer" value={order.customer.fullName} />
            <DetailLine label="Phone" value={order.customer.phone} />
            <DetailLine label="Payment" value={order.paymentDetails.paymentMethod} />
            <DetailLine label="Wallet" value={order.paymentDetails.walletProvider} />
            <DetailLine label="Created" value={formatDate(order.createdAt)} />
            <DetailLine label="Total" value={formatCurrency(order.totals.subtotal)} />
          </div>
        </div>

        <label className="relative block min-w-0">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
            Status
          </span>
          <select
            value={order.status}
            onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-[#08111f] px-3 py-3 pr-9 text-sm font-medium text-white outline-none transition focus:border-cyan-200/40"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-white/45" />
        </label>

        <button
          type="button"
          onClick={onToggleDetails}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/76 transition hover:border-cyan-200/30 hover:bg-cyan-200/10 hover:text-white"
        >
          {isExpanded ? "Hide details" : "View details"}
        </button>
      </div>

      {isExpanded && <OrderDetails order={order} />}
    </article>
  );
}

function OrderDetails({ order }: { order: StoredOrder }) {
  return (
    <div className="border-t border-white/10 bg-white/[0.025] p-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <DetailGroup
          title="Customer info"
          rows={[
            ["Name", order.customer.fullName],
            ["Phone", order.customer.phone],
            ["Email", order.customer.email],
            ["Delivery address", order.customer.address],
            ["City / area", order.customer.cityArea],
            ["Notes", joinNotes(order.customer.sizeFitNote, order.customer.deliveryNote)],
          ]}
        />
        <DetailGroup
          title="Payment"
          rows={[
            ["Payment method", order.paymentDetails.paymentMethod],
            ["Wallet provider", order.paymentDetails.walletProvider],
            ["Payment type", order.paymentDetails.paymentType],
            ["Receiver number", order.paymentDetails.receiverNumber],
            ["Sender number", order.paymentDetails.walletSenderNumber],
            ["Transaction ID / reference", order.paymentDetails.transactionReference],
            ["Order total", formatCurrency(order.totals.subtotal)],
          ]}
        />
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/22 p-4">
          <h4 className="text-sm font-semibold text-white">Items</h4>
          <div className="mt-3 space-y-3">
            {order.items.length === 0 ? (
              <p className="text-sm text-white/50">No items recorded.</p>
            ) : (
              order.items.map((item, index) => (
                <div
                  key={`${item.id ?? item.name ?? "item"}-${index}`}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                >
                  <p className="break-words text-sm font-semibold leading-6 text-white [overflow-wrap:anywhere]">
                    {item.name ?? "Unnamed item"}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-white/48 [overflow-wrap:anywhere]">
                    {[item.size, item.color, item.absorbency].filter(Boolean).join(" / ") ||
                      "No variant recorded"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/68">
                    <span>Qty {item.quantity ?? 0}</span>
                    <span>{formatCurrency((item.price ?? 0) * (item.quantity ?? 0))}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | undefined]>;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/22 p-4">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <DetailLine key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-white/72 [overflow-wrap:anywhere]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
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

function joinNotes(sizeFitNote?: string, deliveryNote?: string) {
  return [sizeFitNote, deliveryNote].filter(Boolean).join(" / ") || undefined;
}
