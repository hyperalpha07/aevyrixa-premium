"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  LogOut,
  MapPin,
  MessageSquare,
  PackageSearch,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import LiveChatWidget from "@/app/components/live-chat-widget";
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

  const openLiveChat = () => {
    if (typeof window === "undefined") {
      router.push("/support");
      return;
    }

    const openEvent = new CustomEvent("aevyrixa:open-live-chat", { cancelable: true });
    const needsFallback = window.dispatchEvent(openEvent);
    if (needsFallback) router.push("/support");
  };

  const canShowWhatsappSupport =
    settings.storeProfile.liveSupportMode === "whatsapp" ||
    settings.storeProfile.liveSupportMode === "both";
  const canShowLiveChatSupport =
    settings.storeProfile.liveSupportMode === "live_chat" ||
    settings.storeProfile.liveSupportMode === "both";
  const homeMedia = settings.homepageMediaSettings;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,77,184,0.07),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.05),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(0,212,198,0.04),transparent_30%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />
      <SiteHeader settings={settings} active="account" />

      <div className="aev-welcome-banner relative overflow-hidden border-b border-[#FF4DB8]/10 px-4 py-6 sm:px-6 sm:py-9">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF4DB8]/30 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-4 h-52 w-52 rounded-full bg-[#FF4DB8]/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#A855F7]/[0.08] blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-center lg:gap-8">
          <div className="aev-glass-panel min-w-0 overflow-hidden rounded-[1.75rem] border border-[#FF4DB8]/16 p-5 shadow-[0_18px_72px_rgba(0,0,0,0.34)] sm:p-7">
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
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#D8CBE8]/80 sm:text-base">
              Track your next delivery, reach support, and keep saved details ready from one Her Care dashboard.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className="action-primary justify-center" href="/track-order">
                Track order
              </Link>
              <button className="action-muted justify-center" type="button" onClick={openLiveChat}>
                Start live chat
              </button>
            </div>
            {customer && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#D8CBE8]">
                <span className="rounded-full border border-[#00D4C6]/18 bg-[#00D4C6]/[0.07] px-3 py-1.5 text-[#31E6D4]">
                  Member dashboard
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Support ready
                </span>
              </div>
            )}
          </div>
          <div className="aev-panel aev-intent-art aev-intent-promise min-w-0 overflow-hidden rounded-[1.75rem] border border-[#A855F7]/16 bg-[#151024]/80 p-4 shadow-[0_18px_72px_rgba(0,0,0,0.28)] sm:p-5">
            <p className="relative mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#FFB3D1]/72">
              Her Care promise
            </p>
            <div className="grid gap-2 min-[390px]:grid-cols-2 lg:grid-cols-1">
              {["Discreet Packaging", "Bangladesh Delivery", "Premium Comfort", "Secure Checkout"].map((item) => (
                <span
                  key={item}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 text-xs font-semibold text-[#D8CBE8]"
                >
                  {item}
                </span>
              ))}
            </div>
            {customer && (
              <button
                type="button"
                onClick={logout}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#211633]/85 px-4 py-2.5 text-sm font-semibold text-[#D8CBE8] transition hover:border-[#FF4DB8]/32 hover:bg-[#2A183D] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 pb-[calc(var(--aev-mobile-bottom-nav-height)+2rem+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6 sm:pt-7 md:pb-20">
        <AccountMobileMenu view={view} />
        <nav className="mb-5 hidden scroll-px-4 gap-2 overflow-x-auto rounded-[1.35rem] border border-white/[0.08] bg-[#080611]/92 p-2 text-sm shadow-[0_14px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:mb-7 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
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
          <div className={`grid gap-5 ${view === "dashboard" ? "lg:grid-cols-[minmax(0,0.71fr)_minmax(18rem,0.29fr)]" : ""} lg:gap-6`}>
            <section className="min-w-0 lg:order-1">
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
              {view === "support" && <SupportView message={supportMessage} settings={settings} onOpenLiveChat={openLiveChat} />}
            </section>

            {view === "dashboard" && (
            <aside className="space-y-4 lg:order-2 lg:sticky lg:top-24 lg:self-start">
              <Panel className="aev-intent-art aev-intent-account overflow-hidden p-0 sm:p-0">
                <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(255,77,184,0.13),rgba(168,85,247,0.08),rgba(0,212,198,0.04))] p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FF4DB8]/22 bg-[#080611]/45 text-base font-semibold text-[#FFB3D1] shadow-[0_0_28px_rgba(255,77,184,0.14)]">
                    {customer.fullName.trim().charAt(0) || <UserRound className="h-5 w-5" />}
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF4DB8]/72">
                    Profile details
                  </p>
                  <p className="mt-2 break-words text-lg font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                    {customer.fullName}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#D8CBE8]/72">
                    Contact details stay here while orders and support stay first in the dashboard.
                  </p>
                </div>
                <div className="space-y-3 p-5 sm:p-6">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/72">Phone</p>
                    <p className="mt-1 break-words text-sm text-[#D8CBE8] [overflow-wrap:anywhere]">{customer.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/72">Email</p>
                    <p className="mt-1 break-words text-sm text-[#D8CBE8] [overflow-wrap:anywhere]">
                      {customer.email || "Not available"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/12 bg-emerald-300/[0.055] p-3">
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                    <span className="text-xs font-semibold text-emerald-100">Account session active</span>
                  </div>
                </div>
              </Panel>
            </aside>
            )}

          </div>
        )}
      </section>

      <div className="aev-account-footer">
        <SiteFooter settings={settings} />
      </div>
      <LiveChatWidget
        enabled={canShowLiveChatSupport && homeMedia.liveChatEnabled}
        label={homeMedia.liveChatLabel}
        placement={homeMedia.liveChatPlacement}
        whatsappAlsoEnabled={
          canShowWhatsappSupport &&
          homeMedia.whatsappWidgetEnabled &&
          !!settings.whatsappUrl &&
          (homeMedia.whatsappWidgetPlacement === "homepage" || homeMedia.whatsappWidgetPlacement === "all")
        }
        whatsappUrl={settings.whatsappUrl}
        supportPhone={settings.supportPhone}
      />
    </main>
  );
}

