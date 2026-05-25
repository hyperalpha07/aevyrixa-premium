"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Home, LayoutGrid, LogOut, MapPin, MessageSquare, PackageSearch, ShoppingBag, UserRound } from "lucide-react";
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
  compactMobile?: boolean;
};

export default function SiteHeader({
  active = "shop",
  productHref = "/product",
  settings = defaultStorefrontSettings,
  compactMobile = false,
}: SiteHeaderProps) {
  const { totalItems, toggleCart } = useCart();
  const router = useRouter();
  const [hasAccountSession, setHasAccountSession] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
    "aev-nav-control aev-site-nav-link rounded-full border px-4 py-2 text-[#D8CBE8] transition duration-300 text-sm font-medium";
  const navMuted =
    "border-transparent hover:border-[#FF4DB8]/25 hover:bg-[#211633]/80 hover:text-white";
  const navActive =
    "aev-site-nav-active border-[#FF4DB8]/35 bg-[#211633]/90 text-white font-semibold shadow-[0_0_16px_rgba(255,77,184,0.15)]";
  const accountMenuItems = [
    { href: "/account", label: "Account", icon: UserRound },
    { href: "/account/orders", label: "Orders", icon: PackageSearch },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/support", label: "Support", icon: MessageSquare },
  ] as const;

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    setHasAccountSession(false);
    setAccountName("");
    setIsAccountMenuOpen(false);
    router.replace("/account/login");
  };

  return (
    <>
    <header className="aev-site-header sticky top-0 z-50">
      {active !== "shop" && (
        <div className={compactMobile ? "hidden md:block" : ""}>
          <AnnouncementBanner
            settings={settings}
            surface={
              active === "home"
                ? "homepage"
                : active === "product"
                  ? "product"
                  : active === "cart"
                    ? "checkout"
                    : "other"
            }
          />
        </div>
      )}
      <div className={`aev-site-header-frame px-3 sm:px-5 sm:py-3 md:px-6 md:py-3.5 ${compactMobile ? "py-1.5 md:py-3.5" : "py-2.5"}`}>
        <div className="aev-site-header-shell mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2 sm:px-3 md:flex md:min-h-[4.25rem] md:justify-between md:gap-4 md:px-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="aev-site-logo-mark flex-shrink-0 overflow-hidden rounded-xl border border-[#FF4DB8]/24 bg-[#1B1230] p-1 shadow-[0_0_24px_rgba(255,64,184,0.10)] transition group-hover:border-[#FF4DB8]/40">
            <Image
              src="/logo.jpg"
              alt="Aevyrixa Logo"
              width={42}
              height={42}
              sizes="42px"
              className="h-10 w-10 rounded-lg object-cover"
            />
          </div>

          <div className="min-w-0 max-w-[130px] min-[390px]:max-w-[160px] min-[430px]:max-w-[200px] sm:max-w-none md:max-w-[180px] lg:max-w-none">
            <p className="truncate text-xs font-bold tracking-[0.1em] text-white min-[390px]:tracking-[0.14em] min-[430px]:text-sm min-[430px]:tracking-[0.18em] sm:text-base sm:tracking-[0.22em] lg:text-lg">
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
            className="aev-button-ghost aev-site-icon-button relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#D8CBE8]"
            aria-label={`Open cart — ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="aev-cart-badge absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(255,77,184,0.50)]">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Desktop nav */}
        <div className="aev-desktop-nav hidden items-center gap-1 text-sm md:flex">
          <Link href="/"         className={`${navBase} ${active === "home"    ? navActive : navMuted}`}>Home</Link>
          <Link href="/product"  className={`${navBase} ${active === "shop"    ? navActive : navMuted}`}>Shop</Link>
          <Link href={productHref} className={`${navBase} ${active === "product" ? navActive : navMuted}`}>Product</Link>
          <Link href="/track-order" className={`${navBase} ${active === "track"   ? navActive : navMuted}`}>Track Order</Link>

          {hasAccountSession ? (
            <details
              className="aev-profile-menu group relative"
              open={isAccountMenuOpen}
              onToggle={(event) => setIsAccountMenuOpen(event.currentTarget.open)}
            >
              <summary className={`${navBase} ${active === "account" ? navActive : navMuted} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
                {accountName ? "Profile" : "Account"}
                <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <nav className="aev-profile-menu-panel absolute right-0 top-[calc(100%+0.65rem)] z-50 grid w-56 gap-1.5 rounded-[1.35rem] border border-[#FF4DB8]/18 bg-[#100B1C]/[0.98] p-2 shadow-[0_22px_68px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
                {accountMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="aev-profile-menu-item flex min-h-11 items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-semibold text-[#D8CBE8] transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4DB8]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#FFB3D1]" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={logout}
                  className="aev-profile-menu-item flex min-h-11 items-center gap-3 rounded-2xl border border-rose-200/12 bg-rose-300/[0.045] px-3 py-2.5 text-left text-sm font-semibold text-rose-100/86 transition hover:border-rose-200/24 hover:bg-rose-300/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200/70"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-rose-200/80" />
                  Logout
                </button>
              </nav>
            </details>
          ) : (
            <Link
              href="/account/login"
              className={`${navBase} ${active === "account" ? navActive : navMuted}`}
            >
              Login
            </Link>
          )}

          <button
            onClick={toggleCart}
            className={`${navBase} aev-site-cart-control relative inline-flex items-center gap-2 border-white/10 bg-[#151024]/80 hover:border-[#FF4DB8]/30 hover:bg-[#211633] ${
              active === "cart" ? "border-[#FF4DB8]/30 bg-[#211633]" : ""
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Cart
            {totalItems > 0 && (
              <span className="aev-cart-badge absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(255,77,184,0.50)]">
                {totalItems}
              </span>
            )}
          </button>
        </div>
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
      className={`aev-bottom-nav-item ${active ? "aev-bottom-nav-item-active text-[#FF4DB8]" : "text-[#6B5F7A]"}`}
      aria-current={active ? "page" : undefined}
    >
      <div
        className={`aev-bottom-nav-icon relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
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
