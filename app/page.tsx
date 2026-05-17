import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Droplets,
  Leaf,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import AevyrixaMotionPanel from "@/app/components/aevyrixa-motion-panel";
import HomeMotionController from "@/app/components/home-motion-controller";
import { listProducts } from "@/app/lib/product-store";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import { whatsappHref } from "@/app/lib/admin-settings";

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
    accent: "from-cyan-200/80 to-sky-400/20",
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
    accent: "from-rose-200/80 to-amber-200/20",
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
  "3-Day Support",
  "Comfort Fit",
  "Reusable Protection",
];

const hereCareBase = [
  {
    name: "Reusable Period Care",
    tagline: "Comfortable reusable protection for light to moderate flow.",
    accent: "from-cyan-200/75 to-cyan-500/15",
    glow: "bg-cyan-300/10",
    key: "categoryReusablePeriodCare" as const,
  },
  {
    name: "Comfort Panty",
    tagline: "Soft stretch everyday wear designed for all-day comfort.",
    accent: "from-fuchsia-200/75 to-fuchsia-500/15",
    glow: "bg-fuchsia-300/10",
    key: "categoryComfortPanty" as const,
  },
  {
    name: "Soft Support Bra",
    tagline: "Gentle support with smooth fabric for daily wear.",
    accent: "from-violet-200/75 to-violet-500/15",
    glow: "bg-violet-300/10",
    key: "categorySoftSupportBra" as const,
  },
  {
    name: "Nightwear",
    tagline: "Relaxed, breathable comfort for restful evenings.",
    accent: "from-rose-200/75 to-rose-500/15",
    glow: "bg-rose-300/10",
    key: "categoryNightwear" as const,
  },
  {
    name: "Hygiene Essentials",
    tagline: "Curated essentials for your daily hygiene routine.",
    accent: "from-amber-200/75 to-amber-500/15",
    glow: "bg-amber-300/10",
    key: "categoryHygieneEssentials" as const,
  },
  {
    name: "Bundles",
    tagline: "Thoughtful care sets at a considered price.",
    accent: "from-sky-200/75 to-sky-500/15",
    glow: "bg-sky-300/10",
    key: "categoryBundles" as const,
  },
  {
    name: "New Arrivals",
    tagline: "Fresh additions to the Her Care collection.",
    accent: "from-emerald-200/75 to-emerald-500/15",
    glow: "bg-emerald-300/10",
    key: "categoryNewArrivals" as const,
  },
];

const careLayerItems = [
  {
    label: "Comfort Knit Layer",
    desc: "Soft, stretch-fit fabric that moves naturally with your body through the day.",
    dotBg: "bg-cyan-300/60",
  },
  {
    label: "Absorbent Core",
    desc: "A slim internal layer for quiet, discreet support during light to moderate flow.",
    dotBg: "bg-violet-300/60",
  },
  {
    label: "Protective Shell",
    desc: "A smooth outer layer with a refined silhouette and clean, everyday finish.",
    dotBg: "bg-rose-300/60",
  },
];

