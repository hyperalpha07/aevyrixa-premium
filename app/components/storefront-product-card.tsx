"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/components/cart/cart-context";
import ProductVisual from "@/app/components/product-visual";
import {
  isPurchasableStock,
  stockBadgeClass,
  stockStatusLabel,
} from "@/app/lib/product-display";
import { formatProductPrice, type ProductVisualTheme } from "@/app/lib/products";
import type { ProductCatalogItem } from "@/app/lib/product-types";
import type { ReviewSummary } from "@/app/lib/review-types";

const themeStyles: Record<
  ProductVisualTheme,
  {
    border: string;
    badge: string;
    button: string;
    glow: string;
  }
> = {
  "blush-violet": {
    border: "border-[#FF4DB8]/18 hover:border-[#FF4DB8]/45",
    badge: "border-[#FF4DB8]/20 bg-[#2A183D]/80 text-[#FFB3D1]",
    button:
      "border-[#FF4DB8]/25 bg-[#211633]/80 text-[#FFB3D1] hover:border-[#FF4DB8]/50 hover:bg-[#2A183D]",
    glow: "bg-[#FF4DB8]/[0.10]",
  },
  "cyan-night": {
    border: "border-[#00D4C6]/20 hover:border-[#00D4C6]/48",
    badge: "border-[#00D4C6]/22 bg-[#0F1E2A]/80 text-[#31E6D4]",
    button:
      "border-[#00D4C6]/25 bg-[#0F1E2A]/80 text-[#31E6D4] hover:border-[#00D4C6]/50 hover:bg-[#102028]",
    glow: "bg-[#00D4C6]/[0.09]",
  },
  "rose-gold": {
    border: "border-[#A855F7]/18 hover:border-[#A855F7]/45",
    badge: "border-[#A855F7]/20 bg-[#1E1240]/80 text-[#C084FC]",
    button:
      "border-[#A855F7]/25 bg-[#1E1240]/80 text-[#C084FC] hover:border-[#A855F7]/50 hover:bg-[#231448]",
    glow: "bg-[#A855F7]/[0.10]",
  },
};

export function isNewProduct(product: ProductCatalogItem) {
  if (product.isNewArrival) return true;
  if (!product.createdAt) return false;
  const created = Date.parse(product.createdAt);
  if (!Number.isFinite(created)) return false;
  if (created <= Date.parse("2001-01-01T00:00:00.000Z")) return false;
  return Date.now() - created <= 45 * 24 * 60 * 60 * 1000;
}

export function isLimitedStock(product: ProductCatalogItem) {
  const threshold = product.lowStockThreshold ?? 5;
  if (product.stockStatus === "low_stock") return true;
  return (
    typeof product.stockQuantity === "number" &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= threshold
  );
}