const accountDestinations = [
  { view: "dashboard", href: "/account", label: "Account", icon: UserRound },
  { view: "orders", href: "/account/orders", label: "Orders", icon: PackageSearch },
  { view: "addresses", href: "/account/addresses", label: "Addresses", icon: MapPin },
  { view: "support", href: "/account/support", label: "Support", icon: MessageSquare },
] as const;

function AccountMobileMenu({ view }: { view: AccountView }) {
  const current = accountDestinations.find((destination) => destination.view === view) ?? accountDestinations[0];
  const CurrentIcon = current.icon;

  return (
    <details className="group relative z-30 mb-5 md:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-[1.2rem] border border-white/[0.10] bg-[#080611]/94 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#FF4DB8]/22 bg-[#FF4DB8]/[0.09] text-[#FFB3D1]">
            <CurrentIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9C91AA]">Account menu</span>
            <span className="block truncate">{current.label}</span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#FFB3D1] transition group-open:rotate-180" />
      </summary>
      <nav className="absolute inset-x-0 top-[calc(100%+0.55rem)] grid gap-1.5 rounded-[1.3rem] border border-[#FF4DB8]/18 bg-[#100B1C]/[0.98] p-2 shadow-[0_22px_68px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
        {accountDestinations.map(({ href, icon: Icon, label, view: destinationView }) => (
          <Link
            key={href}
            href={href}
            aria-current={destinationView === view ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
              destinationView === view
                ? "border-[#FF4DB8]/35 bg-[#FF4DB8]/[0.13] text-white"
                : "border-transparent text-[#D8CBE8] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 text-[#FFB3D1]" />
            {label}
          </Link>
        ))}
      </nav>
    </details>
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
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
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
    <div className={`aev-panel min-w-0 rounded-[1.5rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 shadow-[0_16px_56px_rgba(0,0,0,0.28)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Dashboard({
  orders,
  allOrders,
  address,
  addressCount,
}: {
  orders: AccountOrder[];
  allOrders: AccountOrder[];
  address?: Address;
  addressCount: number;
}) {
  const pendingOrders = allOrders.filter((order) => normalizeStatus(order.status).includes("pending")).length;
  const deliveredOrders = allOrders.filter(
    (order) => normalizeStatus(order.status).includes("deliver") || normalizeStatus(order.deliveryStatus).includes("deliver")
  ).length;

  return (
    <div className="grid gap-4 sm:gap-5">
      <Panel className="aev-intent-art aev-intent-pulse overflow-hidden">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#FF4DB8]/72">Account pulse</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Your Her Care overview</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#9C91AA]">
            Real order and address activity from this customer account.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric icon={PackageSearch} label="Total orders" value={String(allOrders.length)} accent="pink" />
          <Metric icon={Clock3} label="Pending" value={String(pendingOrders)} accent="amber" />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders)} accent="green" />
          <Metric icon={MapPin} label="Addresses" value={String(addressCount)} accent="cyan" />
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.8fr)] xl:gap-5">
        <Panel className="aev-intent-art aev-intent-orders overflow-hidden">
          <SectionTitle title="Recent Orders" href="/account/orders" />
          <OrderRows orders={orders} />
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Panel className="aev-intent-art aev-intent-address overflow-hidden">
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
          <Panel className="aev-intent-art aev-intent-promise hidden overflow-hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/72">Her Care promise</p>
            <h2 className="mt-3 text-lg font-semibold text-white">Support stays purposeful.</h2>
            <p className="mt-2 text-sm leading-7 text-white/62">
              Use the Support tab for live help, WhatsApp, support policy details, and order tracking when a concern needs attention.
            </p>
          </Panel>
        </div>
      </div>
    </div>
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
    <div className="aev-card aev-metric-card relative min-h-[8.25rem] rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230] p-4">
      <div className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full bg-[#FF4DB8]/[0.06] blur-xl" />
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${accents[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/70">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SupportHub({ settings, onOpenLiveChat }: { settings: StorefrontSettings; onOpenLiveChat: () => void }) {
  return (
    <Panel className="aev-intent-art aev-intent-support relative overflow-hidden border-[#00D4C6]/14">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#00D4C6]/[0.07] blur-3xl" />
      <SupportAgentVisual imageUrl={settings.storeProfile.supportAgentImageUrl} />
      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#00D4C6]/24 bg-[#00D4C6]/[0.08] text-[#31E6D4]">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#31E6D4]/76">Support Hub</p>
              <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Need help with an order?</h2>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-[1.15rem] border border-white/[0.08] bg-[#0B0F1A]/65 p-4 text-sm leading-6 text-[#D8CBE8]/82">
            <p>For order, delivery, size, wrong item, or damaged item concerns, contact support with your order reference.</p>
            <p className="flex gap-2 text-[#FFB3D1]">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0" />
              <span>3-Day Hygiene-Safe Support is available for eligible concerns after delivery.</span>
            </p>
          </div>
        </div>
        <div className="grid gap-3 min-[430px]:grid-cols-2">
          <SupportAction
            icon={MessageSquare}
            label="Start live chat"
            helper="Open Aevyrixa Support here."
            accent="pink"
            onClick={onOpenLiveChat}
          />
          {settings.whatsappUrl ? (
            <SupportAction
              href={settings.whatsappUrl}
              icon={Headphones}
              label="WhatsApp support"
              helper={settings.supportWhatsApp || "Open the current WhatsApp support link."}
              accent="cyan"
              external
            />
          ) : (
            <SupportAction
              href="/support"
              icon={Headphones}
              label="WhatsApp support"
              helper="Open current support contact details."
              accent="cyan"
            />
          )}
          <SupportAction
            href="/support"
            icon={ShieldCheck}
            label="Support page"
            helper="Review support policy details."
            accent="amber"
          />
          <SupportAction
            href="/track-order"
            icon={PackageSearch}
            label="Track order"
            helper="Use your order reference and phone."
            accent="violet"
          />
        </div>
      </div>
    </Panel>
  );
}

function SupportAgentVisual({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="aev-support-agent-art" aria-hidden="true">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
        />
      ) : (
        <div className="aev-support-agent-fallback" />
      )}
    </div>
  );
}

function SupportAction({
  href,
  icon: Icon,
  label,
  helper,
  accent,
  external = false,
  onClick,
}: {
  href?: string;
  icon: typeof UserRound;
  label: string;
  helper: string;
  accent: "pink" | "cyan" | "violet" | "amber";
  external?: boolean;
  onClick?: () => void;
}) {
  const accents = {
    pink: "border-[#FF4DB8]/22 bg-[#FF4DB8]/[0.08] text-[#FF4DB8]",
    cyan: "border-[#00D4C6]/22 bg-[#00D4C6]/[0.08] text-[#31E6D4]",
    violet: "border-[#A855F7]/22 bg-[#A855F7]/[0.08] text-[#C9A7FF]",
    amber: "border-[#FFB84D]/22 bg-[#FFB84D]/[0.08] text-[#FFD18A]",
  };
  const content = (
    <>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accents[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3 text-sm font-semibold text-white">
          <span className="break-words [overflow-wrap:anywhere]">{label}</span>
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9C91AA] transition group-hover:translate-x-0.5 group-hover:text-white" />
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#9C91AA]">{helper}</span>
      </span>
    </>
  );
  const className =
    "group flex min-h-[6.5rem] min-w-0 items-start gap-3 rounded-[1.15rem] border border-white/[0.08] bg-[#1B1230]/92 p-4 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#211633]";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left`}>
        {content}
      </button>
    );
  }

  if (!href) return null;

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function SectionTitle({ title, href, label = "View" }: { title: string; href: string; label?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-[#FF4DB8] hover:text-[#FFB3D1]">
        {label}
      </Link>
    </div>
  );
}

function OrdersView({ orders }: { orders: AccountOrder[] }) {
  return (
    <div className="grid gap-5">
      <Panel className="aev-intent-art aev-intent-orders">
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
          className="group relative grid gap-4 overflow-hidden rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230]/95 p-4 transition hover:border-[#FF4DB8]/28 hover:bg-[#211633]/90 sm:p-4 md:grid-cols-[minmax(0,1fr)_auto]"
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
          <div className="flex flex-col gap-2 md:min-w-[10.5rem] md:items-end">
            <div className="w-full rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9C91AA]/70">Total</p>
              <p className="mt-1 text-sm font-semibold text-[#FFB3D1]">{formatCurrency(order.total)}</p>
            </div>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(order.orderRef)}
                className="min-h-10 w-full rounded-full border border-[#FF4DB8]/25 bg-[#211633] px-4 py-2 text-sm font-semibold text-[#D8CBE8] transition hover:border-[#FF4DB8]/45 hover:text-white md:w-auto"
              >
                View details
              </button>
            ) : (
              <Link className="mini-action min-h-10 w-full justify-center text-center md:w-auto" href={orderDetailHref(order.orderRef)}>
                View details
              </Link>
            )}
            <div className="flex w-full flex-col gap-2 min-[390px]:flex-row md:justify-end">
              {order.customerPhone && (
                <Link className="mini-action min-h-10 flex-1 justify-center text-center md:flex-none" href={trackOrderHref(order)}>
                  Track order
                </Link>
              )}
              {detailed && (
                <Link className="mini-action min-h-10 flex-1 justify-center text-center md:flex-none" href="/account/support">
                  Get support
                </Link>
              )}
            </div>
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

function SupportView({ message, settings, onOpenLiveChat }: { message: string; settings: StorefrontSettings; onOpenLiveChat: () => void }) {
  return (
    <div className="grid gap-5">
      <SupportHub settings={settings} onOpenLiveChat={onOpenLiveChat} />
      <Panel>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/22 bg-[#A855F7]/[0.08] text-[#A855F7]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">Support History</h2>
            <p className="mt-2 text-sm leading-7 text-[#9C91AA]">
              {message || "Live chat conversations are currently token-based and not safely linked to customer accounts yet."}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-[#9C91AA]">{text}</p>;
}
