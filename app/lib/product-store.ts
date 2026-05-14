import {
  productStockStatuses,
  productStatuses,
  type ProductCatalogItem,
  type ProductMutationInput,
  type ProductStatus,
  type ProductStorageMode,
} from "@/app/lib/product-types";
import { legacyProductToCatalogItem, products as staticProducts } from "@/app/lib/products";

const SUPABASE_PRODUCTS_TABLE = "products";

type SupabaseProductRow = {
  id?: string;
  slug?: string | null;
  name?: string | null;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  currency?: string | null;
  status?: string | null;
  featured?: boolean | null;
  stock_status?: string | null;
  stock_quantity?: number | string | null;
  sizes?: unknown;
  colors?: unknown;
  visual?: string | null;
  visual_theme?: string | null;
  visual_variant?: string | null;
  absorbency?: string | null;
  absorbency_options?: unknown;
  image_url?: string | null;
  video_url?: string | null;
  poster_url?: string | null;
  benefits?: unknown;
  care?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const fallbackProducts = staticProducts.map((product) =>
  legacyProductToCatalogItem(product)
);
let demoProducts: ProductCatalogItem[] = fallbackProducts;

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function supabaseHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");

  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

async function supabaseError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  const suffix = detail ? ` ${detail.slice(0, 240)}` : "";
  return new Error(`Supabase ${action} failed with ${response.status}.${suffix}`);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const text = textValue(value);
  return text || undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function stringArrayValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStatus(value: unknown): ProductStatus {
  return value === "draft" ? "draft" : "active";
}

function normalizeStockStatus(value: unknown) {
  return productStockStatuses.includes(value as never)
    ? (value as ProductCatalogItem["stockStatus"])
    : "in_stock";
}

function normalizeVisual(value: unknown): ProductCatalogItem["visualTheme"] {
  if (value === "cyan-night" || value === "rose-gold" || value === "blush-violet") {
    return value;
  }

  return "blush-violet";
}

export function validateProductInput(input: ProductMutationInput) {
  const errors: string[] = [];
  const slug = textValue(input.slug);
  const name = textValue(input.name);
  const price = numberValue(input.price);
  const status = input.status ?? "draft";
  const stockStatus = input.stockStatus ?? "in_stock";

  if (!name) errors.push("Product name is required.");
  if (!slug) {
    errors.push("Slug is required.");
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push("Slug must be lowercase kebab-case.");
  }
  if (price === undefined || price < 0) {
    errors.push("Price must be a non-negative number.");
  }
  if (!productStatuses.includes(status as never)) {
    errors.push("Status must be active or draft.");
  }
  if (!productStockStatuses.includes(stockStatus as never)) {
    errors.push("Stock status is invalid.");
  }

  return { errors };
}

export function buildProductInput(input: ProductMutationInput): ProductCatalogItem {
  const now = new Date().toISOString();
  const visualTheme = normalizeVisual(input.visualTheme ?? input.visual);
  const name = textValue(input.name);
  const slug = textValue(input.slug);

  return {
    id: textValue(input.id) || `product-${slug || Date.now()}`,
    slug,
    name,
    shortDescription: textValue(input.shortDescription),
    description: textValue(input.description),
    category: textValue(input.category) || "Reusable Period Panty",
    price: numberValue(input.price) ?? 0,
    compareAtPrice: numberValue(input.compareAtPrice),
    currency: textValue(input.currency) || "USD",
    status: normalizeStatus(input.status),
    featured: Boolean(input.featured),
    stockStatus: normalizeStockStatus(input.stockStatus),
    stockQuantity: numberValue(input.stockQuantity),
    sizes: input.sizes ?? [],
    colors: input.colors ?? [],
    absorbency: textValue(input.absorbency) || "Moderate",
    absorbencyOptions: input.absorbencyOptions ?? [],
    visual: visualTheme,
    visualTheme,
    visualVariant: optionalText(input.visualVariant) ?? visualTheme,
    imageUrl: optionalText(input.imageUrl),
    videoUrl: optionalText(input.videoUrl),
    posterUrl: optionalText(input.posterUrl),
    benefits: input.benefits ?? [],
    care: input.care ?? [],
    seoTitle: optionalText(input.seoTitle),
    seoDescription: optionalText(input.seoDescription),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function mapSupabaseProduct(row: SupabaseProductRow): ProductCatalogItem {
  const visualTheme = normalizeVisual(row.visual_theme ?? row.visual);

  return {
    id: row.id ?? "",
    slug: row.slug ?? "",
    name: row.name ?? "",
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    category: row.category ?? "Reusable Period Panty",
    price: numberValue(row.price) ?? 0,
    compareAtPrice: numberValue(row.compare_at_price),
    currency: row.currency ?? "USD",
    status: normalizeStatus(row.status),
    featured: Boolean(row.featured),
    stockStatus: normalizeStockStatus(row.stock_status),
    stockQuantity: numberValue(row.stock_quantity),
    sizes: stringArrayValue(row.sizes),
    colors: stringArrayValue(row.colors),
    absorbency: row.absorbency ?? "Moderate",
    absorbencyOptions: stringArrayValue(row.absorbency_options),
    visual: visualTheme,
    visualTheme,
    visualVariant: row.visual_variant ?? visualTheme,
    imageUrl: row.image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    posterUrl: row.poster_url ?? undefined,
    benefits: stringArrayValue(row.benefits),
    care: stringArrayValue(row.care),
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function toSupabasePayload(product: ProductMutationInput) {
  return {
    slug: product.slug,
    name: product.name,
    short_description: product.shortDescription ?? "",
    description: product.description ?? "",
    category: product.category ?? "Reusable Period Panty",
    price: product.price ?? 0,
    compare_at_price: product.compareAtPrice ?? null,
    currency: product.currency ?? "USD",
    status: product.status ?? "draft",
    featured: Boolean(product.featured),
    stock_status: product.stockStatus ?? "in_stock",
    stock_quantity: product.stockQuantity ?? null,
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    visual: product.visual ?? product.visualTheme ?? "blush-violet",
    visual_theme: product.visualTheme ?? product.visual ?? "blush-violet",
    visual_variant: product.visualVariant ?? product.visualTheme ?? product.visual ?? null,
    absorbency: product.absorbency ?? "Moderate",
    absorbency_options: product.absorbencyOptions ?? [],
    image_url: product.imageUrl ?? null,
    video_url: product.videoUrl ?? null,
    poster_url: product.posterUrl ?? null,
    benefits: product.benefits ?? [],
    care: product.care ?? [],
    seo_title: product.seoTitle ?? null,
    seo_description: product.seoDescription ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function listProductsFromSupabase(includeDrafts: boolean) {
  const statusFilter = includeDrafts ? "" : "&status=eq.active";
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?select=*&order=created_at.desc${statusFilter}`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw await supabaseError(response, "product list");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows.map(mapSupabaseProduct);
}

async function getProductBySlugFromSupabase(slug: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw await supabaseError(response, "product by slug");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function createProductInSupabase(input: ProductCatalogItem) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_PRODUCTS_TABLE}?select=*`),
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify({
        id: input.id,
        ...toSupabasePayload(input),
        created_at: input.createdAt ?? new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) throw await supabaseError(response, "product insert");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : input;
}

async function updateProductInSupabase(id: string, updates: ProductMutationInput) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`
    ),
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify(toSupabasePayload(updates)),
    }
  );

  if (!response.ok) throw await supabaseError(response, "product update");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function safelyUseSupabase<T>(action: () => Promise<T>) {
  if (!hasSupabaseConfig()) return null;

  try {
    return await action();
  } catch (error) {
    // Product catalog is optional during rollout. Missing Supabase product table
    // should never take down storefront/build; static products remain the source.
    console.error("Product Supabase adapter fell back to static catalog:", error);
    return null;
  }
}

export async function listProducts(options: { includeDrafts?: boolean } = {}) {
  const includeDrafts = Boolean(options.includeDrafts);
  const supabaseProducts = await safelyUseSupabase(() =>
    listProductsFromSupabase(includeDrafts)
  );

  if (supabaseProducts) {
    return { products: supabaseProducts, storageMode: "supabase" as ProductStorageMode };
  }

  const products = includeDrafts
    ? demoProducts
    : demoProducts.filter((product) => product.status === "active");

  return {
    products,
    storageMode: hasSupabaseConfig()
      ? ("fallback-static" as ProductStorageMode)
      : ("demo-memory" as ProductStorageMode),
  };
}

export async function getProductBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const supabaseProduct = await safelyUseSupabase(() =>
    getProductBySlugFromSupabase(slug)
  );
  const includeDrafts = Boolean(options.includeDrafts);

  if (supabaseProduct) {
    if (!includeDrafts && supabaseProduct.status !== "active") {
      return { product: null, storageMode: "supabase" as ProductStorageMode };
    }

    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  const product =
    demoProducts.find(
      (item) => item.slug === slug && (includeDrafts || item.status === "active")
    ) ?? null;

  return {
    product,
    storageMode: hasSupabaseConfig()
      ? ("fallback-static" as ProductStorageMode)
      : ("demo-memory" as ProductStorageMode),
  };
}

export async function createProduct(input: ProductMutationInput) {
  const product = buildProductInput(input);
  const supabaseProduct = await safelyUseSupabase(() =>
    createProductInSupabase(product)
  );

  if (supabaseProduct) {
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  demoProducts = [product, ...demoProducts.filter((item) => item.id !== product.id)];
  return { product, storageMode: "demo-memory" as ProductStorageMode };
}

export async function updateProduct(id: string, updates: ProductMutationInput) {
  const existing = demoProducts.find((product) => product.id === id);
  const merged = buildProductInput({ ...existing, ...updates, id });
  const supabaseProduct = await safelyUseSupabase(() =>
    updateProductInSupabase(id, updates)
  );

  if (supabaseProduct) {
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  demoProducts = demoProducts.map((product) =>
    product.id === id ? { ...product, ...merged, id, updatedAt: new Date().toISOString() } : product
  );

  return {
    product: demoProducts.find((product) => product.id === id) ?? null,
    storageMode: "demo-memory" as ProductStorageMode,
  };
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  return updateProduct(id, { status });
}

export async function deleteProduct(id: string) {
  // Safer admin delete: draft/disable product instead of hard deleting.
  return updateProductStatus(id, "draft");
}

// TODO: Expand this adapter when inventory variants become first-class rows.
// Product-level stock fields are intentionally simple for Phase 15.