export function productDateValue(product: ProductCatalogItem) {
  const parsed = Date.parse(product.createdAt ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function canQuickAdd(product: ProductCatalogItem) {
  return (
    isPurchasableStock(product.stockStatus) &&
    product.sizes.length <= 1 &&
    product.colors.length <= 1 &&
    product.absorbencyOptions.length <= 1
  );
}

function cartLineId(product: ProductCatalogItem) {
  return [product.id, product.sizes[0], product.colors[0], product.absorbencyOptions[0]]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function productBadges(product: ProductCatalogItem) {
  const labels = [
    product.badgeText || "",
    product.isBestSeller ? "Best Seller" : "",
    product.featured || product.showInFeaturedCollection ? "Featured" : "",
    isNewProduct(product) ? "New" : "",
    isLimitedStock(product) ? "Limited Stock" : "",
    product.stockStatus === "out_of_stock" ? "Out of stock" : "",
  ].filter(Boolean);

  return Array.from(new Set(labels));
}

export default function StorefrontProductCard({
  product,
  rating,
  compact = false,
  priority = false,
}: {
  product: ProductCatalogItem;
  rating?: ReviewSummary;
  compact?: boolean;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const style = themeStyles[product.visualTheme] ?? themeStyles["blush-violet"];
  const productHref = `/product/${product.slug}`;
  const quickAddAvailable = canQuickAdd(product);
  const badges = productBadges(product);

  const handleQuickAdd = () => {
    if (!quickAddAvailable) return;
    const variantSummary = [
      product.sizes[0],
      product.colors[0],
      product.absorbencyOptions[0] || product.absorbency,
    ]
      .filter(Boolean)
      .join(" / ");

    addItem({
      id: cartLineId(product),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.visualTheme,
      visualTheme: product.visualTheme,
      visualVariant: product.visualVariant,
      stockStatus: product.stockStatus,
      size: product.sizes[0],
      color: product.colors[0],
      absorbency: product.absorbencyOptions[0] || product.absorbency,
      variant: variantSummary || undefined,
    });
  };

  return (
    <article
      className={`aev-product-card aev-flagship-card-r1 group min-w-0 overflow-hidden rounded-[1.2rem] border bg-[#120D20]/94 p-2 shadow-[0_18px_64px_rgba(0,0,0,0.38),0_0_28px_rgba(255,77,184,0.06)] md:rounded-[1.65rem] md:p-3 ${style.border}`}
    >
      <Link
        href={productHref}
        className="block overflow-hidden rounded-[1rem] border border-white/[0.08] bg-[radial-gradient(circle_at_50%_18%,rgba(255,77,184,0.17),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(0,212,198,0.08),transparent_30%),linear-gradient(145deg,#211633,#080611)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:rounded-[1.35rem]"
        aria-label={`View ${product.name}`}
      >
        <div className={`relative w-full ${compact ? "aspect-[0.94]" : "aspect-[0.9]"}`}>
          <div className={`pointer-events-none absolute inset-x-4 top-8 h-32 rounded-full blur-3xl opacity-90 ${style.glow} transition duration-500 group-hover:scale-110 group-hover:opacity-100`} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_44%,transparent_62%)] opacity-45" />
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-contain p-2.5 transition duration-500 group-hover:scale-[1.04] sm:p-3"
            />
          ) : (
            <ProductVisual
              visualTheme={product.visualTheme}
              label={product.absorbency}
              compact={compact}
            />
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
            {badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[#FF4DB8]/32 bg-[#080611]/86 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#FFB3D1] shadow-[0_0_16px_rgba(255,77,184,0.12)] backdrop-blur-md sm:text-[10px] sm:tracking-[0.12em]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="px-1 pb-2.5 pt-3 md:px-2 md:pb-3 md:pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-[0_0_14px_rgba(0,0,0,0.16)] sm:px-2.5 sm:py-1 sm:text-[11px] ${stockBadgeClass(product.stockStatus)}`}>
            {stockStatusLabel(product.stockStatus)}
          </span>
          <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex sm:px-2.5 sm:py-1 sm:text-[11px] ${style.badge}`}>
            {product.category}
          </span>
        </div>

        <Link href={productHref}>
          <h3 className="mt-2.5 line-clamp-2 break-words text-[0.84rem] font-semibold leading-snug text-white [overflow-wrap:anywhere] sm:text-base md:text-lg">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-5 text-[#D8CBE8]/68 sm:text-sm sm:leading-6">
            {product.shortDescription}
          </p>
        )}
        {rating && rating.reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#FFB84D]">
            <span aria-hidden="true">
              {"★".repeat(Math.round(rating.averageRating))}
              {"☆".repeat(5 - Math.round(rating.averageRating))}
            </span>
            <span className="text-[#D8CBE8]/70">
              {rating.averageRating.toFixed(1)} ({rating.reviewCount})
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold text-[#FFB3D1] sm:text-lg md:text-xl">
            {formatProductPrice(product)}
          </span>
          {typeof product.compareAtPrice === "number" && (
            <span className="text-xs text-[#6B5F7A] line-through sm:text-sm">
              {formatProductPrice({
                price: product.compareAtPrice,
                currency: product.currency,
              })}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
          <Link
            href={productHref}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition sm:min-h-11 sm:px-4 sm:text-sm ${style.button}`}
          >
            View
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
          {quickAddAvailable ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="aev-button-primary inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white sm:min-h-11 sm:px-4 sm:text-sm"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add
            </button>
          ) : (
            <Link
              href={productHref}
              className="aev-button-secondary inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#FF4DB8]/20 bg-[#1B1230]/82 px-3 py-2 text-xs font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/38 hover:text-white sm:min-h-11 sm:px-4 sm:text-sm"
            >
              Options
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
