"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  HeartHandshake,
  LockKeyhole,
  Moon,
  Package,
  PackageCheck,
  Repeat2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import StorefrontProductCard, {
  isLimitedStock,
  isNewProduct,
  productDateValue,
} from "@/app/components/storefront-product-card";
import type { ProductCatalogItem, ProductStockStatus } from "@/app/lib/product-types";
import type {
  CategoryCmsEntry,
  StorefrontSettings,
} from "@/app/lib/storefront-settings";
import type { ReviewSummary } from "@/app/lib/review-types";
import {
  emptyShopQueryFilters,
  parseShopSignal,
  parseShopStock,
  productMatchesCategoryQuery,
  normalizeShopValue,
  shopContextCopy,
  shopSignalLabel,
  type ShopQueryFilters,
  type ShopSignalFilter,
  type ShopStockFilter,
} from "@/app/lib/shop-routing";

type ShopDiscoveryClientProps = {
  products: ProductCatalogItem[];
  activeCategories: CategoryCmsEntry[];
  settings: StorefrontSettings;
  reviewSummaries?: ReviewSummary[];
  initialFilters?: ShopQueryFilters;
};

type StockFilter = ShopStockFilter;
type SignalFilter = ShopSignalFilter;
type PriceFilter = "all" | "under-1300" | "1300-1600" | "over-1600";
type SortMode = "featured" | "newest" | "price-asc" | "price-desc" | "stock";

const stockRank: Record<ProductStockStatus, number> = {
  in_stock: 0,
  low_stock: 1,
  preorder: 2,
  out_of_stock: 3,
};

const discoveryChips = [
  { label: "Period Care", category: "Reusable Period Care", icon: ShieldCheck },
  { label: "Everyday Comfort", category: "Comfort Panty", icon: Sparkles },
  { label: "Night Comfort", category: "Nightwear", icon: Moon },
];

function normalized(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function safeShopCopy(value: string) {
  return value
    .replace(/5-Day Hygiene Support/gi, "3-Day Hygiene-Safe Support")
    .replace(/100%\s*guaranteed/gi, "Carefully supported")
    .replace(/2yr Guaranteed reusable lifespan/gi, "Reusable care, made for repeat wear")
    .replace(/2yr\+?\s*guaranteed/gi, "Reusable care")
    .replace(/2yr reusable lifespan/gi, "Reusable care, made for repeat wear")
    .replace(/100% Discreet delivery/gi, "Discreet privacy packaging")
    .replace(/100%\s*discreet delivery/gi, "Discreet privacy packaging")
    .replace(/OEKO-TEX Certified/gi, "Comfort-focused materials")
    .replace(/OEKO\s*TEX certified/gi, "Comfort-focused materials")
    .replace(/Anti-Leak/gi, "Layered support")
    .replace(/Anti-Bacterial/gi, "Breathable comfort")
    .replace(/Anti[-\s]?bacterial/gi, "Breathable comfort")
    .replace(/leak-proof/gi, "layered support");
}

function productMatchesCategory(products: ProductCatalogItem[], category: string) {
  return products.some((product) => productMatchesCategoryQuery(product, category));
}

function isHeavyFlowProduct(product: ProductCatalogItem) {
  const source = [
    product.absorbency,
    product.category,
    product.name,
    product.shortDescription,
  ]
    .map(normalized)
    .join(" ");

  return source.includes("heavy") || source.includes("night");
}

function CollectionSection({
  eyebrow,
  title,
  products,
  ratingMap,
}: {
  eyebrow: string;
  title: string;
  products: ProductCatalogItem[];
  ratingMap: Map<string, ReviewSummary>;
}) {
  if (products.length === 0) return null;

  return (
    <section className="aev-shop-merch-section mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="aev-section-label">{eyebrow}</p>
          <h2 className="aev-heading mt-2 text-xl sm:text-2xl md:text-3xl">
            {title}
          </h2>
        </div>
        <div className="hidden h-px flex-1 bg-gradient-to-r from-[#FF4DB8]/16 to-transparent sm:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <StorefrontProductCard
            key={product.id}
            product={product}
            compact
            shopCard
            rating={ratingMap.get(product.slug)}
          />
        ))}
      </div>
    </section>
  );
}

