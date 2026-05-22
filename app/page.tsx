import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Droplets,
  Leaf,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Ruler,
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
import { listFeaturedTestimonials } from "@/app/lib/review-store";
import type { PublicProductReview } from "@/app/lib/review-types";

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

const howItWorks = [
  {
    title: "Choose Your Fit",
    copy: "Select the size and coverage that matches your usual underwear feel and cycle needs.",
  },
  {
    title: "Wear With Confidence",
    copy: "Use as part of your period routine for comfortable, discreet daily protection.",
  },
  {
    title: "Rinse & Reuse",
    copy: "Rinse after wear, wash gently, air dry, and keep your piece ready for next time.",
  },
];

const careCards = [
  {
    title: "Size Guide",
    copy: "Choose your normal underwear size. If you are between sizes, consider the fit style you prefer: closer support or a softer relaxed feel.",
    icon: Ruler,
  },
  {
    title: "Care Tips",
    copy: "Rinse with cool water after wear, wash with mild detergent, and air dry. Avoid bleach, fabric softener, and high heat.",
    icon: Droplets,
  },
  {
    title: "Made to Last",
    copy: "Reusable construction and thoughtful care help each piece stay comfortable over repeated cycles.",
    icon: RotateCcw,
  },
];

const heroTrustBadges = [
  "Discreet Packaging",
  "3-Day Hygiene-Safe Support",
  "Comfort Fit",
  "Reusable Protection",
];

const heroTrustStats = [
  {
    value: "5K+",
    label: "Her Care Visitors",
  },
  {
    value: "4.8★",
    label: "Customer Rating",
  },
  {
    value: "100%",
    label: "Discreet Packaging",
  },
];

