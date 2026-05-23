import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Droplets,
  Layers3,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Waves,
} from "lucide-react";
import AevyrixaMotionPanel from "@/app/components/aevyrixa-motion-panel";
import AevIntroScreen from "@/app/components/animations/intro-screen";
import HomeMotionController from "@/app/components/home-motion-controller";
import LiveChatWidget from "@/app/components/live-chat-widget";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import StorefrontProductCard from "@/app/components/storefront-product-card";
import { whatsappHref } from "@/app/lib/admin-settings";
import { publicProduct } from "@/app/lib/product-display";
import { listProducts } from "@/app/lib/product-store";
import { homeCardCtaLabel, smartHomeCtaHref } from "@/app/lib/shop-routing";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Aevyrixa Her Care - Premium Women's Comfort & Reusable Care in Bangladesh",
  description:
    "Aevyrixa Her Care offers premium women's comfort, hygiene, reusable care, and intimate essentials in Bangladesh with discreet privacy packaging and BDT pricing.",
};

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.aevyrixa.com/#organization",
      name: "Aevyrixa Her Care",
      url: "https://www.aevyrixa.com",
      logo: { "@type": "ImageObject", url: "https://www.aevyrixa.com/favicon.ico" },
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

const collectionDefs = [
  { key: "categoryReusablePeriodCare", icon: Droplets, tone: "cyan" },
  { key: "categoryComfortPanty", icon: Sparkles, tone: "rose" },
  { key: "categorySoftSupportBra", icon: ShieldCheck, tone: "violet" },
  { key: "categoryNightwear", icon: Leaf, tone: "rose" },
  { key: "categoryHygieneEssentials", icon: Waves, tone: "cyan" },
  { key: "categoryBundles", icon: Layers3, tone: "violet" },
  { key: "categoryNewArrivals", icon: Sparkles, tone: "rose" },
] as const;

const trustItems = [
  { label: "Discreet Packaging", icon: PackageCheck },
  { label: "Bangladesh Delivery", icon: Truck },
  { label: "3-Day Hygiene-Safe Support", icon: ShieldCheck },
] as const;

const statItems = [
  { value: "5000+", label: "Happy Customers" },
  { value: "4.8★", label: "Customer Rating" },
  { value: "100%", label: "Discreet Packaging" },
] as const;

const marqueeItems = [
  "Bangladesh Delivery",
  "Discreet Packaging",
  "3-Day Hygiene-Safe Support",
  "Premium Comfort",
  "BDT Pricing",
  "Reusable Care",
  "Secure Checkout",
] as const;

type LooseSettings = Record<string, string | boolean | object>;
type SectionMedia = {
  mode: "animation" | "image" | "video";
  imageUrl: string;
  videoUrl: string;
  altText: string;
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
};

function HomeSectionHeading({
  eyebrow,
  heading,
  body,
  compact,
}: {
  eyebrow: string;
  heading: string;
  body?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "max-w-2xl" : "max-w-3xl"}>
      <p className="aev-story-eyebrow">{eyebrow}</p>
      <h2 className="aev-story-title">{heading}</h2>
      {body ? <p className="aev-story-copy">{body}</p> : null}
    </div>
  );
}

