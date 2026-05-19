"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, PackageSearch, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/app/components/cart/cart-context";
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
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080611]/88 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/20 to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 md:flex md:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0 overflow-hidden rounded-xl border border-[#FF4DB8]/20 bg-[#1B1230] p-1">
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

        {/* Mobile icon row */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <Link
            href={hasAccountSession ? "/account" : "/account/login"}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              active === "account"
                ? "border-[#FF4DB8]/45 bg-[#211633] text-[#FF4DB8] shadow-[0_0_12px_rgba(255,77,184,0.20)]"
                : "border-white/10 bg-[#151024] text-[#9C91AA] hover:border-[#FF4DB8]/30 hover:bg-[#211633] hover:text-[#FFB3D1]"
            }`}
            aria-label={hasAccountSession ? "Account profile" : "Login"}
          >
            <UserRound className="h-4 w-4" />
          </Link>
          <Link
            href="/track-order"
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
              active === "track"
                ? "border-[#00D4C6]/40 bg-[#211633] text-[#00D4C6] shadow-[0_0_12px_rgba(0,212,198,0.15)]"
                : "border-white/10 bg-[#151024] text-[#9C91AA] hover:border-[#00D4C6]/30 hover:bg-[#211633] hover:text-[#31E6D4]"
            }`}
            aria-label="Track Order"
          >
            <PackageSearch className="h-4 w-4" />
            <span className="hidden min-[390px]:inline">Track</span>
          </Link>
          <button
            type="button"
            onClick={toggleCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#151024] text-[#9C91AA] transition hover:border-[#FF4DB8]/30 hover:bg-[#211633] hover:text-[#FFB3D1]"
            aria-label={`Open cart with ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-4 w-4" />
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
  );
}
