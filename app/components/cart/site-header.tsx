"use client";

import Image from "next/image";
import Link from "next/link";
import { PackageSearch, ShoppingBag } from "lucide-react";
import { useCart } from "@/app/components/cart/cart-context";
import {
  defaultStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type SiteHeaderProps = {
  active?: "home" | "shop" | "product" | "track" | "cart";
  productHref?: string;
  settings?: StorefrontSettings;
};

export default function SiteHeader({
  active = "shop",
  productHref = "/product",
  settings = defaultStorefrontSettings,
}: SiteHeaderProps) {
  const { totalItems, toggleCart } = useCart();

  const navBase =
    "aev-nav-control rounded-full border px-5 py-2.5 text-white transition duration-300";
  const navMuted =
    "border-transparent text-white/80 hover:border-fuchsia-400/35 hover:bg-white/5 hover:text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.14)]";
  const navActive =
    "border-fuchsia-400/35 bg-white/5 text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.14)]";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 md:flex md:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1">
            <Image
              src="/logo.jpg"
              alt="Aevyrixa Logo"
              width={42}
              height={42}
              sizes="42px"
              className="h-10 w-10 rounded-lg object-cover"
            />
          </div>

          <div className="min-w-0 max-w-[136px] min-[390px]:max-w-[168px] min-[430px]:max-w-[210px] sm:max-w-none">
            <p className="truncate text-xs font-bold tracking-[0.1em] text-white min-[390px]:tracking-[0.14em] min-[430px]:text-sm min-[430px]:tracking-[0.18em] sm:text-lg sm:tracking-[0.25em]">
              {settings.brandDisplayName}
            </p>
            <p className="hidden text-[9px] uppercase tracking-[0.35em] text-cyan-300/70 sm:block">
              {settings.brandTagline}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link
            href="/track-order"
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
              active === "track"
                ? "border-fuchsia-400/35 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/82 hover:border-fuchsia-400/35 hover:bg-white/10"
            }`}
            aria-label="Track Order"
          >
            <PackageSearch className="h-4 w-4" />
            <span className="hidden min-[390px]:inline">Track</span>
          </Link>
          <button
            type="button"
            onClick={toggleCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-fuchsia-400/35 hover:bg-white/10"
            aria-label={`Open cart with ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-bold text-black">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <Link
            href="/"
            className={`${navBase} ${active === "home" ? navActive : navMuted}`}
          >
            Home
          </Link>

          <Link
            href="/product"
            className={`${navBase} ${active === "shop" ? navActive : navMuted}`}
          >
            Shop
          </Link>

          <Link
            href={productHref}
            className={`${navBase} ${active === "product" ? navActive : navMuted}`}
          >
            Product
          </Link>

          <Link
            href="/track-order"
            className={`${navBase} ${active === "track" ? navActive : navMuted}`}
          >
            Track Order
          </Link>

          <button
            onClick={toggleCart}
            className={`${navBase} relative border-white/10 bg-white/5 hover:border-fuchsia-400/35 hover:bg-white/10 ${
              active === "cart" ? "shadow-[0_0_30px_rgba(217,70,239,0.14)]" : ""
            }`}
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-bold text-black">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
