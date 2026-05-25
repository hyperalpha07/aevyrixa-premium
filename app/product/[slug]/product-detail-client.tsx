"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  Info,
  LockKeyhole,
  MessageCircle,
  Minus,
  PackageCheck,
  Play,
  Plus,
  Repeat2,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import ProductVisual from "@/app/components/product-visual";
import StorefrontProductCard from "@/app/components/storefront-product-card";
import { useCart } from "@/app/components/cart/cart-context";
import {
  displayBenefits,
  displayCare,
  isPurchasableStock,
  publicProduct,
  stockBadgeClass,
  stockStatusLabel,
} from "@/app/lib/product-display";
import { formatProductPrice, type ProductVisualTheme } from "@/app/lib/products";
import type { ProductCatalogItem } from "@/app/lib/product-types";
import SiteFooter from "@/app/components/site-footer";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";
import type { PublicProductReview } from "@/app/lib/review-types";
import {
  extractProductCmsContent,
  inferMediaType,
  productSectionLabels,
  safeColorHex,
  type ProductBenefitItem,
  type ProductColorOption,
  type ProductContentBlock,
  type ProductSectionMedia,
  type ProductSectionMediaKey,
} from "@/app/lib/product-content";

const themeStyles: Record<
  ProductVisualTheme,
  {
    accent: string;
    badge: string;
    selected: string;
    primary: string;
    glow: string;
    border: string;
  }
> = {
  "blush-violet": {
    accent: "text-[#FF4DB8]",
    badge: "border-[#FF4DB8]/24 bg-[#FF4DB8]/[0.08] text-[#FFB3D1]",
    selected: "border-[#FF4DB8]/60 bg-[#FF4DB8]/[0.10] text-[#FFB3D1]",
    primary: "from-[#FF4DB8] to-[#FF3FA4] text-white",
    glow: "bg-[#FF4DB8]/[0.12]",
    border: "border-[#FF4DB8]/18 hover:border-[#FF4DB8]/40",
  },
  "cyan-night": {
    accent: "text-[#31E6D4]",
    badge: "border-[#00D4C6]/24 bg-[#00D4C6]/[0.08] text-[#31E6D4]",
    selected: "border-[#00D4C6]/60 bg-[#00D4C6]/[0.10] text-[#31E6D4]",
    primary: "from-[#00D4C6] to-[#0FB8AC] text-[#080611]",
    glow: "bg-[#00D4C6]/[0.10]",
    border: "border-[#00D4C6]/18 hover:border-[#00D4C6]/40",
  },
  "rose-gold": {
    accent: "text-[#C084FC]",
    badge: "border-[#A855F7]/24 bg-[#A855F7]/[0.10] text-[#C084FC]",
    selected: "border-[#A855F7]/60 bg-[#A855F7]/[0.12] text-[#C084FC]",
    primary: "from-[#A855F7] to-[#8B5CF6] text-white",
    glow: "bg-[#A855F7]/[0.12]",
    border: "border-[#A855F7]/18 hover:border-[#A855F7]/40",
  },
};

const safeSupportFallbackFaqs = [
  {
    question: "How should I check the size?",
    answer: "Check fit over clean underwear or clean fitted clothing only before direct wear.",
  },
  {
    question: "What keeps an item eligible for support?",
    answer:
      "Items should remain unused, unwashed, and in original packaging with tags and hygiene liner or seal intact where applicable.",
  },
  {
    question: "When should I contact support?",
    answer:
      "Contact support within the 3-Day Hygiene-Safe Support window for eligible order, size, wrong item, or damaged item concerns.",
  },
];

