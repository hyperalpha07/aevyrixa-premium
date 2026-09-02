import type { ProductCatalogItem } from "@/app/lib/product-types";
import { brandName } from "@/configs/brand/noromi";

export type ShopSignalFilter =
  | "all"
  | "new"
  | "featured"
  | "limited_stock"
  | "best_seller"
  | "heavy_flow";

export type ShopStockFilter = "all" | "in_stock" | "out_of_stock";

export type ShopQueryFilters = {
  category: string;
  signal: ShopSignalFilter;
  stock: ShopStockFilter;
  query: string;
  collection: string;
};

export const emptyShopQueryFilters: ShopQueryFilters = {
  category: "",
  signal: "all",
  stock: "all",
  query: "",
  collection: "",
};

const homeCtaFallbacks: Record<string, string> = {
  categoryReusablePeriodCare: "/product?category=Reusable%20Period%20Care",
  categoryComfortPanty: "/product?category=Comfort%20Panty",
  categorySoftSupportBra: "/product?category=Soft%20Support%20Bra",
  categoryNightwear: "/product?category=Nightwear",
  categoryHygieneEssentials: "/product?category=Hygiene%20Essentials",
  categoryBundles: "/product?category=Bundles",
  categoryNewArrivals: "/product?signal=New",
  layerComfort: "/product?category=Reusable%20Period%20Care",
  careMotion: "/product?category=Reusable%20Period%20Care",
  designedDay: "/product?category=Comfort%20Panty",
  findCare: "/product?collection=Noromi%20Care",
  findCareFlowDays: "/product?signal=Heavy%20Flow",
  findCareDailyComfort: "/product?category=Comfort%20Panty",
  findCareGentleSupport: "/product?category=Soft%20Support%20Bra",
  finalPrimary: "/product?collection=Noromi%20Care",
  finalSecondary: "/product?collection=Noromi%20Care",
};

const categoryAliases: Record<string, string[]> = {
  "reusable period care": [
    "reusable period care",
    "reusable period panty",
    "period panty",
    "period care",
  ],
  "comfort panty": ["comfort panty", "daily comfort", "everyday comfort"],
  "soft support bra": ["soft support bra", "gentle support", "support bra"],
  nightwear: ["nightwear", "night comfort", "overnight"],
  "hygiene essentials": ["hygiene essentials", "hygiene"],
  bundles: ["bundles", "bundle", "set"],
};

export function normalizeShopValue(value: string | undefined) {
  return decodeURIComponent(value ?? "")
    .replace(/\+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function encodeShopParam(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "%20");
}

export function smartHomeCtaHref(
  adminHref: string | undefined,
  fallbackKey: keyof typeof homeCtaFallbacks | string,
  options: { broad?: boolean } = {}
) {
  const href = (adminHref ?? "").trim();
  if (href && (options.broad || href !== "/product")) return href;
  return homeCtaFallbacks[fallbackKey] ?? "/product";
}

export function homeCardCtaLabel(adminLabel?: string) {
  return adminLabel?.trim() || "Explore \u2192";
}

export function categoryHref(category: string) {
  return `/product?category=${encodeShopParam(category)}`;
}

export function signalHref(signal: string) {
  return `/product?signal=${encodeShopParam(signal)}`;
}

export function parseShopSignal(value: string | undefined): ShopSignalFilter {
  const signal = normalizeShopValue(value);
  if (!signal) return "all";
  if (signal === "new" || signal === "new arrivals") return "new";
  if (signal === "featured") return "featured";
  if (signal === "limited stock" || signal === "limited") return "limited_stock";
  if (signal === "best seller" || signal === "best sellers") return "best_seller";
  if (signal === "heavy flow" || signal === "flow days") return "heavy_flow";
  return "all";
}

export function parseShopStock(value: string | undefined): ShopStockFilter {
  const stock = normalizeShopValue(value);
  if (stock === "in" || stock === "in stock" || stock === "in_stock") {
    return "in_stock";
  }
  if (stock === "out" || stock === "out of stock" || stock === "out_of_stock") {
    return "out_of_stock";
  }
  return "all";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseShopQueryFilters(params: {
  [key: string]: string | string[] | undefined;
}): ShopQueryFilters {
  return {
    category: decodeURIComponent(firstParam(params.category) ?? "")
      .replace(/\+/g, " ")
      .trim(),
    signal: parseShopSignal(firstParam(params.signal)),
    stock: parseShopStock(firstParam(params.stock)),
    query: decodeURIComponent(
      firstParam(params.q) ?? firstParam(params.search) ?? ""
    )
      .replace(/\+/g, " ")
      .trim(),
    collection: decodeURIComponent(firstParam(params.collection) ?? "")
      .replace(/\+/g, " ")
      .trim(),
  };
}

export function productMatchesCategoryQuery(
  product: ProductCatalogItem,
  category: string
) {
  const requested = normalizeShopValue(category);
  if (!requested) return true;

  const aliases = categoryAliases[requested] ?? [requested];
  const source = [
    product.category,
    product.name,
    product.shortDescription,
    product.description,
    product.absorbency,
    ...(product.absorbencyOptions ?? []),
  ]
    .map(normalizeShopValue)
    .join(" ");

  return aliases.some((alias) => source.includes(alias));
}

export function resolveCategoryFromProducts(
  products: ProductCatalogItem[],
  requestedCategory: string
) {
  const normalizedRequested = normalizeShopValue(requestedCategory);
  if (!normalizedRequested) return "";

  const exact = products.find(
    (product) => normalizeShopValue(product.category) === normalizedRequested
  );
  if (exact) return exact.category;

  return products.some((product) =>
    productMatchesCategoryQuery(product, requestedCategory)
  )
    ? requestedCategory.trim()
    : requestedCategory.trim();
}

export function shopSignalLabel(signal: ShopSignalFilter) {
  const labels: Record<ShopSignalFilter, string> = {
    all: "",
    new: "New",
    featured: "Featured",
    limited_stock: "Limited Stock",
    best_seller: "Best Sellers",
    heavy_flow: "Heavy Flow",
  };
  return labels[signal];
}

export function shopContextCopy(filters: ShopQueryFilters) {
  if (filters.category) {
    const category = publicShopText(filters.category);
    return {
      eyebrow: `${brandName.toUpperCase()} COLLECTION`,
      heading: category,
      copy: "Products matched to this care category.",
      chip: category,
    };
  }

  if (filters.signal !== "all") {
    const label = shopSignalLabel(filters.signal);
    return {
      eyebrow: `${brandName.toUpperCase()} PICKS`,
      heading:
        filters.signal === "new"
          ? "New Arrivals"
          : filters.signal === "heavy_flow"
            ? "Heavy Flow Picks"
            : `${label} Picks`,
      copy: "Products matched to this care signal.",
      chip: label,
    };
  }

  if (filters.collection) {
    const collection = publicShopText(filters.collection);
    return {
      eyebrow: `${brandName.toUpperCase()} COLLECTION`,
      heading: collection,
      copy: `Browse the current ${brandName} care selection.`,
      chip: collection,
    };
  }

  return {
    eyebrow: "",
    heading: `${brandName} Collection`,
    copy: "Premium reusable care essentials with clear BDT pricing and discreet Bangladesh delivery.",
    chip: "",
  };
}

function publicShopText(value: string) {
  return value
    .replace(/Aevyrixa Her Care/gi, brandName)
    .replace(/\bAevyrixa\b/gi, brandName)
    .replace(/\bHer Care\b/gi, brandName);
}
