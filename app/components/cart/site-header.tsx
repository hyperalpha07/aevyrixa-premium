"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Home, LayoutGrid, PackageSearch, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/app/components/cart/cart-context";
import AnnouncementBanner from "@/app/components/announcement-banner";
import {
  defaultStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type SiteHeaderProps = {
  active?: "home" | "shop" | "product" | "track" | "cart" | "account";
  productHref?: string;
  settings?: StorefrontSettings;
};

export default function SiteHeader({
  active = "shop",
  productHref = "/product",
  settings = defaultStorefrontSettings,
}: SiteHeaderProps) {
  const { totalItems, toggleCart } = useCart();
  const [hasAccountSession, setHasAccountSession] = useState(false);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    let isActive = true;
    void fetch("/api/account/session", { cache: "no-store" })
      .then(async (response) => {
        if (isActive) setHasAccountSession(response.ok);
        const payload = response.ok
          ? ((await response.json().catch(() => ({}))) as { customer?: { fullName?: string } })
          : {};
        if (isActive) setAccountName(payload.customer?.fullName || "");
      })
      .catch(() => {
        if (isActive) setHasAccountSession(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const navBase =
    "aev-nav-control rounded-full border px-5 py-2.5 text-[#D8CBE8] transition duration-300 text-sm font-medium";
  const navMuted =
    "border-transparent hover:border-[#FF4DB8]/25 hover:bg-[#211633]/80 hover:text-white";
  const navActive =
    "border-[#FF4DB8]/35 bg-[#211633]/90 text-white font-semibold shadow-[0_0_16px_rgba(255,77,184,0.15)]";

  return (
    <>
    <header className="aev-glass-panel sticky top-0 z-50 border-b border-[#FF4DB8]/10 bg-[#080611]/88 backdrop-blur-xl">
      <AnnouncementBanner
        settings={settings}
        surface={
          active === "home"
            ? "homepage"
            : active === "shop"
              ? "shop"
              : active === "product"
                ? "product"
                : active === "cart"
                  ? "checkout"
                  : "other"
        }
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/20 to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 md:flex md:justify-between">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0 overflow-hidden rounded-xl border border-[#FF4DB8]/24 bg-[#1B1230] p-1 shadow-[0_0_24px_rgba(255,64,184,0.10)] transition group-hover:border-[#FF4DB8]/40">
            <Image
              src="/logo.jpg"
              alt="Aevyrixa Logo"
              width={42}
              height={42}
              sizes="42px"
              className="h-10 w-10 rounded-lg object-cover"
            />
          </div>

          <div className="min-w-0 max-w-[130px] min-[390px]:max-w-[160px] min-[430px]:max-w-[200px] sm:max-w-none">
            <p className="truncate text-xs font-bold tracking-[0.1em] text-white min-[390px]:tracking-[0.14em] min-[430px]:text-sm min-[430px]:tracking-[0.18em] sm:text-lg sm:tracking-[0.25em]">
              {settings.brandDisplayName}
            </p>
            <p className="hidden text-[8.5px] uppercase tracking-[0.3em] text-[#FF4DB8]/70 min-[430px]:block sm:text-[9px] sm:tracking-[0.35em]">
              {settings.brandTagline}
            </p>
          </div>
        </Link>

        {/* Mobile: cart button only — primary nav lives in bottom bar */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleCart}
            className="aev-button-ghost relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#D8CBE8]"
            aria-label={`Open cart — ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,77,184,0.50)]">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 text-sm md:flex">
          <Link href="/"         className={`${navBase} ${active === "home"    ? navActive : navMuted}`}>Home</Link>
          <Link href="/product"  className={`${navBase} ${active === "shop"    ? navActive : navMuted}`}>Shop</Link>
          <Link href={productHref} className={`${navBase} ${active === "product" ? navActive : navMuted}`}>Product</Link>
          <Link href="/track-order" className={`${navBase} ${active === "track"   ? navActive : navMuted}`}>Track Order</Link>

          <Link
            href={hasAccountSession ? "/account" : "/account/login"}
            className={`${navBase} ${active === "account" ? navActive : navMuted}`}
          >
            {hasAccountSession ? (
              <span className="inline-flex items-center gap-2">
                {accountName ? "Profile" : "Account"}
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            ) : (
              "Login"
            )}
          </Link>

          <button
            onClick={toggleCart}
            className={`${navBase} relative border-white/10 bg-[#151024]/80 hover:border-[#FF4DB8]/30 hover:bg-[#211633] ${
              active === "cart" ? "border-[#FF4DB8]/30 bg-[#211633]" : ""
            }`}
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,77,184,0.50)]">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>

    {/* ── Mobile Bottom Navigation ── */}
    {active !== "cart" && (
      <nav className="aev-bottom-nav md:hidden" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-1 py-2 pb-3">
          <MobileNavItem href="/" active={active === "home"} icon={Home} label="Home" />
          <MobileNavItem href="/product" active={active === "shop" || active === "product"} icon={LayoutGrid} label="Shop" />
          <MobileNavItem href="/track-order" active={active === "track"} icon={PackageSearch} label="Track" />
          <MobileNavItem
            href={hasAccountSession ? "/account" : "/account/login"}
            active={active === "account"}
            icon={UserRound}
            label={hasAccountSession ? "Account" : "Login"}
          />
        </div>
      </nav>
    )}
    </>
  );
}

function MobileNavItem({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof Home;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`aev-bottom-nav-item ${active ? "text-[#FF4DB8]" : "text-[#6B5F7A]"}`}
    >
      <div
        className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
          active ? "bg-[#FF4DB8]/14" : ""
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
        {active && (
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-[#FF4DB8]/10 blur-sm" />
        )}
      </div>
      <span className={`text-[9.5px] font-semibold tracking-wider ${active ? "text-[#FF4DB8]" : "text-[#6B5F7A]"}`}>
        {label}
      </span>
    </Link>
  );
}
