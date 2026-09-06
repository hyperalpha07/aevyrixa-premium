"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
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
  X,
  Maximize2,
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
import {
  colorImageUrl,
  initialProductOption,
  productCartLineId,
  productVariantSummary,
  validateProductSelections,
} from "@/app/lib/product-options";
import { isPublicProductImageAllowed } from "@/app/lib/public-product-media-safety";
import SiteFooter from "@/app/components/site-footer";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";
import { brandName } from "@/configs/brand/noromi";
import type { PublicProductReview } from "@/app/lib/review-types";
import {
  extractProductCmsContent,
  inferMediaType,
  productSectionLabels,
  safeColorHex,
  type ProductBenefitItem,
  type ProductColorOption,
  type ProductContentBlock,
  type ProductDescriptionMediaItem,
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

type PreviewMediaItem = {
  type: "image" | "video";
  url: string;
  poster?: string;
  alt: string;
};

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
  const descriptionMedia = cms.descriptionMedia.filter(
    (item) => item.visible !== false && isPublicProductImageAllowed(item.url)
  );
  const displayColorNames = displayProduct.colors.length > 0
    ? displayProduct.colors
    : colorOptions.map((option) => option.name);
  const sectionMediaEntries = (Object.keys(productSectionLabels) as ProductSectionMediaKey[])
    .map((key) => ({ key, media: cms.sectionMedia[key] }))
    .filter((entry): entry is { key: ProductSectionMediaKey; media: ProductSectionMedia } =>
      Boolean(entry.media?.url && isPublicProductImageAllowed(entry.media.url))
    );
  const contentBlocks = cms.contentBlocks.map((block) => ({
    ...block,
    mediaUrl: isPublicProductImageAllowed(block.mediaUrl) ? block.mediaUrl : "",
  })).filter((block) => block.title || block.subtitle || block.text || block.longText || block.mediaUrl);
  const style =
    themeStyles[displayProduct.visualTheme] ?? themeStyles["blush-violet"];
  const canAddToCart = isPurchasableStock(displayProduct.stockStatus);

  const [selectedSize, setSelectedSize] = useState(() => initialProductOption(displayProduct.sizes));
  const [selectedColor, setSelectedColor] = useState(() => initialProductOption(displayColorNames));
  const [selectedAbsorbency, setSelectedAbsorbency] = useState(() =>
    initialProductOption(displayProduct.absorbencyOptions)
  );
  const [quantity, setQuantity] = useState(1);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [brokenMediaUrls, setBrokenMediaUrls] = useState<Set<string>>(
    () => new Set()
  );
  const [lightboxItems, setLightboxItems] = useState<PreviewMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({
    rating: 5,
    title: "",
    body: "",
    mediaUrls: [] as string[],
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMediaUploading, setReviewMediaUploading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

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
  const colorSpecificMedia = selectedColorOption?.mediaUrl && isPublicProductImageAllowed(selectedColorOption.mediaUrl)
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
  const productPreviewMedia = mediaItems
    .filter((item) => !brokenMediaUrls.has(item.url))
    .map((item, index) => ({
      ...item,
      alt: item.type === "video" ? `${displayProduct.name} video` : `${displayProduct.name} image ${index + 1}`,
    }));
  const lightboxMedia = lightboxItems[lightboxIndex] ?? null;
  const hasLightboxNavigation = lightboxItems.length > 1;
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

  const openLightbox = (items: PreviewMediaItem[], index: number) => {
    const validItems = items.filter((item) => item.url && !brokenMediaUrls.has(item.url));
    if (validItems.length === 0) return;
    const selectedUrl = items[index]?.url;
    const validIndex = Math.max(
      0,
      selectedUrl ? validItems.findIndex((item) => item.url === selectedUrl) : index
    );
    setLightboxItems(validItems);
    setLightboxIndex(validIndex >= 0 ? validIndex : 0);
    setLightboxOpen(true);
  };
  const openProductMediaPreview = (index: number) => {
    const targetUrl = mediaItems[index]?.url;
    const previewIndex = Math.max(0, productPreviewMedia.findIndex((item) => item.url === targetUrl));
    openLightbox(productPreviewMedia, previewIndex);
  };
  const openSelectedMediaPreview = () => {
    if (!selectedMedia) return;
    if (colorSpecificMedia && selectedMedia.url === colorSpecificMedia.url) {
      openLightbox(
        [
          {
            ...colorSpecificMedia,
            alt: `${displayProduct.name} ${selectedColor || "selected color"}`,
          },
          ...productPreviewMedia.filter((item) => item.url !== colorSpecificMedia.url),
        ],
        0
      );
      return;
    }
    openProductMediaPreview(safeIndex);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const showPreviousLightboxMedia = () => {
    setLightboxIndex((index) => (index - 1 + lightboxItems.length) % lightboxItems.length);
  };
  const showNextLightboxMedia = () => {
    setLightboxIndex((index) => (index + 1) % lightboxItems.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft" && lightboxItems.length > 1) {
        setLightboxIndex((index) => (index - 1 + lightboxItems.length) % lightboxItems.length);
      }
      if (e.key === "ArrowRight" && lightboxItems.length > 1) {
        setLightboxIndex((index) => (index + 1) % lightboxItems.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxItems.length, lightboxOpen]);

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
    const selections = {
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      absorbency: selectedAbsorbency || undefined,
    };
    const selectionErrors = validateProductSelections(
      { ...displayProduct, colors: displayColorNames },
      selections
    );
    if (selectionErrors.length) {
      setSelectionMessage(selectionErrors[0]);
      return;
    }
    setSelectionMessage("");
    const variantSummary = productVariantSummary(selections);
    const fallbackCartImage = [
      displayProduct.primaryImageUrl,
      displayProduct.imageUrl,
      ...(displayProduct.images ?? []),
    ].find((image): image is string => Boolean(image?.trim()));
    const mappedCartImage = colorImageUrl(selectedColor, colorOptions, fallbackCartImage);
    const cartImage = isPublicProductImageAllowed(mappedCartImage) ? mappedCartImage : fallbackCartImage;
    addItem(
      {
        id: productCartLineId(displayProduct.id, selections),
        productId: displayProduct.id,
        slug: displayProduct.slug,
        name: displayProduct.name,
        price: displayProduct.price,
        image: cartImage ?? displayProduct.visualTheme,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("review") === "write") {
      setReviewModalOpen(true);
    }
  }, []);

  const openReviewFlow = async () => {
    setReviewError("");
    setReviewMessage("");
    try {
      const response = await fetch("/api/account/session", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.ok) {
        setReviewModalOpen(true);
        return;
      }
    } catch {
      // Fall through to login redirect.
    }
    const returnTo = `/product/${encodeURIComponent(displayProduct.slug)}?review=write`;
    router.push(`/account/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const uploadReviewMedia = async (file: File) => {
    setReviewMediaUploading(true);
    setReviewError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productSlug", displayProduct.slug);
      const response = await fetch("/api/account/reviews/media", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        errors?: string[];
      } | null;
      if (!response.ok || typeof payload?.url !== "string") {
        setReviewError(payload?.errors?.[0] || "Review media upload failed.");
        return;
      }
      setReviewDraft((current) => ({
        ...current,
        mediaUrls: [...current.mediaUrls, payload.url as string].slice(0, 3),
      }));
    } catch {
      setReviewError("Review media upload failed. Check your connection.");
    } finally {
      setReviewMediaUploading(false);
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewDraft.body.trim()) {
      setReviewError("Review text is required.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    setReviewMessage("");
    try {
      const response = await fetch("/api/account/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: displayProduct.id,
          productSlug: displayProduct.slug,
          rating: reviewDraft.rating,
          title: reviewDraft.title,
          body: reviewDraft.body,
          mediaUrls: reviewDraft.mediaUrls,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        errors?: string[];
      } | null;
      if (!response.ok) {
        if (response.status === 401) {
          const returnTo = `/product/${encodeURIComponent(displayProduct.slug)}?review=write`;
          router.push(`/account/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        setReviewError(payload?.errors?.[0] || "Review could not be submitted.");
        return;
      }
      setReviewMessage(payload?.message || "Thanks. Your feedback is pending approval.");
      setReviewDraft({ rating: 5, title: "", body: "", mediaUrls: [] });
    } catch {
      setReviewError("Review could not be submitted. Check your connection.");
    } finally {
      setReviewSubmitting(false);
    }
  };

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
          badge: ["Daily routine", "Discreet", "Reusable", "Clear info"][index] || brandName,
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
  const productTicker = (
    <section className="aev-product-ticker aev-product-ticker-after-hero relative z-[2]" aria-label="Noromi Care service highlights">
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
  );

  return (
    <main className="aev-bloom-product aev-product-page-shell min-h-screen overflow-x-hidden bg-[#080611] pb-[calc(var(--aev-mobile-bottom-nav-height)+6rem+env(safe-area-inset-bottom,0px))] text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_48%_at_18%_26%,rgba(255,77,184,0.11),transparent_62%),radial-gradient(ellipse_50%_40%_at_82%_64%,rgba(0,212,198,0.08),transparent_60%),linear-gradient(180deg,#080611,#090713_48%,#050711)]" />

      <SiteHeader
        active="product"
        productHref={`/product/${displayProduct.slug}`}
        settings={settings}
      />

      <section className="aev-bloom-hero relative z-[2] mx-auto grid box-border w-full max-w-[82rem] items-start gap-5 px-4 pb-8 pt-8 sm:gap-7 sm:px-7 sm:pb-10 sm:pt-10 lg:grid-cols-[minmax(0,36rem)_minmax(0,38rem)] lg:gap-8 lg:px-12 lg:pb-10 lg:pt-12">
        <div className="pointer-events-none absolute left-[-1rem] top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-serif text-[12vw] font-light leading-[0.85] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.035)] lg:block">
          {brandName}
        </div>

        <div className="aev-product-info-card relative z-[1] order-2 min-w-0 overflow-hidden rounded-[2px_42px_2px_42px] border border-[#FF4DB8]/12 bg-[#0D0918]/82 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6 lg:order-2 lg:p-7">
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

          <h1 className="aev-product-mobile-title max-w-[12ch] break-words font-serif text-[2.1rem] font-light leading-[1.04] tracking-normal text-white [overflow-wrap:anywhere] sm:text-5xl lg:max-w-[18ch] lg:text-[3rem]">
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
                : "No approved feedback yet."}
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

        </div>

        <div className="relative z-[1] order-1 lg:order-1 lg:self-start lg:pr-1">
          <div
            className="aev-bloom-media-frame relative aspect-[0.92/1] max-h-[34rem] overflow-hidden rounded-[2px_54px_2px_54px] border border-[#FF4DB8]/12 bg-[linear-gradient(145deg,#211633,#100A1E,#080611)] lg:aspect-[0.96/1] lg:max-h-[38rem]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="aev-premium-edge-line" aria-hidden="true" />
            <div className={`aev-bloom-media-glow pointer-events-none absolute inset-10 rounded-full blur-[76px] ${style.glow}`} />
            <div className="aev-bloom-media-ring pointer-events-none absolute left-1/2 top-1/2 h-[54%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF4DB8]/10" />
            <div className="aev-bloom-media-ring aev-bloom-media-ring-delay pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#31E6D4]/[0.07]" />
            {selectedMedia?.type === "video" ? (
              <>
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
                <button
                  type="button"
                  onClick={openSelectedMediaPreview}
                  className="absolute right-4 top-4 z-[4] inline-flex min-h-10 items-center gap-2 rounded-full border border-[#FF4DB8]/24 bg-[#080611]/78 px-3 text-xs font-semibold text-[#FFB3D1] backdrop-blur-md transition hover:border-[#FF4DB8]/45 hover:text-white"
                  aria-label="Open product video preview"
                >
                  <Maximize2 className="h-4 w-4" />
                  View
                </button>
              </>
            ) : selectedMedia?.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={safeIndex}
                src={selectedMedia.url}
                alt={displayProduct.name}
                loading={safeIndex === 0 ? "eager" : "lazy"}
                decoding="async"
                className="aev-bloom-product-media relative h-full w-full cursor-zoom-in object-contain p-4 transition duration-500 hover:scale-[1.015] sm:p-8"
                onClick={openSelectedMediaPreview}
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
                {displayProduct.category || brandName}
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
                  onClick={() => {
                    setSelectedMediaIndex(index);
                  }}
                  aria-label={item.type === "video" ? "Select product video" : `Select product image ${index + 1}`}
                  disabled={brokenMediaUrls.has(item.url)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[4px_20px_4px_20px] border bg-white/[0.035] transition ${
                    safeIndex === index
                      ? "border-[#FF4DB8]/60 bg-[#FF4DB8]/[0.08] shadow-[0_0_22px_rgba(255,77,184,0.16)]"
                      : "border-white/[0.08] hover:border-[#FF4DB8]/35"
                  } ${brokenMediaUrls.has(item.url) ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
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

          <div className="aev-product-support-cards aev-product-gallery-support mt-2.5 grid gap-1.5 lg:grid-cols-3">
            {[
              { icon: PackageCheck, text: privacyText },
              { icon: Truck, text: deliveryText },
              { icon: ShieldCheck, text: supportText },
            ].map(({ icon: Icon, text }, index) => (
              <div key={`media-${text}-${index}`} className="aev-product-support-card flex items-start gap-2 rounded border border-white/[0.07] bg-white/[0.035] px-2.5 py-2 text-[10px] leading-[1.45] text-[#9C91AA]">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${index === 1 ? "text-[#31E6D4]" : style.accent}`} />
                <span className="min-w-0">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {productTicker}

      {(displayProduct.description || displayProduct.shortDescription || descriptionMedia.length > 0 || sectionMediaEntries.length > 0 || contentBlocks.length > 0) && (
        <ProductContentMediaSections
          description={displayProduct.description || displayProduct.shortDescription}
          descriptionMedia={descriptionMedia}
          fallbackMedia={mediaItems
            .filter((item): item is Extract<MediaItem, { type: "image" }> =>
              item.type === "image" && isPublicProductImageAllowed(item.url)
            )
            .map((item, index) => ({
              id: `safe-gallery-fallback-${index}`,
              url: item.url,
              type: "image" as const,
              alt: `${displayProduct.name} product view ${index + 1}`,
              caption: "",
              fit: "contain" as const,
              position: "center" as const,
              visible: true,
            }))}
          sectionMediaEntries={sectionMediaEntries}
          contentBlocks={contentBlocks}
          benefits={benefits}
          care={care}
          privacyText={privacyText}
          deliveryText={deliveryText}
          supportText={supportText}
          productName={displayProduct.name}
          onPreviewMedia={openLightbox}
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
                      {card.badge || brandName}
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
        onWriteReview={openReviewFlow}
      />

      {reviewModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 py-5 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-[#FF4DB8]/18 bg-[#0D0918] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FF4DB8]">
                  Customer feedback
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Write a review</h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#D8CBE8] transition hover:border-[#FF4DB8]/35 hover:text-white"
                aria-label="Close review form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitReview} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#D8CBE8]">Rating</span>
                <select
                  required
                  value={reviewDraft.rating}
                  onChange={(event) =>
                    setReviewDraft((current) => ({ ...current, rating: Number(event.target.value) }))
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#080611] px-4 text-sm text-white outline-none focus:border-[#FF4DB8]/40"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} star{rating === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#D8CBE8]">Review title optional</span>
                <input
                  value={reviewDraft.title}
                  onChange={(event) =>
                    setReviewDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#080611] px-4 text-sm text-white outline-none focus:border-[#FF4DB8]/40"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#D8CBE8]">Review text</span>
                <textarea
                  required
                  rows={4}
                  value={reviewDraft.body}
                  onChange={(event) =>
                    setReviewDraft((current) => ({ ...current, body: event.target.value }))
                  }
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#080611] px-4 py-3 text-sm text-white outline-none focus:border-[#FF4DB8]/40"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#D8CBE8]">Upload image/video optional</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v"
                  disabled={reviewMediaUploading || reviewDraft.mediaUrls.length >= 3}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void uploadReviewMedia(file);
                  }}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#080611] px-4 py-3 text-sm text-[#D8CBE8] file:mr-3 file:rounded-full file:border-0 file:bg-[#FF4DB8]/16 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FFB3D1]"
                />
              </label>
              {reviewDraft.mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reviewDraft.mediaUrls.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() =>
                        setReviewDraft((current) => ({
                          ...current,
                          mediaUrls: current.mediaUrls.filter((item) => item !== url),
                        }))
                      }
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#D8CBE8]"
                    >
                      Remove media {index + 1}
                    </button>
                  ))}
                </div>
              )}
              {reviewMediaUploading && <p className="text-sm text-[#9C91AA]">Uploading media...</p>}
              {reviewError && (
                <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-3 text-sm text-rose-100">
                  {reviewError}
                </div>
              )}
              {reviewMessage && (
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] p-3 text-sm text-emerald-100">
                  {reviewMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={reviewSubmitting || reviewMediaUploading}
                className="aev-button-primary inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </form>
          </div>
        </div>
      )}

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

      {lightboxOpen && lightboxMedia && (
        <div
          className="aev-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Product media enlarged view"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={(event) => {
            if (touchStartXRef.current === null || !hasLightboxNavigation) return;
            const delta = event.changedTouches[0].clientX - touchStartXRef.current;
            touchStartXRef.current = null;
            if (Math.abs(delta) < 50) return;
            if (delta < 0) showNextLightboxMedia();
            else showPreviousLightboxMedia();
          }}
        >
          <button
            onClick={closeLightbox}
            aria-label="Close media preview"
            className="aev-lightbox-close"
          >
            <X className="h-5 w-5" />
          </button>

          {hasLightboxNavigation && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousLightboxMedia();
                }}
                className="aev-lightbox-nav aev-lightbox-nav-prev"
                aria-label="Previous media"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextLightboxMedia();
                }}
                className="aev-lightbox-nav aev-lightbox-nav-next"
                aria-label="Next media"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="aev-lightbox-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxMedia.type === "video" ? (
              <video
                src={lightboxMedia.url}
                poster={lightboxMedia.poster}
                controls
                playsInline
                autoPlay
                className="aev-lightbox-media"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.alt}
                className="aev-lightbox-media"
              />
            )}
            {hasLightboxNavigation && (
              <div className="aev-lightbox-count">
                {lightboxIndex + 1} / {lightboxItems.length}
              </div>
            )}
          </div>
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
  descriptionMedia,
  fallbackMedia,
  sectionMediaEntries,
  contentBlocks,
  benefits,
  care,
  privacyText,
  deliveryText,
  supportText,
  productName,
  onPreviewMedia,
}: {
  description: string;
  descriptionMedia: ProductDescriptionMediaItem[];
  fallbackMedia: ProductDescriptionMediaItem[];
  sectionMediaEntries: Array<{ key: ProductSectionMediaKey; media: ProductSectionMedia }>;
  contentBlocks: ProductContentBlock[];
  benefits: string[];
  care: string[];
  privacyText: string;
  deliveryText: string;
  supportText: string;
  productName: string;
  onPreviewMedia: (items: PreviewMediaItem[], index: number) => void;
}) {
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [failedRichMedia, setFailedRichMedia] = useState<Set<string>>(() => new Set());
  const gallerySource = descriptionMedia.length > 0 ? descriptionMedia : fallbackMedia;
  const galleryMedia = gallerySource.filter((item) => !failedRichMedia.has(item.url));
  const galleryIndex = Math.min(selectedGalleryIndex, Math.max(0, galleryMedia.length - 1));
  const featuredMedia = galleryMedia[galleryIndex];
  const galleryPreviewMedia: PreviewMediaItem[] = galleryMedia.map((item, index) => ({
    type: inferMediaType(item.url, item.type),
    url: item.url,
    alt: item.alt || item.caption || `${productName} closer look ${index + 1}`,
  }));
  const fitMedia = sectionMediaEntries.find(({ key }) => key === "fit")?.media;
  const careMedia = sectionMediaEntries.find(({ key }) => key === "care")?.media;
  const storyBullets = Array.from(new Set([...benefits, ...care, privacyText])).filter(Boolean).slice(0, 4);
  const defaultFeatures = [
    { title: "Advanced Leak Protection", text: "Multi-layer support helps you stay dry and confident.", icon: ShieldCheck },
    { title: "Soft & Skin-Friendly", text: "Gentle, breathable comfort for everyday wear.", icon: HeartHandshake },
    { title: "Reusable & Eco-Friendly", text: "A reusable choice designed for repeat care.", icon: Repeat2 },
  ];
  const trustItems = [
    { title: "Premium Quality", text: "Thoughtfully designed for comfort.", icon: HeartHandshake },
    { title: "Safe & Discreet", text: privacyText, icon: ShieldCheck },
    { title: "Reliable Delivery", text: deliveryText, icon: Truck },
    { title: "Real Support", text: supportText, icon: MessageCircle },
  ];

  return (
    <section className="aev-product-rich-shell relative z-[2] overflow-hidden border-y border-white/[0.07] py-10 sm:py-14 lg:py-16">
      <div className="aev-rich-orb aev-rich-orb-left" aria-hidden="true" />
      <div className="aev-rich-orb aev-rich-orb-right" aria-hidden="true" />
      <span className="aev-rich-mood aev-rich-mood-left" aria-hidden="true">For a healthier, happier you</span>
      <span className="aev-rich-mood aev-rich-mood-right" aria-hidden="true">Comfort through every phase</span>
      <span className="aev-rich-mood aev-rich-mood-bottom" aria-hidden="true">More than a product, a new confident you</span>
      <div className="pointer-events-none absolute left-1/2 top-[32%] -z-[1] hidden -translate-x-1/2 font-serif text-[9rem] uppercase tracking-[0.12em] text-white/[0.018] xl:block" aria-hidden="true">
        Noromi
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-7 lg:px-12">
        <div className="aev-rich-panel overflow-hidden">
          <div className={`grid gap-0 ${description && featuredMedia ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
            {description && (
              <div className={`p-5 sm:p-7 lg:p-9 ${featuredMedia ? "border-b border-white/[0.07] lg:border-b-0 lg:border-r" : ""}`}>
                <SectionHeading eyebrow="Our Story" title="Product details" description="" />
                <div className="mt-5 space-y-4 text-sm leading-7 text-[#D8CBE8]/82">
                  {description
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${paragraph.slice(0, 16)}-${index}`}>{paragraph}</p>
                    ))}
                </div>
                {storyBullets.length > 0 && (
                  <ul className="mt-7 grid gap-2.5 sm:grid-cols-2" aria-label="Product benefits">
                    {storyBullets.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-[#D8CBE8]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4DB8]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {featuredMedia && (
              <div className="p-5 sm:p-7 lg:p-9">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#FF4DB8]">
                      Description Gallery
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-white">A closer look</h3>
                  </div>
                  {galleryMedia.length > 1 && (
                    <span className="rounded border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] text-[#9C91AA]">
                      {galleryIndex + 1} / {galleryMedia.length}
                    </span>
                  )}
                </div>
                <div className="aev-rich-featured-media">
                  <ProductInlineMedia
                    media={featuredMedia}
                    fallbackAlt={`${productName} closer look`}
                    onPreview={() => onPreviewMedia(galleryPreviewMedia, galleryIndex)}
                    onError={() => setFailedRichMedia((items) => new Set(items).add(featuredMedia.url))}
                  />
                </div>
                {(featuredMedia.caption || featuredMedia.alt) && (
                  <p className="mt-3 text-xs leading-5 text-[#9C91AA]">{featuredMedia.caption || featuredMedia.alt}</p>
                )}
                {galleryMedia.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Description gallery navigation">
                    {galleryMedia.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedGalleryIndex(index)}
                        className={`h-2.5 rounded-full transition ${index === galleryIndex ? "w-8 bg-[#FF4DB8]" : "w-2.5 bg-white/20 hover:bg-[#31E6D4]/70"}`}
                        aria-label={`Show description image ${index + 1}`}
                        aria-pressed={index === galleryIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className={`aev-rich-panel aev-rich-guide-card grid overflow-hidden ${fitMedia && !failedRichMedia.has(fitMedia.url) ? "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`}>
            {fitMedia && !failedRichMedia.has(fitMedia.url) && (
              <ProductInlineMedia media={fitMedia} fallbackAlt={`${productName} size guide`} compact onError={() => setFailedRichMedia((items) => new Set(items).add(fitMedia.url))} />
            )}
            <div className="flex flex-col justify-center p-5 sm:p-6">
              <p className="aev-rich-label">Size Guide</p>
              <h3 className="mt-2 font-serif text-2xl text-white">Find your perfect fit</h3>
              <p className="mt-3 text-sm leading-6 text-[#D8CBE8]/78">Choose the right size for a secure, comfortable fit that moves with you.</p>
              <span className="mt-4 inline-flex w-fit rounded-full border border-[#FF4DB8]/25 bg-[#FF4DB8]/[0.08] px-3 py-1.5 text-xs font-semibold text-[#FFB3D1]">View Size Guide</span>
            </div>
          </article>

          <article className={`aev-rich-panel aev-rich-guide-card grid overflow-hidden ${careMedia && !failedRichMedia.has(careMedia.url) ? "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`}>
            {careMedia && !failedRichMedia.has(careMedia.url) && (
              <ProductInlineMedia media={careMedia} fallbackAlt={`${productName} care guide`} compact onError={() => setFailedRichMedia((items) => new Set(items).add(careMedia.url))} />
            )}
            <div className="flex flex-col justify-center p-5 sm:p-6">
              <p className="aev-rich-label">Care Guide</p>
              <h3 className="mt-2 font-serif text-2xl text-white">Care made simple</h3>
              <p className="mt-3 text-sm leading-6 text-[#D8CBE8]/78">Easy to wash, quick to dry, and made to last. Follow the care guide to keep your Noromi Care product fresh and effective.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Wash gently", "Air dry only", "No bleach", "Lasts longer"].map((step) => (
                  <span key={step} className="rounded-full border border-[#31E6D4]/20 bg-[#31E6D4]/[0.06] px-2.5 py-1 text-[10px] font-semibold text-[#8BF5EA]">{step}</span>
                ))}
              </div>
            </div>
          </article>
        </div>

        <div className="aev-rich-panel mt-5 p-5 sm:p-7">
          <p className="aev-rich-label">Feature Highlights</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(contentBlocks.length > 0 ? contentBlocks : defaultFeatures).map((item, index) => {
              if ("id" in item) {
                return <ContentBlockCard key={item.id} block={item} productName={productName} onMediaError={(url) => setFailedRichMedia((items) => new Set(items).add(url))} mediaFailed={failedRichMedia.has(item.mediaUrl)} />;
              }
              const Icon = item.icon;
              return (
                <article key={item.title} className="aev-rich-feature-card">
                  <span className="aev-rich-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-4 font-serif text-xl text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#9C91AA]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="aev-rich-panel mt-5 px-5 py-4 sm:px-7">
          <p className="aev-rich-label">Why customers trust Noromi Care</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ title, text, icon: Icon }) => (
              <div key={title} className="flex items-start gap-3 lg:border-l lg:border-white/[0.08] lg:pl-4 lg:first:border-l-0 lg:first:pl-0">
                <span className="aev-rich-icon h-9 w-9"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <div>
                  <h3 className="text-xs font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-[10px] leading-4 text-[#9C91AA]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductInlineMedia({
  media,
  fallbackAlt,
  compact = false,
  onPreview,
  onError,
}: {
  media: ProductSectionMedia;
  fallbackAlt: string;
  compact?: boolean;
  onPreview?: () => void;
  onError?: () => void;
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
    ? "aspect-[4/3] min-h-[8.5rem] max-h-[13rem]"
    : "aspect-[4/3] min-h-[10rem] max-h-[18rem]";
  return (
    <div
      className={`relative overflow-hidden rounded border border-[#FF4DB8]/12 bg-[linear-gradient(145deg,#211633,#100A1E,#080611)] ${onPreview ? "cursor-zoom-in" : ""} ${sizeClass}`}
      role={onPreview && type === "image" ? "button" : undefined}
      tabIndex={onPreview && type === "image" ? 0 : undefined}
      onClick={type === "image" ? onPreview : undefined}
      onKeyDown={(event) => {
        if (!onPreview || type !== "image") return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPreview();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-8 rounded-full bg-[#FF4DB8]/10 blur-3xl" />
      {type === "video" ? (
        <>
          <video
            src={media.url}
            controls
            playsInline
            muted
            preload="metadata"
            className={`relative h-full w-full bg-[#080611] ${fitClass} ${positionClass}`}
          />
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="absolute right-2 top-2 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#FF4DB8]/24 bg-[#080611]/78 text-[#FFB3D1] backdrop-blur-md transition hover:border-[#FF4DB8]/45 hover:text-white"
              aria-label="Open media preview"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.alt || fallbackAlt}
          loading="lazy"
          decoding="async"
          className={`relative h-full w-full ${media.fit === "cover" ? "" : "p-3 sm:p-4"} ${fitClass} ${positionClass}`}
          onError={onError}
        />
      )}
      {onPreview && type === "image" && (
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#080611]/78 px-2 py-1 text-[10px] font-semibold text-[#FFB3D1] backdrop-blur">
          <Maximize2 className="h-3 w-3" />
          View
        </span>
      )}
    </div>
  );
}

function ContentBlockCard({
  block,
  productName,
  onMediaError,
  mediaFailed = false,
}: {
  block: ProductContentBlock;
  productName: string;
  onMediaError?: (url: string) => void;
  mediaFailed?: boolean;
}) {
  const hasMedia = Boolean(block.mediaUrl) && !mediaFailed;
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
    <ProductInlineMedia media={media} fallbackAlt={`${productName} ${block.title}`} compact onError={() => onMediaError?.(media.url)} />
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

  return (
    <article className="aev-rich-feature-card overflow-hidden">
      {mediaNode}
      {textNode}
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
  onWriteReview,
}: {
  reviews: PublicProductReview[];
  averageRating: number;
  reviewCount: number;
  onWriteReview: () => void;
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
            title="Customer feedback"
            description="Reviews are shown after approval. Verified purchase appears only when feedback is linked to a confirmed customer order."
          />
          <button
            type="button"
            onClick={onWriteReview}
            className="inline-flex min-h-10 items-center justify-center rounded border border-[#FF4DB8]/24 bg-[#FF4DB8]/[0.08] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
          >
            Write a Review
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_15rem]">
          {reviews.length === 0 ? (
            <div className="lg:col-span-2 rounded border border-dashed border-[#00D4C6]/22 bg-[#00D4C6]/[0.045] p-6 text-sm leading-7 text-[#D8CBE8]">
              No approved feedback yet. Be the first to share your experience after your order.
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
                        {review.title || "Customer feedback"}
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
                      : "Customer feedback"}
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
                : "No approved feedback yet."}
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
