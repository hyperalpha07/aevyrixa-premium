"use client";

import SiteHeader from "@/app/components/cart/site-header";
import { useCart } from "@/app/components/cart/cart-context";
import Link from "next/link";
import { products } from "@/app/lib/products";
import ProductVisual from "@/app/components/product-visual";

function getAccentClasses(accent: "cyan" | "fuchsia" | "amber") {
  if (accent === "cyan") {
    return {
      badge: "text-cyan-300/80",
      glow: "shadow-[0_0_35px_rgba(34,211,238,0.12)]",
      border: "border-cyan-400/20 hover:border-cyan-300/40",
      pill: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
      button:
        "from-cyan-300 to-fuchsia-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.18)]",
    };
  }

  if (accent === "fuchsia") {
    return {
      badge: "text-fuchsia-300/80",
      glow: "shadow-[0_0_35px_rgba(217,70,239,0.12)]",
      border: "border-fuchsia-400/20 hover:border-fuchsia-300/40",
      pill: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300",
      button:
        "from-fuchsia-300 to-cyan-300 text-black shadow-[0_0_30px_rgba(217,70,239,0.16)]",
    };
  }

  return {
    badge: "text-amber-200/80",
    glow: "shadow-[0_0_35px_rgba(251,191,36,0.10)]",
    border: "border-amber-300/20 hover:border-amber-200/40",
    pill: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    button:
      "from-amber-200 to-fuchsia-300 text-black shadow-[0_0_30px_rgba(251,191,36,0.14)]",
  };
}

export default function ProductCollectionPage() {
  const { addItem } = useCart();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[6%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[16%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[28%] h-[280px] w-[280px] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <SiteHeader active="shop" />

      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-cyan-300/70">
            AEVYRIXA Collection
          </p>

          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Premium reusable period care designed for modern confidence
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
            Explore soft, discreet Her Care pieces built for comfort,
            reusable routines, and a refined everyday experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-2xl font-semibold text-white">Premium Look</p>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Clean luxury styling designed for modern customers.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-2xl font-semibold text-white">Fast Shipping</p>
            <p className="mt-2 text-sm leading-7 text-white/60">
              A polished shopping experience with clear delivery updates.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-2xl font-semibold text-white">7-Day Guarantee</p>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Confidence-focused shopping backed by customer-first support.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const accent = getAccentClasses(product.accent);

            return (
              <article
                key={product.slug}
                className={`group rounded-[2rem] border bg-white/5 p-4 backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:bg-white/[0.07] ${accent.border} ${accent.glow}`}
              >
                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#0b1020] via-[#12172a] to-[#1b1030] p-4">
                  <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0b1120]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

                    <div className="relative z-10 h-[190px] w-[190px] transition duration-500 group-hover:scale-[1.04]">
                      <ProductVisual
                        accent={product.accent}
                        label={product.category}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-1 pb-2 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-[11px] uppercase tracking-[0.35em] ${accent.badge}`}
                    >
                      {product.category}
                    </p>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${accent.pill}`}
                    >
                      {product.saveText}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">
                    {product.name}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                    <span className="text-amber-300">★★★★★</span>
                    <span>{product.reviewScore}</span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/60">
                    {product.shortDescription}
                  </p>

                  <div className="mt-6 flex items-end gap-3">
                    <span className="text-3xl font-semibold text-white">
                      {product.price}
                    </span>
                    <span className="pb-1 text-base text-white/35 line-through">
                      {product.compareAtPrice}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                     onClick={() => {
  addItem({
    id: product.id,
    slug: product.slug,
    shopifyHandle: product.shopifyHandle,
    shopifyVariantId: product.shopifyVariantId,
    name: product.name,
    price: product.numericPrice,
    image: product.featuredImage,
  });
  alert("Added to cart ✅");
}}
                      className={`inline-flex justify-center rounded-full bg-gradient-to-r px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.02] ${accent.button}`}
                    >
                      Add to Cart
                    </button>

                    <Link
                      href={`/product/${product.slug}`}
                      className="inline-flex justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:border-fuchsia-400/35 hover:bg-white/10"
                    >
                      View Product
                    </Link>

                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-[10px] uppercase tracking-[0.12em] text-white/55 sm:rounded-full sm:text-xs sm:tracking-[0.2em]">
                      <span>Secure Payment</span>
                      <span>Fast Shipping</span>
                      <span>7-Day</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