function UploadedMedia({
  imageUrl,
  videoUrl,
  mode,
  alt,
  className = "",
}: {
  imageUrl: string;
  videoUrl: string;
  mode: string;
  alt: string;
  className?: string;
}) {
  if ((mode === "video" || mode === "video_text") && videoUrl) {
    return (
      <video className={className} autoPlay muted loop playsInline aria-label={alt}>
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }

  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={alt} className={className} loading="lazy" />;
  }

  if (videoUrl && (mode === "background_media_text" || mode === "media_only")) {
    return (
      <video className={className} autoPlay muted loop playsInline aria-label={alt}>
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }

  return null;
}

function LayerFallback() {
  return (
    <div className="aev-layer-visual-fallback relative h-full min-h-[16rem] overflow-hidden rounded-[1.7rem]">
      <div className="absolute inset-x-[8%] top-[12%] h-[68%] rounded-[2rem] border border-rose-100/15 bg-rose-100/[0.045]" />
      <div className="absolute inset-x-[13%] top-[20%] h-[63%] rounded-[2rem] border border-violet-100/16 bg-violet-100/[0.055]" />
      <div className="absolute inset-x-[18%] top-[29%] h-[58%] overflow-hidden rounded-[2rem] border border-cyan-100/16 bg-[#151024] shadow-2xl">
        <div className="absolute inset-x-[16%] top-[28%] h-px bg-gradient-to-r from-transparent via-[#FFB3D1]/60 to-transparent" />
        <div className="absolute inset-x-[22%] top-[48%] h-px bg-gradient-to-r from-transparent via-[#31E6D4]/55 to-transparent" />
        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-semibold text-white">
          <Layers3 className="h-4 w-4 text-[#FFB3D1]" />
          Layered care
        </div>
      </div>
    </div>
  );
}

function StoryVisual({
  media,
  fallback,
  alt,
}: {
  media: SectionMedia;
  fallback: React.ReactNode;
  alt: string;
}) {
  const hasUploaded = (media.mode === "image" && media.imageUrl) || (media.mode === "video" && media.videoUrl);

  return (
    <div className="aev-story-media aev-home-art-block relative isolate min-w-0 overflow-hidden">
      {hasUploaded ? (
        <>
          <UploadedMedia
            imageUrl={media.imageUrl}
            videoUrl={media.videoUrl}
            mode={media.mode}
            alt={media.altText || alt}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080611]/65 via-[#080611]/12 to-transparent" />
        </>
      ) : (
        fallback
      )}
    </div>
  );
}

export default async function Home() {
  const [{ products }, { settings }] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
  ]);
  const featuredProducts = products
    .filter(
      (product) =>
        product.status === "active" &&
        !product.deletedAt &&
        product.showOnHomepage !== false &&
        (product.showInFeaturedCollection ?? product.featured)
    )
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 4)
    .map(publicProduct);
  const featuredProduct = products.find((product) => product.featured) ?? products[0];
  const featuredProductHref = featuredProduct ? `/product/${featuredProduct.slug}` : "/product";
  const hms = settings.homepageMediaSettings;
  const rawHms = hms as unknown as LooseSettings;
  const heroMedia = hms.heroMedia as SectionMedia;
  const careMedia = hms.careMedia as SectionMedia;
  const experienceMedia = hms.experienceMedia as SectionMedia;
  const liveSupportMode = settings.storeProfile.liveSupportMode;
  const whatsappUrl = settings.supportWhatsApp ? whatsappHref(settings.supportWhatsApp) : "";
  const homepageStatItems = [
    { value: hms.statItem1Value, label: hms.statItem1Label },
    { value: hms.statItem2Value, label: hms.statItem2Label },
    { value: hms.statItem3Value, label: hms.statItem3Label },
  ].filter((item) => item.value && item.label);
  const homepageMarqueeItems = hms.marqueeItems
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  const collections = collectionDefs
    .map(({ key, icon, tone }) => {
      const value = (suffix: string) => String(rawHms[`${key}${suffix}`] || "");
      const state = String(rawHms[key] || "hidden");
      return {
        key,
        icon,
        tone,
        state,
        comingSoon: state === "coming_soon",
        title: value("Title"),
        description: value("Description"),
        fallbackHref: smartHomeCtaHref(value("LinkUrl"), key),
        imageUrl: value("ImageUrl"),
        videoUrl: value("VideoUrl"),
        altText: value("AltText"),
        mode: value("MediaMode"),
        sortOrder: Number(value("SortOrder") || "99") || 99,
      };
    })
    .filter((item) => item.state !== "hidden")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const layerBenefits = [
    [hms.layerComfortLayer1Title, hms.layerComfortLayer1Description],
    [hms.layerComfortLayer2Title, hms.layerComfortLayer2Description],
    [hms.layerComfortLayer3Title, hms.layerComfortLayer3Description],
  ].filter(([title]) => title);
  const careBenefits = [
    ["Soft comfort", "Flexible fabric feel for daily wear."],
    ["Layered support", "Built for reusable care and light to moderate flow routines."],
    ["Discreet finish", "A smooth silhouette for privacy-minded comfort."],
  ];
  const findCards = [
    {
      title: hms.findCareCard1Title,
      description: hms.findCareCard1Description,
      fallbackHref: smartHomeCtaHref(hms.findCareCard1LinkUrl, "findCareFlowDays"),
      icon: Droplets,
      collection: collections[0],
    },
    {
      title: hms.findCareCard2Title,
      description: hms.findCareCard2Description,
      fallbackHref: smartHomeCtaHref(hms.findCareCard2LinkUrl, "findCareDailyComfort"),
      icon: Sparkles,
      collection: collections[1],
    },
    {
      title: hms.findCareCard3Title,
      description: hms.findCareCard3Description,
      fallbackHref: smartHomeCtaHref(hms.findCareCard3LinkUrl, "findCareGentleSupport"),
      icon: ShieldCheck,
      collection: collections[2],
    },
  ];
  const faqs = [
    [hms.faqPreviewItem1Question, hms.faqPreviewItem1Answer],
    [hms.faqPreviewItem2Question, hms.faqPreviewItem2Answer],
    [hms.faqPreviewItem3Question, hms.faqPreviewItem3Answer],
  ].filter(([question, answer]) => question && answer);

  return (
    <main className="aev-home relative min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <HomeMotionController />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(255,77,184,0.08),transparent_29%),radial-gradient(circle_at_84%_20%,rgba(0,212,198,0.06),transparent_25%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />
      <SiteHeader active="home" productHref={featuredProductHref} settings={settings} />
      <AevIntroScreen
        enabled={hms.splashEnabled}
        brand={hms.splashTitle || settings.brandDisplayName || "Aevyrixa Her Care"}
        logoSrc={hms.splashLogoUrl || "/logo.jpg"}
      />

      {hms.showHero ? (
        <section className="aev-home-hero relative isolate overflow-hidden px-4 pb-7 pt-5 sm:px-6 sm:pb-14 sm:pt-12">
          <div className="aev-hero-cinema pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14">
            <div className="min-w-0">
              <p className="aev-story-eyebrow inline-flex rounded-full border border-[#FF4DB8]/24 bg-[#FF4DB8]/[0.08] px-4 py-2">
                {heroMedia.eyebrow || settings.appearanceSettings.heroBadgeText || settings.brandDisplayName}
              </p>
              <h1 className="mt-4 max-w-[12ch] text-[2.15rem] font-semibold leading-[1.04] tracking-tight text-white min-[390px]:text-[2.45rem] sm:mt-6 sm:max-w-3xl sm:text-6xl lg:text-[4.7rem]">
                {heroMedia.heading || settings.appearanceSettings.homepageHeroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
                {heroMedia.subheading || settings.appearanceSettings.homepageHeroSubtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
                <Link href={smartHomeCtaHref(heroMedia.ctaLink, "finalPrimary", { broad: true })} className="aev-action-primary inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-6 text-sm font-bold text-white">
                  {heroMedia.ctaText || settings.appearanceSettings.primaryCtaText}
                </Link>
                <Link href="/product" className="aev-action-secondary inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF4DB8]/22 bg-white/[0.05] px-6 text-sm font-semibold text-[#FFB3D1]">
                  View Collection
                </Link>
              </div>
              {hms.showStatStrip ? (
                <div className="aev-hero-stat-shelf mt-5 w-full max-w-xl overflow-hidden border-y border-[#FF4DB8]/16 sm:mt-7" aria-label="Brand trust statistics">
                  <div className="grid grid-cols-3">
                    {(homepageStatItems.length ? homepageStatItems : statItems).map(({ value, label }) => (
                      <div key={label} className="aev-hero-stat flex flex-col items-center justify-center gap-0.5 px-1.5 py-2.5 text-center sm:px-3 sm:py-3">
                        <span className="aev-hero-stat-value block text-base font-extrabold text-[#FFB3D1] sm:text-lg">{value}</span>
                        <span className="block text-[0.53rem] font-semibold uppercase leading-tight tracking-[0.075em] text-[#D8CBE8]/70 sm:text-[0.62rem]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <StoryVisual
              media={heroMedia}
              alt="Aevyrixa Her Care hero media"
              fallback={
                <AevyrixaMotionPanel
                  mp4Src="/videos/aevyrixa-hero-motion.mp4"
                  eyebrow="Reusable care"
                  title="Her Care in motion"
                  copy="A visual introduction to comfort layers and refined everyday care."
                  variant="hero"
                  className="h-full rounded-none border-0 shadow-none"
                />
              }
            />
          </div>
        </section>
      ) : null}

      {hms.showMarquee ? (
        <div className="aev-home-marquee mb-2 sm:mb-4" aria-hidden="true">
          <div className="aev-home-marquee-track">
            <div className="aev-home-marquee-group">
              {(homepageMarqueeItems.length ? homepageMarqueeItems : marqueeItems).map((item) => (
                <span key={item} className="aev-home-marquee-item">{item}</span>
              ))}
            </div>
            <div className="aev-home-marquee-group" aria-hidden="true">
              {(homepageMarqueeItems.length ? homepageMarqueeItems : marqueeItems).map((item) => (
                <span key={`dup-${item}`} className="aev-home-marquee-item">{item}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {hms.showTrustStrip ? (
        <section className="px-4 pb-3 sm:px-6 sm:pb-7" aria-label="Store trust points">
          <div className="aev-trust-row mx-auto grid max-w-7xl grid-cols-3 gap-2 overflow-hidden rounded-[1.35rem] border border-[#FF4DB8]/12 bg-[#120C22]/76 p-2 sm:gap-3 sm:p-3">
            {trustItems.map(({ label, icon: Icon }) => (
              <article key={label} className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[1rem] border border-white/[0.07] bg-white/[0.035] px-1.5 py-2.5 text-center sm:flex-row sm:justify-start sm:px-4">
                <Icon className="h-4 w-4 shrink-0 text-[#FFB3D1]" strokeWidth={1.8} />
                <h2 className="text-[0.62rem] font-semibold leading-4 text-white/88 sm:text-sm">{label}</h2>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hms.showFeaturedProducts && featuredProducts.length ? (
        <section className="aev-scroll-section px-4 py-9 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <HomeSectionHeading
                eyebrow={hms.featuredProductsEyebrow}
                heading={hms.featuredProductsHeading}
                body={hms.featuredProductsDescription}
                compact
              />
              <Link href="/product" className="aev-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold">
                View Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="aev-featured-products-grid mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <StorefrontProductCard key={product.id} product={product} compact priority={index === 0} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hms.showCategories ? (
        <section className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <HomeSectionHeading
                eyebrow={hms.collectionsEyebrow}
                heading={hms.collectionsHeading}
                body={hms.collectionsDescription}
              />
              <Link href="/product" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#FF4DB8]/20 bg-white/[0.04] px-4 text-sm font-semibold text-[#FFB3D1]">
                Shop all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="aev-collection-grid mt-6 grid grid-cols-2 gap-2.5 min-[460px]:gap-4 lg:mt-9 lg:grid-cols-4">
              {collections.map((item) => {
                const Icon = item.icon;
                const visual = (
                  <div className="relative aspect-[1.16] overflow-hidden rounded-[1rem] border border-white/[0.08] bg-[#0D0820]">
                    <UploadedMedia
                      imageUrl={item.imageUrl}
                      videoUrl={item.videoUrl}
                      mode={item.mode}
                      alt={item.altText || item.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-90"
                    />
                    {!item.imageUrl && !item.videoUrl ? (
                      <div className={`aev-collection-art aev-collection-art-${item.tone} absolute inset-0 flex items-center justify-center`}>
                        <Icon className="h-7 w-7 text-white/85 sm:h-9 sm:w-9" strokeWidth={1.5} />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080611]/62 via-transparent to-white/[0.05]" />
                  </div>
                );
                const body = (
                  <>
                    {visual}
                    <div className="mt-2 flex items-start justify-between gap-1.5 sm:mt-3">
                      <div className="min-w-0">
                        <h3 className="text-[0.82rem] font-semibold leading-4 text-white sm:text-base">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-[0.66rem] leading-4 text-[#D8CBE8]/72 sm:text-sm sm:leading-5">
                          {item.description}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.08em] sm:px-2 sm:text-[0.6rem] ${item.comingSoon ? "border-[#FFB84D]/24 bg-[#FFB84D]/[0.08] text-[#FFB84D]" : "border-[#00D4C6]/22 bg-[#00D4C6]/[0.08] text-[#31E6D4]"}`}>
                        {item.comingSoon ? "Soon" : "Open"}
                      </span>
                    </div>
                  </>
                );

                return !item.comingSoon ? (
                  <a key={item.key} href={item.fallbackHref} className="aev-home-art-link aev-collection-card flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[#FF4DB8]/12 bg-[#151024]/92 p-2.5 sm:rounded-[1.6rem] sm:p-4">
                    {body}
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-[#FFB3D1] sm:text-sm">
                      {homeCardCtaLabel()} 
                    </span>
                  </a>
                ) : (
                  <article key={item.key} className="aev-collection-card min-w-0 overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-[#151024]/68 p-2.5 opacity-80 sm:rounded-[1.6rem] sm:p-4">
                    {body}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {hms.showStorySections ? (
        <>
          {hms.layerComfortEnabled ? (
            <section className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-16">
              <div className="aev-home-art-block aev-home-art-block-layer mx-auto grid max-w-7xl gap-5 overflow-hidden rounded-[1.8rem] border border-[#FF4DB8]/12 bg-[#100A1E]/72 p-4 sm:p-7 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-10 lg:p-10">
                <div className="order-2 min-w-0 lg:order-1">
                  <HomeSectionHeading
                    eyebrow={hms.layerComfortEyebrow}
                    heading={hms.layerComfortHeading}
                    body={hms.layerComfortDescription}
                  />
                  <div className="mt-4 grid gap-2.5 sm:mt-7">
                    {layerBenefits.map(([title, body]) => (
                      <article key={title} className="flex gap-3 rounded-[1rem] border border-white/[0.08] bg-[#080611]/58 p-3.5 sm:rounded-2xl sm:p-4">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#31E6D4] ring-4 ring-[#FF4DB8]/10" />
                        <div>
                          <h3 className="text-sm font-semibold text-white">{title}</h3>
                          <p className="mt-1 text-xs leading-5 text-[#D8CBE8]/75 sm:text-sm sm:leading-6">{body}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <Link href={smartHomeCtaHref(hms.layerComfortCtaLink, "layerComfort")} className="aev-action-primary mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-5 text-sm font-bold text-white sm:mt-7">
                    {homeCardCtaLabel(hms.layerComfortCtaText)}
                  </Link>
                </div>
                <div className="aev-layer-story-media order-1 relative min-h-[16rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0D0820] sm:min-h-[25rem] lg:order-2">
                  <UploadedMedia
                    imageUrl={hms.layerComfortImageUrl}
                    videoUrl={hms.layerComfortVideoUrl}
                    mode={hms.layerComfortMediaMode}
                    alt={hms.layerComfortAltText || "Her Care layer system"}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                  {!hms.layerComfortImageUrl && !hms.layerComfortVideoUrl ? <LayerFallback /> : <div className="absolute inset-0 bg-gradient-to-t from-[#080611]/54 via-transparent to-white/[0.04]" />}
                </div>
              </div>
            </section>
          ) : null}

          <section className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-16">
            <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
              <StoryVisual
                media={careMedia}
                alt="Aevyrixa care motion media"
                fallback={
                  <AevyrixaMotionPanel
                    mp4Src="/videos/aevyrixa-care-system.mp4"
                    eyebrow="Aevyrixa Care Motion"
                    title="Layered reusable care"
                    copy="Soft motion and layered form keep the product story visual."
                    variant="care"
                    className="h-full rounded-none border-0 shadow-none"
                  />
                }
              />
              <div className="min-w-0">
                <HomeSectionHeading
                  eyebrow={careMedia.eyebrow || "Aevyrixa Care Motion"}
                  heading={careMedia.heading || "Reusable care with a softer daily feel."}
                  body={careMedia.subheading || "A compact visual look at comfort, layered support, and discreet daily wear for Bangladesh routines."}
                />
                <div className="mt-4 grid gap-2 sm:mt-7">
                  {careBenefits.map(([title, body]) => (
                    <article key={title} className="flex gap-3 rounded-[1rem] border border-[#FF4DB8]/12 bg-[#151024]/88 p-3.5 text-sm leading-6 text-[#D8CBE8]/78">
                      <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#31E6D4]" />
                      <span><strong className="block text-white">{title}</strong>{body}</span>
                    </article>
                  ))}
                </div>
                <Link href={smartHomeCtaHref(careMedia.ctaLink, "careMotion")} className="aev-action-primary mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-5 text-sm font-bold text-white sm:mt-7">
                  {homeCardCtaLabel(careMedia.ctaText)}
                </Link>
              </div>
            </div>
          </section>

          <section className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-16">
            <div className="aev-home-art-block aev-home-art-block-petal mx-auto grid max-w-7xl gap-5 overflow-hidden rounded-[1.8rem] border border-[#00D4C6]/12 bg-[#0D0A1C]/82 p-4 sm:p-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-10 lg:p-10">
              <div className="min-w-0">
                <HomeSectionHeading
                  eyebrow={experienceMedia.eyebrow || "Designed for Your Day"}
                  heading={experienceMedia.heading || "Everyday comfort, shown through the routine around it."}
                  body={experienceMedia.subheading || "Use the visual story to explore soft care for moving, resting, and returning to your day with a calmer fit."}
                />
                <Link href={smartHomeCtaHref(experienceMedia.ctaLink, "designedDay")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#FF4DB8]/22 bg-white/[0.055] px-5 text-sm font-semibold text-[#FFB3D1]">
                  {homeCardCtaLabel(experienceMedia.ctaText)}
                </Link>
              </div>
              <StoryVisual
                media={experienceMedia}
                alt="Designed for your day media"
                fallback={
                  <AevyrixaMotionPanel
                    mp4Src="/videos/aevyrixa-experience.mp4"
                    eyebrow="Lifestyle motion"
                    title="Designed for your day"
                    copy="A lifestyle-focused fallback keeps this story visual when no admin media is uploaded."
                    variant="experience"
                    className="h-full rounded-none border-0 shadow-none"
                  />
                }
              />
            </div>
          </section>

          {hms.findCareEnabled ? (
            <section className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-16">
              <div className="mx-auto max-w-7xl">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <HomeSectionHeading eyebrow={hms.findCareEyebrow} heading={hms.findCareHeading} body={hms.findCareDescription} />
                  <Link href={smartHomeCtaHref(hms.findCareCtaLink, "findCare", { broad: true })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#00D4C6]/22 bg-[#00D4C6]/[0.08] px-4 text-sm font-semibold text-[#9FF6EE]">
                    {homeCardCtaLabel(hms.findCareCtaText)}
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {findCards.map(({ title, description, fallbackHref, icon: Icon, collection }) => (
                    <Link key={title} href={fallbackHref} className="aev-home-art-link aev-find-card grid min-w-0 grid-cols-[5.4rem_1fr] gap-3 overflow-hidden rounded-[1.35rem] border border-[#FF4DB8]/12 bg-[#151024]/92 p-2.5 md:block md:p-4">
                      <div className="relative min-h-[5.4rem] overflow-hidden rounded-[1rem] border border-white/[0.08] bg-[#0D0820] md:aspect-[1.22]">
                        {collection ? (
                          <UploadedMedia imageUrl={collection.imageUrl} videoUrl={collection.videoUrl} mode={collection.mode} alt={collection.altText || title} className="absolute inset-0 h-full w-full object-cover opacity-90" />
                        ) : null}
                        {!collection?.imageUrl && !collection?.videoUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(255,77,184,0.24),transparent_42%),linear-gradient(135deg,rgba(0,212,198,0.15),rgba(168,85,247,0.17))]">
                            <Icon className="h-7 w-7 text-white/90" strokeWidth={1.6} />
                          </div>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080611]/55 to-transparent" />
                      </div>
                      <div className="min-w-0 md:mt-4">
                        <h3 className="text-base font-semibold leading-5 text-white">{title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-[#D8CBE8]/76 sm:text-sm">{description}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#FFB3D1]">
                          {homeCardCtaLabel()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {hms.showFAQ ? (
        <section id="faq" className="aev-scroll-section px-4 py-8 sm:px-6 sm:py-14">
          <div className="aev-home-art-block mx-auto max-w-5xl overflow-hidden rounded-[1.7rem] border border-[#FF4DB8]/12 bg-[#100A1E]/78 p-4 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <HomeSectionHeading eyebrow={hms.faqPreviewEyebrow} heading={hms.faqPreviewHeading} compact />
              <Link href="/faq" className="text-sm font-semibold text-[#FFB3D1] transition hover:text-white">
                View full FAQ
              </Link>
            </div>
            <div className="mt-5 grid gap-2.5">
              {faqs.map(([question, answer], index) => (
                <details key={question} className="aev-home-faq rounded-[1rem] border border-white/[0.08] bg-[#080611]/58 px-4 py-3" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white sm:text-base">
                    {question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#FFB3D1]" />
                  </summary>
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-[#D8CBE8]/76 sm:text-sm sm:leading-6">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hms.showBottomCTA && hms.ctaSectionEnabled ? (
        <section className="px-4 pb-10 pt-8 sm:px-6 sm:pb-24 sm:pt-14">
          <div className="aev-final-cta aev-home-art-block aev-home-art-block-cta mx-auto grid max-w-7xl overflow-hidden rounded-[1.8rem] border border-[#FF4DB8]/16 bg-[#0D0820] lg:grid-cols-[1fr_0.9fr]">
            <div className="relative p-5 sm:p-9 lg:p-12">
              <HomeSectionHeading eyebrow={hms.ctaSectionEyebrow} heading={hms.ctaSectionHeading} body={hms.ctaSectionDescription} />
              <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7">
                <Link href={smartHomeCtaHref(hms.ctaSectionPrimaryCtaLink, "finalPrimary", { broad: true })} className="aev-action-primary inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] px-6 text-sm font-bold text-white">
                  {homeCardCtaLabel(hms.ctaSectionPrimaryCtaText || settings.appearanceSettings.primaryCtaText)}
                </Link>
                <Link href={smartHomeCtaHref(hms.ctaSectionSecondaryCtaLink, "finalSecondary", { broad: true })} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.055] px-6 text-sm font-semibold text-white/88">
                  {hms.ctaSectionSecondaryCtaText || "View Collection"}
                </Link>
              </div>
            </div>
            <div className="aev-final-cta-media relative min-h-[12rem] overflow-hidden border-t border-white/10 bg-[#120C22] lg:min-h-full lg:border-l lg:border-t-0">
              <UploadedMedia imageUrl={hms.ctaSectionImageUrl} videoUrl={hms.ctaSectionVideoUrl} mode={hms.ctaSectionMediaMode} alt={hms.ctaSectionAltText || "Her Care collection"} className="absolute inset-0 h-full w-full object-cover opacity-90" />
              {!hms.ctaSectionImageUrl && !hms.ctaSectionVideoUrl ? <LayerFallback /> : null}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#080611]/65 via-transparent to-[#31E6D4]/[0.06]" />
            </div>
          </div>
        </section>
      ) : null}

      {liveSupportMode === "whatsapp" || liveSupportMode === "both" ? (
        hms.whatsappWidgetEnabled &&
        whatsappUrl &&
        (hms.whatsappWidgetPlacement === "homepage" || hms.whatsappWidgetPlacement === "all") ? (
          <div className="aev-home-whatsapp-widget fixed bottom-20 right-4 z-50 md:bottom-6 sm:right-6">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-[#00D4C6]/28 bg-[#151024]/92 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl">
              {hms.whatsappWidgetLabel || "Support"}
            </a>
          </div>
        ) : null
      ) : null}
      <LiveChatWidget
        enabled={(liveSupportMode === "live_chat" || liveSupportMode === "both") && hms.liveChatEnabled}
        label={hms.liveChatLabel}
        placement={hms.liveChatPlacement}
        whatsappAlsoEnabled={Boolean(whatsappUrl && hms.whatsappWidgetEnabled)}
        whatsappUrl={whatsappUrl}
        supportPhone={settings.supportPhone}
        hideLauncherOnMobile
      />
      <SiteFooter settings={settings} />
    </main>
  );
}
