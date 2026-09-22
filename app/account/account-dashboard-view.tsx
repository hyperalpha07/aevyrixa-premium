"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Heart, Headphones, MapPin, MessageSquare, PackageSearch, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { normalizeAccountStatus as normalizeStatus } from "@/app/account/_shared/account-format";
import { AccountMobileMenu, DashboardSidebar, Metric, Panel } from "@/app/account/_shared/account-ui";
import { RecentOrderRows } from "@/app/account/account-recent-orders";
import { formatCurrency } from "@/app/lib/currency";
import type { AccountOrder, Customer } from "@/app/account/_shared/account-types";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";
import type { WishlistItem } from "@/app/lib/wishlist-storage";

export default function Dashboard({
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
    <div className="aev-account-dashboard-workspace aev-account-dashboard-home">
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

        <section className="aev-account-dashboard-stats aev-account-dashboard-stats-desktop" aria-label="Account overview">
          <DashboardMetric icon={PackageSearch} label="Total Orders" value={allOrders.length} href="/account/orders" accent="pink" />
          <DashboardMetric icon={Clock3} label="Pending Orders" value={pendingOrders} href="/account/orders" accent="amber" />
          <DashboardMetric icon={CheckCircle2} label="Delivered Orders" value={deliveredOrders} href="/account/orders" accent="green" />
          <DashboardMetric icon={MapPin} label="Saved Addresses" value={addressCount} href="/account/addresses" accent="cyan" />
        </section>
        <section className="aev-account-dashboard-stats aev-account-dashboard-stats-mobile" aria-label="Account overview">
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
            <RecentOrderRows orders={orders} />
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

function DashboardMetric({ icon: Icon, label, value, href, accent }: {
  icon: typeof PackageSearch;
  label: string;
  value: number;
  href: string;
  accent: "pink" | "amber" | "green" | "cyan";
}) {
  return <Link href={href} className={`aev-account-dashboard-metric is-${accent}`} aria-label={`${label}: ${value}. View ${href === "/account/addresses" ? "addresses" : "orders"}`}>
    <span className="aev-account-dashboard-metric-icon"><Icon size={18} aria-hidden="true" /></span>
    <span className="aev-account-dashboard-metric-copy"><span>{label}</span><strong>{value}</strong></span>
    <ArrowRight className="aev-account-dashboard-metric-arrow" size={15} aria-hidden="true" />
  </Link>;
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

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-[#9C91AA]">{text}</p>;
}