export default function ShopDiscoveryClient({
  products,
  activeCategories,
  reviewSummaries = [],
  initialFilters = emptyShopQueryFilters,
  settings,
}: ShopDiscoveryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialFilters.query);
  const [category, setCategory] = useState(initialFilters.category);
  const [stock, setStock] = useState<StockFilter>(initialFilters.stock);
  const [price, setPrice] = useState<PriceFilter>("all");
  const [signal, setSignal] = useState<SignalFilter>(initialFilters.signal);
  const [sort, setSort] = useState<SortMode>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collection, setCollection] = useState(initialFilters.collection);

  const categoriesWithProducts = useMemo(() => {
    return activeCategories.filter((entry) =>
      products.some((product) => productMatchesCategoryQuery(product, entry.title))
    );
  }, [activeCategories, products]);

  const ratingMap = useMemo(
    () => new Map(reviewSummaries.map((summary) => [summary.productSlug, summary])),
    [reviewSummaries]
  );

  const featuredProducts = useMemo(
    () =>
      products
        .filter((product) => product.showInFeaturedCollection ?? product.featured)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .slice(0, 4),
    [products]
  );

  const newArrivals = useMemo(
    () => [...products].sort((a, b) => productDateValue(b) - productDateValue(a)).slice(0, 4),
    [products]
  );

  const bestPicks = featuredProducts.length > 0 ? featuredProducts : newArrivals;
  const limitedStockProducts = useMemo(
    () => products.filter((product) => isLimitedStock(product)).slice(0, 4),
    [products]
  );
  const everydayComfortProducts = useMemo(
    () =>
      products
        .filter((product) => {
          const source = normalized(`${product.category} ${product.name} ${product.shortDescription}`);
          return source.includes("comfort") || source.includes("everyday");
        })
        .slice(0, 4),
    [products]
  );

  const availableDiscoveryChips = useMemo(
    () =>
      discoveryChips.filter((chip) =>
        productMatchesCategory(products, chip.category)
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = normalized(query);

    return products
      .filter((product) => {
        const searchable = [
          product.name,
          product.shortDescription,
          product.description,
          product.category,
        ]
          .map(normalized)
          .join(" ");

        if (term && !searchable.includes(term)) return false;
        if (category && !productMatchesCategoryQuery(product, category)) return false;
        if (stock === "in_stock" && product.stockStatus === "out_of_stock") return false;
        if (stock === "out_of_stock" && product.stockStatus !== "out_of_stock") return false;
        if (price === "under-1300" && product.price >= 1300) return false;
        if (price === "1300-1600" && (product.price < 1300 || product.price > 1600)) return false;
        if (price === "over-1600" && product.price <= 1600) return false;
        if (signal === "new" && !isNewProduct(product)) return false;
        if (signal === "featured" && !(product.showInFeaturedCollection ?? product.featured)) return false;
        if (signal === "limited_stock" && !isLimitedStock(product)) return false;
        if (signal === "best_seller" && !product.isBestSeller) return false;
        if (signal === "heavy_flow" && !isHeavyFlowProduct(product)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "newest") return productDateValue(b) - productDateValue(a);
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "stock") return stockRank[a.stockStatus] - stockRank[b.stockStatus];
        return (
          Number(b.showInFeaturedCollection ?? b.featured) -
            Number(a.showInFeaturedCollection ?? a.featured) ||
          (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
          productDateValue(b) - productDateValue(a)
        );
      });
  }, [category, price, products, query, signal, sort, stock]);

  const hasActiveFilters =
    Boolean(query || category || collection) ||
    stock !== "all" ||
    price !== "all" ||
    signal !== "all";
  const context = shopContextCopy({ category, signal, stock, query, collection });
  const activeFilterLabels = [
    category,
    signal !== "all" ? shopSignalLabel(signal) : "",
    stock === "in_stock" ? "In stock" : stock === "out_of_stock" ? "Out of stock" : "",
    query ? `Search: ${query}` : "",
    collection && !category && signal === "all" ? collection : "",
  ].filter(Boolean);
  const safeAnnouncementItems = [
    "Discreet Packaging",
    "3-Day Hygiene-Safe Support",
    "Premium Comfort",
    "BDT Pricing",
    "Reusable Care",
    "Secure Checkout",
    "Bangladesh Delivery",
  ].map(safeShopCopy);
  const tickerItems = safeAnnouncementItems;
  const hms = settings.homepageMediaSettings;
  const heroTitle = safeShopCopy(hms.shopHeroTitle || "Comfort that moves with you");
  const heroSubtitle = safeShopCopy(
    hms.shopHeroSubtitle ||
      "Premium women's comfort, hygiene & reusable care with discreet Bangladesh delivery."
  );
  const primaryCta = hms.shopHeroPrimaryCtaText || "Shop Now";
  const primaryCtaLink = hms.shopHeroPrimaryCtaLink || "#shop-products";
  const secondaryCta = hms.shopHeroSecondaryCtaText || "Track Order";
  const secondaryCtaLink = hms.shopHeroSecondaryCtaLink || "/track-order";
  const heroEyebrow = hms.shopHeroEyebrow || "AEVYRIXA HER CARE SHOP";
  const heroMediaUrl = hms.shopHeroMediaUrl || "";
  const heroMediaAlt = hms.shopHeroMediaAlt || "Aevyrixa Her Care";
  const heroMediaType = hms.shopHeroMediaType || "auto";
  const heroBadge1 = hms.shopHeroBadge1 ? safeShopCopy(hms.shopHeroBadge1) : "";
  const heroBadge2 = hms.shopHeroBadge2 ? safeShopCopy(hms.shopHeroBadge2) : "";
  const heroCaption = hms.shopHeroCaption || "";
  const isHeroVideo =
    heroMediaType === "video" ||
    (heroMediaType === "auto" && /\.(mp4|webm|ogg)(\?|$)/i.test(heroMediaUrl));
  const trustCards = [
    {
      icon: PackageCheck,
      kicker: safeShopCopy(hms.shopHeroTrust1Label || "Privacy"),
      label: safeShopCopy(hms.shopHeroTrust1Description || "Discreet privacy packaging"),
      tone: "text-[#FFB3D1]",
    },
    {
      icon: HeartHandshake,
      kicker: safeShopCopy(hms.shopHeroTrust2Label || "Support"),
      label: safeShopCopy(hms.shopHeroTrust2Description || "3-Day Hygiene-Safe Support"),
      tone: "text-[#31E6D4]",
    },
    {
      icon: Truck,
      kicker: safeShopCopy(hms.shopHeroTrust3Label || "Delivery"),
      label: safeShopCopy(hms.shopHeroTrust3Description || "Bangladesh delivery"),
      tone: "text-[#C084FC]",
    },
  ];
  const tickerIconFor = (item: string) => {
    const text = normalized(item);
    if (text.includes("packag") || text.includes("privacy") || text.includes("discreet")) return Package;
    if (text.includes("hygiene") || text.includes("support")) return ShieldCheck;
    if (text.includes("comfort")) return HeartHandshake;
    if (text.includes("secure") || text.includes("checkout") || text.includes("lock")) return LockKeyhole;
    if (text.includes("bdt") || text.includes("pricing")) return CreditCard;
    if (text.includes("reusable") || text.includes("repeat") || text.includes("care")) return Repeat2;
    if (text.includes("delivery") || text.includes("bangladesh")) return Truck;
    return Sparkles;
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setStock("all");
    setPrice("all");
    setSignal("all");
    setSort("featured");
    setCollection("");
    router.replace("/product", { scroll: false });
  };

  const selectDiscoveryChip = (chip: (typeof discoveryChips)[number]) => {
    setCategory(category === chip.category ? "" : chip.category);
    setSignal("all");
  };

  useEffect(() => {
    const nextCategory = searchParams.get("category")?.trim() ?? "";
    const nextQuery =
      searchParams.get("q")?.trim() ?? searchParams.get("search")?.trim() ?? "";
    const nextCollection = searchParams.get("collection")?.trim() ?? "";

    setCategory(nextCategory);
    setQuery(nextQuery);
    setCollection(nextCollection);
    setStock(parseShopStock(searchParams.get("stock") ?? undefined));
    setSignal(parseShopSignal(searchParams.get("signal") ?? undefined));
  }, [searchParams]);

  useEffect(() => {
    if (!filtersOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

  const filterPanel = (
    <div className="space-y-5">
      <FilterGroup label="Category">
        <Chip active={!category} onClick={() => setCategory("")}>
          All
        </Chip>
        {categoriesWithProducts.map((entry) => (
          <Chip
            key={entry.key}
            active={category === entry.title}
            onClick={() => setCategory(entry.title)}
          >
            {entry.title}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Stock">
        <Chip active={stock === "all"} onClick={() => setStock("all")}>
          All
        </Chip>
        <Chip active={stock === "in_stock"} onClick={() => setStock("in_stock")}>
          In stock
        </Chip>
        <Chip active={stock === "out_of_stock"} onClick={() => setStock("out_of_stock")}>
          Out of stock
        </Chip>
      </FilterGroup>

      <FilterGroup label="Price">
        <Chip active={price === "all"} onClick={() => setPrice("all")}>
          All BDT
        </Chip>
        <Chip active={price === "under-1300"} onClick={() => setPrice("under-1300")}>
          Under BDT 1,300
        </Chip>
        <Chip active={price === "1300-1600"} onClick={() => setPrice("1300-1600")}>
          BDT 1,300-1,600
        </Chip>
        <Chip active={price === "over-1600"} onClick={() => setPrice("over-1600")}>
          Over BDT 1,600
        </Chip>
      </FilterGroup>

      <FilterGroup label="Signals">
        <Chip active={signal === "all"} onClick={() => setSignal("all")}>
          All
        </Chip>
        <Chip active={signal === "featured"} onClick={() => setSignal("featured")}>
          Featured
        </Chip>
        <Chip active={signal === "new"} onClick={() => setSignal("new")}>
          New
        </Chip>
        <Chip active={signal === "limited_stock"} onClick={() => setSignal("limited_stock")}>
          Limited Stock
        </Chip>
        <Chip active={signal === "best_seller"} onClick={() => setSignal("best_seller")}>
          Best Sellers
        </Chip>
        <Chip active={signal === "heavy_flow"} onClick={() => setSignal("heavy_flow")}>
          Heavy Flow
        </Chip>
      </FilterGroup>
    </div>
  );

  return (
    <>
      <section className="aev-v2-shop-hero aev-mobile-safe relative mx-auto max-w-[70rem] px-3 pb-2 pt-2 sm:px-5 lg:px-6">
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_16.5rem] xl:grid-cols-[minmax(0,1fr)_17.5rem]">
          <div className="grid gap-3">
            {/* Main hero content card */}
            <div className="aev-v2-hero-main rounded-2xl border border-white/[0.07] bg-[#130F22] p-3 shadow-[0_16px_54px_rgba(0,0,0,0.32)] sm:p-3.5 lg:p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF4DB8] shadow-[0_0_0_5px_rgba(255,77,184,0.10)]" />
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.28em] text-[#9C91AA]">
                  {heroEyebrow}
                </p>
              </div>
              <h1 className="max-w-xl break-words text-[1.42rem] font-black leading-[1.06] tracking-tight text-white [overflow-wrap:anywhere] min-[390px]:text-[1.58rem] sm:text-[1.9rem] lg:text-[2.08rem]">
                {heroTitle}
              </h1>
              <p className="mt-2 max-w-md text-xs leading-5 text-[#D8CBE8]/68 sm:text-sm sm:leading-6">
                {heroSubtitle}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={primaryCtaLink}
                  className="aev-button-primary inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold text-white sm:min-h-11 sm:px-6"
                >
                  {primaryCta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={secondaryCtaLink}
                  className="aev-button-secondary inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold sm:min-h-11 sm:px-5"
                >
                  {secondaryCta}
                </Link>
              </div>

              {/* Mobile compact hero media — hidden on lg+ */}
              {heroMediaUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0E0A1C] lg:hidden" style={{ maxHeight: "10rem" }}>
                  {isHeroVideo ? (
                    <video
                      src={heroMediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                      style={{ maxHeight: "10rem" }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroMediaUrl}
                      alt={heroMediaAlt}
                      className="h-full w-full object-cover"
                      style={{ maxHeight: "10rem" }}
                    />
                  )}
                </div>
              )}

              {/* Mobile compact trust chips — hidden on lg+ */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 lg:hidden">
                {trustCards.map((card) => {
                  const TrustIcon = card.icon;
                  return (
                    <div
                      key={card.kicker}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#0E0A1C]/90 px-2.5 py-1.5 backdrop-blur-sm"
                    >
                      <TrustIcon className={`h-3 w-3 shrink-0 ${card.tone}`} />
                      <span className="text-[0.6rem] font-bold tracking-wide text-white">{card.kicker}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop trust grid — hidden on mobile, shown lg+ */}
            <div className="aev-v2-trust-grid hidden gap-2 sm:gap-3 lg:grid">
              {trustCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.kicker}
                    className="aev-v2-trust-card min-w-0 rounded-xl border border-white/[0.07] bg-[#0E0A1C] p-2.5 sm:flex sm:items-center sm:gap-2.5 sm:p-3"
                  >
                    <span className={`mb-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] sm:mb-0 ${card.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.68rem] font-black uppercase tracking-[0.12em] text-white sm:text-sm">
                        {card.kicker}
                      </span>
                      <span className="mt-0.5 block max-w-full break-words text-[0.58rem] leading-4 text-[#9C91AA] [overflow-wrap:anywhere] sm:line-clamp-2 sm:text-[0.7rem]">
                        {card.label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop hero media card — hidden on mobile, shown lg+ */}
          <div className="aev-v2-hero-media-card relative hidden overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(145deg,#1A0E28,#0E0A1F,#07101F)] shadow-[0_16px_54px_rgba(0,0,0,0.36)] lg:block lg:min-h-[12.25rem]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,77,184,0.22),transparent_34%),radial-gradient(circle_at_20%_82%,rgba(0,212,198,0.11),transparent_30%)]" />

            {heroMediaUrl ? (
              isHeroVideo ? (
                <video
                  src={heroMediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroMediaUrl}
                  alt={heroMediaAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )
            ) : (
              /* Default brand trust visual when no media is set */
              <div className="relative flex h-full min-h-[12.25rem] flex-col justify-between p-5">
                <div className="pointer-events-none absolute inset-0 opacity-70">
                  <div className="absolute left-1/2 top-1/3 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4DB8]/20 blur-2xl" />
                  <div className="absolute bottom-1/4 left-1/4 h-14 w-14 rounded-full bg-[#31E6D4]/15 blur-xl" />
                </div>
                <div className="relative grid grid-cols-3 gap-2">
                  {trustCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.kicker}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-1 py-3"
                      >
                        <span className={`grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] ${card.tone}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-center text-[0.5rem] font-bold uppercase leading-tight tracking-wide text-white/60">
                          {card.kicker}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="relative mt-auto pt-3 text-center text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#9C91AA]/70">
                  Aevyrixa Her Care
                </p>
              </div>
            )}

            {/* Badges */}
            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
              {heroBadge1 && (
                <span className="max-w-[10rem] truncate rounded-full border border-white/10 bg-[#080611]/72 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-[#D8CBE8]/75 backdrop-blur">
                  {heroBadge1}
                </span>
              )}
              {heroBadge2 && (
                <span className="hidden max-w-[10rem] truncate rounded-full border border-white/10 bg-[#080611]/72 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-[#D8CBE8]/75 backdrop-blur sm:inline-flex">
                  {heroBadge2}
                </span>
              )}
            </div>

            {/* Optional caption */}
            {heroCaption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080611]/90 to-transparent px-4 pb-4 pt-6">
                <p className="text-[0.62rem] font-semibold leading-5 text-[#D8CBE8]/80">
                  {heroCaption}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="aev-v2-ticker overflow-hidden border-y border-white/[0.07] bg-[#0E0A1C] py-2">
        <div className="aev-v2-ticker-track flex w-max items-center">
          {[...tickerItems, ...tickerItems].map((item, index) => {
            const TickerIcon = tickerIconFor(item);
            return (
            <span
              key={`${item}-${index}`}
              className="aev-v2-ticker-item flex items-center gap-2.5 px-3.5 text-[0.66rem] font-semibold text-[#9C91AA] sm:px-4"
            >
              <TickerIcon className="h-3.5 w-3.5 text-[#FF4DB8]" />
              {item}
              <span className="text-[#FF4DB8]/35">/</span>
            </span>
            );
          })}
        </div>
      </section>

      {availableDiscoveryChips.length > 0 && (
        <section className="aev-v2-flow-finder border-b border-white/[0.07] bg-[linear-gradient(90deg,rgba(255,77,184,0.045),rgba(168,85,247,0.05),rgba(0,212,198,0.035))] px-3 py-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="shrink-0 text-sm font-black tracking-tight text-white">
              Find your <span className="text-[#FF4DB8]">flow</span>
            </p>
            <div className="aev-v2-flow-chips grid gap-2 pb-0.5 sm:flex sm:flex-wrap">
              {availableDiscoveryChips.map((chip) => {
                const Icon = chip.icon;
                const active =
                  normalizeShopValue(category) === normalizeShopValue(chip.category);
                return (
                  <button
                    key={`${chip.label}-${chip.category}`}
                    type="button"
                    onClick={() => selectDiscoveryChip(chip)}
                    className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#FF4DB8]/55 bg-[#FF4DB8]/14 text-white"
                        : "border-white/10 bg-white/[0.035] text-[#9C91AA] hover:border-[#FF4DB8]/32 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#9C91AA] sm:ml-auto">
              Showing <span className="font-bold text-[#FF4DB8]">{filteredProducts.length}</span> real product{filteredProducts.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>
      )}

      <section id="shop-products" className="aev-shop-products-section mx-auto max-w-7xl px-3 pb-6 pt-0 sm:px-6 sm:pb-10">
        <div className="aev-v2-sort-bar sticky top-[4.9rem] z-30 -mx-3 mb-4 border-b border-white/[0.07] bg-[#080611]/92 px-3 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:top-[6.25rem]">
          <div className="mx-auto grid max-w-7xl gap-2 lg:grid-cols-[minmax(12rem,23rem)_minmax(0,auto)] lg:items-center lg:justify-between">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#FF4DB8]/60" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products or categories..."
                className="aev-input min-h-10 rounded-md py-2 pl-9 pr-9 text-sm placeholder:text-[#6B5F7A]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#9C91AA] transition hover:bg-[#211633] hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="aev-shop-control-row grid grid-cols-[minmax(0,1fr)_minmax(5.4rem,auto)_minmax(4.6rem,auto)] gap-2 lg:flex lg:items-center">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="aev-input min-h-10 min-w-0 rounded-md px-3 py-2 text-xs font-semibold lg:w-36"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price low</option>
                <option value="price-desc">Price high</option>
                <option value="stock">In stock</option>
              </select>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="aev-button-secondary inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-semibold sm:px-4"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters && sort === "featured"}
                className="aev-button-ghost inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
                aria-label="Reset filters"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mx-auto mt-2 flex max-w-7xl gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2">
            {[
              `${products.length} Products`,
              "BDT Pricing",
              "Discreet Packaging",
              "Bangladesh Delivery",
            ].map((item) => (
              <span
                key={item}
                className="aev-shop-meta-chip shrink-0 rounded-full border border-white/10 bg-[#151024]/72 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#D8CBE8]/78 backdrop-blur-xl sm:text-[0.66rem]"
              >
                {item}
              </span>
            ))}
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="shrink-0 rounded-full border border-[#FF4DB8]/28 bg-[#FF4DB8]/[0.09] px-2.5 py-1 text-[0.66rem] font-semibold text-[#FFB3D1]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-1 border-b border-white/[0.08] pb-2.5 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-3">
            <h2 className="aev-heading text-xl sm:text-2xl md:text-3xl">
              {hasActiveFilters ? context.heading : "All Products"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#9C91AA]">
              <span>
                {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </span>
              {filteredProducts.length > 0 && (
                <span className="text-[#D8CBE8]/72">
                  {activeFilterLabels.length > 0
                    ? `Filtered: ${activeFilterLabels.join(", ")}`
                    : "All active products"}
                </span>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="aev-panel px-5 py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#FF4DB8]/55" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                No matching products
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#D8CBE8]/72">
                No exact match is available for this filter right now. Clear filters to view the full Aevyrixa collection.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="aev-button-secondary mt-6 rounded-full px-5 py-3 text-sm font-semibold"
              >
                View all products
              </button>
            </div>
          ) : (
            <div className="aev-shop-products-grid grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <StorefrontProductCard
                  key={product.id}
                  product={product}
                  shopCard
                  rating={ratingMap.get(product.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CollectionSection
        eyebrow="Best Picks"
        title="Shop our best picks"
        products={bestPicks}
        ratingMap={ratingMap}
      />

      <CollectionSection
        eyebrow="New Arrivals"
        title="Fresh from the collection"
        products={newArrivals.filter((product) => isNewProduct(product))}
        ratingMap={ratingMap}
      />

      <CollectionSection
        eyebrow="Limited Stock"
        title="Low-stock pieces to consider"
        products={limitedStockProducts}
        ratingMap={ratingMap}
      />

      <CollectionSection
        eyebrow="Everyday Comfort"
        title="Soft essentials for daily wear"
        products={everydayComfortProducts}
        ratingMap={ratingMap}
      />

      {filtersOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#080611]/78 p-0 backdrop-blur-sm md:items-center md:p-5 lg:items-stretch lg:justify-end lg:p-4"
          role="presentation"
          onMouseDown={() => setFiltersOpen(false)}
        >
          <section
            aria-label="Shop filters"
            aria-modal="true"
            className="aev-panel flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-b-none rounded-t-[1.8rem] border-[#FF4DB8]/20 bg-[#120C22]/95 shadow-[0_-18px_80px_rgba(0,0,0,0.52)] md:max-w-xl md:rounded-[1.8rem] lg:h-full lg:max-h-none lg:max-w-[27rem]"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="aev-section-label">Filters</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Refine products</h2>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="aev-button-ghost grid h-10 w-10 shrink-0 place-items-center rounded-full"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {filterPanel}
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-white/10 bg-[#0D0820]/92 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={resetFilters}
                className="aev-button-ghost min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="aev-button-primary min-h-11 rounded-full px-5 py-2 text-sm font-bold text-white"
              >
                Show {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="aev-shop-support-cta px-4 pb-8 sm:px-6 sm:pb-14">
        <div className="aev-panel aev-glow-border mx-auto max-w-7xl overflow-hidden p-6 text-center sm:p-10">
          <p className="aev-section-label">Need help choosing?</p>
          <h2 className="aev-heading mx-auto mt-3 max-w-3xl text-2xl sm:text-4xl">
            Get discreet guidance before you order.
          </h2>
          <p className="aev-subtext mx-auto mt-4 max-w-2xl text-sm sm:text-base">
            Ask about fit, coverage, and care routine. We keep product guidance simple, private, and pressure-free.
          </p>
          <Link
            href="/support"
            className="aev-button-primary mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold text-white"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#9C91AA]/70">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
        active
          ? "border-[#FF4DB8]/50 bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] text-white shadow-[0_0_14px_rgba(255,77,184,0.30)]"
          : "border-white/10 bg-[#1B1230] text-[#9C91AA] hover:border-[#FF4DB8]/28 hover:text-[#D8CBE8]"
      }`}
    >
      {children}
    </button>
  );
}
