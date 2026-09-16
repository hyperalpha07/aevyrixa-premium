"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Heart,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingBag,
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
import {
  readWishlistItems,
  WISHLIST_UPDATED_EVENT,
  writeWishlistItems,
  type WishlistItem,
} from "@/app/lib/wishlist-storage";

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
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
    const syncWishlist = () => setWishlistItems(readWishlistItems());
    syncWishlist();
    window.addEventListener("storage", syncWishlist);
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    return () => {
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
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

  const removeWishlistItem = (item: WishlistItem) => {
    const next = wishlistItems.filter(
      (wishlistItem) => wishlistItem.productId !== item.productId && wishlistItem.slug !== item.slug
    );
    setWishlistItems(next);
    writeWishlistItems(next);
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
    <main className={`aev-account-page-background aev-account-dashboard-page min-h-screen overflow-x-hidden text-white ${view === "orders" ? "aev-account-orders-page" : ""} ${view === "addresses" ? "aev-account-addresses-page" : ""} ${view === "support" ? "aev-account-support-page" : ""}`}>
      <SiteHeader settings={settings} active="account" compactMobile />

      <section className="aev-account-shell mx-auto w-full max-w-7xl px-4 pb-[calc(var(--aev-mobile-bottom-nav-height)+2.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pt-6 md:pb-20 md:pt-8">
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
          <div className="grid gap-5 lg:gap-6">
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
                  addressCount={addresses.length}
                  customer={customer}
                  settings={settings}
                  wishlistItems={wishlistItems}
                  onRemoveWishlistItem={removeWishlistItem}
                  onLogout={logout}
                  onOpenLiveChat={openLiveChat}
                />
              )}
              {view === "orders" && (
                <OrdersView
                  orders={orders}
                  customer={customer}
                  onLogout={logout}
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
                  customer={customer}
                  onLogout={logout}
                />
              )}
              {view === "support" && (
                <SupportView
                  message={supportMessage}
                  settings={settings}
                  customer={customer}
                  onLogout={logout}
                  onOpenLiveChat={openLiveChat}
                />
              )}
            </section>

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
        hideLauncherOnMobile
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

