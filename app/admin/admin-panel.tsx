"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ClipboardList,
  Gauge,
  PackageCheck,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const LATEST_DRAFT_ORDER_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_KEY = "aevyrixa-draft-orders";

const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

type OrderStatus = (typeof orderStatuses)[number];
type AdminView = "dashboard" | "orders";

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

type UnknownRecord = Record<string, unknown>;

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge, view: "dashboard" },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, view: "orders" },
  { label: "Products", href: "/admin#products", icon: Boxes },
  { label: "Settings", href: "/admin#settings", icon: Settings },
];

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

export default function AdminPanel({ view }: { view: AdminView }) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setOrders(readOrdersFromStorage());
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
              Store
            </Link>
          </div>

          <nav className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = "view" in item && item.view === view;

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
                  {view === "orders" ? "Orders" : "Dashboard"}
                </h2>
              </div>
              <p className="max-w-xl break-words text-sm leading-6 text-white/56 [overflow-wrap:anywhere]">
                Local test orders are loaded from this browser until the backend phase begins.
              </p>
            </div>

            {!isLoaded ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                Loading admin data...
              </div>
            ) : view === "orders" ? (
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
            ) : (
              <DashboardSection
                metrics={metrics}
                orders={orders}
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

function DashboardSection({
  metrics,
  orders,
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
  expandedOrderId: string | null;
  onToggleDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const recentOrders = orders.slice(0, 5);

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
          <ComingSoonCard
            id="products"
            title="Products"
            copy="Product editing will connect here after the admin foundation is stable."
            icon={Boxes}
          />
          <ComingSoonCard
            id="settings"
            title="Settings"
            copy="Brand, checkout, and operational controls will be added in a later phase."
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

function ComingSoonCard({
  id,
  title,
  copy,
  icon: Icon,
}: {
  id: string;
  title: string;
  copy: string;
  icon: typeof Boxes;
}) {
  return (
    <div
      id={id}
      className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/24 p-5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200/20 bg-violet-200/10 text-violet-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/56">{copy}</p>
      <p className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-white/45">
        Coming soon
      </p>
    </div>
  );
}

function joinNotes(sizeFitNote?: string, deliveryNote?: string) {
  return [sizeFitNote, deliveryNote].filter(Boolean).join(" / ") || undefined;
}
