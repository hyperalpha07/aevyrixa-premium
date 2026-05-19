"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import ProductVisual from "@/app/components/product-visual";
import { useCart } from "@/app/components/cart/cart-context";
import {
  isPurchasableStock,
  stockBadgeClass,
  stockStatusLabel,
} from "@/app/lib/product-display";
import { formatProductPrice, type ProductVisualTheme } from "@/app/lib/products";
import type {
  ProductCatalogItem,
  ProductStockStatus,
} from "@/app/lib/product-types";
import type {
  CategoryCmsEntry,
  StorefrontSettings,
} from "@/app/lib/storefront-settings";

type ShopDiscoveryClientProps = {
  products: ProductCatalogItem[];
  activeCategories: CategoryCmsEntry[];
  settings: StorefrontSettings;
  initialCategory?: string;
};

type StockFilter = "all" | "in_stock" | "out_of_stock";
type SignalFilter = "all" | "new" | "featured" | "limited_stock";
type PriceFilter = "all" | "under-1300" | "1300-1600" | "over-1600";
type SortMode = "featured" | "newest" | "price-asc" | "price-desc" | "stock";

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
    border: "border-fuchsia-300/20 hover:border-fuchsia-200/45",
    badge: "border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100",
    button:
      "border-fuchsia-200/25 bg-fuchsia-200/10 hover:border-fuchsia-100/45 hover:bg-fuchsia-200/15",
    glow: "bg-fuchsia-300/18",
  },
  "cyan-night": {
    border: "border-cyan-300/20 hover:border-cyan-200/45",
    badge: "border-cyan-200/25 bg-cyan-300/10 text-cyan-100",
    button:
      "border-cyan-200/25 bg-cyan-200/10 hover:border-cyan-100/45 hover:bg-cyan-200/15",
    glow: "bg-cyan-300/18",
  },
  "rose-gold": {
    border: "border-rose-200/25 hover:border-rose-100/50",
    badge: "border-rose-100/30 bg-rose-200/10 text-rose-100",
    button:
      "border-rose-100/30 bg-rose-200/10 hover:border-rose-100/55 hover:bg-rose-200/15",
    glow: "bg-rose-200/18",
  },
};

const stockRank: Record<ProductStockStatus, number> = {
  in_stock: 0,
  low_stock: 1,
  preorder: 2,
  out_of_stock: 3,
};

