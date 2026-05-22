import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Droplets,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Waves,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import AevyrixaMotionPanel from "@/app/components/aevyrixa-motion-panel";
import HomeMotionController from "@/app/components/home-motion-controller";
import StorefrontProductCard from "@/app/components/storefront-product-card";
import LiveChatWidget from "@/app/components/live-chat-widget";
import { listProducts } from "@/app/lib/product-store";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import { whatsappHref } from "@/app/lib/admin-settings";
import { publicProduct } from "@/app/lib/product-display";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Aevyrixa Her Care — Premium Women's Comfort & Reusable Care in Bangladesh",
  description:
    "Aevyrixa Her Care offers premium women's comfort, hygiene, reusable care, and intimate essentials in Bangladesh. Discreet privacy packaging, 3-Day Hygiene-Safe Support, BDT pricing.",
  openGraph: {
    title: "Aevyrixa Her Care — Premium Women's Comfort & Reusable Care",
    description:
      "Premium women's comfort, hygiene, reusable care, and intimate essentials with discreet Bangladesh delivery.",
    url: "https://www.aevyrixa.com",
    type: "website",
  },
  twitter: {
    title: "Aevyrixa Her Care — Premium Women's Comfort & Reusable Care",
    description:
      "Premium women's comfort, hygiene, reusable care, and intimate essentials with discreet Bangladesh delivery.",
  },
};

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.aevyrixa.com/#organization",
      name: "Aevyrixa Her Care",
      url: "https://www.aevyrixa.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.aevyrixa.com/favicon.ico",
      },
      description:
        "Premium women's comfort, hygiene, reusable care, and intimate essentials brand in Bangladesh.",
      areaServed: "BD",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.aevyrixa.com/#website",
      url: "https://www.aevyrixa.com",
      name: "Aevyrixa Her Care",
      publisher: { "@id": "https://www.aevyrixa.com/#organization" },
    },
  ],
};

const confidenceCards = [
  {
    title: "Leak Anxiety",
    copy: "Layered protection helps reduce daily worry during light to moderate flow, without overpromising.",
    accent: "from-[#00D4C6]/35 to-[#A855F7]/20",
    icon: ShieldCheck,
  },
  {
    title: "Comfort",
    copy: "Soft stretch, smooth edges, and a flexible fit are designed to move with your body.",
    accent: "from-fuchsia-200/75 to-violet-500/20",
    icon: Waves,
  },
  {
    title: "Discreet Everyday Wear",
    copy: "A refined silhouette supports confidence under everyday outfits and routines.",
    accent: "from-[#FF4DB8]/35 to-[#A855F7]/20",
    icon: Sparkles,
  },
];

const heroTrustBadges = [
  "Discreet Packaging",
  "3-Day Hygiene-Safe Support",
  "Comfort Fit",
  "Reusable Protection",
];

const heroMarqueeItems = [
  "Bangladesh Delivery",
  "Layered Care",
  "Reusable Care",
  "Hygiene-Safe Support",
  "Premium Comfort",
  "Discreet Packaging",
  "Secure Checkout",
  "BDT Pricing",
  "Reusable Care",
];

const hereCareBase = [
  {
    name: "Reusable Period Care",
    tagline: "Comfortable reusable protection for light to moderate flow.",
    accent: "from-[#00D4C6]/35 to-[#FF4DB8]/15",
    glow: "bg-[#00D4C6]/10",
    key: "categoryReusablePeriodCare" as const,
  },
  {
    name: "Comfort Panty",
    tagline: "Soft stretch everyday wear designed for all-day comfort.",
    accent: "from-[#FF4DB8]/35 to-[#A855F7]/18",
    glow: "bg-[#FF4DB8]/10",
    key: "categoryComfortPanty" as const,
  },
  {
    name: "Soft Support Bra",
    tagline: "Gentle support with smooth fabric for daily wear.",
    accent: "from-[#A855F7]/35 to-[#FF4DB8]/16",
    glow: "bg-[#A855F7]/10",
    key: "categorySoftSupportBra" as const,
  },
  {
    name: "Nightwear",
    tagline: "Relaxed, breathable comfort for restful evenings.",
    accent: "from-[#FF4DB8]/30 to-[#A855F7]/16",
    glow: "bg-[#FF4DB8]/10",
    key: "categoryNightwear" as const,
  },
  {
    name: "Hygiene Essentials",
    tagline: "Curated essentials for your daily hygiene routine.",
    accent: "from-[#FFB84D]/35 to-[#FF4DB8]/14",
    glow: "bg-[#FFB84D]/10",
    key: "categoryHygieneEssentials" as const,
  },
  {
    name: "Bundles",
    tagline: "Thoughtful care sets at a considered price.",
    accent: "from-[#00D4C6]/32 to-[#A855F7]/16",
    glow: "bg-[#00D4C6]/10",
    key: "categoryBundles" as const,
  },
  {
    name: "New Arrivals",
    tagline: "Fresh additions to the Her Care collection.",
    accent: "from-[#FF4DB8]/32 to-[#00D4C6]/16",
    glow: "bg-[#FF4DB8]/10",
    key: "categoryNewArrivals" as const,
  },
];

