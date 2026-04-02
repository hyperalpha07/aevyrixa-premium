"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/app/components/cart/site-header";
import { products, type Product } from "@/app/lib/products";
import { useCart } from "@/app/components/cart/cart-context";

function getAccentClasses(accent: Product["accent"]) {
  if (accent === "cyan") {
    return {
      badge: "text-cyan-300/75",
      sale: "border-cyan-300/20 bg-cyan-300/10 text-cyan-300",
      thumbActive:
        "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_25px_rgba(34,211,238,0.14)]",
      primaryButton:
        "bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-black shadow-[0_0_40px_rgba(56,189,248,0.25)]",
      secondaryButton:
        "border-cyan-300/20 bg-white/5 text-white hover:border-cyan-300/40 hover:bg-white/10",
      featureLabel: "text-cyan-300/75",
      panelGlow: "shadow-[0_0_35px_rgba(34,211,238,0.08)]",
    };
  }

  if (accent === "fuchsia") {
    return {
      badge: "text-fuchsia-300/75",
      sale: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300",
      thumbActive:
        "border-fuchsia-400/40 bg-fuchsia-400/10 shadow-[0_0_25px_rgba(217,70,239,0.14)]",
      primaryButton:
        "bg-gradient-to-r from-fuchsia-300 to-cyan-300 text-black shadow-[0_0_40px_rgba(217,70,239,0.22)]",
      secondaryButton:
        "border-fuchsia-400/20 bg-white/5 text-white hover:border-fuchsia-400/40 hover:bg-white/10",
      featureLabel: "text-fuchsia-300/75",
      panelGlow: "shadow-[0_0_35px_rgba(217,70,239,0.08)]",
    };
  }

  return {
    badge: "text-amber-200/75",
    sale: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    thumbActive:
      "border-amber-300/40 bg-amber-300/10 shadow-[0_0_25px_rgba(251,191,36,0.14)]",
    primaryButton:
      "bg-gradient-to-r from-amber-200 to-fuchsia-300 text-black shadow-[0_0_40px_rgba(251,191,36,0.18)]",
    secondaryButton:
      "border-amber-300/20 bg-white/5 text-white hover:border-amber-300/40 hover:bg-white/10",
    featureLabel: "text-amber-200/75",
    panelGlow: "shadow-[0_0_35px_rgba(251,191,36,0.08)]",
  };
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);

  const product = useMemo(
    () => products.find((item) => item.slug === slug),
    [slug]
  );

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("/logo.jpg");
  const { addItem } = useCart();

  useEffect(() => {
    if (product?.gallery?.[0]) {
      setSelectedImage(product.gallery[0]);
    }
  }, [product]);

  if (!product) {
    notFound();
  }

  const accent = getAccentClasses(product.accent);
  const numericPrice = Number(String(product.price).replace("$", ""));

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

 const handleAddToCart = () => {
  addItem(
    {
      id: product.id,
      slug: product.slug,
      shopifyHandle: product.shopifyHandle,
      shopifyVariantId: product.shopifyVariantId,
      name: product.name,
      price: product.numericPrice,
      image: product.featuredImage,
    },
    quantity
  );
};

  const handleBuyNow = () => {
  addItem(
    {
      id: product.id,
      slug: product.slug,
      shopifyHandle: product.shopifyHandle,
      shopifyVariantId: product.shopifyVariantId,
      name: product.name,
      price: product.numericPrice,
      image: product.featuredImage,
    },
    quantity
  );

  router.push("/cart");
};

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[8%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[30%] h-[280px] w-[280px] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <SiteHeader active="product" productHref={`/product/${product.slug}`} />

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mb-8 flex justify-end">
          <Link
            href="/cart"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition duration-300 hover:border-fuchsia-400/35 hover:bg-white/10"
          >
            Go to Cart
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
          <div>
            <div
              className={`rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl ${accent.panelGlow}`}
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#0b1020] via-[#12172a] to-[#1b1030] p-4">
                <div className="relative flex min-h-[360px] items-center justify-center rounded-[1.25rem] border border-white/10 bg-[#0b1120] md:min-h-[520px]">
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    width={700}
                    height={700}
                    className="max-h-[320px] w-auto object-contain md:max-h-[430px]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3 md:gap-4">
              {product.gallery.map((img, index) => (
                <button
                  key={`${product.slug}-${index}`}
                  onClick={() => setSelectedImage(img)}
                  className={`overflow-hidden rounded-2xl border p-2 transition duration-300 ${
                    selectedImage === img
                      ? accent.thumbActive
                      : "border-white/10 bg-white/5 hover:border-fuchsia-400/30 hover:bg-white/8"
                  }`}
                >
                  <div className="flex h-20 items-center justify-center rounded-xl bg-[#0b1120]">
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p
              className={`mb-4 text-sm uppercase tracking-[0.35em] ${accent.badge}`}
            >
              {product.category}
            </p>

            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 text-amber-300">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="text-sm text-white/55">{product.reviewSummary}</p>
            </div>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/65">
              {product.shortDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <span className="text-4xl font-semibold text-white">
                {product.price}
              </span>
              <span className="pb-1 text-lg text-white/35 line-through">
                {product.compareAtPrice}
              </span>
              <span
                className={`rounded-full border px-4 py-1 text-sm font-medium ${accent.sale}`}
              >
                {product.saveText}
              </span>
            </div>

            <div
              className={`mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl md:p-6 ${accent.panelGlow}`}
            >
              <div className="flex flex-col gap-5">
                <div>
                  <p
                    className={`mb-4 text-sm uppercase tracking-[0.3em] ${accent.badge}`}
                  >
                    Quantity
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center rounded-full border border-white/10 bg-black/20">
                      <button
                        onClick={decreaseQuantity}
                        className="px-5 py-3 text-lg text-white/70 transition hover:text-white"
                      >
                        −
                      </button>
                      <span className="min-w-[48px] text-center text-base font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        className="px-5 py-3 text-lg text-white/70 transition hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm text-white/55">
                      In stock • ready to ship
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleAddToCart}
                    className={`rounded-full px-8 py-3.5 text-sm font-semibold transition hover:scale-[1.02] ${accent.primaryButton}`}
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className={`rounded-full border px-8 py-3.5 text-sm font-semibold transition duration-300 ${accent.secondaryButton}`}
                  >
                    Buy Now
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 text-sm text-white/60 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                      Secure Payment
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                      Fast Shipping
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                      7-Day Guarantee
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
                <div className="mb-2 text-2xl text-cyan-300">🔒</div>
                <h3 className="text-sm font-semibold">Secure Payment</h3>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
                <div className="mb-2 text-2xl text-fuchsia-300">💰</div>
                <h3 className="text-sm font-semibold">7-Day Guarantee</h3>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
                <div className="mb-2 text-2xl text-amber-200">🚚</div>
                <h3 className="text-sm font-semibold">Fast Shipping</h3>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <p
                className={`mb-4 text-sm uppercase tracking-[0.3em] ${accent.badge}`}
              >
                Shipping & Support
              </p>
              <ul className="space-y-3 text-sm leading-7 text-white/65">
                {product.shippingNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <p
              className={`mb-3 text-sm uppercase tracking-[0.35em] ${accent.featureLabel}`}
            >
              Premium Features
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Crafted for a refined smart living experience
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {product.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/60">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <p
              className={`mb-3 text-sm uppercase tracking-[0.35em] ${accent.featureLabel}`}
            >
              Review Summary
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Customers love the premium feel
            </h2>

            <div className="mt-5 flex items-center gap-2 text-amber-300">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="ml-2 text-base text-white">
                {product.reviewScore}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {product.reviewQuotes.map((quote) => (
                <div
                  key={quote}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm leading-7 text-white/70">“{quote}”</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}