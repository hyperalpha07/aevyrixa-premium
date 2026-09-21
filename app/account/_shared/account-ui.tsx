"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Clock3, LayoutDashboard, LogOut, MapPin, MessageSquare, MoreHorizontal, PackageSearch, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { accountStatusChipClass as statusChipClass, formatAccountDate as formatDate, readableAccountValue as readable } from "@/app/account/_shared/account-format";
import type { AccountOrder, Customer } from "@/app/account/_shared/account-types";

export type AccountView = "dashboard" | "orders" | "addresses" | "support";

const accountDestinations = [
  { view: "dashboard", href: "/account", label: "Account", icon: UserRound },
  { view: "orders", href: "/account/orders", label: "Orders", icon: PackageSearch },
  { view: "addresses", href: "/account/addresses", label: "Addresses", icon: MapPin },
  { view: "support", href: "/account/support", label: "Support", icon: MessageSquare },
] as const;

export function AccountMobileMenu({
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

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`aev-panel min-w-0 rounded-[1.5rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 shadow-[0_16px_56px_rgba(0,0,0,0.28)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}


export function DashboardSidebar({
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


export function Metric({
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

