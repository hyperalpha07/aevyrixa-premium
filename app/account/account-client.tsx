"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  PackageSearch,
  Plus,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type AccountView = "dashboard" | "orders" | "addresses" | "support";
type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
};
type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  cityArea: string;
  address: string;
  deliveryZone?: string;
  isDefault: boolean;
};
type AccountOrder = {
  orderRef: string;
  createdAt: string;
  status: string;
  total: number;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryAddress: string;
  cityArea: string;
  courierName?: string;
  trackingId?: string;
  items: { name: string; quantity: number; price: number; variant?: string }[];
};
type SupportPayload = {
  conversations?: unknown[];
  linked?: boolean;
  message?: string;
};
type AddressForm = {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  cityArea: string;
  address: string;
  deliveryZone: string;
  isDefault: boolean;
};

const emptyAddress: AddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  cityArea: "",
  address: "",
  deliveryZone: "Inside Dhaka",
  isDefault: false,
};

function formatDate(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

function readable(value?: string) {
  return value ? value.replace(/_/g, " ") : "Not available";
}

function normalizeStatus(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

function statusChipClass(value?: string) {
  const status = normalizeStatus(value);
  if (status.includes("cancel") || status.includes("failed") || status.includes("return")) {
    return "border-rose-300/35 bg-rose-300/[0.08] text-rose-100";
  }
  if (status.includes("deliver")) {
    return "border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100";
  }
  if (status.includes("confirm") || status.includes("paid") || status.includes("dispatch") || status.includes("transit")) {
    return "border-[#00D4C6]/35 bg-[#00D4C6]/[0.08] text-[#31E6D4]";
  }
  return "border-[#FFB84D]/35 bg-[#FFB84D]/[0.08] text-[#FFD18A]";
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = (await response.json().catch(() => ({}))) as T & { errors?: string[] };
  if (!response.ok) {
    throw new Error(payload.errors?.[0] || "Request failed.");
  }
  return payload;
}

export default function AccountClient({ view }: { view: AccountView }) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressDraft, setAddressDraft] = useState<AddressForm>(emptyAddress);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportCount, setSupportCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const recentOrders = orders.slice(0, 3);

  useEffect(() => {
    let isActive = true;
    void fetchStorefrontSettings().then((next) => {
      if (isActive) setSettings(next);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const session = await readJson<{ customer: Customer }>("/api/account/session");
        if (!isActive) return;
        setCustomer(session.customer);
        const [orderPayload, addressPayload, supportPayload] = await Promise.all([
          readJson<{ orders: AccountOrder[] }>("/api/account/orders"),
          readJson<{ addresses: Address[] }>("/api/account/addresses"),
          readJson<SupportPayload>("/api/account/support").catch((err) => ({
            message: err instanceof Error ? err.message : "Support history is unavailable.",
            conversations: [],
          })),
        ]);
        if (!isActive) return;
        setOrders(orderPayload.orders);
        setAddresses(addressPayload.addresses);
        setSupportMessage(supportPayload.message ?? "");
        setSupportCount(supportPayload.conversations?.length ?? 0);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Please log in to continue.");
        setCustomer(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    router.replace("/account/login");
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const url = addressDraft.id
      ? `/api/account/addresses/${encodeURIComponent(addressDraft.id)}`
      : "/api/account/addresses";
    const method = addressDraft.id ? "PATCH" : "POST";
    try {
      await readJson(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addressDraft),
      });
      const payload = await readJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
      setAddressDraft(emptyAddress);
      setIsAddressOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Address could not be saved.");
    }
  };

  const editAddress = (address: Address) => {
    setAddressDraft({
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      cityArea: address.cityArea,
      address: address.address,
      deliveryZone: address.deliveryZone ?? "Inside Dhaka",
      isDefault: address.isDefault,
    });
    setIsAddressOpen(true);
  };

  const deleteAddress = async (addressId: string) => {
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
        method: "DELETE",
      });
      setAddresses((current) => current.filter((item) => item.id !== addressId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Address could not be deleted.");
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "set_default" }),
      });
      const payload = await readJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Default address could not be updated.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,77,184,0.07),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.05),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(0,212,198,0.04),transparent_30%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />
      <SiteHeader settings={settings} active="account" />

      {/* Premium welcome banner */}
      <div className="aev-welcome-banner border-b border-[#FF4DB8]/10 px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF4DB8]/30 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#FF4DB8]/25 bg-[#FF4DB8]/12 text-[#FF4DB8]">
                <UserRound className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/75">
                Her Care Account
              </p>
            </div>
            <h1 className="mt-3 break-words text-2xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-3xl md:text-4xl">
              {customer ? `Welcome back, ${customer.fullName.split(" ")[0]}` : "Your Aevyrixa account"}
            </h1>
            {customer && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[#D8CBE8]">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 [overflow-wrap:anywhere]">
                    {customer.email}
                  </span>
                )}
              </div>
            )}
          </div>
          {customer && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#1B1230]/80 px-4 py-2.5 text-sm font-semibold text-[#9C91AA] transition hover:border-[#FF4DB8]/25 hover:bg-[#211633] hover:text-[#D8CBE8]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-20 md:pt-8">
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 text-sm">
          <AccountTab href="/account" active={view === "dashboard"} icon={UserRound} label="Account" />
          <AccountTab href="/account/orders" active={view === "orders"} icon={PackageSearch} label="Orders" />
          <AccountTab href="/account/addresses" active={view === "addresses"} icon={MapPin} label="Addresses" />
          <AccountTab href="/account/support" active={view === "support"} icon={MessageSquare} label="Support" />
        </nav>

        {isLoading ? (
          <Panel>Loading your account...</Panel>
        ) : !customer ? (
          <Panel>
            <p className="text-lg font-semibold text-white">Login required</p>
            <p className="mt-2 text-sm leading-7 text-white/62">{error}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className="action-primary" href="/account/login">Login</Link>
              <Link className="action-muted" href="/account/register">Create Account</Link>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
            <aside className="space-y-4">
              <Panel>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FF4DB8]/22 bg-gradient-to-br from-[#FF4DB8]/15 to-[#A855F7]/10 text-[#FF4DB8]">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-white">{customer.fullName}</p>
                    <p className="mt-1 text-sm text-[#D8CBE8]">{customer.phone}</p>
                    {customer.email && <p className="mt-0.5 truncate text-xs text-[#9C91AA]">{customer.email}</p>}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-medium text-[#9C91AA]">Active member</span>
                </div>
              </Panel>
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/70">
                  Quick Links
                </p>
                <div className="mt-4 grid gap-2">
                  <Link className="shortcut-link" href="/track-order">
                    <PackageSearch className="h-3.5 w-3.5 shrink-0 text-[#FF4DB8]" />
                    Track an order
                  </Link>
                  <Link className="shortcut-link" href="/support">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[#A855F7]" />
                    Support & policies
                  </Link>
                  <Link className="shortcut-link" href="/product">
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[#00D4C6]" />
                    Continue shopping
                  </Link>
                </div>
              </Panel>
            </aside>

            <section className="min-w-0">
              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">
                  {error}
                </div>
              )}
              {view === "dashboard" && (
                <Dashboard
                  orders={recentOrders}
                  allOrders={orders}
                  address={defaultAddress}
                  addressCount={addresses.length}
                  supportMessage={supportMessage}
                  supportCount={supportCount}
                />
              )}
              {view === "orders" && (
                <OrdersView
                  orders={orders}
                />
              )}
              {view === "addresses" && (
                <AddressesView
                  addresses={addresses}
                  isOpen={isAddressOpen}
                  draft={addressDraft}
                  setDraft={setAddressDraft}
                  onOpen={() => {
                    setAddressDraft(emptyAddress);
                    setIsAddressOpen(true);
                  }}
                  onCancel={() => {
                    setAddressDraft(emptyAddress);
                    setIsAddressOpen(false);
                  }}
                  onSave={saveAddress}
                  onEdit={editAddress}
                  onDelete={deleteAddress}
                  onSetDefault={setDefaultAddress}
                />
              )}
              {view === "support" && <SupportView message={supportMessage} />}
            </section>
          </div>
        )}
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}

function AccountTab({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-[#FF4DB8]/45 bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] text-white shadow-[0_0_16px_rgba(255,77,184,0.30)]"
          : "border-white/10 bg-[#151024] text-[#9C91AA] hover:border-[#FF4DB8]/25 hover:bg-[#211633] hover:text-[#D8CBE8]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`aev-panel min-w-0 rounded-[1.5rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Dashboard({
  orders,
  allOrders,
  address,
  addressCount,
  supportMessage,
  supportCount,
}: {
  orders: AccountOrder[];
  allOrders: AccountOrder[];
  address?: Address;
  addressCount: number;
  supportMessage: string;
  supportCount: number;
}) {
  const pendingOrders = allOrders.filter((order) => normalizeStatus(order.status).includes("pending")).length;
  const deliveredOrders = allOrders.filter(
    (order) => normalizeStatus(order.status).includes("deliver") || normalizeStatus(order.deliveryStatus).includes("deliver")
  ).length;

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-5">
          <Metric icon={PackageSearch} label="Total orders" value={String(allOrders.length)} accent="pink" />
          <Metric icon={Clock3} label="Pending" value={String(pendingOrders)} accent="amber" />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders)} accent="green" />
          <Metric icon={MessageSquare} label="Support" value={String(supportCount)} accent="violet" />
          <Metric icon={MapPin} label="Addresses" value={String(addressCount)} accent="cyan" />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Quick Actions" href="/product" label="Shop" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <QuickAction href="/track-order" icon={PackageSearch} label="Track order" />
          <QuickAction href="/account/orders" icon={ShoppingBag} label="View orders" />
          <QuickAction href="/account/addresses" icon={MapPin} label="Saved addresses" />
          <QuickAction href="/account/support" icon={MessageSquare} label="Support" />
          <QuickAction href="/product" icon={Home} label="Continue shopping" />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Recent Orders" href="/account/orders" />
        <OrderRows orders={orders} />
      </Panel>
      <Panel>
        <SectionTitle title="Saved Address" href="/account/addresses" />
        {address ? (
          <>
            <AddressSummary address={address} />
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/38">
              {addressCount} saved {addressCount === 1 ? "address" : "addresses"}
            </p>
          </>
        ) : (
          <EmptyLine text="No saved address yet." />
        )}
      </Panel>
      <Panel>
        <SectionTitle title="Support History" href="/account/support" />
        <p className="text-sm leading-7 text-white/62">
          {supportMessage || "Use support shortcuts when you need help with an order."}
        </p>
      </Panel>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-24 min-w-0 flex-col justify-between overflow-hidden rounded-[1.15rem] border border-[#FF4DB8]/12 bg-[#1B1230] p-4 transition duration-200 hover:border-[#FF4DB8]/30 hover:bg-[#211633] hover:shadow-[0_12px_36px_rgba(0,0,0,0.36),0_0_18px_rgba(255,77,184,0.07)]"
    >
      <div className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full bg-[#FF4DB8]/[0.04] blur-xl transition duration-300 group-hover:bg-[#FF4DB8]/[0.08]" />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.07] text-[#FF4DB8] transition duration-200 group-hover:border-[#FF4DB8]/35 group-hover:bg-[#FF4DB8]/12">
        <Icon className="h-4 w-4" />
      </div>
      <span className="relative mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-white">
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{label}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#9C91AA] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#FF4DB8]" />
      </span>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent = "pink",
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  accent?: "pink" | "amber" | "green" | "violet" | "cyan";
}) {
  const accents = {
    pink: "border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.08] text-[#FF4DB8]",
    amber: "border-[#FFB84D]/20 bg-[#FFB84D]/[0.08] text-[#FFD18A]",
    green: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
    violet: "border-[#A855F7]/20 bg-[#A855F7]/[0.08] text-[#C9A7FF]",
    cyan: "border-[#00D4C6]/20 bg-[#00D4C6]/[0.08] text-[#31E6D4]",
  };

  return (
    <div className="aev-card aev-metric-card relative rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230] p-4">
      <div className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full bg-[#FF4DB8]/[0.06] blur-xl" />
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${accents[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/70">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SectionTitle({ title, href, label = "View" }: { title: string; href: string; label?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-[#FF4DB8] hover:text-[#FFB3D1]">
        {label}
      </Link>
    </div>
  );
}

function OrdersView({ orders }: { orders: AccountOrder[] }) {
  return (
    <div className="grid gap-5">
      <Panel>
        <h2 className="text-xl font-semibold text-white">Order History</h2>
        <p className="mt-2 text-sm leading-7 text-[#9C91AA]">
          Open an order for a focused detail view with tracking and support actions.
        </p>
        <div className="mt-5">
          <OrderRows orders={orders} detailed />
        </div>
      </Panel>
    </div>
  );
}

function orderDetailHref(orderRef: string) {
  return `/account/orders/${encodeURIComponent(orderRef)}`;
}

function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}

function OrderRows({
  orders,
  onSelect,
  detailed = false,
}: {
  orders: AccountOrder[];
  onSelect?: (orderRef: string) => void;
  detailed?: boolean;
}) {
  if (orders.length === 0) return <EmptyLine text="No orders found for this account phone yet." />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.orderRef}
          className="group relative grid gap-4 overflow-hidden rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230]/95 p-4 transition hover:border-[#FF4DB8]/28 hover:bg-[#211633]/90 md:grid-cols-[1fr_auto]"
        >
          <div className="pointer-events-none absolute right-4 top-4 h-14 w-14 rounded-full bg-[#FF4DB8]/[0.05] blur-xl transition group-hover:bg-[#FF4DB8]/[0.10]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">{order.orderRef}</p>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusChipClass(order.status)}`}>
                {readable(order.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#9C91AA]">{formatDate(order.createdAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {order.paymentStatus && (
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusChipClass(order.paymentStatus)}`}>
                  Payment: {readable(order.paymentStatus)}
                </span>
              )}
              {order.deliveryStatus && (
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusChipClass(order.deliveryStatus)}`}>
                  Delivery: {readable(order.deliveryStatus)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-sm font-semibold text-[#FFB3D1]">{formatCurrency(order.total)}</p>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(order.orderRef)}
                className="rounded-full border border-[#FF4DB8]/25 bg-[#211633] px-4 py-2 text-sm font-semibold text-[#D8CBE8] transition hover:border-[#FF4DB8]/45 hover:text-white"
              >
                View details
              </button>
            ) : (
              <Link className="mini-action text-center" href={orderDetailHref(order.orderRef)}>
                View details
              </Link>
            )}
            {detailed && (
              <div className="flex flex-col gap-2 sm:flex-row">
                {order.customerPhone && (
                  <Link className="mini-action text-center" href={trackOrderHref(order)}>
                    Track order
                  </Link>
                )}
                <Link className="mini-action text-center" href="/account/support">
                  Get support
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressesView({
  addresses,
  isOpen,
  draft,
  setDraft,
  onOpen,
  onCancel,
  onSave,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addresses: Address[];
  isOpen: boolean;
  draft: AddressForm;
  setDraft: (draft: AddressForm) => void;
  onOpen: () => void;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Saved Addresses</h2>
          <button type="button" onClick={onOpen} className="icon-action">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {isOpen && (
          <form onSubmit={onSave} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Label" value={draft.label} onChange={(value) => setDraft({ ...draft, label: value })} />
              <Input label="Full name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
              <Input label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
              <Input label="City / area" value={draft.cityArea} onChange={(value) => setDraft({ ...draft, cityArea: value })} />
            </div>
            <label className="block">
              <span className="text-sm font-medium text-[#D8CBE8]">Full address</span>
              <textarea
                value={draft.address}
                rows={3}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                className="mt-2 w-full resize-none rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3 text-sm text-white outline-none focus:border-[#FF4DB8]/35 placeholder:text-[#6B5F7A]"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#D8CBE8]">Delivery zone</span>
                <select
                  value={draft.deliveryZone}
                  onChange={(event) => setDraft({ ...draft, deliveryZone: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3 text-sm text-white outline-none focus:border-[#FF4DB8]/35"
                >
                  <option>Inside Dhaka</option>
                  <option>Outside Dhaka</option>
                </select>
              </label>
              <label className="mt-8 flex items-center gap-3 text-sm text-[#D8CBE8]">
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                  className="h-4 w-4 accent-[#FF4DB8]"
                />
                Set as default
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="action-primary" type="submit">Save address</button>
              <button className="action-muted" type="button" onClick={onCancel}>Cancel</button>
            </div>
          </form>
        )}
      </Panel>
      <Panel>
        {addresses.length === 0 ? (
          <EmptyLine text="No saved addresses yet." />
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230] p-4">
                <AddressSummary address={address} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="mini-action" type="button" onClick={() => onEdit(address)}>Edit</button>
                  <button className="mini-action" type="button" onClick={() => onDelete(address.id)}>Delete</button>
                  {!address.isDefault && (
                    <button className="mini-action" type="button" onClick={() => onSetDefault(address.id)}>
                      Set default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#D8CBE8]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6B5F7A] focus:border-[#FF4DB8]/35"
      />
    </label>
  );
}

function AddressSummary({ address }: { address: Address }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-white">{address.label}</p>
        {address.isDefault && (
          <span className="rounded-full border border-[#FF4DB8]/30 bg-[#FF4DB8]/[0.08] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4DB8]">
            Default
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#D8CBE8]">{address.fullName} / {address.phone}</p>
      <p className="text-sm leading-6 text-[#9C91AA]">{address.cityArea} / {address.deliveryZone || "Zone not set"}</p>
      <p className="mt-1 break-words text-sm leading-6 text-[#9C91AA] [overflow-wrap:anywhere]">{address.address}</p>
    </div>
  );
}

function SupportView({ message }: { message: string }) {
  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/22 bg-[#A855F7]/[0.08] text-[#A855F7]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">Support History</h2>
            <p className="mt-2 text-sm leading-7 text-[#9C91AA]">
              {message || "No support conversations yet. Start one anytime from the support page."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link className="action-primary" href="/support">Open support page</Link>
          <Link className="action-muted" href="/track-order">Track an order</Link>
        </div>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/70">Support policies</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "3-Day Hygiene-Safe Support", desc: "Eligible concerns within 3 days of delivery." },
            { label: "Order Linked Only", desc: "Support is linked to your verified order history." },
            { label: "Privacy Safe", desc: "We never share your order details externally." },
            { label: "Bangladesh Only", desc: "Support covers orders delivered within Bangladesh." },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-[#FF4DB8]/10 bg-[#1B1230] p-3">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-[#9C91AA]">{desc}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-[#9C91AA]">{text}</p>;
}
