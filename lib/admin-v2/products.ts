import "server-only";

import { listProducts } from "@/app/lib/product-store";
import type {
  ProductCatalogItem,
  ProductStatus,
  ProductStockStatus,
} from "@/app/lib/product-types";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";

export type AdminV2ProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockStatus: ProductStockStatus;
  stockQuantity: number | null;
  category: string;
  optionSummary: string;
  updatedAt: string | null;
  imageUrls: string[];
};

export type AdminV2ProductCatalogData = {
  available: boolean;
  storageMode: string;
  products: AdminV2ProductListItem[];
  summary: {
    total: number;
    active: number;
    draft: number;
    lowOrOutOfStock: number;
  };
};

export type AdminV2ProductWarning = {
  title: string;
  message: string;
  severity: "info" | "warning";
};

export type AdminV2ProductDetail = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockStatus: ProductStockStatus;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  category: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  sizes: string[];
  colors: string[];
  absorbency: string;
  absorbencyOptions: string[];
  benefits: string[];
  care: string[];
  featured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  showOnHomepage: boolean;
  showInFeaturedCollection: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  imageUrls: string[];
  unavailableImageReferences: string[];
  publicPath: string | null;
  warnings: AdminV2ProductWarning[];
};

export type AdminV2ProductDetailData = {
  available: boolean;
  storageMode: string;
  product: AdminV2ProductDetail | null;
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function optimizedImageUrl(value: string | null | undefined) {
  const normalized = normalizeAdminV2ImageSrc(value);
  if (!normalized) return null;
  if (normalized.startsWith("/")) return normalized;

  try {
    const imageUrl = new URL(normalized);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      : null;
    return supabaseUrl && imageUrl.hostname === supabaseUrl.hostname ? normalized : null;
  } catch {
    return null;
  }
}

function imageReferenceLabel(value: string) {
  try {
    const url = new URL(value);
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? value);
  } catch {
    return value.split("/").filter(Boolean).at(-1) ?? value;
  }
}

async function checkProductImageUrls(values: Array<string | null | undefined>) {
  const rawCandidates = unique(
    values
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const candidates = rawCandidates.map((raw) => ({ raw, normalized: optimizedImageUrl(raw) }));

  const checked = await Promise.all(
    candidates.map(async ({ raw, normalized }) => {
      if (!normalized) return { url: null, unavailable: imageReferenceLabel(raw) };
      if (normalized.startsWith("/")) return { url: normalized, unavailable: null };
      try {
        const response = await fetch(normalized, { method: "HEAD", cache: "no-store" });
        return response.ok
          ? { url: normalized, unavailable: null }
          : { url: null, unavailable: imageReferenceLabel(raw) };
      } catch {
        return { url: null, unavailable: imageReferenceLabel(raw) };
      }
    })
  );

  return {
    available: checked
      .map((item) => item.url)
      .filter((value): value is string => Boolean(value)),
    unavailable: checked
      .map((item) => item.unavailable)
      .filter((value): value is string => Boolean(value)),
  };
}

async function productImageUrls(product: ProductCatalogItem) {
  const checked = await checkProductImageUrls([product.primaryImageUrl, product.imageUrl]);
  return checked.available;
}

function optionSummary(product: ProductCatalogItem) {
  const groups = [
    product.sizes.length ? `Sizes: ${product.sizes.join(", ")}` : null,
    product.colors.length ? `Colors: ${product.colors.join(", ")}` : null,
    product.absorbencyOptions.length
      ? `Absorbency: ${product.absorbencyOptions.join(", ")}`
      : product.absorbency
        ? `Absorbency: ${product.absorbency}`
        : null,
  ].filter((value): value is string => Boolean(value));

  return groups.length ? groups.join(" | ") : "No options provided";
}

async function toListItem(product: ProductCatalogItem): Promise<AdminV2ProductListItem> {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    currency: product.currency,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity ?? null,
    category: product.category,
    optionSummary: optionSummary(product),
    updatedAt: product.updatedAt ?? null,
    imageUrls: await productImageUrls(product),
  };
}