const productTickerItems = [
  { label: "Discreet Packaging", icon: PackageCheck },
  { label: "3-Day Hygiene-Safe Support", icon: ShieldCheck },
  { label: "Bangladesh Delivery", icon: Truck },
  { label: "Secure Checkout", icon: LockKeyhole },
  { label: "Premium Comfort", icon: HeartHandshake },
  { label: "Reusable Care", icon: Repeat2 },
  { label: "BDT Pricing", icon: CreditCard },
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
  const hms = settings.homepageMediaSettings;
  const benefits = displayBenefits(displayProduct);
  const care = displayCare(displayProduct);
  const cms = extractProductCmsContent(displayProduct.media, displayProduct.colors);
  const colorOptions = cms.colorOptions;
  const displayColorNames =
    colorOptions.length > 0 ? colorOptions.map((option) => option.name) : displayProduct.colors;
  const sectionMediaEntries = (Object.keys(productSectionLabels) as ProductSectionMediaKey[])
    .map((key) => ({ key, media: cms.sectionMedia[key] }))
    .filter((entry): entry is { key: ProductSectionMediaKey; media: ProductSectionMedia } =>
      Boolean(entry.media?.url)
    );
  const contentBlocks = cms.contentBlocks;
  const style =
    themeStyles[displayProduct.visualTheme] ?? themeStyles["blush-violet"];
  const canAddToCart = isPurchasableStock(displayProduct.stockStatus);

  const [selectedSize, setSelectedSize] = useState(displayProduct.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(displayColorNames[0] || "");
  const [selectedAbsorbency, setSelectedAbsorbency] = useState(
    displayProduct.absorbencyOptions[0] || displayProduct.absorbency
  );
  const [quantity, setQuantity] = useState(1);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [brokenMediaUrls, setBrokenMediaUrls] = useState<Set<string>>(
    () => new Set()
  );

  const mediaItems: MediaItem[] = [];
  const seenUrls = new Set<string>();
  if (displayProduct.imageUrl) {
    seenUrls.add(displayProduct.imageUrl);
    mediaItems.push({ type: "image", url: displayProduct.imageUrl });
  }
  const extraImages = Array.isArray(displayProduct.images) ? displayProduct.images : [];
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
  const selectedColorOption = colorOptions.find(
    (option) => option.name.toLowerCase() === selectedColor.toLowerCase()
  );
  const colorSpecificMedia = selectedColorOption?.mediaUrl
    ? {
        type: inferMediaType(selectedColorOption.mediaUrl, selectedColorOption.mediaType),
        url: selectedColorOption.mediaUrl,
        poster: selectedColorOption.mediaType === "video" ? displayProduct.imageUrl : undefined,
      } satisfies MediaItem
    : null;

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const safeIndex = Math.min(selectedMediaIndex, Math.max(0, mediaItems.length - 1));
  const selectedMedia =
    colorSpecificMedia && !brokenMediaUrls.has(colorSpecificMedia.url)
      ? colorSpecificMedia
      : mediaItems.length > 0 && !brokenMediaUrls.has(mediaItems[safeIndex].url)
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
    settings.privacyPackagingMessage || "Orders ship in discreet privacy packaging.";
  const supportText =
    settings.supportWindowMessage || "3-Day Hygiene-Safe Support on eligible concerns.";
  const sizeFitItems = [
    displayProduct.sizes.length > 0
      ? `Available sizes: ${displayProduct.sizes.join(", ")}`
      : "Size availability is shown before checkout.",
    "If you are between sizes, choose the fit that feels more comfortable around the waist and leg opening.",
    "Check fit over clean clothing before direct wear.",
  ];

  const [lightboxOpen, setLightboxOpen] = useState(false);
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || mediaItems.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < 50) return;
    setSelectedMediaIndex((i) =>
      delta < 0 ? (i + 1) % mediaItems.length : (i - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => q + 1);

  const handleAddToCart = (goToCart = false) => {
    if (!canAddToCart) return;
    if (displayProduct.sizes.length > 0 && !selectedSize) {
      setSelectionMessage("Please select a size before adding this item.");
      return;
    }
    if (displayColorNames.length > 0 && !selectedColor) {
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
        id: buildCartLineId(displayProduct, selectedSize, selectedColor, selectedAbsorbency),
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

  const productSignalBadges = [
    displayProduct.badgeText,
    displayProduct.isBestSeller ? "Best Seller" : "",
    displayProduct.isTrending ? "Trending" : "",
    displayProduct.isNewArrival ? "New Arrival" : "",
  ].filter((badge): badge is string => Boolean(badge));
  const supportFaqs = [
    { question: hms.faqPreviewItem1Question, answer: hms.faqPreviewItem1Answer },
    { question: hms.faqPreviewItem2Question, answer: hms.faqPreviewItem2Answer },
    { question: hms.faqPreviewItem3Question, answer: hms.faqPreviewItem3Answer },
  ].filter((faq) => faq.question && faq.answer);
  const cmsFaqs = cms.faqItems
    .filter((faq) => faq.visible)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((faq) => ({ question: faq.question, answer: faq.answer }));
  const displayFaqs =
    cmsFaqs.length > 0 ? cmsFaqs : supportFaqs.length > 0 ? supportFaqs : safeSupportFallbackFaqs;
  const promiseCards =
    cms.benefitItems.filter((item) => item.visible).length > 0
      ? cms.benefitItems
          .filter((item) => item.visible)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
          .slice(0, 4)
          .map((item) => ({
            title: item.title,
            body: item.description,
            badge: item.badge,
            iconKey: item.iconKey,
          }))
      : benefits.slice(0, 4).map((benefit, index) => ({
          title: ["Comfort", "Packaging", "Care", "Guidance"][index] || "Comfort point",
          body: benefit,
          badge: ["Daily routine", "Discreet", "Reusable", "Clear info"][index] || "Her Care",
          iconKey: "sparkles",
        }));
  const carePanels = [
    { icon: Ruler, title: "Fit", items: sizeFitItems.slice(0, 3), tone: "text-[#FF4DB8]" },
    { icon: CheckCircle2, title: "Care", items: care.slice(0, 3), tone: "text-[#31E6D4]" },
    {
      icon: ShieldCheck,
      title: "Support",
      items: [
        supportText,
        "Keep hygiene seal and packaging intact until fit is confirmed.",
        "Message us for size, care, or order help before checkout.",
      ],
      tone: "text-[#C084FC]",
    },
  ];
  return (
    <main className="aev-bloom-product aev-product-page-shell min-h-screen overflow-x-hidden bg-[#080611] pb-[calc(var(--aev-mobile-bottom-nav-height)+6rem+env(safe-area-inset-bottom,0px))] text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_48%_at_18%_26%,rgba(255,77,184,0.11),transparent_62%),radial-gradient(ellipse_50%_40%_at_82%_64%,rgba(0,212,198,0.08),transparent_60%),linear-gradient(180deg,#080611,#090713_48%,#050711)]" />

      <SiteHeader
        active="product"
        productHref={`/product/${displayProduct.slug}`}
        settings={settings}
      />

      <section className="aev-product-ticker relative z-[2]" aria-label="Aevyrixa service highlights">
        <div className="aev-product-ticker-track">
          {[0, 1].map((group) => (
            <div className="aev-product-ticker-group" key={group}>
              {productTickerItems.map(({ label, icon: Icon }) => (
                <span className="aev-product-ticker-item" key={`${group}-${label}`}>
                  <Icon className="h-3.5 w-3.5 text-white/90" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="aev-bloom-hero relative z-[2] mx-auto grid box-border w-full max-w-[78rem] items-start gap-5 px-4 pb-10 pt-20 sm:gap-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(29rem,32rem)] lg:gap-8 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="pointer-events-none absolute left-[-1rem] top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-serif text-[12vw] font-light leading-[0.85] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.035)] lg:block">
          Aevyrixa
        </div>

        <div className="aev-product-info-card relative z-[1] order-2 min-w-0 overflow-hidden rounded-[2px_42px_2px_42px] border border-[#FF4DB8]/12 bg-[#0D0918]/82 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6 lg:order-1 lg:p-7">
          <div className="aev-premium-edge-line" aria-hidden="true" />
          <div className="mb-5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#6B5F7A]">
            <Link href="/" className="transition hover:text-[#FF4DB8]">Home</Link>
            <span>/</span>
            <Link href="/product" className="transition hover:text-[#FF4DB8]">Products</Link>
            <span>/</span>
            <span className="truncate text-[#9C91AA]">{displayProduct.name}</span>
          </div>

          <div className="mb-5 flex flex-wrap gap-1.5">
            <span className={`rounded-[3px] border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${style.badge}`}>
              {displayProduct.absorbency}
            </span>
            {productSignalBadges.slice(0, 2).map((badge) => (
              <span key={badge} className="rounded-[3px] border border-[#A855F7]/25 bg-[#A855F7]/[0.12] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#C084FC]">
                {badge}
              </span>
            ))}
            <span className={`rounded-[3px] border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${stockBadgeClass(displayProduct.stockStatus)}`}>
              {stockStatusLabel(displayProduct.stockStatus)}
            </span>
          </div>

          <h1 className="aev-product-mobile-title max-w-[12ch] break-words font-serif text-[2.1rem] font-light leading-[1.04] tracking-normal text-white [overflow-wrap:anywhere] sm:text-5xl lg:text-[3.35rem]">
            {displayProduct.name}
          </h1>

          {(displayProduct.shortDescription || displayProduct.description) && (
            <p className="aev-product-mobile-copy mt-4 max-w-[27rem] border-l-2 border-[#FF4DB8]/30 pl-4 text-[13px] leading-7 text-[#9C91AA]">
              {displayProduct.shortDescription || displayProduct.description}
            </p>
          )}

          <div className="aev-product-mobile-price mt-5 inline-flex flex-wrap items-baseline gap-2 rounded-md border border-white/[0.08] bg-white/[0.035] px-4 py-3 sm:px-5">
            <span className="font-serif text-4xl leading-none text-white">
              {formatProductPrice(displayProduct)}
            </span>
            {typeof displayProduct.compareAtPrice === "number" && (
              <span className="text-sm text-[#6B5F7A] line-through">
                {formatProductPrice({
                  price: displayProduct.compareAtPrice,
                  currency: displayProduct.currency,
                })}
              </span>
            )}
            {hasSavings && (
              <span className="rounded-[3px] border border-[#00D4C6]/25 bg-[#00D4C6]/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#31E6D4]">
                Save {savingsPct}%
              </span>
            )}
          </div>

          <div className="aev-product-mobile-rating mt-4 flex flex-wrap items-center gap-2 text-xs text-[#6B5F7A]">
            <StarRating rating={averageRating} />
            <span>
              {reviewCount > 0
                ? `${averageRating.toFixed(1)} from ${reviewCount} approved ${reviewCount === 1 ? "review" : "reviews"}`
                : "No approved reviews yet"}
            </span>
            <Link href="#reviews" className="font-semibold text-[#FF4DB8] hover:text-[#FFB3D1]">
              View reviews
            </Link>
          </div>

          <div className="aev-product-mobile-options mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <VariantSelector
              label="Size"
              options={displayProduct.sizes}
              selected={selectedSize}
              onSelect={(value) => {
                setSelectedSize(value);
                setSelectionMessage("");
              }}
              selectedClassName={style.selected}
              hint="Check size over clean underwear or clothing only before direct wear."
              disabled={!canAddToCart}
            />
            <VariantSelector
              label="Color"
              options={displayColorNames}
              colorOptions={colorOptions}
              selected={selectedColor}
              onSelect={(value) => {
                setSelectedColor(value);
                setSelectionMessage("");
                setSelectedMediaIndex(0);
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
          </div>

          <div className="aev-product-mobile-controls mt-5 flex flex-wrap items-center gap-2">
            <div className="aev-product-qty-control flex overflow-hidden rounded border border-white/[0.08] bg-white/[0.035]">
              <button
                onClick={decreaseQuantity}
                disabled={!canAddToCart || quantity <= 1}
                className="h-8 w-8 text-[#D8CBE8] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                aria-label="Decrease quantity"
              >
                <Minus className="mx-auto h-4 w-4" />
              </button>
              <span className="flex h-8 w-10 items-center justify-center text-sm font-semibold text-white">
                {quantity}
              </span>
              <button
                onClick={increaseQuantity}
                disabled={!canAddToCart}
                className="h-8 w-8 text-[#D8CBE8] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-[#6B5F7A]/40"
                aria-label="Increase quantity"
              >
                <Plus className="mx-auto h-4 w-4" />
              </button>
            </div>
            <Link
              href={supportHref}
              className="aev-product-help-button inline-flex h-8 flex-1 items-center justify-center gap-2 rounded border border-[#25D366]/20 bg-[#25D366]/[0.055] px-3 text-[11px] font-semibold text-[#25D366] shadow-[0_0_18px_rgba(37,211,102,0.06)] transition hover:border-[#25D366]/35 hover:bg-[#25D366]/[0.10] sm:flex-none"
            >
              {settings.whatsappUrl ? <WhatsAppIcon className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
              {supportLabel}
            </Link>
          </div>

          {selectionMessage && (
            <p className="mt-3 rounded border border-[#FF4DB8]/24 bg-[#FF4DB8]/[0.07] px-3 py-2 text-xs leading-5 text-[#FFB3D1]">
              {selectionMessage}
            </p>
          )}

          <div className="aev-product-mobile-cta mt-4 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={!canAddToCart}
              className={`aev-product-cta-button min-h-11 rounded bg-gradient-to-r px-5 text-[12px] font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-[#1B1230] disabled:to-[#1B1230] disabled:text-[#6B5F7A]/50 ${style.primary}`}
            >
              {canAddToCart ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              onClick={() => handleAddToCart(true)}
              disabled={!canAddToCart}
              className="aev-product-cta-button min-h-11 rounded border border-white/[0.08] bg-transparent px-5 text-[12px] font-semibold text-white transition hover:border-[#FF4DB8]/35 hover:text-[#FFB3D1] disabled:cursor-not-allowed disabled:text-[#6B5F7A]/50"
            >
              {canAddToCart ? "Add and View Cart" : "Unavailable"}
            </button>
          </div>

          <div className="aev-product-support-cards mt-4 grid gap-1.5">
            {[
              { icon: PackageCheck, text: privacyText },
              { icon: Truck, text: deliveryText },
              { icon: ShieldCheck, text: supportText },
            ].map(({ icon: Icon, text }, index) => (
              <div key={`${text}-${index}`} className="aev-product-support-card flex items-start gap-2 rounded border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[11px] leading-5 text-[#9C91AA]">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${index === 1 ? "text-[#31E6D4]" : style.accent}`} />
                <span className="min-w-0">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[1] order-1 lg:order-2 lg:pr-1">
          <div
            className="aev-bloom-media-frame relative aspect-[0.9/1] overflow-hidden rounded-[2px_54px_2px_54px] border border-[#FF4DB8]/12 bg-[linear-gradient(145deg,#211633,#100A1E,#080611)] lg:aspect-[0.88/1]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="aev-premium-edge-line" aria-hidden="true" />
            <div className={`aev-bloom-media-glow pointer-events-none absolute inset-10 rounded-full blur-[76px] ${style.glow}`} />
            <div className="aev-bloom-media-ring pointer-events-none absolute left-1/2 top-1/2 h-[54%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF4DB8]/10" />
            <div className="aev-bloom-media-ring aev-bloom-media-ring-delay pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#31E6D4]/[0.07]" />
            {selectedMedia?.type === "video" ? (
              <video
                src={selectedMedia.url}
                poster={selectedMedia.poster}
                controls
                playsInline
                preload="metadata"
                className="aev-bloom-product-media relative h-full w-full bg-[#080611] object-contain"
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
                className="aev-bloom-product-media relative h-full w-full cursor-zoom-in object-contain p-4 transition duration-500 hover:scale-[1.015] sm:p-8"
                onClick={() => setLightboxOpen(true)}
                onError={() =>
                  setBrokenMediaUrls((urls) => new Set(urls).add(selectedMedia.url))
                }
              />
            ) : (
              <ProductVisual
                visualTheme={displayProduct.visualTheme}
                label={displayProduct.absorbency}
                className="aev-bloom-product-media"
              />
            )}
            <div className="pointer-events-none absolute left-0 top-0 z-[3] h-16 w-16 border-l border-t border-[#FF4DB8]/35" />
            <div className="pointer-events-none absolute bottom-0 right-0 z-[3] h-16 w-16 border-b border-r border-[#FF4DB8]/35" />
            <div className="absolute bottom-5 left-0 right-0 z-[3] flex justify-between gap-3 px-5">
              <span className="rounded-sm border border-[#FF4DB8]/14 bg-[#080611]/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#FF4DB8]/70 backdrop-blur">
                {displayProduct.category || "Aevyrixa Her Care"}
              </span>
              <span className="rounded-sm border border-[#00D4C6]/14 bg-[#080611]/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#31E6D4]/70 backdrop-blur">
                {displayProduct.absorbency}
              </span>
            </div>
          </div>

          {showThumbnails && (
            <div className="mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
              {mediaItems.map((item, index) => (
                <button
                  key={`${item.type}-${item.url}-${index}`}
                  onClick={() => setSelectedMediaIndex(index)}
                  aria-label={item.type === "video" ? "Play video" : `Product image ${index + 1}`}
                  disabled={brokenMediaUrls.has(item.url)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[4px_20px_4px_20px] border bg-white/[0.035] transition ${
                    safeIndex === index
                      ? "border-[#FF4DB8]/60 bg-[#FF4DB8]/[0.08] shadow-[0_0_22px_rgba(255,77,184,0.16)]"
                      : "border-white/[0.08] hover:border-[#FF4DB8]/35"
                  } ${brokenMediaUrls.has(item.url) ? "cursor-not-allowed opacity-35" : ""}`}
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
                    <span className="flex h-full w-full items-center justify-center bg-[#1B1230]">
                      <Play className="h-4 w-4 fill-[#FF4DB8] text-[#FF4DB8]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {(displayProduct.description || sectionMediaEntries.length > 0 || contentBlocks.length > 0) && (
        <ProductContentMediaSections
          description={displayProduct.description}
          sectionMediaEntries={sectionMediaEntries}
          contentBlocks={contentBlocks}
          productName={displayProduct.name}
        />
      )}

      {promiseCards.length > 0 && (
        <section className="relative z-[2] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-7 lg:px-12">
            <SectionHeading
              eyebrow="Promise"
              title="Why customers choose it"
              description=""
            />
            <div className="aev-trust-reasons mt-7 grid gap-3">
              {promiseCards.map((card, index) => (
                <article
                  key={`${card.body}-${index}`}
                  className="aev-trust-reason-row group relative grid gap-3 overflow-hidden rounded border border-white/[0.08] bg-white/[0.035] p-4 transition duration-300 hover:border-[#FF4DB8]/24 hover:bg-[#FF4DB8]/[0.045] sm:grid-cols-[3.25rem_1fr_1.45fr] sm:items-center sm:p-5"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="aev-trust-line-sweep" aria-hidden="true" />
                  <div className="font-serif text-3xl italic leading-none text-[#FF4DB8]/35">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="sm:pr-8">
                    <h3 className="font-serif text-lg text-white sm:text-xl">{card.title}</h3>
                    <span className="mt-2 inline-flex rounded-sm border border-[#FF4DB8]/20 bg-[#FF4DB8]/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#FFB3D1]">
                      {card.badge || "Her Care"}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[#D8CBE8]/82">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative z-[2] border-y border-white/[0.08] bg-[#0D0918] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-7 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:items-end">
            <SectionHeading
              eyebrow={hms.faqPreviewEyebrow || "Guidance"}
              title={hms.faqPreviewHeading || "Fit, Care & Support"}
              description=""
            />
            <p className="max-w-3xl text-sm leading-7 text-[#9C91AA]">
              Everything about fit, washing, and after-purchase support in one place. If still unsure, support is one message away.
            </p>
          </div>
          <div className="mt-9 grid gap-0 sm:grid-cols-3">
            {carePanels.map(({ icon: Icon, title, items, tone }) => (
              <article key={title} className="aev-clean-hover-line border border-white/[0.06] bg-[#080611] p-6">
                <Icon className={`h-6 w-6 ${tone}`} />
                <h3 className="mt-4 font-serif text-lg text-white">{title}</h3>
                <div className="mt-3 space-y-2">
                  {items.map((item, index) => (
                    <p key={`${title}-${index}`} className="text-xs leading-6 text-[#9C91AA]">
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 overflow-hidden rounded border border-white/[0.08]">
            {displayFaqs.map((faq, index) => (
              <details key={`${faq.question}-${index}`} className="group border-b border-white/[0.08] last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white marker:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#FF4DB8] transition group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-4 text-xs leading-6 text-[#9C91AA]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ProductReviewsSection
        reviews={reviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      {displayRelated.length > 0 && (
        <section className="aev-related-recommendations relative z-[2] mx-auto max-w-7xl px-3 pb-[calc(var(--aev-mobile-bottom-nav-height)+8rem+env(safe-area-inset-bottom,0px))] sm:px-7 sm:pb-16 lg:px-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="More From Our Collection"
              title="You May Also Like"
              description=""
            />
            <Link
              href="/product"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-[#FF4DB8]/20 bg-[#FF4DB8]/[0.08] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
            >
              Shop all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="aev-related-grid grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
            {displayRelated.map((rp) => (
              <StorefrontProductCard key={rp.id} product={rp} compact recommendation />
            ))}
          </div>
        </section>
      )}

      <div className="hidden lg:block">
        <SiteFooter settings={settings} />
      </div>

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

      <div className="aev-mobile-buy-bar fixed bottom-[calc(var(--aev-mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 border-t border-[#FF4DB8]/14 bg-[#080611]/96 px-3 py-3 shadow-[0_-14px_38px_rgba(0,0,0,0.54),0_-1px_0_rgba(255,77,184,0.16)] backdrop-blur-md md:bottom-0 lg:hidden">
        <div className="aev-mobile-buy-bar-inner mx-auto grid w-full max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[#FFB3D1]">
              {formatProductPrice(displayProduct)}
            </p>
            <p className="aev-mobile-buy-summary text-[11px] leading-4 text-[#9C91AA]">
              {selectedSummary || "Select your preferred options"} / Qty {quantity}
            </p>
          </div>
          <button
            onClick={() => handleAddToCart(false)}
            disabled={!canAddToCart}
            className={`aev-mobile-buy-button flex min-h-11 w-[6.75rem] shrink-0 items-center justify-center gap-1.5 rounded px-3 text-sm font-semibold transition ${
              canAddToCart
                ? `bg-gradient-to-r shadow-[0_4px_20px_rgba(255,77,184,0.38)] ${style.primary}`
                : "cursor-not-allowed bg-[#1B1230] text-[#6B5F7A]/50"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </main>
  );
}

function ProductContentMediaSections({
  description,
  sectionMediaEntries,
  contentBlocks,
  productName,
}: {
  description: string;
  sectionMediaEntries: Array<{ key: ProductSectionMediaKey; media: ProductSectionMedia }>;
  contentBlocks: ProductContentBlock[];
  productName: string;
}) {
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [defaultMediaCount, setDefaultMediaCount] = useState(6);
  const galleryMedia = [
    ...sectionMediaEntries.map(({ key, media }) => ({
      id: `section-${key}`,
      title: productSectionLabels[key],
      media,
    })),
    ...contentBlocks
      .filter((block) => block.mediaUrl)
      .map((block) => ({
        id: `block-${block.id}`,
        title: block.title || block.subtitle || "Product media",
        media: {
          url: block.mediaUrl,
          type: block.mediaType,
          alt: block.mediaAlt,
          fit: block.mediaFit || "contain",
          position: block.mediaObjectPosition || "center",
        } satisfies ProductSectionMedia,
      })),
  ].filter((item) => item.media.url);
  const visibleGalleryMedia = showAllMedia ? galleryMedia : galleryMedia.slice(0, defaultMediaCount);
  const hiddenMediaCount = Math.max(0, galleryMedia.length - visibleGalleryMedia.length);

  useEffect(() => {
    const updateCount = () => setDefaultMediaCount(window.matchMedia("(max-width: 767px)").matches ? 4 : 6);
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  return (
    <section className="relative z-[2] border-y border-white/[0.07] bg-[#0B0814] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-7 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          {description && (
            <div className="rounded border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
              <SectionHeading eyebrow="Story" title="Product details" description="" />
              <div className="mt-4 space-y-4 text-sm leading-8 text-[#D8CBE8]/76">
                {description
                  .split(/\n{2,}/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 16)}-${index}`}>{paragraph}</p>
                  ))}
              </div>
            </div>
          )}
          {galleryMedia.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#FF4DB8]">
                    Product Gallery
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-white">A closer look</h3>
                </div>
                {galleryMedia.length > defaultMediaCount && (
                  <span className="rounded border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] text-[#9C91AA]">
                    {galleryMedia.length} media
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleGalleryMedia.map((item, index) => (
                  <article key={item.id} className="group overflow-hidden rounded border border-white/[0.08] bg-white/[0.035]">
                    <ProductInlineMedia
                      media={item.media}
                      fallbackAlt={`${productName} ${item.title}`}
                      compact
                    />
                    <div className="border-t border-white/[0.07] px-3 py-2">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9C91AA]">
                        {item.title || `Media ${index + 1}`}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              {galleryMedia.length > defaultMediaCount && (
                <button
                  type="button"
                  onClick={() => setShowAllMedia((value) => !value)}
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded border border-[#FF4DB8]/22 bg-[#FF4DB8]/[0.08] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
                >
                  {showAllMedia ? "Show less" : `Show more (${hiddenMediaCount})`}
                </button>
              )}
            </div>
          )}
        </div>

        {contentBlocks.length > 0 && (
          <div className="mt-8 grid gap-4">
            {contentBlocks.map((block) => (
              <ContentBlockCard key={block.id} block={block} productName={productName} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductInlineMedia({
  media,
  fallbackAlt,
  compact = false,
}: {
  media: ProductSectionMedia;
  fallbackAlt: string;
  compact?: boolean;
}) {
  const type = inferMediaType(media.url, media.type);
  const fitClass = media.fit === "cover" ? "object-cover" : "object-contain";
  const positionClass =
    media.position === "top"
      ? "object-top"
      : media.position === "bottom"
        ? "object-bottom"
        : "object-center";
  const sizeClass = compact
    ? "aspect-[4/3] min-h-[10rem]"
    : "aspect-[4/3] min-h-[14rem] max-h-[30rem]";
  return (
    <div className={`relative overflow-hidden rounded border border-[#FF4DB8]/12 bg-[linear-gradient(145deg,#211633,#100A1E,#080611)] ${sizeClass}`}>
      <div className="pointer-events-none absolute inset-8 rounded-full bg-[#FF4DB8]/10 blur-3xl" />
      {type === "video" ? (
        <video
          src={media.url}
          controls
          playsInline
          muted
          preload="metadata"
          className={`relative h-full w-full bg-[#080611] ${fitClass} ${positionClass}`}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.alt || fallbackAlt}
          loading="lazy"
          decoding="async"
          className={`relative h-full w-full ${media.fit === "cover" ? "" : "p-3 sm:p-4"} ${fitClass} ${positionClass}`}
        />
      )}
    </div>
  );
}

function ContentBlockCard({
  block,
  productName,
}: {
  block: ProductContentBlock;
  productName: string;
}) {
  const hasMedia = Boolean(block.mediaUrl);
  const media = hasMedia
    ? {
        url: block.mediaUrl,
        type: block.mediaType,
        alt: block.mediaAlt,
        fit: block.mediaFit || "contain",
        position: block.mediaObjectPosition || "center",
      }
    : null;
  const mediaNode = media ? (
    <ProductInlineMedia media={media} fallbackAlt={`${productName} ${block.title}`} />
  ) : null;
  const textNode = (
    <div className="p-4 sm:p-5">
      {block.title && <h3 className="font-serif text-2xl text-white">{block.title}</h3>}
      {block.subtitle && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFB3D1]">{block.subtitle}</p>}
      {block.text && <p className="mt-3 text-sm leading-7 text-[#D8CBE8]/76">{block.text}</p>}
      {block.longText && (
        <div className="mt-3 space-y-3 text-sm leading-7 text-[#9C91AA]">
          {block.longText
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${block.id}-long-${index}`}>{paragraph}</p>
            ))}
        </div>
      )}
      {block.ctaLabel && block.ctaLink && (
        <Link
          href={block.ctaLink}
          className="mt-4 inline-flex min-h-10 items-center rounded border border-[#FF4DB8]/22 bg-[#FF4DB8]/[0.08] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
        >
          {block.ctaLabel}
        </Link>
      )}
    </div>
  );

  if (!hasMedia || block.mediaPosition === "top") {
    return (
      <article className="overflow-hidden rounded border border-white/[0.08] bg-white/[0.035]">
        {mediaNode}
        {textNode}
      </article>
    );
  }

  return (
    <article className={`grid gap-0 overflow-hidden rounded border border-white/[0.08] bg-white/[0.035] ${block.mediaPosition === "full" ? "" : "lg:grid-cols-2"}`}>
      {block.mediaPosition === "left" && mediaNode}
      {textNode}
      {block.mediaPosition !== "left" && mediaNode}
    </article>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.49 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.86 11.86 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.42Zm-8.4 18.3h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.38a9.83 9.83 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.9-9.89 9.9Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#FF4DB8]">
          {eyebrow}
        </span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <h2 className="max-w-2xl font-serif text-4xl font-light leading-[1.05] text-white sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#9C91AA]">{description}</p>
      ) : null}
    </div>
  );
}

function VariantSelector({
  label,
  options,
  colorOptions = [],
  selected,
  onSelect,
  selectedClassName,
  hint,
  type = "text",
  disabled = false,
}: {
  label: string;
  options: string[];
  colorOptions?: ProductColorOption[];
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
      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B5F7A]">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option, index) => {
          const isSelected = selected === option;
          const colorOption = colorOptions.find(
            (item) => item.name.toLowerCase() === option.toLowerCase()
          );
          return (
            <button
              key={`${label}-${option}-${index}`}
              onClick={() => onSelect(option)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded border px-3 py-1.5 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
                isSelected
                  ? selectedClassName
                  : "border-white/[0.08] bg-white/[0.035] text-[#9C91AA] hover:border-[#FF4DB8]/40 hover:text-[#FFB3D1]"
              }`}
            >
              {type === "color" && <ColorSwatch color={option} option={colorOption} />}
              {option}
              {isSelected && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {hint && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-[#6B5F7A]">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

function ColorSwatch({ color, option }: { color: string; option?: ProductColorOption }) {
  const hex = option?.hex || safeColorHex(color);
  const style = option?.swatchImageUrl
    ? { backgroundImage: `url(${option.swatchImageUrl})` }
    : {
        background: option?.secondaryHex
          ? `linear-gradient(135deg, ${hex}, ${option.secondaryHex})`
          : hex,
      };

  return (
    <span
      className="h-2.5 w-2.5 rounded-full border border-[#FF4DB8]/30 bg-cover bg-center"
      style={style}
      aria-hidden="true"
    />
  );
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[#FFB84D]"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rounded ? "fill-current" : "fill-transparent opacity-45"}`}
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
  const ratingRows = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => Math.round(review.rating) === rating).length;
    const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
    return { rating, count, percent };
  });

  return (
    <section id="reviews" className="relative z-[2] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-7 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Reviews"
            title="Real and approved"
            description="Approved reviews are shown here. Verified purchase appears only when a review is linked to a real customer order."
          />
          <Link
            href="/account"
            className="inline-flex min-h-10 items-center justify-center rounded border border-[#FF4DB8]/24 bg-[#FF4DB8]/[0.08] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
          >
            Write a Review
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_15rem]">
          {reviews.length === 0 ? (
            <div className="lg:col-span-2 rounded border border-dashed border-[#00D4C6]/22 bg-[#00D4C6]/[0.045] p-6 text-sm leading-7 text-[#D8CBE8]">
              No approved reviews yet. The section will populate after eligible customer feedback is reviewed.
            </div>
          ) : (
            reviews.slice(0, 4).map((review) => (
              <article
                key={review.id}
                className="aev-clean-hover-line rounded border border-white/[0.08] bg-white/[0.035] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.08] text-xs font-bold text-[#FFB3D1]">
                    {review.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
                        {review.title || "Customer review"}
                      </h3>
                      {review.isFeatured && (
                        <span className="rounded border border-[#00D4C6]/25 bg-[#00D4C6]/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#31E6D4]">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B5F7A]">
                      {review.customerName} / {formatReviewDate(review.approvedAt || review.createdAt)}
                    </p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[#9C91AA]">{review.body}</p>
                <p className="mt-3">
                  <span className="rounded border border-[#00D4C6]/20 bg-[#00D4C6]/[0.07] px-2 py-1 text-[10px] font-semibold text-[#31E6D4]">
                    {review.verifiedPurchase && review.sourceType === "order-linked"
                      ? "Verified purchase"
                      : "Customer review"}
                  </span>
                </p>
                {review.mediaUrls.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {review.mediaUrls.slice(0, 3).map((url, index) =>
                      inferMediaType(url) === "video" ? (
                        <video
                          key={`${review.id}-${url}-${index}`}
                          src={url}
                          muted
                          playsInline
                          preload="metadata"
                          controls
                          className="h-16 w-16 shrink-0 rounded border border-white/10 bg-[#080611] object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${review.id}-${url}-${index}`}
                          src={url}
                          alt=""
                          loading="lazy"
                          className="h-16 w-16 shrink-0 rounded border border-white/10 object-cover"
                        />
                      )
                    )}
                  </div>
                )}
              </article>
            ))
          )}

          <aside className="rounded border border-white/[0.08] bg-[#0D0918] p-5 lg:sticky lg:top-20">
            <div className="font-serif text-5xl leading-none text-white">
              {reviewCount > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>
            <p className="mt-1 text-[11px] text-[#6B5F7A]">
              {reviewCount > 0
                ? `${reviewCount} approved ${reviewCount === 1 ? "review" : "reviews"}`
                : "No approved reviews"}
            </p>
            <div className="mt-5 space-y-2">
              {ratingRows.map(({ rating, count, percent }) => (
                <div key={rating} className="grid grid-cols-[2rem_1fr_1.5rem] items-center gap-2 text-[10px] text-[#9C91AA]">
                  <span>{rating} star</span>
                  <span className="h-1 overflow-hidden rounded bg-white/[0.06]">
                    <span
                      className="block h-full rounded bg-gradient-to-r from-[#FF4DB8] to-[#31E6D4]"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-right">{count}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}