function AccountMobileMenu({
  view,
  hero = false,
  onLogout,
}: {
  view: AccountView;
  hero?: boolean;
  onLogout?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = accountDestinations.find((destination) => destination.view === view) ?? accountDestinations[0];
  const CurrentIcon = current.icon;
  const heroActions = [
    { href: "/track-order", label: "Track Order", icon: PackageSearch },
    { view: "orders", href: "/account/orders", label: "View Orders", icon: PackageSearch },
    { view: "addresses", href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
    { view: "support", href: "/account/support", label: "Support", icon: MessageSquare },
  ] as const;

  return (
    <details
      className={`group relative z-30 md:hidden ${hero ? "" : "mb-5"}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 border border-white/[0.10] bg-[#080611]/94 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4DB8] [&::-webkit-details-marker]:hidden ${
        hero ? "h-10 w-10 rounded-full p-0" : "min-h-12 rounded-[1.2rem] px-4 py-3"
      }`}>
        {hero ? (
          <>
            <span className="sr-only">Open account menu</span>
            <MoreHorizontal className="mx-auto h-4 w-4 text-[#FFB3D1]" />
          </>
        ) : (
          <>
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
          </>
        )}
      </summary>
      <nav className={`absolute top-[calc(100%+0.55rem)] grid gap-1.5 rounded-[1.3rem] border border-[#FF4DB8]/18 bg-[#100B1C]/[0.98] p-2 shadow-[0_22px_68px_rgba(0,0,0,0.58)] backdrop-blur-2xl ${
        hero ? "right-0 w-56" : "inset-x-0"
      }`}>
        {(hero ? heroActions : accountDestinations).map((action) => {
          const Icon = action.icon;
          const destinationView = "view" in action ? action.view : undefined;

          return (
            <Link
              key={action.href}
              href={action.href}
              aria-current={destinationView === view ? "page" : undefined}
              onClick={() => setIsOpen(false)}
              className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4DB8] ${
                destinationView === view
                  ? "border-[#FF4DB8]/35 bg-[#FF4DB8]/[0.13] text-white"
                  : "border-transparent text-[#D8CBE8] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-[#FFB3D1]" />
              {action.label}
            </Link>
          );
        })}
        {hero && onLogout && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex min-h-11 items-center gap-3 rounded-2xl border border-rose-200/12 bg-rose-300/[0.045] px-3 py-2.5 text-left text-sm font-semibold text-rose-100/86 transition hover:border-rose-200/24 hover:bg-rose-300/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200/70"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-200/80" />
            Logout
          </button>
        )}
      </nav>
    </details>
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
  addressCount,
  customer,
  settings,
  wishlistItems,
  onRemoveWishlistItem,
  onLogout,
  onOpenLiveChat,
}: {
  orders: AccountOrder[];
  allOrders: AccountOrder[];
  addressCount: number;
  customer: Customer;
  settings: StorefrontSettings;
  wishlistItems: WishlistItem[];
  onRemoveWishlistItem: (item: WishlistItem) => void;
  onLogout: () => void;
  onOpenLiveChat: () => void;
}) {
  const pendingOrders = allOrders.filter((order) => normalizeStatus(order.status).includes("pending")).length;
  const deliveredOrders = allOrders.filter(
    (order) => normalizeStatus(order.status).includes("deliver") || normalizeStatus(order.deliveryStatus).includes("deliver")
  ).length;

  return (
    <div className="aev-account-dashboard-workspace">
      <DashboardSidebar customer={customer} activeView="dashboard" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 break-words text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-4xl">
              Hello, {customer.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Manage your orders, saved addresses, and support in one calm, private place.
            </p>
          </div>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="dashboard" hero onLogout={onLogout} />
          </div>
        </section>

        <section className="aev-account-dashboard-stats" aria-label="Account overview">
          <Metric icon={PackageSearch} label="Total Orders" value={String(allOrders.length)} accent="pink" />
          <Metric icon={Clock3} label="Pending Orders" value={String(pendingOrders)} accent="amber" />
          <Metric icon={CheckCircle2} label="Delivered Orders" value={String(deliveredOrders)} accent="green" />
          <Metric icon={MapPin} label="Saved Addresses" value={String(addressCount)} accent="cyan" />
        </section>

        <section className="aev-account-care-banner">
          <div className="relative z-10 max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              The Noromi Care promise
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Comfort. Confidence. Care.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#F2E8F5]/82">
              Thoughtful period care, discreet delivery, and support from a team that listens.
            </p>
            <Link className="aev-account-care-cta" href="/product">
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="aev-account-dashboard-content-grid">
          <Panel className="aev-account-dashboard-orders overflow-hidden">
            <SectionTitle title="Recent Orders" href="/account/orders" label="View all" />
            <OrderRows orders={orders} />
          </Panel>

          <div className="aev-account-dashboard-side-stack">
            <Panel className="aev-account-dashboard-utilities">
              <DashboardQuickActions />
              <DashboardHelp settings={settings} onOpenLiveChat={onOpenLiveChat} />
            </Panel>
            <WishlistPanel items={wishlistItems} onRemove={onRemoveWishlistItem} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSidebar({
  customer,
  activeView,
  onLogout,
}: {
  customer: Customer;
  activeView: AccountView;
  onLogout: () => void;
}) {
  const items = [
    { href: "/account", label: "Dashboard", icon: LayoutDashboard, active: activeView === "dashboard" },
    { href: "/account/orders", label: "My Orders", icon: PackageSearch, active: activeView === "orders" },
    { href: "/account/addresses", label: "My Addresses", icon: MapPin, active: activeView === "addresses" },
    { href: "/account/support", label: "Support Requests", icon: MessageSquare, active: activeView === "support" },
  ];

  return (
    <aside className="aev-account-dashboard-sidebar">
      <div className="relative z-10">
        <div className="aev-account-dashboard-avatar">
          {customer.fullName.trim().charAt(0) || <UserRound className="h-6 w-6" />}
        </div>
        <p className="mt-4 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
          {customer.fullName}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.23em] text-[#FFB3D1]/72">
          Noromi Care Account
        </p>
        <p className="mt-3 break-all text-xs leading-5 text-[#D8CBE8]/65">
          {customer.phone}
        </p>
      </div>

      <nav className="relative z-10 mt-8 grid gap-2" aria-label="Account dashboard">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`aev-account-dashboard-nav-item ${item.active ? "is-active" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="aev-account-dashboard-nav-item aev-account-dashboard-logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </nav>

      <div className="aev-account-dashboard-sidebar-note">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#31E6D4]" />
        <p>Private account access for your Noromi Care orders and support.</p>
      </div>
    </aside>
  );
}

function DashboardQuickActions() {
  const actions = [
    { href: "/track-order", label: "Track an Order", icon: PackageSearch, accent: "cyan" },
    { href: "/account/addresses", label: "Manage Addresses", icon: MapPin, accent: "pink" },
    { href: "/account/support", label: "Support Requests", icon: MessageSquare, accent: "violet" },
    { href: "/product", label: "Continue Shopping", icon: ShoppingBag, accent: "amber" },
  ] as const;

  return (
    <section className="aev-account-dashboard-quick-panel">
      <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`aev-account-dashboard-quick-action is-${action.accent}`}
            >
              <span className="aev-account-dashboard-quick-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span>{action.label}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-55" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DashboardHelp({
  settings,
  onOpenLiveChat,
}: {
  settings: StorefrontSettings;
  onOpenLiveChat: () => void;
}) {
  return (
    <section className="aev-account-dashboard-help">
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#31E6D4]/76">
          Customer care
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Need help?</h2>
        <p className="mt-2 text-sm leading-6 text-[#E8DDF0]/74">
          Our support team can guide you with orders, delivery, sizing, or product concerns.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenLiveChat} className="mini-action">
            Live Chat
          </button>
          {settings.whatsappUrl && (
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mini-action"
            >
              WhatsApp
            </a>
          )}
          <Link href="/support" className="mini-action">
            Support Center
          </Link>
        </div>
      </div>
    </section>
  );
}

function WishlistPanel({
  items,
  onRemove,
}: {
  items: WishlistItem[];
  onRemove: (item: WishlistItem) => void;
}) {
  return (
    <Panel className="aev-intent-art overflow-hidden">
      <SectionTitle title="Favorites" href="/product" />
      {items.length === 0 ? (
        <EmptyLine text="No favorites saved yet." />
      ) : (
        <div className="space-y-3">
          {items.slice(0, 4).map((item) => (
            <div key={`${item.productId}-${item.slug}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230] p-3">
              <Link href={`/product/${item.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#FF4DB8]/18 bg-[#080611]/70 text-[#FFB3D1]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{item.name}</span>
                  <span className="mt-1 block truncate text-xs text-[#9C91AA]">
                    {formatCurrency(item.price)}
                    {item.variant ? ` / ${item.variant}` : ""}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="mini-action shrink-0"
                aria-label={`Remove ${item.name} from favorites`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
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
    <div className="aev-card aev-metric-card relative min-h-[6.8rem] rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230]/88 p-3.5 sm:min-h-[7.5rem] sm:p-4">
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
            helper="Open Noromi Care Support here."
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

function OrdersView({
  orders,
  customer,
  onLogout,
}: {
  orders: AccountOrder[];
  customer: Customer;
  onLogout: () => void;
}) {
  const isPending = (order: AccountOrder) => normalizeStatus(order.status).includes("pending");
  const isDelivered = (order: AccountOrder) =>
    normalizeStatus(order.status).includes("deliver") ||
    normalizeStatus(order.deliveryStatus).includes("deliver");
  const pendingOrders = orders.filter(isPending).length;
  const deliveredOrders = orders.filter(isDelivered).length;
  const cancelledOrOtherOrders = orders.filter(
    (order) => !isPending(order) && !isDelivered(order)
  ).length;

  return (
    <div className="aev-account-dashboard-workspace aev-account-orders-workspace">
      <DashboardSidebar customer={customer} activeView="orders" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-orders-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Review your Noromi Care orders, delivery progress, and available support actions.
            </p>
          </div>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="orders" hero onLogout={onLogout} />
          </div>
        </section>

        <section className="aev-account-dashboard-stats aev-account-orders-overview" aria-label="Order overview">
          <Metric icon={PackageSearch} label="Total Orders" value={String(orders.length)} accent="pink" />
          <Metric icon={Clock3} label="Pending" value={String(pendingOrders)} accent="amber" />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders)} accent="green" />
          <Metric icon={MoreHorizontal} label="Cancelled / Other" value={String(cancelledOrOtherOrders)} accent="violet" />
        </section>

        <Panel className="aev-account-orders-list-panel">
          <div className="aev-account-orders-list-heading">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FFB3D1]/72">
                Order history
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">Your orders</h2>
            </div>
            <Link href="/track-order" className="mini-action min-h-10 justify-center">
              <PackageSearch className="h-4 w-4" />
              Track an order
            </Link>
          </div>
          <div className="mt-5">
            <OrderRows orders={orders} detailed />
          </div>
        </Panel>
      </div>
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
  if (orders.length === 0) {
    if (!detailed) return <EmptyLine text="No orders found for this account phone yet." />;

    return (
      <div className="aev-account-orders-empty">
        <span className="aev-account-orders-empty-icon">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <h3>No orders yet</h3>
        <p>Your Noromi Care orders will appear here after they are placed.</p>
        <Link href="/product" className="aev-account-care-cta">
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (!detailed) {
    return (
      <div className="space-y-2.5">
        {orders.map((order) => (
          <div
            key={order.orderRef}
            className="group relative grid min-w-0 gap-3 overflow-hidden rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230]/88 p-3.5 transition hover:border-[#FF4DB8]/28 hover:bg-[#211633]/90 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4"
          >
            <div className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 rounded-full bg-[#FF4DB8]/[0.06] blur-2xl" />
            <div className="relative min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
                  {order.items[0]?.name || order.orderRef}
                </p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusChipClass(order.status)}`}>
                  {readable(order.status)}
                </span>
              </div>
              <p className="mt-1 break-words text-xs text-[#9C91AA] [overflow-wrap:anywhere]">
                {order.orderRef} / {formatDate(order.createdAt)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#FFB3D1]">{formatCurrency(order.total)}</p>
            </div>
            <div className="relative flex flex-wrap gap-2 sm:justify-end">
              <Link className="mini-action min-h-9 flex-1 justify-center text-center sm:flex-none" href={orderDetailHref(order.orderRef)}>
                View details
              </Link>
              {order.customerPhone && (
                <Link className="mini-action min-h-9 flex-1 justify-center text-center sm:flex-none" href={trackOrderHref(order)}>
                  Track order
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="aev-account-order-list">
      {orders.map((order, index) => {
        const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
        const deliveryArea = order.deliveryArea || order.cityArea || order.deliveryZone;

        return (
          <article
            key={order.orderRef}
            className={`aev-account-order-card is-variant-${(index % 3) + 1}`}
          >
            <div className="aev-account-order-card-content">
              <div className="aev-account-order-card-primary">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
                    {order.orderRef}
                  </p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusChipClass(order.status)}`}>
                    {readable(order.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#C6B6D2]/68">Placed {formatDate(order.createdAt)}</p>

                <div className="aev-account-order-meta-grid">
                  <OrderMeta label="Items" value={`${itemCount} ${itemCount === 1 ? "item" : "items"}`} />
                  <OrderMeta label="Payment" value={readable(order.paymentMethod)} />
                  {deliveryArea && <OrderMeta label="Delivery area" value={deliveryArea} />}
                  {order.deliveryStatus && <OrderMeta label="Delivery" value={readable(order.deliveryStatus)} />}
                </div>

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

              <div className="aev-account-order-card-actions">
                <div className="aev-account-order-total">
                  <p>Total</p>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(order.orderRef)}
                    className="mini-action min-h-10 w-full justify-center"
                  >
                    View details
                  </button>
                ) : (
                  <Link className="mini-action min-h-10 w-full justify-center text-center" href={orderDetailHref(order.orderRef)}>
                    View details
                  </Link>
                )}
                <div className="aev-account-order-secondary-actions">
                  {order.customerPhone && (
                    <Link className="mini-action min-h-10 flex-1 justify-center text-center" href={trackOrderHref(order)}>
                      Track order
                    </Link>
                  )}
                  <Link className="mini-action min-h-10 flex-1 justify-center text-center" href="/account/support">
                    Get support
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9C91AA]/64">{label}</p>
      <p className="mt-1 break-words text-xs font-medium capitalize text-[#E9DEEF]/82 [overflow-wrap:anywhere]">
        {value}
      </p>
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
  customer,
  onLogout,
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
  customer: Customer;
  onLogout: () => void;
}) {
  return (
    <div className="aev-account-dashboard-workspace aev-account-addresses-workspace">
      <DashboardSidebar customer={customer} activeView="addresses" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-addresses-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">My Addresses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Keep your delivery details accurate for a smooth and discreet Noromi Care order experience.
            </p>
          </div>
          <button type="button" onClick={onOpen} className="aev-account-addresses-add">
            <Plus className="h-4 w-4" />
            Add Address
          </button>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="addresses" hero onLogout={onLogout} />
          </div>
        </section>

        <Panel className="aev-account-addresses-panel">
          {isOpen && (
            <form onSubmit={onSave} className="aev-account-address-form">
              <div className="aev-account-address-form-heading">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#31E6D4]/72">
                    Delivery details
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold text-white">
                    {draft.id ? "Edit address" : "Add an address"}
                  </h2>
                </div>
                <button className="mini-action" type="button" onClick={onCancel}>Cancel</button>
              </div>
              <div className="aev-account-address-form-grid">
                <Input label="Label" value={draft.label} onChange={(value) => setDraft({ ...draft, label: value })} />
                <Input label="Full name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
                <Input label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
                <Input label="City / area" value={draft.cityArea} onChange={(value) => setDraft({ ...draft, cityArea: value })} />
                <label className="aev-account-address-field sm:col-span-2">
                  <span>Full address</span>
                  <textarea
                    value={draft.address}
                    rows={3}
                    onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                  />
                </label>
                <label className="aev-account-address-field">
                  <span>Delivery zone</span>
                  <select
                    value={draft.deliveryZone}
                    onChange={(event) => setDraft({ ...draft, deliveryZone: event.target.value })}
                  >
                    <option>Inside Dhaka</option>
                    <option>Outside Dhaka</option>
                  </select>
                </label>
                <label className="aev-account-address-default-toggle">
                  <input
                    type="checkbox"
                    checked={draft.isDefault}
                    onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                  />
                  <span>Set as default</span>
                </label>
              </div>
              <button className="action-primary mt-5" type="submit">Save address</button>
            </form>
          )}

          <div className={isOpen ? "aev-account-address-list has-form" : "aev-account-address-list"}>
            {addresses.length === 0 ? (
              <div className="aev-account-addresses-empty">
                <span><MapPin className="h-6 w-6" /></span>
                <h2>No saved addresses yet</h2>
                <p>Add a delivery address to make future Noromi Care orders quicker and easier.</p>
                {!isOpen && (
                  <button type="button" onClick={onOpen} className="aev-account-care-cta">
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="aev-account-address-list-heading">
                  <h2>Saved addresses</h2>
                  <span>{addresses.length} {addresses.length === 1 ? "address" : "addresses"}</span>
                </div>
                {addresses.map((address) => (
                  <article key={address.id} className="aev-account-address-row">
                    <AddressSummary address={address} />
                    <div className="aev-account-address-actions">
                      <button className="mini-action" type="button" onClick={() => onEdit(address)}>Edit</button>
                      <button className="mini-action" type="button" onClick={() => onDelete(address.id)}>Delete</button>
                      {!address.isDefault && (
                        <button className="mini-action" type="button" onClick={() => onSetDefault(address.id)}>
                          Set default
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </Panel>
      </div>
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

function SupportView({
  message,
  settings,
  customer,
  onLogout,
  onOpenLiveChat,
}: {
  message: string;
  settings: StorefrontSettings;
  customer: Customer;
  onLogout: () => void;
  onOpenLiveChat: () => void;
}) {
  const supportActions: Array<{
    label: string;
    helper: string;
    icon: typeof MessageSquare;
    onClick?: () => void;
    href?: string;
    external?: boolean;
  }> = [
    { label: "Live Chat", helper: "Chat with Noromi Care support.", icon: MessageSquare, onClick: onOpenLiveChat },
    {
      label: "WhatsApp",
      helper: settings.supportWhatsApp || "Open the current support contact details.",
      icon: Headphones,
      href: settings.whatsappUrl || "/support",
      external: Boolean(settings.whatsappUrl),
    },
    { label: "Support Center", helper: "Review support and care guidance.", icon: ShieldCheck, href: "/support" },
    { label: "Track Order", helper: "Check the latest delivery progress.", icon: PackageSearch, href: "/track-order" },
  ];

  return (
    <div className="aev-account-dashboard-workspace aev-account-support-workspace">
      <DashboardSidebar customer={customer} activeView="support" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-support-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">Support Requests</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Get private, thoughtful help with your orders, delivery, sizing, or product concerns.
            </p>
          </div>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="support" hero onLogout={onLogout} />
          </div>
        </section>

        <div className="aev-account-support-layout">
          <Panel className="aev-account-support-history">
            <div className="aev-account-support-heading">
              <span><MessageSquare className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#FFB3D1]/72">Account support</p>
                <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">Support history</h2>
              </div>
            </div>
            <div className="aev-account-support-message">
              <p>{message || "Live chat conversations are currently token-based and not safely linked to customer accounts yet."}</p>
            </div>
            <div className="aev-account-support-reassurance">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <p>Share your order reference when contacting support so the team can help efficiently.</p>
            </div>
          </Panel>

          <Panel className="aev-account-support-utilities">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#31E6D4]/72">Support tools</p>
            <h2 className="mt-1.5 text-xl font-semibold text-white">How can we help?</h2>
            <div className="aev-account-support-action-list">
              {supportActions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <>
                    <span><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <strong>{action.label}</strong>
                      <small>{action.helper}</small>
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-55" />
                  </>
                );
                const className = "aev-account-support-action";

                if (action.onClick) {
                  return <button key={action.label} type="button" onClick={action.onClick} className={className}>{content}</button>;
                }
                if (action.external) {
                  return <a key={action.label} href={action.href} target="_blank" rel="noreferrer" className={className}>{content}</a>;
                }
                return <Link key={action.label} href={action.href || "/support"} className={className}>{content}</Link>;
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-[#9C91AA]">{text}</p>;
}