function legacyTextFields(product: ProductCatalogItem) {
  const legacyPattern = /aevyrixa|\bher care\b|hygeia|\blogo\b/i;
  return [
    ["name", product.name],
    ["short description", product.shortDescription],
    ["description", product.description],
    ["SEO title", product.seoTitle],
    ["SEO description", product.seoDescription],
  ]
    .filter((entry) => legacyPattern.test(entry[1] ?? ""))
    .map(([label]) => label);
}

async function toDetail(product: ProductCatalogItem): Promise<AdminV2ProductDetail> {
  const imageCheck = await checkProductImageUrls([
    product.primaryImageUrl,
    product.imageUrl,
    ...(product.images ?? []),
  ]);
  const warnings: AdminV2ProductWarning[] = [];
  const legacyFields = legacyTextFields(product);

  if (product.status === "draft") {
    warnings.push({
      severity: "warning",
      title: "Draft product",
      message: "This product is not available in the active public catalog.",
    });
  }
  if (legacyFields.length > 0) {
    warnings.push({
      severity: "warning",
      title: "Legacy or placeholder wording detected",
      message: `Review the stored ${legacyFields.join(", ")} before this product is published. No text was changed.`,
    });
  }
  if (imageCheck.unavailable.length > 0) {
    warnings.push({
      severity: "warning",
      title: "Unavailable media references",
      message: `${imageCheck.unavailable.length} stored image reference${imageCheck.unavailable.length === 1 ? " is" : "s are"} unavailable and ${imageCheck.unavailable.length === 1 ? "was" : "were"} omitted from this preview.`,
    });
  }
  if (imageCheck.available.length === 0) {
    warnings.push({
      severity: "info",
      title: "No usable product image",
      message: "A neutral placeholder is shown because no reachable product image is stored.",
    });
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    currency: product.currency,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity ?? null,
    lowStockThreshold: product.lowStockThreshold ?? null,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    sizes: product.sizes,
    colors: product.colors,
    absorbency: product.absorbency,
    absorbencyOptions: product.absorbencyOptions,
    benefits: product.benefits,
    care: product.care,
    featured: product.featured,
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    showOnHomepage: product.showOnHomepage !== false,
    showInFeaturedCollection: product.showInFeaturedCollection ?? product.featured,
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
    imageUrls: imageCheck.available,
    unavailableImageReferences: imageCheck.unavailable,
    publicPath:
      product.status === "active" && product.slug
        ? `/product/${encodeURIComponent(product.slug)}`
        : null,
    warnings,
  };
}

export async function getAdminV2ProductCatalog(): Promise<AdminV2ProductCatalogData> {
  const result = await listProducts({ scope: "admin" });
  if (result.storageMode !== "supabase") {
    return {
      available: false,
      storageMode: result.storageMode,
      products: [],
      summary: { total: 0, active: 0, draft: 0, lowOrOutOfStock: 0 },
    };
  }

  const products = await Promise.all(result.products.map(toListItem));
  return {
    available: true,
    storageMode: result.storageMode,
    products,
    summary: {
      total: products.length,
      active: products.filter((product) => product.status === "active").length,
      draft: products.filter((product) => product.status === "draft").length,
      lowOrOutOfStock: products.filter(
        (product) =>
          product.stockStatus === "low_stock" || product.stockStatus === "out_of_stock"
      ).length,
    },
  };
}

export async function getAdminV2ProductDetail(
  productId: string
): Promise<AdminV2ProductDetailData> {
  const result = await listProducts({ scope: "admin" });
  if (result.storageMode !== "supabase") {
    return {
      available: false,
      storageMode: result.storageMode,
      product: null,
    };
  }

  const product = result.products.find((item) => item.id === productId) ?? null;
  return {
    available: true,
    storageMode: result.storageMode,
    product: product ? await toDetail(product) : null,
  };
}