const heroMarqueeItems = [
  "Bangladesh Delivery",
  "4-Layer Protection",
  "Eco-Friendly",
  "5,000+ Visitors",
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

function TestimonialsSection({ reviews }: { reviews: PublicProductReview[] }) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#00D4C6]/75">
            Customer Trust
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Moderated reviews from real orders.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#D8CBE8]/80">
            Approved customer feedback appears here after purchase and admin review.
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <article
                key={review.id}
                className="aev-reveal rounded-[1.6rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 shadow-[0_20px_70px_rgba(255,77,184,0.07)]"
              >
                <div className="flex items-center gap-1 text-[#FFB84D]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={index < review.rating ? "" : "opacity-35"}>★</span>
                  ))}
                </div>
                {review.isFeatured && (
                  <span className="mt-4 inline-flex rounded-full border border-[#00D4C6]/25 bg-[#00D4C6]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#31E6D4]">
                    Featured
                  </span>
                )}
                <h3 className="mt-4 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
                  {review.title || "Customer review"}
                </h3>
                <p className="mt-3 line-clamp-5 text-sm leading-7 text-[#D8CBE8]/78">
                  {review.body}
                </p>
                <p className="mt-4 text-sm font-semibold text-[#FFB3D1]">
                  {review.customerName}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Moderated Only", "Reviews stay pending until an admin approves them."],
              ["Order Linked", "Customers can submit feedback from their account order history."],
              ["Privacy First", "Public reviews use masked customer names and never show phone numbers."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[1.6rem] border border-[#00D4C6]/14 bg-[#151024] p-5">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D8CBE8]/78">{copy}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


export default async function Home() {
  const [{ products }, { settings }, testimonials] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
    listFeaturedTestimonials(6),
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
    {
      question: "What support is available?",
      answer: settings.supportWindowMessage,
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
              {heroMedia.heading || settings.appearanceSettings.homepageHeroTitle}
            </h1>
            <p className="aev-hero-copy aev-mobile-secondary-copy mt-5 max-w-2xl text-pretty text-base leading-8 text-white/74 sm:text-lg">
              {heroMedia.subheading || settings.appearanceSettings.homepageHeroSubtitle}
            </p>

            <div className="aev-hero-actions mt-8 flex flex-col gap-3 min-[500px]:flex-row sm:mt-10">
              <Link
                href={heroMedia.ctaLink || "/product"}
                className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_36px_rgba(255,77,184,0.55)]"
              >
                {heroMedia.ctaText || settings.appearanceSettings.primaryCtaText}
              </Link>
              <Link
                href="#how-it-works"
                className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/25 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#FF4DB8]/45 hover:bg-white/[0.09]"
              >
                Explore How It Works
              </Link>
            </div>

            <div className="aev-hero-stat-shelf mt-7 grid grid-cols-3 overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[#120C22]/72 shadow-[0_22px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(255,77,184,0.08)] backdrop-blur-xl">
              {heroTrustStats.map((stat) => (
                <div key={stat.label} className="aev-hero-stat min-w-0 px-2.5 py-4 text-center sm:px-5 sm:py-5">
                  <p className="aev-hero-stat-value text-[1.45rem] font-semibold leading-none text-[#FF4DB8] min-[430px]:text-[1.65rem] sm:text-[1.9rem]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[0.62rem] font-medium leading-4 text-[#9C91AA] sm:text-[0.7rem]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="aev-hero-trust mt-7 grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/[0.08] bg-[#120C22]/70 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:gap-2.5">
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
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/14 bg-[#0D0820] shadow-[0_34px_130px_rgba(0,0,0,0.55),0_0_60px_rgba(255,77,184,0.10)]" style={{ minHeight: "clamp(20rem, 56vw, 33rem)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroMedia.imageUrl}
                    alt={heroMedia.altText || "Her Care hero"}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/70 via-[#030714]/20 to-transparent" />
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_58%)] opacity-40 pointer-events-none" />
                </div>
              ) : heroMedia.mode === "video" && heroMedia.videoUrl ? (
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/14 bg-[#0D0820] shadow-[0_34px_130px_rgba(0,0,0,0.55),0_0_60px_rgba(255,77,184,0.10)]" style={{ minHeight: "clamp(20rem, 56vw, 33rem)" }}>
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
              <div className="aev-hero-product-chip absolute bottom-4 left-4 right-4 rounded-[1.2rem] border border-[#FF4DB8]/22 bg-[#0D0820]/88 p-3.5 shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:rounded-[1.35rem] sm:p-5">
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
        <section className="aev-scroll-section relative px-4 py-10 sm:px-6 sm:py-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_22%_28%,rgba(255,77,184,0.09),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(168,85,247,0.08),transparent_30%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="aev-section-label">Shop our best picks</p>
                <h2 className="aev-heading mt-3 text-2xl sm:text-4xl lg:text-5xl">
                  Best Picks For You
                </h2>
                <p className="aev-subtext aev-mobile-secondary-copy mt-3 max-w-2xl text-sm sm:text-base">
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

      {hms.showTrustStrip && (
      <section className="aev-scroll-section px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Discreet Packaging",
                copy: settings.privacyPackagingMessage || "Plain outer packaging for private delivery.",
                icon: PackageCheck,
                art: "aev-intent-promise",
              },
              {
                title: "Bangladesh Delivery",
                copy: settings.deliveryCoverageText || "Courier delivery across Bangladesh with support.",
                icon: Truck,
                art: "aev-intent-delivery",
              },
              {
                title: "3-Day Hygiene-Safe Support",
                copy: settings.supportWindowMessage || "Support for eligible product concerns after delivery.",
                icon: ShieldCheck,
                art: "aev-intent-support",
              },
              {
                title: "Secure Checkout",
                copy: "Clear BDT pricing and careful order confirmation.",
                icon: Sparkles,
                art: "aev-intent-secure",
              },
            ].map(({ title, copy, art, icon: Icon }) => (
              <article
                key={title}
                className={`aev-card aev-reveal aev-intent-card ${art} group relative overflow-hidden rounded-[1.35rem] p-4 sm:p-5`}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-gradient-to-r from-[#FF4DB8]/40 via-[#A855F7]/30 to-transparent" />
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.08] text-[#FF4DB8] transition duration-300 group-hover:scale-105">
                  <Icon size={19} strokeWidth={1.7} />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#D8CBE8]/76">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Phase 27: Her Care Categories ── */}
      {hms.showCategories && (
      <section className="aev-scroll-section px-4 py-12 sm:px-6 sm:py-20">
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
      <section id="how-it-works" className="aev-scroll-section px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
                How It Works
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#FFFFFF] sm:text-4xl lg:text-5xl">
                A simple reusable rhythm.
              </h2>
            </div>
            <p className="aev-mobile-secondary-copy max-w-3xl text-base leading-8 text-[#D8CBE8]/80 lg:justify-self-end">
              {settings.brandDisplayName} is designed to feel intuitive from
              first wear to wash day: choose thoughtfully, wear comfortably,
              and care for it gently.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {howItWorks.map((step, index) => (
              <article
                key={step.title}
                className="aev-reveal aev-premium-card group relative overflow-hidden rounded-[1.6rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#FF4DB8]/25 sm:p-7"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#FF4DB8]/[0.05] blur-2xl transition duration-300 group-hover:bg-[#00D4C6]/[0.07]" />
                <div className="relative mb-12 flex h-14 w-14 items-center justify-center rounded-full border border-[#FF4DB8]/18 bg-[#1B1230] text-lg font-semibold text-[#FF4DB8]">
                  0{index + 1}
                </div>
                <h3 className="relative text-xl font-semibold text-[#FFFFFF]">
                  {step.title}
                </h3>
                <p className="relative mt-4 text-sm leading-7 text-[#D8CBE8]/80">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Layer Explorer — CMS-controlled ── */}
      {lc.layerComfortEnabled !== false && (
        <section className={`aev-scroll-section px-4 py-12 sm:px-6 sm:py-20 ${lc.layerComfortMediaMode === "background_media_text" ? "relative overflow-hidden" : ""}`}>
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
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
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

      <section className="aev-scroll-section px-4 py-12 sm:px-6 sm:py-20">
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

      <section className="aev-experience-section aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
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

      {/* ── Phase 27: Hygiene-Safe Support Timeline ── */}
      <section className="aev-scroll-section px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
            Care Routine
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-4xl">
            3-Day Hygiene-Safe Support
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#D8CBE8]/80">
            A simple, repeatable care routine that keeps your reusable pieces
            feeling fresh, soft, and ready for next use.
          </p>

          <div className="relative mt-12">
            <div
              className="aev-timeline-line absolute left-[20%] right-[20%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/30 to-transparent sm:block"
              aria-hidden="true"
            />
            <div className="grid gap-8 sm:grid-cols-3">
              {(
                [
                  {
                    step: "01",
                    label: "Wear",
                    desc: "Choose comfort, wear with quiet confidence during your day.",
                    delay: "0s",
                  },
                  {
                    step: "02",
                    label: "Rinse",
                    desc: "Cool water rinse after wear, gently clearing residue.",
                    delay: "1.2s",
                  },
                  {
                    step: "03",
                    label: "Air Dry",
                    desc: "Wash gently, air dry, then fold and store ready for next use.",
                    delay: "2.4s",
                  },
                ] as const
              ).map(({ step, label, desc, delay }) => (
                <div
                  key={step}
                  className="aev-reveal flex flex-col items-center gap-3 text-center"
                >
                  <div
                    className="aev-timeline-dot flex h-14 w-14 items-center justify-center rounded-full border border-[#FF4DB8]/28 bg-[#1B1230] text-sm font-semibold text-[#FF4DB8]"
                    style={{ animationDelay: delay }}
                  >
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-[#FFFFFF]">{label}</h3>
                  <p className="max-w-[20ch] text-sm leading-7 text-[#D8CBE8]/80">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {hms.showTestimonials && <TestimonialsSection reviews={testimonials} />}

      {hms.showStorySections && (
      <>
      {/* ── Phase 47C: Privacy from order to delivery ── */}
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
                Order to Arrival
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#FFFFFF] sm:text-3xl">
                Privacy from order to delivery.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#D8CBE8]/80">
                Your care routine stays private. Every order ships with plain outer packaging — no product names or brand marks visible.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  {
                    icon: PackageCheck,
                    label: "Discreet Packaging",
                    desc: settings.privacyPackagingMessage || "Plain outer packaging — no product names or brand marks outside.",
                    glow: "bg-[#FF4DB8]/[0.06]",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Order Confirmation",
                    desc: "Receive a clear confirmation after we process your order. No unexpected surprises.",
                    glow: "bg-[#00D4C6]/[0.05]",
                  },
                  {
                    icon: Truck,
                    label: "Bangladesh Delivery",
                    desc: settings.deliveryCoverageText || "Delivered across Bangladesh with courier tracking and support.",
                    glow: "bg-[#A855F7]/[0.05]",
                  },
                  {
                    icon: MessageCircle,
                    label: "3-Day Hygiene-Safe Support",
                    desc: settings.supportWindowMessage || "3-Day Hygiene-Safe Support on eligible product concerns after delivery.",
                    glow: "bg-[#FF4DB8]/[0.05]",
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

      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[#FF4DB8]/12 bg-[#151024] p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
                  Size & Care
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
                  Clear care for a better fit and longer wear.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {careCards.map(({ title, copy, icon: Icon }) => (
                  <article
                    key={title}
                    className="aev-reveal aev-premium-card rounded-[1.35rem] border border-[#FF4DB8]/12 bg-[#080611] p-5"
                  >
                    <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B1230] text-[#FF4DB8]">
                      <Icon size={20} strokeWidth={1.7} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#FFFFFF]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#D8CBE8]/80">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Phase 47C: Which one is right for you? ── */}
      <section className="aev-scroll-section px-4 py-12 sm:px-6 sm:py-16">
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
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
                  title: "Not sure? Get help first.",
                  desc: "Message support before you order. We help with size, coverage, and product selection — no pressure, just honest guidance.",
                  href: "/support",
                  iconColor: "text-[#A855F7]",
                  iconBg: "bg-[#A855F7]/[0.08] border-[#A855F7]/18",
                  tag: "Support",
                  icon: MessageCircle,
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
      <section id="faq" className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/80">
              FAQ Preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#FFFFFF] sm:text-5xl">
              Honest answers before checkout.
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
        </div>
      </section>
      )}

      {hms.showBottomCTA && hms.ctaSectionEnabled && (
      <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#FF4DB8]/15 bg-[#0D0820] shadow-2xl">
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
                  {` ${settings.supportWindowMessage}`}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                  <Link
                    href={hms.ctaSectionPrimaryCtaLink || "/product"}
                    className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                  >
                    {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                  </Link>
                  {hms.ctaSectionSecondaryCtaText && (
                    <a
                      href={hms.ctaSectionSecondaryCtaLink || "#faq"}
                      className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                    >
                      {hms.ctaSectionSecondaryCtaText}
                    </a>
                  )}
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
                    {` ${settings.supportWindowMessage}`}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link
                      href={hms.ctaSectionPrimaryCtaLink || "/product"}
                      className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                    >
                      {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                    </Link>
                    {hms.ctaSectionSecondaryCtaText && (
                      <a
                        href={hms.ctaSectionSecondaryCtaLink || "#faq"}
                        className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                      >
                        {hms.ctaSectionSecondaryCtaText}
                      </a>
                    )}
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
                  {` ${settings.supportWindowMessage}`}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                  <Link
                    href={hms.ctaSectionPrimaryCtaLink || "/product"}
                    className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-7 text-sm font-bold text-white"
                  >
                    {hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText}
                  </Link>
                  {hms.ctaSectionSecondaryCtaText && (
                    <a
                      href={hms.ctaSectionSecondaryCtaLink || "#faq"}
                      className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] backdrop-blur-xl"
                    >
                      {hms.ctaSectionSecondaryCtaText}
                    </a>
                  )}
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
      />

      <SiteFooter settings={settings} />
    </main>
  );
}