export default async function Home() {
  const [{ products }, { settings }] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
  ]);
  const activeProducts = products
    .filter(
      (p) =>
        p.status === "active" &&
        !p.deletedAt &&
        p.showOnHomepage !== false &&
        (p.showInFeaturedCollection ?? p.featured)
    )
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 4)
    .map(publicProduct);
  const featuredProduct = products.find((product) => product.featured) ?? products[0];
  const featuredProductHref = featuredProduct
    ? `/product/${featuredProduct.slug}`
    : "/product/everyday-comfort";

  const hms = settings.homepageMediaSettings;
  const hereCareCategories = hereCareBase
    .map((cat) => {
      const state = hms[cat.key];
      const imageKey = `${cat.key}ImageUrl` as keyof typeof hms;
      const videoKey = `${cat.key}VideoUrl` as keyof typeof hms;
      const modeKey = `${cat.key}MediaMode` as keyof typeof hms;
      const altKey = `${cat.key}AltText` as keyof typeof hms;
      const titleKey = `${cat.key}Title` as keyof typeof hms;
      const descKey = `${cat.key}Description` as keyof typeof hms;
      const linkKey = `${cat.key}LinkUrl` as keyof typeof hms;
      const sortKey = `${cat.key}SortOrder` as keyof typeof hms;
      return {
        ...cat,
        state,
        comingSoon: state === "coming_soon",
        hidden: state === "hidden",
        categoryImageUrl: (hms[imageKey] as string) || "",
        categoryVideoUrl: (hms[videoKey] as string) || "",
        categoryMediaMode: (hms[modeKey] as string) || "animation",
        categoryAltText: (hms[altKey] as string) || "",
        displayName: (hms[titleKey] as string) || cat.name,
        displayTagline: (hms[descKey] as string) || cat.tagline,
        displayLinkUrl: (hms[linkKey] as string) || (state === "active" ? "/product" : ""),
        sortOrder: Number((hms[sortKey] as string) || "99") || 99,
      };
    })
    .filter((cat) => !cat.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const heroMedia = hms.heroMedia;
  const careMedia = hms.careMedia;
  const experienceMedia = hms.experienceMedia;
  const lc = hms; // shorthand for layerComfort fields
  const lcLayerItems = [
    { label: lc.layerComfortLayer1Title, desc: lc.layerComfortLayer1Description, dotBg: "bg-[#00D4C6]/60" },
    { label: lc.layerComfortLayer2Title, desc: lc.layerComfortLayer2Description, dotBg: "bg-violet-300/60" },
    { label: lc.layerComfortLayer3Title, desc: lc.layerComfortLayer3Description, dotBg: "bg-rose-300/60" },
  ];

  const whatsappUrl = settings.supportWhatsApp
    ? whatsappHref(settings.supportWhatsApp)
    : "";
  const liveSupportMode = settings.storeProfile.liveSupportMode;
  const canShowWhatsappSupport =
    liveSupportMode === "whatsapp" || liveSupportMode === "both";
  const canShowLiveChatSupport =
    liveSupportMode === "live_chat" || liveSupportMode === "both";
  const faqs = [
    {
      question: "How much protection should I expect?",
      answer: `${settings.brandDisplayName} is designed to help manage light to moderate flow with layered protection, without overpromising protection levels.`,
    },
    {
      question: "Can I wear it by itself?",
      answer:
        "Many customers use period underwear on its own for lighter days. For heavier flow, pair it with your preferred backup protection.",
    },
    {
      question: "How do I wash it?",
      answer:
        "Rinse with cool water, machine wash or hand wash with mild detergent, then air dry before storing.",
    },
  ];

  return (
    <main className="aev-home relative min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <HomeMotionController />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,77,184,0.07),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.05),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(0,212,198,0.04),transparent_30%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />

      <SiteHeader
        active="home"
        productHref={featuredProductHref}
        settings={settings}
      />

      {hms.showHero && (
      <>
      <section className="aev-hero-stage relative isolate overflow-hidden bg-[#0D0820] px-4 pb-8 pt-6 text-white sm:px-6 sm:pb-12 sm:pt-14 lg:pb-14">
        <div className="aev-hero-cinema pointer-events-none absolute inset-0 -z-10" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[52rem] overflow-hidden">
          <div className="aev-glow absolute left-1/2 top-10 h-96 w-[min(58rem,98vw)] -translate-x-1/2 rounded-full bg-[#FF4DB8]/18 blur-3xl" />
          <div className="aev-float-slow absolute -left-16 top-24 h-80 w-80 rounded-full bg-[#A855F7]/14 blur-3xl" />
          <div className="aev-float absolute right-0 top-36 h-64 w-64 rounded-full bg-[#00D4C6]/10 blur-3xl" />
          <div className="aev-hero-shimmer absolute left-0 top-0 h-full w-full" />
        </div>
        <div className="aev-hero-load-wash pointer-events-none absolute inset-0 -z-10" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080611] to-transparent" />

        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="min-w-0">
            <p className="aev-hero-kicker inline-flex max-w-full rounded-full border border-[#FF4DB8]/30 bg-[#FF4DB8]/[0.08] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/90 shadow-[0_0_26px_rgba(255,77,184,0.12)] backdrop-blur-xl sm:tracking-[0.36em]">
              {heroMedia.eyebrow || settings.appearanceSettings.heroBadgeText || settings.brandDisplayName}
            </p>
            <h1 className="aev-hero-headline mt-6 max-w-4xl text-[2rem] font-semibold leading-[1.03] tracking-tight text-white min-[430px]:text-[2.45rem] sm:text-6xl lg:text-[4.9rem]">
              <span className="md:hidden">Comfort You Can Feel.</span>
              <span className="hidden md:inline">
                {heroMedia.heading || settings.appearanceSettings.homepageHeroTitle}
              </span>
            </h1>
            <p className="aev-hero-copy aev-mobile-secondary-copy mt-5 max-w-2xl text-pretty text-base leading-8 text-white/74 sm:text-lg">
              <span className="md:hidden">
                Discreet period care, delivered across Bangladesh.
              </span>
              <span className="hidden md:inline">
                {heroMedia.subheading || settings.appearanceSettings.homepageHeroSubtitle}
              </span>
            </p>

            <div className="aev-hero-actions mt-8 flex flex-col gap-3 min-[500px]:flex-row sm:mt-10">
              <Link
                href={heroMedia.ctaLink || "/product"}
                className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_36px_rgba(255,77,184,0.55)]"
              >
                <span className="md:hidden">Shop Now</span>
                <span className="hidden md:inline">
                  {heroMedia.ctaText || settings.appearanceSettings.primaryCtaText}
                </span>
              </Link>
              <Link
                href="/product"
                className="aev-action-secondary hidden min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/25 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#FF4DB8]/45 hover:bg-white/[0.09] md:inline-flex"
              >
                View Collection
              </Link>
            </div>

            <div className="aev-hero-trust mt-7 hidden grid-cols-2 gap-2 rounded-[1.35rem] border border-white/[0.08] bg-[#120C22]/70 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:grid sm:gap-2.5">
              {heroTrustBadges.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="aev-trust-badge flex items-center justify-center gap-1.5 rounded-full border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.06] px-3 py-2.5 text-center text-[0.63rem] font-semibold uppercase tracking-[0.09em] text-white/86 backdrop-blur-xl sm:px-4 sm:py-3 sm:text-[0.67rem] sm:tracking-[0.12em]"
                >
                  <span className="h-1 w-1 rounded-full bg-[#FF4DB8]/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="aev-hero-visual relative min-w-0 max-w-full lg:pt-4">
            <div className="aev-product-glow absolute -inset-6 rounded-[2.8rem] bg-gradient-to-br from-[#FF4DB8]/18 via-[#A855F7]/12 to-[#00D4C6]/08 blur-2xl" />
            <div className="aev-product-edge absolute -inset-2 rounded-[2.6rem] border border-[#FF4DB8]/16" />
            <div className="aev-product-float relative">
              {heroMedia.mode === "image" && heroMedia.imageUrl ? (
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/14 bg-[#0D0820] shadow-[0_34px_130px_rgba(0,0,0,0.55),0_0_60px_rgba(255,77,184,0.10)]" style={{ minHeight: "clamp(15rem, 64vw, 33rem)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroMedia.imageUrl}
                    alt={heroMedia.altText || "Her Care hero"}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/70 via-[#030714]/20 to-transparent" />
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_58%)] opacity-40 pointer-events-none" />
                </div>
              ) : heroMedia.mode === "video" && heroMedia.videoUrl ? (
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/14 bg-[#0D0820] shadow-[0_34px_130px_rgba(0,0,0,0.55),0_0_60px_rgba(255,77,184,0.10)]" style={{ minHeight: "clamp(15rem, 64vw, 33rem)" }}>
                  <video
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={heroMedia.videoUrl} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_58%)] opacity-40 pointer-events-none" />
                </div>
              ) : (
                <AevyrixaMotionPanel
                  mp4Src="/videos/aevyrixa-hero-motion.mp4"
                  eyebrow="Reusable Layer System"
                  title="Period care in motion"
                  copy="Floating comfort layers, glass reflections, and soft cyan-violet light create a cinematic product intro without explicit visuals."
                  variant="hero"
                />
              )}
              <div className="aev-hero-product-chip absolute bottom-4 left-4 right-4 hidden rounded-[1.2rem] border border-[#FF4DB8]/22 bg-[#0D0820]/88 p-3.5 shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl md:block sm:bottom-7 sm:left-7 sm:right-7 sm:rounded-[1.35rem] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-[#FF4DB8]/75 sm:text-[0.66rem] sm:tracking-[0.3em]">
                      {settings.brandDisplayName}
                    </p>
                    <h2 className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-xl lg:text-2xl">
                      Her Care Collection
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#FF4DB8]/25 bg-[#FF4DB8]/12 p-2.5 text-[#FF4DB8] sm:p-3">
                    <Leaf size={18} strokeWidth={1.7} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[0.62rem] text-white/75 sm:mt-5 sm:gap-2 sm:text-[0.68rem]">
                  <span className="rounded-full bg-white/[0.07] px-2 py-1.5 sm:py-2">Soft</span>
                  <span className="rounded-full bg-white/[0.07] px-2 py-1.5 sm:py-2">Layered</span>
                  <span className="rounded-full bg-white/[0.07] px-2 py-1.5 sm:py-2">Discreet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="aev-mobile-home-trust relative px-4 pb-3 pt-1 md:hidden" aria-label="Store trust points">
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
          {[
            { label: "Discreet Packaging", icon: PackageCheck },
            { label: "Bangladesh Delivery", icon: Truck },
            { label: "3-Day Support", icon: ShieldCheck },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="aev-mobile-trust-point relative flex min-w-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1rem] border border-[#FF4DB8]/14 bg-[#151024]/88 px-1.5 py-2.5 text-center text-[0.62rem] font-semibold leading-4 text-white/88"
            >
              <Icon className="relative h-3.5 w-3.5 shrink-0 text-[#FFB3D1]" strokeWidth={1.9} />
              <span className="relative">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="aev-home-marquee" aria-label="Storefront highlights">
        <div className="aev-home-marquee-track">
          {[false, true].map((isDuplicate) => (
            <div
              key={isDuplicate ? "duplicate" : "primary"}
              className="aev-home-marquee-group"
              aria-hidden={isDuplicate || undefined}
            >
              {heroMarqueeItems.map((item) => (
                <span key={`${isDuplicate ? "duplicate" : "primary"}-${item}`} className="aev-home-marquee-item">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {hms.showFeaturedProducts && activeProducts.length > 0 && (
        <section className="aev-home-featured-products aev-scroll-section relative px-4 py-10 sm:px-6 sm:py-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_22%_28%,rgba(255,77,184,0.09),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(168,85,247,0.08),transparent_30%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="aev-section-label hidden sm:block">Shop our best picks</p>
                <h2 className="aev-heading mt-3 text-2xl sm:text-4xl lg:text-5xl">
                  <span className="sm:hidden">Best Picks</span>
                  <span className="hidden sm:inline">Best Picks For You</span>
                </h2>
                <p className="aev-subtext mt-3 hidden max-w-2xl text-sm sm:block sm:text-base">
                  Real active products from the current storefront, shown with live stock status and BDT pricing.
                </p>
              </div>
              <Link
                href="/product"
                className="aev-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                View Collection
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </div>

            <div className="aev-products-row mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {activeProducts.map((product, index) => (
                <StorefrontProductCard
                  key={product.id}
                  product={product}
                  compact
                  priority={index === 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {hms.showCategories && (
        <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-categories-title">
          <div className="aev-home-art-block aev-home-art-block-rail mx-auto max-w-xl overflow-hidden rounded-[1.5rem] border border-[#FF4DB8]/12 bg-[#100A1E]/72 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                  Collections
                </p>
                <h2 id="mobile-categories-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                  Shop by care.
                </h2>
              </div>
              <Link
                href="/product"
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-[#FF4DB8]/18 bg-white/[0.04] px-3 text-xs font-semibold text-[#FFB3D1]"
              >
                All
                <ArrowRight size={12} strokeWidth={2.2} />
              </Link>
            </div>
            <div className="aev-mobile-category-grid mt-3 grid grid-cols-2 gap-2.5">
              {hereCareCategories.map((category) => {
                const {
                  displayName,
                  displayLinkUrl,
                  comingSoon,
                  categoryImageUrl,
                  categoryVideoUrl,
                  categoryMediaMode,
                  categoryAltText,
                  glow,
                } = category;
                const showsVideo =
                  categoryVideoUrl &&
                  (categoryMediaMode === "video_text" ||
                    categoryMediaMode === "background_media_text" ||
                    categoryMediaMode === "media_only");
                const thumbnail = showsVideo ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={categoryVideoUrl} type="video/mp4" />
                  </video>
                ) : categoryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={categoryImageUrl}
                    alt={categoryAltText || displayName}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className={`absolute inset-4 rounded-full ${glow} blur-xl`} />
                    <div className="absolute inset-x-4 bottom-3 top-3 rounded-[1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,77,184,0.18),rgba(168,85,247,0.08),rgba(0,212,198,0.12))]" />
                  </>
                );
                const card = (
                  <>
                    <div className="relative aspect-[1.24] overflow-hidden rounded-[1rem] border border-white/[0.08] bg-[#0D0820]">
                      {thumbnail}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080611]/48 via-transparent to-white/[0.04]" />
                    </div>
                    <div className="mt-2 flex min-w-0 items-start justify-between gap-1">
                      <h3 className="line-clamp-2 text-[0.78rem] font-semibold leading-4 text-white">
                        {displayName}
                      </h3>
                      <span className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.08em] ${comingSoon ? "border-[#FFB84D]/24 bg-[#FFB84D]/[0.08] text-[#FFB84D]" : "border-[#00D4C6]/20 bg-[#00D4C6]/[0.07] text-[#31E6D4]"}`}>
                        {comingSoon ? "Soon" : "Open"}
                      </span>
                    </div>
                  </>
                );

                return !comingSoon && displayLinkUrl ? (
                  <a
                    key={displayName}
                    href={displayLinkUrl}
                    className="aev-mobile-category-card block min-w-0 overflow-hidden rounded-[1.2rem] border border-[#FF4DB8]/14 bg-[#151024]/92 p-2.5"
                  >
                    {card}
                  </a>
                ) : (
                  <div
                    key={displayName}
                    className="aev-mobile-category-card min-w-0 overflow-hidden rounded-[1.2rem] border border-[#FF4DB8]/10 bg-[#151024]/72 p-2.5"
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {hms.showStorySections && (
        <>
        {lc.layerComfortEnabled !== false && (
          <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-layer-title">
            <div className="aev-home-art-block aev-home-art-block-layer relative mx-auto max-w-xl overflow-hidden rounded-[1.55rem] border border-[#FF4DB8]/15 bg-[#120C22] p-4">
              <div className="relative">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                  {lc.layerComfortEyebrow || "Her Care Layer System"}
                </p>
                <h2 id="mobile-layer-title" className="mt-1.5 max-w-[15ch] text-xl font-semibold leading-tight text-white">
                  Her Care Layer System.
                </h2>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#D8CBE8]/76">
                  Layered comfort designed for reusable care and discreet everyday routines.
                </p>
                <div className="mt-3 grid gap-2">
                  {lcLayerItems.map(({ label, desc, dotBg }) => (
                    <article
                      key={label}
                      className="aev-mobile-mini-card flex min-w-0 items-start gap-2.5 rounded-[1rem] border border-white/[0.08] bg-[#080611]/58 p-3"
                    >
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotBg} ring-4 ring-[#FF4DB8]/10`} />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-5 text-white">{label}</h3>
                        <p className="mt-0.5 line-clamp-1 text-[0.69rem] leading-4 text-[#D8CBE8]/74">{desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="aev-mobile-home-benefit aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-comfort-title">
          <div className="relative mx-auto max-w-xl overflow-hidden rounded-[1.45rem] border border-[#FF4DB8]/16 bg-[#120C22] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
            <div className="relative grid grid-cols-[1fr_5.4rem] items-center gap-3">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                  {careMedia.eyebrow || "Aevyrixa Care Motion"}
                </p>
                <h2 id="mobile-comfort-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                  Soft protection, daily comfort.
                </h2>
              </div>
              {careMedia.mode === "image" && careMedia.imageUrl ? (
                <div className="aev-mobile-comfort-thumb relative h-[5.4rem] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#1B1230]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={careMedia.imageUrl}
                    alt={careMedia.altText || "Care system"}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aev-mobile-benefit-art flex h-[5.4rem] w-[5.4rem] items-center justify-center rounded-[1.1rem] border border-white/10 bg-[#1B1230]/85 text-[#FF4DB8]">
                  <ShieldCheck className="h-7 w-7" strokeWidth={1.55} />
                </div>
              )}
            </div>
            <div className="relative mt-3 grid grid-cols-2 gap-2">
              {["Soft comfort", "Absorbent support", "Discreet protection", "Breathable daily wear"].map((item) => (
                <div
                  key={item}
                  className="flex min-h-9 items-center gap-1.5 rounded-[0.9rem] border border-[#FF4DB8]/12 bg-[#080611]/58 px-2.5 text-[0.69rem] font-semibold leading-4 text-[#F1E7FA]"
                >
                  <ShieldCheck className="h-3 w-3 shrink-0 text-[#31E6D4]" strokeWidth={2} />
                  <span className="line-clamp-1">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href={careMedia.ctaLink || featuredProductHref}
              className="aev-action-primary relative mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-4 text-xs font-bold text-white"
            >
              {careMedia.ctaText || "View Product"}
            </Link>
          </div>
        </section>
        <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-designed-title">
          <div className="aev-home-art-block aev-home-art-block-petal relative mx-auto max-w-xl overflow-hidden rounded-[1.5rem] border border-[#00D4C6]/12 bg-[#0D0A1C] p-4">
            <div className="relative">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#31E6D4]/72">
                {experienceMedia.eyebrow || "Designed for your day"}
              </p>
              <h2 id="mobile-designed-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                Designed for your day.
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {confidenceCards.map(({ title, icon: Icon }) => (
                  <article
                    key={title}
                    className="aev-mobile-mini-card flex min-h-[5.35rem] min-w-0 flex-col justify-between rounded-[1rem] border border-white/[0.08] bg-[#151024]/82 p-2.5"
                  >
                    <Icon className="h-4 w-4 text-[#FFB3D1]" strokeWidth={1.8} />
                    <h3 className="text-[0.68rem] font-semibold leading-4 text-white">{title}</h3>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-care-title">
        <div className="mx-auto max-w-xl">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
            Care Routine
          </p>
          <h2 id="mobile-care-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
            Reusable care rhythm.
          </h2>
          <div className="aev-mobile-step-grid mt-3 grid grid-cols-3 gap-2">
            {[
              ["Wear", "Choose your comfort."],
              ["Rinse", "Cool rinse after wear."],
              ["Air Dry", "Dry before storing."],
            ].map(([label, copy], index) => (
              <article
                key={label}
                className="aev-mobile-mini-card min-w-0 rounded-[1.15rem] border border-[#FF4DB8]/13 bg-[#151024]/90 p-3"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#FF4DB8]/24 bg-[#1B1230] text-[0.62rem] font-bold text-[#FFB3D1]">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">{label}</h3>
                <p className="mt-1 text-[0.68rem] leading-4 text-[#D8CBE8]/76">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {hms.showStorySections && (
        <>
          <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-arrival-title">
            <div className="aev-home-art-block aev-home-art-block-arrival relative mx-auto max-w-xl overflow-hidden rounded-[1.55rem] border border-[#FF4DB8]/14 bg-[#120C22] p-4">
              <div className="relative">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                  Order to Arrival
                </p>
                <h2 id="mobile-arrival-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                  Private from order to delivery.
                </h2>
                <div className="mt-3 grid gap-2">
                  {[
                    { label: "Choose product", copy: "Pick care for your day.", icon: Sparkles },
                    { label: "Confirm order", copy: "Review options and order.", icon: ShieldCheck },
                    { label: "Discreet delivery", copy: "Private outer packaging.", icon: Truck },
                  ].map(({ label, copy, icon: Icon }) => (
                    <article
                      key={label}
                      className="aev-mobile-mini-card flex items-center gap-2.5 rounded-[1rem] border border-white/[0.08] bg-[#080611]/58 p-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-[#FF4DB8]/18 bg-[#1B1230] text-[#FFB3D1]">
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm font-semibold leading-5 text-white">{label}</strong>
                        <span className="block text-[0.69rem] leading-4 text-[#D8CBE8]/74">{copy}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-find-title">
            <div className="mx-auto max-w-xl">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                Find Your Care
              </p>
              <h2 id="mobile-find-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                Choose by routine.
              </h2>
              <div className="mt-3 grid gap-2">
                {[
                  {
                    title: "Reusable Period Care",
                    copy: "For light to moderate flow days.",
                    href: "/product?category=Reusable+Period+Care",
                    icon: Droplets,
                  },
                  {
                    title: "Comfort Wear",
                    copy: "Soft daily panty and support picks.",
                    href: "/product?category=Comfort+Panty",
                    icon: Sparkles,
                  },
                  {
                    title: "Soft Support",
                    copy: "Bra picks for gentle daily wear.",
                    href: "/product?category=Soft+Support+Bra",
                    icon: ShieldCheck,
                  },
                ].map(({ title, copy, href, icon: Icon }) => (
                  <Link
                    key={title}
                    href={href}
                    className="aev-home-art-link aev-mobile-mini-card flex items-center gap-3 rounded-[1.1rem] border border-[#FF4DB8]/13 bg-[#151024]/90 p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-[#00D4C6]/16 bg-[#0E1828] text-[#31E6D4]">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-semibold leading-5 text-white">{title}</strong>
                      <span className="block text-[0.69rem] leading-4 text-[#D8CBE8]/74">{copy}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#FFB3D1]" strokeWidth={2.1} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {hms.showFAQ && (
        <section id="mobile-faq" className="aev-mobile-home-section px-4 md:hidden" aria-labelledby="mobile-faq-title">
          <div className="aev-home-art-block relative mx-auto max-w-xl overflow-hidden rounded-[1.55rem] border border-[#FF4DB8]/13 bg-[#100A1E]/82 p-4">
            <div className="relative">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#FFB3D1]/75">
                FAQ Preview
              </p>
              <h2 id="mobile-faq-title" className="mt-1.5 text-xl font-semibold leading-tight text-white">
                Answers before checkout.
              </h2>
              <div className="mt-3 grid gap-2">
                {faqs.slice(0, 3).map((faq, index) => (
                  <details
                    key={faq.question}
                    className="aev-mobile-faq rounded-[1rem] border border-white/[0.08] bg-[#080611]/58 px-3 py-2.5"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold leading-5 text-white">
                      {faq.question}
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#FFB3D1]" strokeWidth={1.8} />
                    </summary>
                    <p className="mt-2 text-[0.7rem] leading-5 text-[#D8CBE8]/76">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {hms.showBottomCTA && hms.ctaSectionEnabled && (
        <section className="aev-mobile-home-cta aev-mobile-home-section px-4 pb-8 md:hidden" aria-labelledby="mobile-cta-title">
          <div className="aev-home-art-block aev-home-art-block-cta relative mx-auto max-w-xl overflow-hidden rounded-[1.65rem] border border-[#FF4DB8]/18 bg-[#0D0820] p-4">
            <div className="relative">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#31E6D4]/72">
                {hms.ctaSectionEyebrow || "Aevyrixa Her Care"}
              </p>
              <h2 id="mobile-cta-title" className="mt-2 text-[1.35rem] font-semibold leading-tight text-white">
                {hms.ctaSectionHeading || "Ready for reusable confidence?"}
              </h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#D8CBE8]/76">
                {hms.ctaSectionDescription || "Shop premium reusable care with discreet delivery."}
              </p>
              <div className="mt-4 grid gap-2 min-[390px]:grid-cols-2">
                <Link
                  href={hms.ctaSectionPrimaryCtaLink || "/product"}
                  className="aev-action-primary inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-5 text-sm font-bold text-white"
                >
                  {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                </Link>
                <Link
                  href="/product"
                  className="aev-action-secondary inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF4DB8]/24 bg-white/[0.05] px-5 text-sm font-semibold text-[#FFB3D1]"
                >
                  View Collection
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {hms.showTrustStrip && (
      <section className="aev-scroll-section hidden px-4 py-7 md:block sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="aev-home-art-block grid gap-3 overflow-hidden rounded-[1.6rem] border border-[#FF4DB8]/12 bg-[#120C22]/72 p-3 sm:grid-cols-3 sm:p-4">
            {[
              {
                title: "Discreet Packaging",
                icon: PackageCheck,
                art: "aev-intent-promise",
              },
              {
                title: "Bangladesh Delivery",
                icon: Truck,
                art: "aev-intent-delivery",
              },
              {
                title: "3-Day Hygiene-Safe Support",
                icon: ShieldCheck,
                art: "aev-intent-support",
              },
            ].map(({ title, art, icon: Icon }) => (
              <article
                key={title}
                className={`aev-card aev-reveal aev-intent-card ${art} group relative flex items-center gap-3 overflow-hidden rounded-[1.2rem] p-3.5 sm:p-4`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.08] text-[#FF4DB8] transition duration-300 group-hover:scale-105">
                  <Icon size={19} strokeWidth={1.7} />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Phase 27: Her Care Categories ── */}
      {hms.showCategories && (
      <section className="aev-scroll-section hidden px-4 py-12 md:block sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/70">
              Her Care Collection
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Seven categories, one calm care routine.
            </h2>
            <p className="aev-mobile-secondary-copy mt-4 max-w-2xl text-base leading-8 text-[#9C91AA]">
              Explore the full range of reusable period care, soft comfort
              wear, and hygiene essentials thoughtfully curated for your
              everyday routine.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
            {hereCareCategories.map(({ displayName, displayTagline, displayLinkUrl, glow, comingSoon, categoryImageUrl, categoryVideoUrl, categoryMediaMode, categoryAltText }) => {
              const mode = categoryMediaMode as "animation" | "image_text" | "background_media_text" | "video_text" | "media_only";
              const showImageVisual = mode === "image_text" && Boolean(categoryImageUrl);
              const showVideoVisual = mode === "video_text" && Boolean(categoryVideoUrl);
              const showBackgroundMedia = mode === "background_media_text" && Boolean(categoryImageUrl || categoryVideoUrl);
              const showMediaOnly = mode === "media_only" && Boolean(categoryImageUrl || categoryVideoUrl);
              const renderMedia = (className: string) =>
                categoryVideoUrl && (mode === "video_text" || mode === "background_media_text" || mode === "media_only") ? (
                  <video
                    className={className}
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={categoryVideoUrl} type="video/mp4" />
                  </video>
                ) : categoryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={categoryImageUrl}
                    alt={categoryAltText || displayName}
                    className={className}
                    loading="lazy"
                  />
                ) : null;

              const inner = (
                <>
                  {(showBackgroundMedia || showMediaOnly) && (
                    <>
                      {renderMedia("absolute inset-0 h-full w-full object-cover opacity-88 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100")}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0820]/60 via-[#0D0820]/10 to-transparent" />
                    </>
                  )}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#FF4DB8]/35 via-[#A855F7]/25 to-transparent" />
                  <div className={`absolute right-4 top-4 h-16 w-16 rounded-full ${glow} blur-2xl transition duration-500 group-hover:scale-[1.7] group-hover:opacity-80`} />
                  {(showImageVisual || showVideoVisual) && (
                    <div className="relative mb-4 aspect-[1.2] overflow-hidden rounded-[1.15rem] border border-[#FF4DB8]/12 bg-[#0B0F1A]">
                      {renderMedia("absolute inset-0 h-full w-full object-cover opacity-92 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100")}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B0F1A]/20 to-transparent" />
                    </div>
                  )}
                  {mode === "animation" && (
                    <div className="relative mb-5 h-24 overflow-hidden rounded-[1.15rem] border border-[#FF4DB8]/10 bg-gradient-to-br from-[#1B1230] via-[#151024] to-[#211633]/60">
                      <div className="absolute left-5 top-5 h-12 w-24 rounded-full bg-[#FF4DB8]/[0.10] blur-xl" />
                      <div className="absolute right-6 top-8 h-12 w-20 rounded-full bg-[#00D4C6]/[0.07] blur-xl" />
                      <div className="absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/25 to-transparent" />
                    </div>
                  )}
                  <div className={`relative ${showBackgroundMedia || showMediaOnly ? "mt-20 rounded-[1.15rem] border border-white/12 bg-[#080611]/75 p-4 shadow-2xl backdrop-blur-md" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold leading-snug text-white drop-shadow-sm">{displayName}</h3>
                      {comingSoon && (
                        <span className="mt-0.5 shrink-0 rounded-full border border-[#FFB84D]/28 bg-[#FFB84D]/[0.08] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#FFB84D]">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    {mode !== "media_only" && (
                      <p className={`aev-mobile-secondary-copy mt-2 text-sm leading-6 drop-shadow-sm ${showBackgroundMedia || showMediaOnly ? "text-white/75" : "text-[#9C91AA]"}`}>{displayTagline}</p>
                    )}
                    {mode === "media_only" && !comingSoon && displayLinkUrl && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF4DB8]/75">
                        View collection
                      </p>
                    )}
                    {!comingSoon && displayLinkUrl && mode !== "media_only" && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#FF4DB8] transition duration-300 group-hover:gap-2 group-hover:text-[#FFB3D1]">
                        Explore
                        <ArrowRight size={12} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    )}
                  </div>
                </>
              );

              const isClickable = !comingSoon && Boolean(displayLinkUrl);

              return isClickable ? (
                <a
                  key={displayName}
                  href={displayLinkUrl}
                  className="aev-category-card aev-reveal group relative min-h-[15rem] overflow-hidden rounded-[1.6rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 transition duration-300 hover:-translate-y-1.5 hover:border-[#FF4DB8]/28 sm:p-6"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={displayName}
                  className={`aev-category-card aev-reveal group relative min-h-[15rem] overflow-hidden rounded-[1.6rem] border bg-[#1B1230] p-5 sm:p-6 ${comingSoon ? "border-[#FF4DB8]/8 opacity-65" : "border-[#FF4DB8]/6"}`}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {hms.showStorySections && (
      <>
      {/* ── Layer Explorer — CMS-controlled ── */}
      {lc.layerComfortEnabled !== false && (
        <section className={`aev-scroll-section hidden px-4 py-12 md:block sm:px-6 sm:py-20 ${lc.layerComfortMediaMode === "background_media_text" ? "relative overflow-hidden" : ""}`}>
          {/* Background media for background_media_text mode */}
          {lc.layerComfortMediaMode === "background_media_text" && lc.layerComfortImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lc.layerComfortImageUrl}
                alt={lc.layerComfortAltText || "Layered comfort"}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#030714]/70 via-[#030714]/50 to-[#030714]/80" />
            </>
          )}
          {lc.layerComfortMediaMode === "background_media_text" && lc.layerComfortVideoUrl && !lc.layerComfortImageUrl && (
            <>
              <video
                src={lc.layerComfortVideoUrl}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#030714]/70 via-[#030714]/50 to-[#030714]/80" />
            </>
          )}
          <div className={`mx-auto max-w-7xl ${lc.layerComfortMediaMode === "background_media_text" ? "relative" : ""}`}>
            {lc.layerComfortMediaMode === "media_only" ? (
              /* media_only mode — show just the image or video */
              <div className="aev-reveal group relative isolate overflow-hidden rounded-[2rem] border border-white/12 bg-[#0D0820] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "clamp(18rem, 52vw, 26rem)" }}>
                {lc.layerComfortImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lc.layerComfortImageUrl}
                      alt={lc.layerComfortAltText || "Layered comfort"}
                      className="absolute inset-0 h-full w-full object-cover opacity-88"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/65 via-transparent to-transparent" />
                  </>
                ) : lc.layerComfortVideoUrl ? (
                  <video
                    src={lc.layerComfortVideoUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  /* Fallback: animation */
                  <div className="flex h-full items-center justify-center py-12">
                    <div className="relative h-72 w-full max-w-sm sm:h-80">
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-three absolute inset-x-7 top-9 h-full rounded-[2rem] border border-rose-100/16 bg-gradient-to-br from-rose-100/[0.055] to-transparent shadow-[0_24px_72px_rgba(0,0,0,0.26)] backdrop-blur-sm" />
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-two absolute inset-x-3.5 top-4 h-full rounded-[2rem] border border-violet-100/18 bg-gradient-to-br from-violet-100/[0.065] to-transparent shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm" />
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-one absolute inset-x-0 top-0 h-full overflow-hidden rounded-[2rem] border border-[#FF4DB8]/20 bg-gradient-to-br from-[#1B1230] to-[#080611] shadow-[0_34px_90px_rgba(0,0,0,0.42)] backdrop-blur-md" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* grid layout: text left, media right */
              <div className="aev-home-art-block aev-home-art-block-layer grid gap-10 overflow-hidden rounded-[2rem] border border-[#FF4DB8]/12 bg-[#100A1E]/45 p-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-10">
                <div className="aev-reveal min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
                    {lc.layerComfortEyebrow}
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
                    {lc.layerComfortHeading}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-[#D8CBE8]/80">
                    {lc.layerComfortDescription}
                  </p>
                  <div className="mt-8 space-y-3">
                    {lcLayerItems.map(({ label, desc, dotBg }) => (
                      <div
                        key={label}
                        className="aev-reveal flex gap-4 rounded-2xl border border-[#FF4DB8]/12 bg-[#151024] p-4"
                      >
                        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotBg} ring-4 ring-[#FF4DB8]/10`} />
                        <div>
                          <p className="text-sm font-semibold text-[#FFFFFF]">{label}</p>
                          <p className="mt-1 text-sm leading-6 text-[#D8CBE8]/80">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: image, video, or animation */}
                <div className="aev-reveal flex items-center justify-center py-6 lg:py-0">
                  {(lc.layerComfortMediaMode === "image_text") && lc.layerComfortImageUrl ? (
                    <div className="group relative isolate w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[#0D0820] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "20rem" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lc.layerComfortImageUrl}
                        alt={lc.layerComfortAltText || "Layered comfort"}
                        className="absolute inset-0 h-full w-full object-cover opacity-88"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/65 via-[#030714]/10 to-transparent" />
                    </div>
                  ) : (lc.layerComfortMediaMode === "video_text") && lc.layerComfortVideoUrl ? (
                    <div className="group relative isolate w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[#0D0820] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "20rem" }}>
                      <video
                        src={lc.layerComfortVideoUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  ) : (
                    /* Default: stacked floating layer cards animation */
                    <div className="relative h-72 w-full max-w-sm sm:h-80">
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-three absolute inset-x-7 top-9 h-full rounded-[2rem] border border-rose-100/16 bg-gradient-to-br from-rose-100/[0.055] to-transparent shadow-[0_24px_72px_rgba(0,0,0,0.26)] backdrop-blur-sm" />
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-two absolute inset-x-3.5 top-4 h-full rounded-[2rem] border border-violet-100/18 bg-gradient-to-br from-violet-100/[0.065] to-transparent shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm" />
                      <div className="aev-layer-explorer-card aev-layer-explorer-card-one absolute inset-x-0 top-0 h-full overflow-hidden rounded-[2rem] border border-[#FF4DB8]/20 bg-gradient-to-br from-[#1B1230] to-[#080611] shadow-[0_34px_90px_rgba(0,0,0,0.42)] backdrop-blur-md">
                        <div className="absolute inset-x-[15%] top-[22%] h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/35 to-transparent" />
                        <div className="absolute inset-x-[22%] top-[44%] h-px bg-gradient-to-r from-transparent via-[#00D4C6]/30 to-transparent" />
                        <div className="absolute inset-x-[28%] top-[63%] h-px bg-gradient-to-r from-transparent via-rose-100/48 to-transparent" />
                        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4DB8]/[0.08] blur-2xl" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-[#FF4DB8]/70">
                            Care Layer System
                          </p>
                          <p className="mt-1.5 text-base font-semibold text-[#FFFFFF]">
                            Her Care Collection
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="aev-scroll-section hidden px-4 py-12 md:block sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
          {careMedia.mode === "image" && careMedia.imageUrl ? (
            <div className="aev-reveal group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#0D0820] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "28rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={careMedia.imageUrl}
                alt={careMedia.altText || "Care system"}
                className="absolute inset-0 h-full w-full object-cover opacity-88"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/65 via-[#030714]/10 to-transparent" />
            </div>
          ) : (
            <AevyrixaMotionPanel
              mp4Src={careMedia.mode === "video" && careMedia.videoUrl ? careMedia.videoUrl : "/videos/aevyrixa-care-system.mp4"}
              eyebrow="Aevyrixa Care Motion"
              title="Layered reusable care, softly engineered."
              copy="Comfort knit, absorbent core, and a protective layer move as abstract fabric forms, supporting discreet daily confidence and privacy packaging."
              variant="care"
              className="aev-reveal"
            />
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
              {careMedia.eyebrow || "Aevyrixa Care Motion"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
              {careMedia.heading || "Premium comfort, reusable care, and discreet protection in one calm system."}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#D8CBE8]/80">
              {careMedia.subheading || "Premium reusable care essentials made for soft comfort, discreet daily wear, gentle care after use, and privacy-minded delivery from order to arrival."}
            </p>

            <div className="mt-8 grid gap-3">
              {[
                ["Soft comfort", "Soft fabric feel with flexible everyday support."],
                ["Absorbent support", "Layered protection designed for light to moderate flow."],
                ["Discreet protection", settings.privacyPackagingMessage],
                ["Breathable daily wear", "A smooth, breathable feel for daily routines and repeat wear."],
              ].map(([label, benefit]) => (
                <div
                  key={label}
                  className="aev-reveal flex gap-3 rounded-2xl border border-[#FF4DB8]/12 bg-[#151024] p-4 text-sm leading-7 text-[#D8CBE8]/80"
                >
                  <ShieldCheck
                    className="mt-1 shrink-0 text-[#00D4C6]"
                    size={18}
                    strokeWidth={1.8}
                  />
                  <span>
                    <strong className="block text-white">{label}</strong>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={careMedia.ctaLink || featuredProductHref}
              className="aev-action-primary mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.40)] transition duration-300 hover:-translate-y-0.5"
            >
              {careMedia.ctaText || "View Product"}
            </Link>
          </div>
        </div>
      </section>

      <section className="aev-experience-section aev-scroll-section hidden px-4 py-16 md:block sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          <div className="aev-reveal min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
              {experienceMedia.eyebrow || "Designed for your day"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
              {experienceMedia.heading || "Every detail, designed for quiet everyday confidence."}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#D8CBE8]/80">
              {experienceMedia.subheading || "Soft layered protection, gentle stretch, and a refined silhouette support your routine from first wear to wash day — without adjustment or worry."}
            </p>
          </div>

          {experienceMedia.mode === "image" && experienceMedia.imageUrl ? (
            <div className="aev-reveal group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#0D0820] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "28rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={experienceMedia.imageUrl}
                alt={experienceMedia.altText || "Cinematic experience"}
                className="absolute inset-0 h-full w-full object-cover opacity-88"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/65 via-[#030714]/10 to-transparent" />
            </div>
          ) : (
            <AevyrixaMotionPanel
              mp4Src={experienceMedia.mode === "video" && experienceMedia.videoUrl ? experienceMedia.videoUrl : "/videos/aevyrixa-experience.mp4"}
              eyebrow="Premium Experience"
              title="Video-style motion, coded fallback."
              copy="A cinematic glass frame with flowing care layers, soft reflections, and reveal motion keeps the brand alive even when video files are not installed."
              labels={["Comfort", "Discretion", "Privacy Pack"]}
              variant="experience"
              className="aev-reveal"
            />
          )}
        </div>
      </section>
      </>
      )}

      {hms.showStorySections && (
      <>
      {/* ── Phase 47C: Privacy from order to delivery ── */}
      <section className="hidden px-4 py-10 md:block sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="aev-home-art-block aev-home-art-block-arrival overflow-hidden rounded-[2rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
                Order to Arrival
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#FFFFFF] sm:text-3xl">
                A calm path from pick to delivery.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#D8CBE8]/80">
                Choose the care that fits your routine, confirm your order, and receive it with discreet Bangladesh delivery.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  {
                    icon: Sparkles,
                    label: "Choose Product",
                    desc: "Browse reusable care, comfort wear, or the collection that matches your day.",
                    glow: "bg-[#FF4DB8]/[0.06]",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Confirm Order",
                    desc: "Review your options and place the order with clear BDT checkout details.",
                    glow: "bg-[#00D4C6]/[0.05]",
                  },
                  {
                    icon: Truck,
                    label: "Discreet Delivery",
                    desc: settings.privacyPackagingMessage || "Plain outer packaging for private Bangladesh delivery.",
                    glow: "bg-[#A855F7]/[0.05]",
                  },
                ] as const
              ).map(({ icon: Icon, label, desc, glow }) => (
                <div
                  key={label}
                  className="aev-reveal aev-delivery-chip relative overflow-hidden rounded-2xl border border-[#FF4DB8]/12 bg-[#080611] p-4"
                >
                  <div className={`pointer-events-none absolute right-3 top-3 h-12 w-12 rounded-full ${glow} blur-2xl aev-story-ambient-glow`} />
                  <div className="relative flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF4DB8]/15 bg-[#1B1230] text-[#FF4DB8]">
                      <Icon size={17} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#FFFFFF]">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#D8CBE8]/80">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Phase 47C: Which one is right for you? ── */}
      <section className="aev-scroll-section hidden px-4 py-12 md:block sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
              Find Your Care
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#FFFFFF] sm:text-3xl">
              Which one is right for you?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#D8CBE8]/80">
              A quick guide to help you choose the right Her Care product for your routine.
            </p>
          </div>
          <div className="aev-home-art-block aev-home-art-block-petal mt-8 grid gap-4 overflow-hidden rounded-[2rem] border border-[#FF4DB8]/10 bg-[#100A1E]/44 p-4 sm:grid-cols-3 sm:p-5">
            {(
              [
                {
                  title: "Light to Moderate Flow Days",
                  desc: "Reusable period underwear supports everyday flow days. Soft, layered, and designed to wear comfortably through your regular schedule.",
                  href: "/product?category=Reusable+Period+Care",
                  iconColor: "text-[#00D4C6]",
                  iconBg: "bg-[#00D4C6]/[0.08] border-[#00D4C6]/18",
                  tag: "Period Care",
                  icon: Droplets,
                },
                {
                  title: "All-Day Comfort Wear",
                  desc: "Comfort panties and soft support bras for daily wear. Choose relaxed fit or gentle stretch based on your preference.",
                  href: "/product?category=Comfort+Panty",
                  iconColor: "text-[#FF4DB8]",
                  iconBg: "bg-[#1B1230] border-[#FF4DB8]/18",
                  tag: "Comfort Wear",
                  icon: Sparkles,
                },
                {
                  title: "Gentle Daily Support",
                  desc: "Soft support bra picks add smooth comfort for everyday movement and layering.",
                  href: "/product?category=Soft+Support+Bra",
                  iconColor: "text-[#A855F7]",
                  iconBg: "bg-[#A855F7]/[0.08] border-[#A855F7]/18",
                  tag: "Soft Support",
                  icon: ShieldCheck,
                },
              ] as const
            ).map(({ title, desc, href, iconColor, iconBg, tag, icon: Icon }) => (
              <a
                key={title}
                href={href}
                className="aev-reveal aev-routine-card group relative overflow-hidden rounded-[1.6rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#FF4DB8]/30 via-[#FF3FA4]/20 to-transparent" />
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${iconBg} ${iconColor} transition duration-300 group-hover:scale-105`}>
                  <Icon size={20} strokeWidth={1.7} />
                </div>
                <span className="inline-block rounded-full border border-[#FF4DB8]/18 bg-[#1B1230] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#9C91AA]">
                  {tag}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[#FFFFFF]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#D8CBE8]/80">{desc}</p>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#FF4DB8] transition duration-300 group-hover:gap-2 group-hover:text-[#D8CBE8]">
                  Explore
                  <ArrowRight size={12} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      </>
      )}

      {hms.showFAQ && (
      <section id="faq" className="hidden px-4 py-12 md:block sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
              FAQ Preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
              A few quick answers.
            </h2>
          </div>

          <div className="mt-10 grid gap-3">
            {faqs.map((faq, index) => (
              <article
                key={`${faq.question}-${index}`}
                className="aev-reveal aev-premium-card rounded-[1.35rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#FF4DB8]/70">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-[#FFFFFF]">
                      {faq.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#D8CBE8]/80">
                      {faq.answer}
                    </p>
                  </div>
                  <ChevronDown
                    className="mt-1 hidden shrink-0 text-[#9C91AA] sm:block"
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/faq" className="text-sm font-semibold text-[#FFB3D1] transition hover:text-white">
              View full FAQ
            </Link>
          </div>
        </div>
      </section>
      )}

      {hms.showBottomCTA && hms.ctaSectionEnabled && (
      <section className="hidden px-4 pb-16 pt-12 md:block sm:px-6 sm:pb-28 sm:pt-20">
        <div className="aev-home-art-block aev-home-art-block-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#FF4DB8]/15 bg-[#0D0820] shadow-2xl">
          {/* background_media_text mode */}
          {(hms.ctaSectionMediaMode === "background_media_text") && (hms.ctaSectionImageUrl || hms.ctaSectionVideoUrl) ? (
            <div className="relative min-h-[28rem] overflow-hidden">
              {hms.ctaSectionVideoUrl ? (
                <video
                  src={hms.ctaSectionVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-label={hms.ctaSectionAltText || "CTA background video"}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hms.ctaSectionImageUrl}
                  alt={hms.ctaSectionAltText || "CTA background"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-[#0D0820]/80 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,77,184,0.10),transparent_32%)]" />
              <div className="relative flex min-h-[28rem] flex-col items-center justify-center px-5 py-16 text-center sm:px-8 lg:px-12">
                {hms.ctaSectionEyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-100/72">
                    {hms.ctaSectionEyebrow}
                  </p>
                )}
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  {hms.ctaSectionHeading}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66">
                  {hms.ctaSectionDescription}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                  <Link
                    href={hms.ctaSectionPrimaryCtaLink || "/product"}
                    className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                  >
                    {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                  </Link>
                  <Link
                    href="/product"
                    className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          ) : (hms.ctaSectionMediaMode === "image_text" || hms.ctaSectionMediaMode === "video_text") && (hms.ctaSectionImageUrl || hms.ctaSectionVideoUrl) ? (
            /* image_text / video_text: side-by-side layout */
            <div className="grid items-center gap-0 lg:grid-cols-2">
              {/* Media side */}
              <div className="relative order-2 overflow-hidden lg:order-1 lg:min-h-[26rem]">
                {hms.ctaSectionVideoUrl && hms.ctaSectionMediaMode === "video_text" ? (
                  <video
                    src={hms.ctaSectionVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-56 w-full object-cover lg:absolute lg:inset-0 lg:h-full"
                    aria-label={hms.ctaSectionAltText || "CTA video"}
                  />
                ) : hms.ctaSectionImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hms.ctaSectionImageUrl}
                    alt={hms.ctaSectionAltText || ""}
                    className="h-56 w-full object-cover lg:absolute lg:inset-0 lg:h-full"
                  />
                ) : null}
              </div>
              {/* Text side */}
              <div className="relative order-1 px-5 py-12 text-center sm:px-8 sm:py-16 lg:order-2 lg:text-left">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,77,184,0.08),transparent_40%)]" />
                <div className="relative">
                  {hms.ctaSectionEyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-100/72">
                      {hms.ctaSectionEyebrow}
                    </p>
                  )}
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {hms.ctaSectionHeading}
                  </h2>
                  <p className="mt-5 text-base leading-8 text-white/66">
                    {hms.ctaSectionDescription}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link
                      href={hms.ctaSectionPrimaryCtaLink || "/product"}
                      className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                    >
                      {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                    </Link>
                    <Link
                      href="/product"
                      className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                    >
                      View Collection
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* no_media or no URL provided — original centered text layout */
            <div className="relative px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-12 lg:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,212,198,0.10),transparent_32%),radial-gradient(circle_at_82%_68%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,rgba(255,77,184,0.10),transparent_38%)]" />
              <div className="relative mx-auto max-w-3xl">
                {hms.ctaSectionEyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-100/72">
                    {hms.ctaSectionEyebrow}
                  </p>
                )}
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  {hms.ctaSectionHeading}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66">
                  {hms.ctaSectionDescription}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                  <Link
                    href={hms.ctaSectionPrimaryCtaLink || "/product"}
                    className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                  >
                    {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                  </Link>
                  <Link
                    href="/product"
                    className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {canShowWhatsappSupport && hms.whatsappWidgetEnabled && whatsappUrl &&
        (hms.whatsappWidgetPlacement === "homepage" || hms.whatsappWidgetPlacement === "all") && (
        <div className="aev-home-whatsapp-widget fixed bottom-20 right-4 z-50 md:bottom-6 sm:right-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-full border border-[#00D4C6]/28 bg-[#151024]/92 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.36),0_0_24px_rgba(0,212,198,0.12)] backdrop-blur-xl transition hover:border-[#00D4C6]/50 hover:bg-[#211633]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 fill-[#31E6D4]"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>{hms.whatsappWidgetLabel || "Support"}</span>
            {hms.whatsappWidgetLiveText && (
              <span className="text-[#31E6D4]/80">{hms.whatsappWidgetLiveText}</span>
            )}
          </a>
        </div>
      )}

      <LiveChatWidget
        enabled={canShowLiveChatSupport && hms.liveChatEnabled}
        label={hms.liveChatLabel}
        placement={hms.liveChatPlacement}
        whatsappAlsoEnabled={
          canShowWhatsappSupport &&
          hms.whatsappWidgetEnabled &&
          !!whatsappUrl &&
          (hms.whatsappWidgetPlacement === "homepage" || hms.whatsappWidgetPlacement === "all")
        }
        whatsappUrl={whatsappUrl}
        supportPhone={settings.supportPhone}
        hideLauncherOnMobile
      />

      <SiteFooter settings={settings} />
    </main>
  );
}
