"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  PackageCheck,
  Recycle,
  ShieldCheck,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import ProductVisual from "@/app/components/product-visual";
import { useCart } from "@/app/components/cart/cart-context";
import {
  catalogItemToLegacyProduct,
  formatProductPrice,
  type ProductVisualTheme,
} from "@/app/lib/products";
import type { ProductCatalogItem } from "@/app/lib/product-types";

const themeStyles: Record<
  ProductVisualTheme,
  {
    accent: string;
    badge: string;
    selected: string;
    primary: string;
    panel: string;
  }
> = {
  "blush-violet": {
    accent: "text-fuchsia-100",
    badge: "border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100",
    selected: "border-fuchsia-100/50 bg-fuchsia-200/14 text-white",
    primary: "from-fuchsia-200 to-cyan-200 text-black",
    panel: "shadow-[0_0_42px_rgba(217,70,239,0.10)]",
  },
  "cyan-night": {
    accent: "text-cyan-100",
    badge: "border-cyan-200/25 bg-cyan-300/10 text-cyan-100",
    selected: "border-cyan-100/50 bg-cyan-200/14 text-white",
    primary: "from-cyan-200 to-fuchsia-200 text-black",
    panel: "shadow-[0_0_42px_rgba(34,211,238,0.10)]",
  },
  "rose-gold": {
    accent: "text-rose-100",
    badge: "border-rose-100/30 bg-rose-200/10 text-rose-100",
    selected: "border-rose-100/55 bg-rose-200/14 text-white",
    primary: "from-rose-100 to-cyan-200 text-black",
    panel: "shadow-[0_0_42px_rgba(244,196,212,0.10)]",
  },
};

const trustBadges = [
  { label: "Discreet Privacy Packaging", icon: PackageCheck },
  { label: "3-Day Hygiene-Safe Support", icon: ShieldCheck },
  { label: "Comfort Fit", icon: HeartHandshake },
  { label: "Reusable Protection", icon: Recycle },
];

const faqs = [
  {
    question: "Can I wear it on its own?",
    answer:
      "Choose the absorbency that matches your routine. Some customers also use reusable period underwear as backup support on higher-flow days.",
  },
  {
    question: "How should I wash it?",
    answer:
      "Rinse cold after wear, wash cold with mild detergent, and air dry fully. Avoid bleach, fabric softener, and high heat.",
  },
  {
    question: "How do I choose a size?",
    answer:
      "Start with your usual underwear size. If you are between sizes, choose the fit that feels more comfortable around the waist and leg opening.",
  },
];

function buildCartLineId(
  product: ProductCatalogItem,
  size: string,
  color: string,
  absorbency: string
) {
  return `${product.id}-${size}-${color}-${absorbency}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductDetailClient({
  product,
}: {
  product: ProductCatalogItem;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const legacyProduct = catalogItemToLegacyProduct(product);
  const style = themeStyles[product.visualTheme];
  const [selectedSize, setSelectedSize] = useState<string>(
    legacyProduct.sizes[1] || legacyProduct.sizes[0] || "M"
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    legacyProduct.colors[0] || "Black"
  );
  const [selectedAbsorbency, setSelectedAbsorbency] = useState<string>(
    product.absorbency
  );
  const [quantity, setQuantity] = useState(1);

  const decreaseQuantity = () => setQuantity((current) => Math.max(1, current - 1));
  const increaseQuantity = () => setQuantity((current) => current + 1);

  const handleAddToCart = (goToCart = false) => {
    addItem(
      {
        id: buildCartLineId(product, selectedSize, selectedColor, selectedAbsorbency),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.visualTheme,
        visualTheme: product.visualTheme,
        size: selectedSize,
        color: selectedColor,
        absorbency: selectedAbsorbency,
      },
      quantity
    );

    if (goToCart) {
      router.push("/cart");
    }
  };

  return (
    <main className="aev-cinematic-page min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[5%] h-[310px] w-[310px] rounded-full bg-cyan-400/14 blur-[120px]" />
        <div className="absolute right-[-18%] top-[20%] h-[360px] w-[360px] rounded-full bg-fuchsia-400/14 blur-[140px]" />
        <div className="absolute bottom-[-14%] left-[28%] h-[280px] w-[280px] rounded-full bg-rose-200/10 blur-[120px]" />
      </div>

      <SiteHeader active="product" productHref={`/product/${product.slug}`} />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <div className={`aev-shop-card min-w-0 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-2xl ${style.panel}`}>
          <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#07111f]">
            <div className="aspect-[0.92] min-h-[340px] w-full sm:aspect-square">
              <ProductVisual visualTheme={product.visualTheme} label={product.absorbency} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <Link href="/product" className="text-sm font-medium text-white/55 transition hover:text-white">
            Back to products
          </Link>

          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
              {product.absorbency}
            </span>
            <span className="max-w-full break-words text-xs uppercase tracking-[0.16em] text-white/42 [overflow-wrap:anywhere] min-[420px]:tracking-[0.24em]">
              {product.category}
            </span>
          </div>

          <h1 className="mt-5 break-words text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl md:text-6xl">
            {product.name}
          </h1>

          <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/68 [overflow-wrap:anywhere]">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-semibold">{formatProductPrice(product)}</span>
            {typeof product.compareAtPrice === "number" && (
              <span className="pb-1 text-lg text-white/35 line-through">
                {formatProductPrice({
                  price: product.compareAtPrice,
                  currency: product.currency,
                })}
              </span>
            )}
          </div>

          <div className={`aev-product-buy-panel mt-7 rounded-[1.65rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl sm:p-5 ${style.panel}`}>
            <div className="space-y-6">
              <VariantSelector
                label="Size"
                options={legacyProduct.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
                selectedClassName={style.selected}
              />
              <VariantSelector
                label="Color"
                options={legacyProduct.colors}
                selected={selectedColor}
                onSelect={setSelectedColor}
                selectedClassName={style.selected}
              />
              <VariantSelector
                label="Absorbency"
                options={legacyProduct.absorbencyOptions}
                selected={selectedAbsorbency}
                onSelect={setSelectedAbsorbency}
                selectedClassName={style.selected}
              />

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-white/50">
                  Quantity
                </p>
                <div className="flex w-fit items-center rounded-full border border-white/10 bg-black/20">
                  <button
                    onClick={decreaseQuantity}
                    className="px-4 py-3 text-white/70 transition hover:text-white"
                    aria-label="Decrease quantity"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <span className="min-w-[48px] text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="px-4 py-3 text-white/70 transition hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => handleAddToCart(false)}
                  className={`aev-action-primary rounded-full bg-gradient-to-r px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.01] ${style.primary}`}
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  className="aev-action-secondary rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-200/35 hover:bg-white/[0.08]"
                >
                  Add and View Cart
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {trustBadges.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="aev-cinematic-chip flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72"
              >
                <Icon className={`h-4 w-4 shrink-0 ${style.accent}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}>
            Benefits
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Made for a calmer routine</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {legacyProduct.benefits.map((benefit) => (
              <div key={benefit} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${style.accent}`} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}>
            Care Guide
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Simple wash steps</h2>
          <div className="mt-5 space-y-3">
            {legacyProduct.care.map((step, index) => (
              <div key={step} className="flex gap-3 text-sm leading-7 text-white/68">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6 lg:col-span-2">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}>
            FAQ
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-white/62">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function VariantSelector({
  label,
  options,
  selected,
  onSelect,
  selectedClassName,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  selectedClassName: string;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-white/50">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              selected === option
                ? selectedClassName
                : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

