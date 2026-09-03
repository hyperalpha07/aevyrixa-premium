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

async function productImageUrls(product: ProductCatalogItem) {
  const candidates = unique(
    [product.primaryImageUrl, product.imageUrl]
      .map(optimizedImageUrl)
      .filter((value): value is string => Boolean(value))
  );

  const checked = await Promise.all(
    candidates.map(async (url) => {
      if (url.startsWith("/")) return url;
      try {
        const response = await fetch(url, { method: "HEAD", cache: "no-store" });
        return response.ok ? url : null;
      } catch {
        return null;
      }
    })
  );

  return checked.filter((value): value is string => Boolean(value));
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