export default async function Home() {
  const [{ products }, { settings }] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
  ]);
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
      return {
        ...cat,
        state,
        comingSoon: state === "coming_soon",
        hidden: state === "hidden",
        categoryImageUrl: (hms[imageKey] as string) || "",
        categoryVideoUrl: (hms[videoKey] as string) || "",
      };
    })
    .filter((cat) => !cat.hidden);

  const heroMedia = hms.heroMedia;
  const careMedia = hms.careMedia;
  const experienceMedia = hms.experienceMedia;

  const whatsappUrl = settings.supportWhatsApp
    ? whatsappHref(settings.supportWhatsApp)
    : "";
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
    <main className="aev-home relative min-h-screen overflow-x-hidden bg-[#030612] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <HomeMotionController />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,#030612_0%,#07101f_46%,#050612_100%)]" />

      <SiteHeader
        active="home"
        productHref={featuredProductHref}
        settings={settings}
      />

      <section className="aev-hero-stage relative isolate overflow-hidden px-4 pb-18 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28">
        <div className="aev-hero-cinema pointer-events-none absolute inset-0 -z-10" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden">
          <div className="aev-glow absolute left-1/2 top-16 h-72 w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-cyan-300/18 blur-3xl" />
          <div className="aev-float-slow absolute -left-16 top-32 h-72 w-72 rounded-full bg-violet-500/18 blur-3xl" />
          <div className="aev-float absolute right-0 top-40 h-56 w-56 rounded-full bg-rose-200/12 blur-3xl" />
          <div className="aev-hero-shimmer absolute left-0 top-0 h-full w-full" />
        </div>
        <div className="aev-hero-load-wash pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="min-w-0">
            <p className="aev-hero-kicker inline-flex max-w-full rounded-full border border-cyan-200/20 bg-white/[0.06] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/90 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:tracking-[0.36em]">
              {settings.appearanceSettings.heroBadgeText || settings.brandDisplayName}
            </p>
            <h1 className="aev-hero-headline mt-7 max-w-4xl text-[1.7rem] font-semibold leading-[1.05] tracking-tight text-white min-[430px]:text-[2.15rem] sm:text-6xl lg:text-7xl">
              {settings.appearanceSettings.homepageHeroTitle}
            </h1>
            <p className="aev-hero-copy mt-6 max-w-2xl text-pretty text-base leading-8 text-white/72 sm:text-lg">
              {settings.appearanceSettings.homepageHeroSubtitle}
            </p>

            <div className="aev-hero-actions mt-8 flex flex-col gap-3 min-[768px]:flex-row sm:mt-10">
              <Link
                href="/product"
                className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.28)]"
              >
                {settings.appearanceSettings.primaryCtaText}
              </Link>
              <a
                href="#how-it-works"
                className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/[0.09]"
              >
                Explore How It Works
              </a>
            </div>

            <div className="aev-hero-trust mt-9 grid gap-2.5 min-[430px]:grid-cols-2">
              {heroTrustBadges.map((item) => (
                <div
                  key={item}
                  className="aev-trust-badge rounded-full border border-white/10 bg-white/[0.055] px-4 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/76 backdrop-blur-xl sm:px-5"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="aev-hero-visual relative min-w-0 max-w-full">
            <div className="aev-product-glow absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-cyan-300/14 via-violet-500/12 to-rose-200/10 blur-2xl" />
            <div className="aev-product-edge absolute -inset-2 rounded-[2.4rem] border border-cyan-100/10" />
            <div className="aev-product-float relative">
              {heroMedia.mode === "image" && heroMedia.imageUrl ? (
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#030714] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "26rem" }}>
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
                <div className="aev-motion-panel aev-motion-panel-hero relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#030714] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "26rem" }}>
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
              <div className="aev-hero-product-chip absolute bottom-5 left-5 right-5 rounded-[1.35rem] border border-white/12 bg-[#050816]/72 p-4 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-rose-100/70">
                      {settings.brandDisplayName}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                      Her Care Collection
                    </h2>
                  </div>
                  <div className="rounded-full border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">
                    <Leaf size={20} strokeWidth={1.7} />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[0.68rem] text-white/68">
                  <span className="rounded-full bg-white/[0.07] px-2 py-2">Soft</span>
                  <span className="rounded-full bg-white/[0.07] px-2 py-2">Layered</span>
                  <span className="rounded-full bg-white/[0.07] px-2 py-2">Discreet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Confidence System
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Three quiet upgrades for the moments that usually feel uncertain.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {confidenceCards.map(({ title, copy, accent, icon: Icon }) => (
              <article
                key={title}
                className="aev-border-card aev-reveal aev-premium-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 sm:p-7"
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
                <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07] text-cyan-100 transition duration-300 group-hover:scale-105">
                  <Icon size={22} strokeWidth={1.7} />
                </div>
                <h3 className="text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/65">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Phase 27: Her Care Categories ── */}
      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Her Care Collection
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Seven categories, one calm care routine.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/62">
              Explore the full range of reusable period care, soft comfort
              wear, and hygiene essentials thoughtfully curated for your
              everyday routine.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hereCareCategories.map(({ name, tagline, accent, glow, comingSoon, categoryImageUrl, categoryVideoUrl }) => {
              const hasMedia = Boolean(categoryImageUrl || categoryVideoUrl);
              const inner = (
                <>
                  {hasMedia && categoryVideoUrl ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover opacity-30"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src={categoryVideoUrl} type="video/mp4" />
                    </video>
                  ) : hasMedia && categoryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={categoryImageUrl}
                      alt={name}
                      className="absolute inset-0 h-full w-full object-cover opacity-30"
                      loading="lazy"
                    />
                  ) : null}
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
                  <div className={`absolute right-4 top-4 h-14 w-14 rounded-full ${glow} blur-2xl transition duration-500 group-hover:scale-150`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">{name}</h3>
                    {comingSoon && (
                      <span className="mt-0.5 shrink-0 rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white/48">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="relative mt-2 text-sm leading-6 text-white/58">{tagline}</p>
                  {!comingSoon && (
                    <div className="relative mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-200/72 transition duration-300 group-hover:text-cyan-200">
                      Explore
                      <ArrowRight size={12} strokeWidth={2.2} />
                    </div>
                  )}
                </>
              );

              return comingSoon ? (
                <div
                  key={name}
                  className="aev-category-card aev-reveal group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.032] p-5 backdrop-blur-2xl opacity-70 sm:p-6"
                >
                  {inner}
                </div>
              ) : (
                <a
                  key={name}
                  href="/product"
                  className="aev-category-card aev-reveal group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.048] p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-cyan-100/25 hover:shadow-[0_0_32px_rgba(34,211,238,0.10)] sm:p-6"
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                How It Works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                A simple reusable rhythm.
              </h2>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white/65 lg:justify-self-end">
              {settings.brandDisplayName} is designed to feel intuitive from
              first wear to wash day: choose thoughtfully, wear comfortably,
              and care for it gently.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {howItWorks.map((step, index) => (
              <article
                key={step.title}
                className="aev-reveal aev-premium-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-cyan-100/25 sm:p-7"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-200/10 blur-2xl transition duration-300 group-hover:bg-violet-300/14" />
                <div className="relative mb-12 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-lg font-semibold text-white">
                  0{index + 1}
                </div>
                <h3 className="relative text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-4 text-sm leading-7 text-white/64">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Phase 27: Care Layer Explorer ── */}
      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="aev-reveal min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                Her Care Layer System
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Layered comfort built for calm, discreet daily wear.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
                Each piece is designed with softness at every layer — from the
                fabric you feel against your skin to the discreet structure
                supporting your day.
              </p>
              <div className="mt-8 space-y-3">
                {careLayerItems.map(({ label, desc, dotBg }) => (
                  <div
                    key={label}
                    className="aev-reveal flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
                  >
                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotBg} ring-4 ring-white/10`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/58">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stacked floating layer cards */}
            <div className="aev-reveal flex items-center justify-center py-6 lg:py-0">
              <div className="relative h-72 w-full max-w-sm sm:h-80">
                <div className="aev-layer-explorer-card aev-layer-explorer-card-three absolute inset-x-7 top-9 h-full rounded-[2rem] border border-rose-100/16 bg-gradient-to-br from-rose-100/[0.055] to-transparent shadow-[0_24px_72px_rgba(0,0,0,0.26)] backdrop-blur-sm" />
                <div className="aev-layer-explorer-card aev-layer-explorer-card-two absolute inset-x-3.5 top-4 h-full rounded-[2rem] border border-violet-100/18 bg-gradient-to-br from-violet-100/[0.065] to-transparent shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm" />
                <div className="aev-layer-explorer-card aev-layer-explorer-card-one absolute inset-x-0 top-0 h-full overflow-hidden rounded-[2rem] border border-cyan-100/22 bg-gradient-to-br from-cyan-100/[0.08] to-white/[0.03] shadow-[0_34px_90px_rgba(0,0,0,0.32),0_0_52px_rgba(34,211,238,0.09)] backdrop-blur-md">
                  <div className="absolute inset-x-[15%] top-[22%] h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />
                  <div className="absolute inset-x-[22%] top-[44%] h-px bg-gradient-to-r from-transparent via-violet-100/52 to-transparent" />
                  <div className="absolute inset-x-[28%] top-[63%] h-px bg-gradient-to-r from-transparent via-rose-100/48 to-transparent" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/12 blur-2xl" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-cyan-100/68">
                      Care Layer System
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-white">
                      Her Care Collection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
          {careMedia.mode === "image" && careMedia.imageUrl ? (
            <div className="aev-reveal group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#030714] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "28rem" }}>
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
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Aevyrixa Care Motion
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Premium comfort, reusable care, and discreet protection in one calm system.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Premium reusable care essentials made for soft comfort, discreet
              daily wear, gentle care after use, and privacy-minded delivery
              from order to arrival.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Soft fabric feel with flexible everyday support.",
                "Layered protection designed for light to moderate flow.",
                settings.privacyPackagingMessage,
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="aev-reveal flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-white/70"
                >
                  <ShieldCheck
                    className="mt-1 shrink-0 text-cyan-200"
                    size={18}
                    strokeWidth={1.8}
                  />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Link
              href={featuredProductHref}
              className="aev-action-primary mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.24)] transition duration-300 hover:-translate-y-0.5"
            >
              View Product
            </Link>
          </div>
        </div>
      </section>

      <section className="aev-experience-section aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          <div className="aev-reveal min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Aevyrixa Experience
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              A cinematic care experience that stays calm, premium, and lightweight.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Moving glass, layered fabric forms, soft glow, and tactile tap
              feedback create a video-style moment while staying fast and
              mobile-safe.
            </p>
          </div>

          {experienceMedia.mode === "image" && experienceMedia.imageUrl ? (
            <div className="aev-reveal group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#030714] shadow-[0_34px_120px_rgba(0,0,0,0.42)]" style={{ minHeight: "28rem" }}>
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

      {/* ── Phase 27: Hygiene-Safe Support Timeline ── */}
      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
            Care Routine
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            3-Day Hygiene-Safe Support
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-white/60">
            A simple, repeatable care routine that keeps your reusable pieces
            feeling fresh, soft, and ready for next use.
          </p>

          <div className="relative mt-12">
            <div
              className="aev-timeline-line absolute left-[20%] right-[20%] top-7 hidden h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent sm:block"
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
                    className="aev-timeline-dot flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10 text-sm font-semibold text-cyan-100"
                    style={{ animationDelay: delay }}
                  >
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{label}</h3>
                  <p className="max-w-[20ch] text-sm leading-7 text-white/58">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] p-5 backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                  Size & Care
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  Clear care for a better fit and longer wear.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {careCards.map(({ title, copy, icon: Icon }) => (
                  <article
                    key={title}
                    className="aev-reveal aev-premium-card rounded-[1.35rem] border border-white/10 bg-[#050816]/58 p-5"
                  >
                    <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.07] text-cyan-100">
                      <Icon size={20} strokeWidth={1.7} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              FAQ Preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Honest answers before checkout.
            </h2>
          </div>

          <div className="mt-10 grid gap-3">
            {faqs.map((faq, index) => (
              <article
                key={faq.question}
                className="aev-reveal aev-premium-card rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {faq.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {faq.answer}
                    </p>
                  </div>
                  <ChevronDown
                    className="mt-1 hidden shrink-0 text-white/38 sm:block"
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="relative px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_82%_68%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,rgba(244,196,212,0.1),transparent_38%)]" />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-100/72">
                Ready for reusable confidence?
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Discover Her Care essentials that feel softer, calmer, and more considered.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66">
                Premium women's comfort, hygiene, and reusable care with discreet delivery.
                {` ${settings.supportWindowMessage}`}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                <Link
                  href="/product"
                  className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617]"
                >
                  {settings.appearanceSettings.primaryCtaText}
                </Link>
                <a
                  href="#faq"
                  className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl"
                >
                  Read FAQs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hms.whatsappWidgetEnabled && whatsappUrl && (
        <div className="fixed bottom-6 right-4 z-50 sm:right-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-full border border-white/20 bg-[#1a1a2e]/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:border-green-200/40 hover:bg-[#1e2240]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 fill-green-400"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>{hms.whatsappWidgetLabel || "Support"}</span>
            {hms.whatsappWidgetLiveText && (
              <span className="text-green-400/80">{hms.whatsappWidgetLiveText}</span>
            )}
          </a>
        </div>
      )}

      <SiteFooter settings={settings} />
    </main>
  );
}
