"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Moon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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

type ShopDiscoveryClientProps = {
  products: ProductCatalogItem[];
  activeCategories: CategoryCmsEntry[];
  settings: StorefrontSettings;
  reviewSummaries?: ReviewSummary[];
  initialCategory?: string;
};

type StockFilter = "all" | "in_stock" | "out_of_stock";
type SignalFilter =
  | "all"
  | "new"
  | "featured"
  | "limited_stock"
  | "best_seller"
  | "heavy_flow";
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

function productMatchesCategory(products: ProductCatalogItem[], category: string) {
  return products.some((product) => product.category === category);
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
  initialCategory = "",
}: ShopDiscoveryClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [stock, setStock] = useState<StockFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [signal, setSignal] = useState<SignalFilter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoriesWithProducts = useMemo(() => {
    const productCategories = new Set(products.map((product) => product.category));
    return activeCategories.filter((entry) => productCategories.has(entry.title));
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
        if (category && product.category !== category) return false;
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

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setStock("all");
    setPrice("all");
    setSignal("all");
    setSort("featured");
  };

  const selectDiscoveryChip = (chip: (typeof discoveryChips)[number]) => {
    setCategory(category === chip.category ? "" : chip.category);
    setSignal("all");
  };

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
      <section className="aev-shop-intro aev-mobile-safe relative mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 sm:pt-7 md:pb-6 md:pt-9">
        <div className="pointer-events-none absolute inset-x-3 top-4 -z-10 h-[13rem] rounded-[2rem] bg-[radial-gradient(circle_at_18%_18%,rgba(255,77,184,0.18),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.13),transparent_30%),radial-gradient(circle_at_60%_88%,rgba(0,212,198,0.06),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_58%)] shadow-[0_24px_90px_rgba(0,0,0,0.24)] sm:h-[15rem]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-5xl">
            <h1 className="aev-heading break-words text-[1.65rem] [overflow-wrap:anywhere] sm:text-[2.2rem] lg:text-[2.65rem]">
              Her Care Collection
            </h1>
            <p className="aev-subtext mt-1.5 hidden max-w-2xl text-sm sm:block sm:text-base">
              Premium reusable care essentials with clear BDT pricing and discreet Bangladesh delivery.
            </p>
          </div>

          <div className="aev-panel aev-glow-border mx-auto mt-3 max-w-5xl p-2.5 shadow-[0_20px_72px_rgba(0,0,0,0.38),0_0_36px_rgba(255,77,184,0.08)] sm:mt-4 sm:p-3">
            <div className="grid gap-2 md:grid-cols-[minmax(18rem,1fr)_auto_auto_auto] md:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF4DB8]/60" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products or categories..."
                  className="aev-input min-h-11 rounded-full py-2.5 pl-11 pr-11 text-sm placeholder:text-[#6B5F7A]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#9C91AA] transition hover:bg-[#211633] hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 md:contents">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                  className="aev-input min-h-11 min-w-0 rounded-full px-3 py-2 text-sm font-semibold md:w-40"
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
                  className="aev-button-secondary inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold sm:px-4"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="aev-button-ghost min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm"
                  aria-label="Reset filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-2 flex max-w-5xl gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2">
            {[
              `${products.length} Products`,
              "BDT Pricing",
              "Discreet Packaging",
              "Bangladesh Delivery",
            ].map((item, index) => (
              <span
                key={item}
                className={`aev-shop-meta-chip ${index > 1 ? "aev-shop-meta-chip-secondary" : ""} shrink-0 rounded-full border border-white/10 bg-[#151024]/72 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#D8CBE8]/78 backdrop-blur-xl sm:px-3 sm:py-1.5 sm:text-[0.68rem]`}
              >
                {item}
              </span>
            ))}
          </div>

          {availableDiscoveryChips.length > 0 && (
            <div className="aev-shop-discovery-chips mx-auto mt-2 flex max-w-5xl gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2">
              {availableDiscoveryChips.map((chip) => {
                const Icon = chip.icon;
                const active = category === chip.category;
                return (
                  <button
                    key={`${chip.label}-${chip.category}`}
                    type="button"
                    onClick={() => selectDiscoveryChip(chip)}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition ${
                      active
                        ? "border-[#FF4DB8]/55 bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] text-white shadow-[0_0_18px_rgba(255,77,184,0.32)]"
                        : "border-white/10 bg-[#151024]/88 text-[#D8CBE8]/78 backdrop-blur-xl hover:border-[#FF4DB8]/32 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-0 sm:px-6 sm:pb-18 md:pt-1">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-1 border-b border-white/[0.08] pb-2.5 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-3">
            <h2 className="aev-heading text-xl sm:text-2xl md:text-3xl">
              All Products
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#9C91AA]">
              <span>
                {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </span>
              {filteredProducts.length > 0 && (
                <span className="text-[#D8CBE8]/72">
                  {category ? `Filtered: ${category}` : "All active products"}
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
                Adjust your search, category, price, stock, or signal filters to reveal more of the current Aevyrixa collection.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="aev-button-secondary mt-6 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <StorefrontProductCard
                  key={product.id}
                  product={product}
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

      <section className="aev-shop-support-cta px-4 pb-14 sm:px-6 sm:pb-20">
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
