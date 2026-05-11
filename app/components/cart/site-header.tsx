"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/components/cart/cart-context";

type SiteHeaderProps = {
  active?: "home" | "shop" | "product" | "cart";
  productHref?: string;
};

export default function SiteHeader({
  active = "shop",
  productHref = "/product/her-care-period-panty",
}: SiteHeaderProps) {
  const { totalItems, toggleCart } = useCart();

  const navBase =
    "rounded-full border px-5 py-2.5 text-white transition duration-300";
  const navMuted =
    "border-transparent text-white/80 hover:border-fuchsia-400/35 hover:bg-white/5 hover:text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.14)]";
  const navActive =
    "border-fuchsia-400/35 bg-white/5 text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.14)]";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
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

          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold tracking-[0.25em] text-white truncate">
              Aevyrixa Her Care
            </p>
            <p className="hidden sm:block text-[9px] uppercase tracking-[0.35em] text-cyan-300/70">
              Premium reusable period panty care
            </p>
          </div>
        </Link>

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