function normalized(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isNewProduct(product: ProductCatalogItem) {
  if (!product.createdAt) return false;
  const created = Date.parse(product.createdAt);
  if (!Number.isFinite(created)) return false;
  if (created <= Date.parse("2001-01-01T00:00:00.000Z")) return false;
  return Date.now() - created <= 45 * 24 * 60 * 60 * 1000;
}

function isLimitedStock(product: ProductCatalogItem) {
  if (product.stockStatus === "low_stock") return true;
  return (
    typeof product.stockQuantity === "number" &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= 5
  );
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

function dateValue(product: ProductCatalogItem) {
  const parsed = Date.parse(product.createdAt ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCatalogItem;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const style = themeStyles[product.visualTheme] ?? themeStyles["blush-violet"];
  const productHref = `/product/${product.slug}`;
  const quickAddAvailable = canQuickAdd(product);
  const badges = [
    product.featured ? "Flagship" : "",
    isNewProduct(product) ? "New" : "",
    isLimitedStock(product) ? "Limited Stock" : "",
  ].filter(Boolean);

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
      image: product.visualTheme,
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
      className={`aev-shop-card group min-w-0 overflow-hidden rounded-[1.35rem] border bg-white/[0.045] p-2.5 backdrop-blur-2xl transition duration-300 md:rounded-[1.75rem] md:p-3 md:hover:-translate-y-1 ${style.border}`}
    >
      <Link
        href={productHref}
        className="block overflow-hidden rounded-[1.05rem] border border-white/10 bg-[#07111f] md:rounded-[1.35rem]"
        aria-label={`View ${product.name}`}
      >
        <div className={`relative w-full ${compact ? "aspect-[1.05]" : "aspect-square"}`}>
          <div className={`pointer-events-none absolute inset-x-8 top-8 h-28 rounded-full blur-3xl ${style.glow}`} />
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <ProductVisual
              visualTheme={product.visualTheme}
              label={product.absorbency}
              compact={compact}
            />
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-cyan-100/25 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 backdrop-blur-md"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="px-1.5 pb-2.5 pt-3 md:px-2.5 md:pb-3 md:pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${stockBadgeClass(product.stockStatus)}`}>
            {stockStatusLabel(product.stockStatus)}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${style.badge}`}>
            {product.category}
          </span>
        </div>

        <Link href={productHref}>
          <h3 className="mt-2.5 line-clamp-2 break-words text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere] sm:text-base md:text-lg">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/58 sm:text-sm sm:leading-6">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-1.5 sm:gap-2">
          <span className="text-lg font-semibold text-white sm:text-xl md:text-2xl">
            {formatProductPrice(product)}
          </span>
          {typeof product.compareAtPrice === "number" && (
            <span className="pb-0.5 text-xs text-white/35 line-through sm:text-sm">
              {formatProductPrice({
                price: product.compareAtPrice,
                currency: product.currency,
              })}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href={productHref}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition ${style.button}`}
          >
            View
            <ArrowRight className="h-4 w-4" />
          </Link>
          {quickAddAvailable ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cyan-100/30 bg-cyan-100/12 px-4 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/55 hover:bg-cyan-100/18"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </button>
          ) : (
            <Link
              href={productHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white/68 transition hover:border-white/25 hover:text-white"
            >
              Options
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function CollectionSection({
  eyebrow,
  title,
  products,
}: {
  eyebrow: string;
  title: string;
  products: ProductCatalogItem[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </section>
  );
}

export default function ShopDiscoveryClient({
  products,
  activeCategories,
  settings,
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

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured).slice(0, 4),
    [products]
  );
  const newArrivals = useMemo(
    () => [...products].sort((a, b) => dateValue(b) - dateValue(a)).slice(0, 4),
    [products]
  );
  const editorPicks = featuredProducts.length > 0 ? featuredProducts : newArrivals.slice(0, 4);

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
        if (signal === "featured" && !product.featured) return false;
        if (signal === "limited_stock" && !isLimitedStock(product)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "newest") return dateValue(b) - dateValue(a);
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "stock") return stockRank[a.stockStatus] - stockRank[b.stockStatus];
        return Number(b.featured) - Number(a.featured) || dateValue(b) - dateValue(a);
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
          Flagship
        </Chip>
        <Chip active={signal === "new"} onClick={() => setSignal("new")}>
          New
        </Chip>
        <Chip active={signal === "limited_stock"} onClick={() => setSignal("limited_stock")}>
          Limited Stock
        </Chip>
      </FilterGroup>
    </div>
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 md:pb-12 md:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70 sm:text-sm sm:tracking-[0.42em]">
              {settings.brandDisplayName}
            </p>
            <h1 className="mt-3 break-words text-2xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-3xl sm:text-4xl md:text-5xl">
              Premium product discovery for every care rhythm
            </h1>
            <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/65 [overflow-wrap:anywhere] md:text-lg">
              Search, filter, and compare Aevyrixa Her Care essentials with clear BDT pricing, privacy packaging, and Bangladesh delivery.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, categories, comfort details"
                className="min-h-13 w-full rounded-full border border-white/10 bg-black/24 py-3.5 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-cyan-200/45"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-100/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/40 hover:bg-cyan-100/15 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="min-h-11 flex-1 rounded-full border border-white/10 bg-black/24 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-200/45 sm:flex-none sm:px-4"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="stock">In stock</option>
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-white/62 transition hover:border-white/25 hover:text-white sm:px-4"
                aria-label="Reset filters"
              >
                Reset
              </button>
            </div>

            {filtersOpen && (
              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/20 p-4 lg:hidden">
                {filterPanel}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            [settings.privacyPackagingMessage || "Privacy Packaging", PackageCheck],
            ["BDT pricing", CheckCircle2],
            [settings.supportWindowMessage || "3-Day Hygiene-Safe Support", ShieldCheck],
            ["Bangladesh delivery", Truck],
          ].map(([label, Icon]) => (
            <div
              key={label as string}
              className="aev-cinematic-chip flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white/70 backdrop-blur-xl sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
              <span>{label as string}</span>
            </div>
          ))}
        </div>
      </section>

      <CollectionSection
        eyebrow="Flagship Collection"
        title="Featured by Aevyrixa"
        products={featuredProducts}
      />
      <CollectionSection
        eyebrow="New Arrivals"
        title="Latest active products"
        products={newArrivals}
      />
      <CollectionSection
        eyebrow="Editor's Pick"
        title="Curated premium essentials"
        products={editorPicks}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl lg:block">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Filters
            </p>
            <SlidersHorizontal className="h-4 w-4 text-cyan-200/70" />
          </div>
          {filterPanel}
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
                All Products
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/52">
              Active products only. Coming soon and hidden CMS categories are not shown as shop filters.
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] px-5 py-16 text-center backdrop-blur-2xl">
              <Sparkles className="mx-auto h-8 w-8 text-cyan-200/70" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                No matching products
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/58">
                Adjust your search, category, price, stock, or signal filters to reveal more of the current Aevyrixa collection.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-full border border-cyan-100/30 bg-cyan-100/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/55"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
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
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
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
          ? "border-cyan-200/50 bg-cyan-200/15 text-cyan-50"
          : "border-white/10 bg-black/20 text-white/58 hover:border-cyan-200/30 hover:text-cyan-50"
      }`}
    >
      {children}
    </button>
  );
}
