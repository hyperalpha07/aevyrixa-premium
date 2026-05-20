"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  MessageCircle,
  Minus,
  PackageCheck,
  Play,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import ProductVisual from "@/app/components/product-visual";
import { useCart } from "@/app/components/cart/cart-context";
import {
  displayBenefits,
  displayCare,
  isPurchasableStock,
  publicProduct,
  stockBadgeClass,
  stockStatusLabel,
} from "@/app/lib/product-display";
import {
  formatProductPrice,
  type ProductVisualTheme,
} from "@/app/lib/products";
import type { ProductCatalogItem } from "@/app/lib/product-types";
import SiteFooter from "@/app/components/site-footer";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";
import type { PublicProductReview } from "@/app/lib/review-types";

const themeStyles: Record<
  ProductVisualTheme,
  {
    accent: string;
    badge: string;
    selected: string;
    primary: string;
    panel: string;
    glow: string;
    border: string;
  }
> = {
  "blush-violet": {
    accent: "text-[#FF4DB8]",
    badge: "border-[#FF4DB8]/22 bg-[#2A183D]/80 text-[#FFB3D1]",
    selected: "border-[#FF4DB8]/50 bg-[#2A183D] text-white",
    primary: "from-[#FF4DB8] to-[#FF3FA4] text-white",
    panel: "shadow-[0_8px_32px_rgba(255,77,184,0.12)]",
    glow: "bg-[#FF4DB8]/[0.10]",
    border: "border-[#FF4DB8]/18 hover:border-[#FF4DB8]/40",
  },
  "cyan-night": {
    accent: "text-[#00D4C6]",
    badge: "border-[#00D4C6]/22 bg-[#0F1E2A]/80 text-[#31E6D4]",
    selected: "border-[#00D4C6]/50 bg-[#102028] text-white",
    primary: "from-[#00D4C6] to-[#0FB8AC] text-[#080611]",
    panel: "shadow-[0_8px_32px_rgba(0,212,198,0.10)]",
    glow: "bg-[#00D4C6]/[0.08]",
    border: "border-[#00D4C6]/18 hover:border-[#00D4C6]/40",
  },
  "rose-gold": {
    accent: "text-[#A855F7]",
    badge: "border-[#A855F7]/22 bg-[#1E1240]/80 text-[#C084FC]",
    selected: "border-[#A855F7]/50 bg-[#231448] text-white",
    primary: "from-[#A855F7] to-[#8B5CF6] text-white",
    panel: "shadow-[0_8px_32px_rgba(168,85,247,0.10)]",
    glow: "bg-[#A855F7]/[0.09]",
    border: "border-[#A855F7]/18 hover:border-[#A855F7]/40",
  },
};

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

type MediaItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string; poster?: string };

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
  settings,
  relatedProducts = [],
  reviews = [],
}: {
  product: ProductCatalogItem;
  settings: StorefrontSettings;
  relatedProducts?: ProductCatalogItem[];
  reviews?: PublicProductReview[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const displayProduct = publicProduct(product);
  const benefits = displayBenefits(displayProduct);
  const care = displayCare(displayProduct);
  const style =
    themeStyles[displayProduct.visualTheme] ?? themeStyles["blush-violet"];
  const canAddToCart = isPurchasableStock(displayProduct.stockStatus);

  const [selectedSize, setSelectedSize] = useState<string>(
    displayProduct.sizes[0] || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    displayProduct.colors[0] || ""
  );
  const [selectedAbsorbency, setSelectedAbsorbency] = useState<string>(
    displayProduct.absorbencyOptions[0] || displayProduct.absorbency
  );
  const [quantity, setQuantity] = useState(1);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [brokenMediaUrls, setBrokenMediaUrls] = useState<Set<string>>(
    () => new Set()
  );

  const decreaseQuantity = () =>
    setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => q + 1);

  const handleAddToCart = (goToCart = false) => {
    if (!canAddToCart) return;
    if (displayProduct.sizes.length > 0 && !selectedSize) {
      setSelectionMessage("Please select a size before adding this item.");
      return;
    }
    if (displayProduct.colors.length > 0 && !selectedColor) {
      setSelectionMessage("Please select a color before adding this item.");
      return;
    }
    if (displayProduct.absorbencyOptions.length > 0 && !selectedAbsorbency) {
      setSelectionMessage("Please select an absorbency before adding this item.");
      return;
    }
    setSelectionMessage("");
    const variantSummary = [selectedSize, selectedColor, selectedAbsorbency]
      .filter(Boolean)
      .join(" / ");
    addItem(
      {
        id: buildCartLineId(
          displayProduct,
          selectedSize,
          selectedColor,
          selectedAbsorbency
        ),
        productId: displayProduct.id,
        slug: displayProduct.slug,
        name: displayProduct.name,
        price: displayProduct.price,
        image: displayProduct.visualTheme,
        visualTheme: displayProduct.visualTheme,
        visualVariant: displayProduct.visualVariant,
        stockStatus: displayProduct.stockStatus,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        absorbency: selectedAbsorbency || undefined,
        variant: variantSummary || undefined,
      },
      quantity
    );
    if (goToCart) router.push("/cart");
  };

  // Build media gallery
  const mediaItems: MediaItem[] = [];
  const seenUrls = new Set<string>();
  if (displayProduct.imageUrl) {
    seenUrls.add(displayProduct.imageUrl);
    mediaItems.push({ type: "image", url: displayProduct.imageUrl });
  }
  const extraImages = Array.isArray(displayProduct.images)
    ? displayProduct.images
    : [];
  for (const img of extraImages) {
    if (typeof img === "string" && img && !seenUrls.has(img)) {
      seenUrls.add(img);
      mediaItems.push({ type: "image", url: img });
    }
  }
  if (displayProduct.videoUrl) {
    mediaItems.push({
      type: "video",
      url: displayProduct.videoUrl,
      poster: displayProduct.posterUrl ?? displayProduct.imageUrl,
    });
  }

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const safeIndex = Math.min(
    selectedMediaIndex,
    Math.max(0, mediaItems.length - 1)
  );
  const selectedMedia =
    mediaItems.length > 0 && !brokenMediaUrls.has(mediaItems[safeIndex].url)
      ? mediaItems[safeIndex]
      : null;
  const showThumbnails = mediaItems.length > 1;
  const selectedSummary = [selectedSize, selectedColor, selectedAbsorbency]
    .filter(Boolean)
    .join(" / ");
  const supportHref = settings.whatsappUrl || "/support";
  const supportLabel = settings.whatsappUrl ? "WhatsApp help" : "Live support";
  const deliveryText =
    settings.deliveryCoverageText ||
    "Bangladesh delivery is available with order confirmation before dispatch.";
  const privacyText =
    settings.privacyPackagingMessage ||
    "Orders ship in discreet privacy packaging.";
  const supportText =
    settings.supportWindowMessage ||
    "3-Day Hygiene-Safe Support on eligible concerns.";
  const detailsItems = [
    displayProduct.shortDescription,
    displayProduct.description,
    ...benefits.slice(0, 3),
  ].filter(Boolean);
  const sizeFitItems = [
    displayProduct.sizes.length > 0
      ? `Available sizes: ${displayProduct.sizes.join(", ")}`
      : "Size availability is shown before checkout.",
    "If you are between sizes, choose the fit that feels more comfortable around the waist and leg opening.",
    "Check fit over clean clothing before direct wear.",
  ];
  const deliverySupportItems = [
    deliveryText,
    privacyText,
    supportText,
    "Track your order after purchase from the Track Order page.",
  ];

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  // Touch swipe for mobile gallery navigation
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || mediaItems.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) {
      setSelectedMediaIndex((i) => (i + 1) % mediaItems.length);
    } else {
      setSelectedMediaIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  const hasSavings =
    typeof displayProduct.compareAtPrice === "number" &&
    displayProduct.compareAtPrice > displayProduct.price;
  const savingsPct = hasSavings
    ? Math.round(
        ((displayProduct.compareAtPrice! - displayProduct.price) /
          displayProduct.compareAtPrice!) *
          100
      )
    : 0;

  const displayRelated = relatedProducts.map(publicProduct);
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10
        ) / 10
      : 0;

  return (
    <main className="aev-cinematic-page min-h-screen overflow-x-hidden bg-[#080611] pb-40 text-white lg:pb-0">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[5%] h-[310px] w-[310px] rounded-full bg-[#FF4DB8]/[0.07] blur-[120px]" />
        <div className="absolute right-[-18%] top-[20%] h-[360px] w-[360px] rounded-full bg-[#A855F7]/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-14%] left-[28%] h-[280px] w-[280px] rounded-full bg-[#00D4C6]/[0.05] blur-[120px]" />
      </div>

      <SiteHeader
        active="product"
        productHref={`/product/${displayProduct.slug}`}
        settings={settings}
      />

      {/* ── Main product section ── */}
      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-6 sm:px-6 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">

        {/* LEFT — Media gallery */}
        <div
          className={`aev-panel aev-shop-card min-w-0 rounded-[1.5rem] border border-[#FF4DB8]/12 bg-[#151024] p-2.5 sm:rounded-[1.85rem] sm:p-3 ${style.panel}`}
        >
          {/* Main media display */}
          <div
            className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-[#0B0F1A] sm:rounded-[1.45rem]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Premium glow behind product */}
            <div
              className={`pointer-events-none absolute inset-0 scale-90 rounded-full opacity-40 blur-[60px] ${style.glow}`}
            />
            <div className="aspect-[0.96] w-full sm:aspect-square">
              {selectedMedia?.type === "video" ? (
                <video
                  src={selectedMedia.url}
                  poster={selectedMedia.poster}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-[#0B0F1A] object-contain"
                  onError={() =>
                    setBrokenMediaUrls((urls) => new Set(urls).add(selectedMedia.url))
                  }
                />
              ) : selectedMedia?.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={safeIndex}
                  src={selectedMedia.url}
                  alt={displayProduct.name}
                  loading={safeIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="aev-media-img-reveal h-full w-full cursor-zoom-in object-contain p-3 sm:p-4"
                  onClick={() => setLightboxOpen(true)}
                  onError={() =>
                    setBrokenMediaUrls((urls) => new Set(urls).add(selectedMedia.url))
                  }
                />
              ) : (
                <ProductVisual
                  visualTheme={displayProduct.visualTheme}
                  label={displayProduct.absorbency}
                />
              )}
            </div>
            {/* Category label overlay */}
            {displayProduct.category && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10">
                <span className="rounded-full border border-[#FF4DB8]/22 bg-[#080611]/75 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#FFB3D1] backdrop-blur-sm">
                  {displayProduct.category}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail strip — shown when multiple images or image + video */}
          {showThumbnails && (
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
              {mediaItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  aria-label={
                    item.type === "video"
                      ? "Play video"
                      : `Product image ${index + 1}`
                  }
                  disabled={brokenMediaUrls.has(item.url)}
                  className={`h-[72px] w-[72px] shrink-0 snap-start overflow-hidden rounded-xl border transition sm:h-[78px] sm:w-[78px] ${
                    safeIndex === index
                      ? "aev-media-thumb-active border-[#FF4DB8]/55 bg-[#1B1230]"
                      : "border-white/[0.07] bg-[#1B1230] hover:border-[#FF4DB8]/28"
                  } ${
                    brokenMediaUrls.has(item.url)
                      ? "cursor-not-allowed opacity-35"
                      : ""
                  }`}
                >
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={() =>
                        setBrokenMediaUrls((urls) => new Set(urls).add(item.url))
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1B1230]">
                      <Play className="h-5 w-5 text-[#FF4DB8]/70" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* If single image + video: always show video card below */}
          {!showThumbnails && displayProduct.videoUrl && (
            <div className="mt-3 overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#0B0F1A]">
              <video
                src={displayProduct.videoUrl}
                poster={displayProduct.posterUrl ?? displayProduct.imageUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full"
                style={{ maxHeight: "260px" }}
                onError={() =>
                  setBrokenMediaUrls((urls) =>
                    new Set(urls).add(displayProduct.videoUrl || "")
                  )
                }
              />
            </div>
          )}

          {/* Product info cards below media */}
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#FF4DB8]/10 bg-[#1B1230] px-4 py-3 text-xs leading-5 text-[#9C91AA]">
              <PackageCheck className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.accent}`} />
              <span>{privacyText}</span>
            </div>
            <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#00D4C6]/12 bg-[#1B1230] px-4 py-3 text-xs leading-5 text-[#9C91AA]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D4C6]" />
              <span>{supportText}</span>
            </div>
            <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#A855F7]/10 bg-[#1B1230] px-4 py-3 text-xs leading-5 text-[#9C91AA]">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A855F7]" />
              <span>{deliveryText}</span>
            </div>
            <Link
              href={supportHref}
              className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[#FF4DB8]/15 bg-[#1B1230] px-4 py-3 text-xs font-semibold text-[#D8CBE8] transition hover:border-[#FF4DB8]/30 hover:bg-[#211633]"
            >
              <span className="inline-flex items-center gap-3">
                <MessageCircle className={`h-3.5 w-3.5 shrink-0 ${style.accent}`} />
                Need help choosing? {supportLabel}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#9C91AA]" />
            </Link>
            <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#FF4DB8]/10 bg-[#1B1230] px-4 py-3 text-xs leading-5 text-[#9C91AA]">
              <Ruler className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.accent}`} />
              <span>Size check: try over clean clothing before direct wear.</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Product information */}
        <div className="min-w-0">
          <Link
            href="/product"
            className="text-sm font-medium text-[#9C91AA] transition hover:text-[#D8CBE8]"
          >
            ← Back to products
          </Link>

          {/* Badges */}
          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}
            >
              {displayProduct.absorbency}
            </span>
            {displayProduct.featured && (
              <span className="rounded-full border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-1 text-xs font-medium text-[#FFC36A]">
                Featured
              </span>
            )}
            <span className="max-w-full break-words text-xs uppercase tracking-[0.16em] text-[#9C91AA]/70 [overflow-wrap:anywhere] min-[420px]:tracking-[0.24em]">
              {displayProduct.category}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${stockBadgeClass(displayProduct.stockStatus)}`}>
              {stockStatusLabel(displayProduct.stockStatus)}
            </span>
          </div>

          {/* Product name */}
          <h1 className="mt-5 break-words text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl md:text-6xl">
            {displayProduct.name}
          </h1>

          {/* Short description — accent tagline */}
          {displayProduct.shortDescription && (
            <p
              className={`mt-3 text-base font-medium leading-7 ${style.accent}`}
            >
              {displayProduct.shortDescription}
            </p>
          )}

          {/* Main description */}
          <p className="mt-4 max-w-2xl break-words text-base leading-8 text-[#9C91AA] [overflow-wrap:anywhere]">
            {displayProduct.description}
          </p>

          {/* Price */}
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-semibold text-[#FFB3D1]">
              {formatProductPrice(displayProduct)}
            </span>
            {typeof displayProduct.compareAtPrice === "number" && (
              <span className="pb-1 text-lg text-[#6B5F7A] line-through">
                {formatProductPrice({
                  price: displayProduct.compareAtPrice,
                  currency: displayProduct.currency,
                })}
              </span>
            )}
            {hasSavings && (
              <span className="mb-0.5 rounded-full border border-[#00D4C6]/25 bg-[#00D4C6]/[0.08] px-2.5 py-1 text-xs font-semibold text-[#31E6D4]">
                Save {savingsPct}%
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#FFB84D]/18 bg-[#FFB84D]/[0.055] px-4 py-3">
            <StarRating rating={averageRating} />
            <span className="text-sm font-semibold text-white">
              {reviewCount > 0
                ? `${averageRating.toFixed(1)} from ${reviewCount} approved ${reviewCount === 1 ? "review" : "reviews"}`
                : "No reviews yet"}
            </span>
            <Link href="#reviews" className="text-sm font-semibold text-[#FFB84D] hover:text-[#FFE1A3]">
              {reviewCount > 0 ? "Read reviews" : "Be the first after purchase"}
            </Link>
          </div>

          {/* ── Buy panel ── */}
          <div
            className={`aev-panel aev-product-buy-panel mt-7 rounded-[1.65rem] border border-[#FF4DB8]/12 bg-[#151024] p-4 sm:p-5 ${style.panel}`}
          >
            <div className="space-y-6">
              <VariantSelector
                label="Size"
                options={displayProduct.sizes}
                selected={selectedSize}
                onSelect={(value) => {
                  setSelectedSize(value);
                  setSelectionMessage("");
                }}
                selectedClassName={style.selected}
                hint="Check size over clean underwear or clothing only. Do not wear directly before confirming fit."
                disabled={!canAddToCart}
              />
              <VariantSelector
                label="Color"
                options={displayProduct.colors}
                selected={selectedColor}
                onSelect={(value) => {
                  setSelectedColor(value);
                  setSelectionMessage("");
                }}
                selectedClassName={style.selected}
                type="color"
                disabled={!canAddToCart}
              />
              <VariantSelector
                label="Absorbency"
                options={displayProduct.absorbencyOptions}
                selected={selectedAbsorbency}
                onSelect={(value) => {
                  setSelectedAbsorbency(value);
                  setSelectionMessage("");
                }}
                selectedClassName={style.selected}
                disabled={!canAddToCart}
              />

              {/* Quantity */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#9C91AA]/70">
                  Quantity
                </p>
                <div className="flex w-fit items-center rounded-full border border-[#FF4DB8]/18 bg-[#1B1230]">
                  <button
                    onClick={decreaseQuantity}
                    disabled={!canAddToCart || quantity <= 1}
                    className="px-4 py-3 text-[#D8CBE8] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[48px] text-center text-sm font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    disabled={!canAddToCart}
                    className="px-4 py-3 text-[#D8CBE8] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectionMessage && (
                <p className="rounded-2xl border border-[#FF4DB8]/22 bg-[#1B1230] px-4 py-3 text-sm leading-6 text-[#D8CBE8]">
                  {selectionMessage}
                </p>
              )}

              {/* Add to cart buttons */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={!canAddToCart}
                  className={`aev-button-primary aev-action-primary rounded-full px-6 py-3.5 text-sm font-semibold transition ${
                    canAddToCart
                      ? `bg-gradient-to-r shadow-[0_4px_24px_rgba(255,77,184,0.38)] hover:scale-[1.01] hover:shadow-[0_4px_32px_rgba(255,77,184,0.52)] ${style.primary}`
                      : "cursor-not-allowed border border-white/10 bg-[#1B1230] text-[#6B5F7A]/50"
                  }`}
                >
                  {canAddToCart ? "Add to Cart" : "Out of Stock"}
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={!canAddToCart}
                  className={`aev-button-secondary aev-action-secondary rounded-full border px-6 py-3.5 text-sm font-semibold transition ${
                    canAddToCart
                      ? "border-[#FF4DB8]/22 bg-[#1B1230] text-[#D8CBE8] hover:border-[#FF4DB8]/45 hover:bg-[#211633] hover:text-white"
                      : "cursor-not-allowed border-white/8 bg-[#1B1230] text-[#6B5F7A]/50"
                  }`}
                >
                  {canAddToCart ? "Add and View Cart" : "Unavailable"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Trust chips — 5 Her Care specific blocks ── */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: PackageCheck,
                label: "Discreet Packaging",
                desc: privacyText,
              },
              {
                icon: ShieldCheck,
                label: "3-Day Hygiene-Safe Support",
                desc: supportText,
              },
              {
                icon: CheckCircle2,
                label: "Original Seal Condition",
                desc: "Items must be unused, unwashed, and in original packaging.",
              },
              {
                icon: Info,
                label: "Size Check Over Clothing",
                desc: "Check fit over clean clothing before direct wear.",
              },
              {
                icon: Truck,
                label: "Bangladesh Delivery",
                desc: deliveryText,
              },
              {
                icon: MessageCircle,
                label: "Support Before You Buy",
                desc: "Message us for size, care, or order help before checkout.",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="aev-cinematic-chip flex items-start gap-3 rounded-2xl border border-[#FF4DB8]/10 bg-[#151024] px-4 py-3"
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${style.accent}`}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-[#9C91AA]">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:hidden">
        <div className="rounded-[1.45rem] border border-[#FF4DB8]/12 bg-[#151024] p-3">
          <ProductAccordion
            title="Details"
            items={detailsItems}
            defaultOpen
            accentClassName={style.accent}
          />
          <ProductAccordion
            title="Size & Fit"
            items={sizeFitItems}
            accentClassName={style.accent}
          />
          <ProductAccordion
            title="Care Instructions"
            items={care}
            accentClassName={style.accent}
          />
          <ProductAccordion
            title="Delivery & Support"
            items={deliverySupportItems}
            accentClassName={style.accent}
          />
          <ProductAccordion
            title="Privacy Packaging"
            items={[privacyText, "Outer packaging stays plain and discreet."]}
            accentClassName={style.accent}
          />
          <ProductFaqAccordion faqs={faqs} accentClassName={style.accent} />
        </div>
      </section>

      {/* ── Benefits, Care, Policy, FAQ ── */}
      <section className="mx-auto hidden max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:grid lg:grid-cols-[1fr_0.9fr]">

        {/* Benefits */}
        <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}
          >
            Benefits
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Made for a calmer routine
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-2xl border border-[#FF4DB8]/10 bg-[#1B1230] p-4 text-sm leading-6 text-[#9C91AA]"
              >
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${style.accent}`}
                />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Care guide */}
        <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}
          >
            Care Guide
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Simple wash steps</h2>
          <div className="mt-5 space-y-3">
            {care.map((step, index) => (
              <div
                key={step}
                className="flex gap-3 text-sm leading-7 text-[#9C91AA]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#FF4DB8]/20 bg-[#1B1230] text-xs text-[#FF4DB8]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hygiene & Support Policy */}
        <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6 lg:col-span-2">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}
          >
            Support & Hygiene Policy
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Her Care support details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "3-Day Hygiene-Safe Support",
                body: `${supportText} Product must remain unused, unwashed, and in original packaging/hygiene seal condition.`,
              },
              {
                icon: PackageCheck,
                title: "Discreet Packaging",
                body: privacyText,
              },
              {
                icon: Truck,
                title: "Delivery Confirmation",
                body: deliveryText,
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#FF4DB8]/10 bg-[#1B1230] p-4"
              >
                <Icon className={`h-5 w-5 ${style.accent}`} />
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#9C91AA]">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6 lg:col-span-2">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}
          >
            FAQ
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {faqs.map((faq, index) => (
              <div
                key={`${faq.question}-${index}`}
                className="rounded-2xl border border-[#FF4DB8]/10 bg-[#1B1230] p-4"
              >
                <h3 className="font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-[#9C91AA]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductReviewsSection
        reviews={reviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      {/* ── Related products ── */}
      {displayRelated.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="mb-6 flex items-center gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${style.accent}`}>
                More From Our Collection
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                You May Also Like
              </h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#FF4DB8]/12 to-transparent" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayRelated.map((rp) => {
              const rpStyle =
                themeStyles[rp.visualTheme] ?? themeStyles["blush-violet"];
              return (
                <article
                  key={rp.id}
                  className={`aev-product-card aev-flagship-card-r1 group min-w-0 overflow-hidden rounded-[1.75rem] border bg-[#151024] p-3 ${rpStyle.border}`}
                >
                  <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.06] bg-[#0B0F1A]">
                    <div className="relative aspect-square w-full">
                      {rp.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rp.imageUrl}
                          alt={rp.name}
                          className="absolute inset-0 h-full w-full object-contain p-3"
                        />
                      ) : (
                        <ProductVisual
                          visualTheme={rp.visualTheme}
                          label={rp.absorbency}
                        />
                      )}
                    </div>
                  </div>
                  <div className="px-2 pb-3 pt-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${rpStyle.badge}`}
                    >
                      {rp.absorbency}
                    </span>
                    <h3 className="mt-3 break-words text-lg font-semibold leading-tight text-white [overflow-wrap:anywhere]">
                      {rp.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9C91AA]">
                      {rp.shortDescription}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-2xl font-semibold text-[#FFB3D1]">
                        {formatProductPrice(rp)}
                      </span>
                      <Link
                        href={`/product/${rp.slug}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[#D8CBE8] transition ${rpStyle.border}`}
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <SiteFooter settings={settings} />

      {/* ── Lightbox ── */}
      {lightboxOpen && selectedMedia?.type === "image" && (
        <div
          className="aev-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Product image enlarged view"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image view"
            className="absolute right-4 top-4 z-10 rounded-full border border-[#FF4DB8]/22 bg-[#080611]/80 p-2 text-[#D8CBE8] backdrop-blur-md transition hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedMedia.url}
            alt={displayProduct.name}
            className="aev-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Mobile sticky add-to-cart bar — sits above bottom nav ── */}
      <div className="fixed bottom-14 left-0 right-0 z-30 border-t border-[#FF4DB8]/12 bg-[#080611]/96 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.50)] backdrop-blur-md md:bottom-0 md:pb-[calc(1rem+env(safe-area-inset-bottom))] md:pt-3 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-semibold text-[#FFB3D1]">
                {formatProductPrice(displayProduct)}
              </p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stockBadgeClass(displayProduct.stockStatus)}`}>
                {stockStatusLabel(displayProduct.stockStatus)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[#9C91AA]">
              {selectedSummary || "Select your preferred options"} · Qty {quantity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-full border border-[#FF4DB8]/18 bg-[#1B1230] min-[420px]:flex">
              <button
                onClick={decreaseQuantity}
                disabled={!canAddToCart || quantity <= 1}
                className="p-3 text-[#D8CBE8] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold text-white">
                {quantity}
              </span>
              <button
                onClick={increaseQuantity}
                disabled={!canAddToCart}
                className="p-3 text-[#D8CBE8] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => handleAddToCart(false)}
              disabled={!canAddToCart}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                canAddToCart
                  ? `bg-gradient-to-r shadow-[0_4px_20px_rgba(255,77,184,0.38)] hover:scale-[1.01] ${style.primary}`
                  : "cursor-not-allowed bg-[#1B1230] text-[#6B5F7A]/50"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              {canAddToCart ? "Add" : "Out"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function VariantSelector({
  label,
  options,
  selected,
  onSelect,
  selectedClassName,
  hint,
  type = "text",
  disabled = false,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  selectedClassName: string;
  hint?: string;
  type?: "text" | "color";
  disabled?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#9C91AA]/70">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            disabled={disabled}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
              selected === option
                ? selectedClassName
                : "border-white/10 bg-[#1B1230] text-[#D8CBE8] hover:border-[#FF4DB8]/28 hover:bg-[#211633]"
            }`}
          >
            {type === "color" && <ColorSwatch color={option} />}
            {option}
          </button>
        ))}
      </div>
      {hint && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#9C91AA]">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

function ColorSwatch({ color }: { color: string }) {
  const normalized = color.trim().toLowerCase();
  const swatchClass =
    normalized.includes("black")
      ? "bg-zinc-950"
      : normalized.includes("nude")
        ? "bg-[#d7b59b]"
        : normalized.includes("pink")
          ? "bg-[#FF80C8]"
          : normalized.includes("white")
            ? "bg-white"
            : normalized.includes("rose")
              ? "bg-rose-400"
              : "bg-gradient-to-br from-[#FF4DB8] to-[#A855F7]";

  return (
    <span
      className={`h-4 w-4 rounded-full border border-[#FF4DB8]/30 ${swatchClass}`}
      aria-hidden="true"
    />
  );
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5 text-[#FFB84D]" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rounded ? "fill-current" : "fill-transparent opacity-45"}`}
        />
      ))}
    </span>
  );
}

function ProductReviewsSection({
  reviews,
  averageRating,
  reviewCount,
}: {
  reviews: PublicProductReview[];
  averageRating: number;
  reviewCount: number;
}) {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 shadow-[0_18px_70px_rgba(255,77,184,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00D4C6]/75">
              Customer Reviews
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              Real feedback after purchase
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9C91AA]">
              Reviews are shown only after admin moderation and approval.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FFB84D]/18 bg-[#FFB84D]/[0.06] px-4 py-3">
            <StarRating rating={averageRating} />
            <p className="mt-2 text-sm font-semibold text-white">
              {reviewCount > 0 ? `${averageRating.toFixed(1)} average · ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[1.35rem] border border-dashed border-[#00D4C6]/22 bg-[#00D4C6]/[0.045] p-5 text-sm leading-7 text-[#D8CBE8]">
            No reviews yet. Customers can write a review from their account after a confirmed purchase.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[1.35rem] border border-[#FF4DB8]/12 bg-[#1B1230] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating rating={review.rating} />
                  {review.isFeatured && (
                    <span className="rounded-full border border-[#00D4C6]/25 bg-[#00D4C6]/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#31E6D4]">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="mt-3 break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
                  {review.title || "Customer review"}
                </h3>
                <p className="mt-2 text-xs text-[#9C91AA]">
                  {review.customerName} · {formatReviewDate(review.approvedAt || review.createdAt)}
                </p>
                <p className="mt-3 break-words text-sm leading-7 text-[#D8CBE8]/80 [overflow-wrap:anywhere]">
                  {review.body}
                </p>
                {review.mediaUrls.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {review.mediaUrls.slice(0, 3).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

function ProductAccordion({
  title,
  items,
  accentClassName,
  defaultOpen = false,
}: {
  title: string;
  items: string[];
  accentClassName: string;
  defaultOpen?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <details
      open={defaultOpen}
      className="group border-b border-[#FF4DB8]/[0.08] last:border-b-0"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-white marker:hidden">
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition group-open:rotate-180 ${accentClassName}`} />
      </summary>
      <div className="space-y-2 pb-4">
        {items.map((item, index) => (
          <p
            key={`${item}-${index}`}
            className="rounded-2xl border border-[#FF4DB8]/[0.08] bg-[#1B1230] px-4 py-3 text-sm leading-6 text-[#9C91AA]"
          >
            {item}
          </p>
        ))}
      </div>
    </details>
  );
}

function ProductFaqAccordion({
  faqs,
  accentClassName,
}: {
  faqs: { question: string; answer: string }[];
  accentClassName: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <details className="group border-b border-[#FF4DB8]/[0.08] last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-white marker:hidden">
        <span>FAQs</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition group-open:rotate-180 ${accentClassName}`} />
      </summary>
      <div className="space-y-3 pb-4">
        {faqs.map((faq, index) => (
          <div
            key={`${faq.question}-${index}`}
            className="rounded-2xl border border-[#FF4DB8]/[0.08] bg-[#1B1230] px-4 py-3"
          >
            <p className="text-sm font-semibold text-white">{faq.question}</p>
            <p className="mt-1 text-sm leading-6 text-[#9C91AA]">{faq.answer}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
