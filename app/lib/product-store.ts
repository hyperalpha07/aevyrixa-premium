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

function slugValue(value: unknown) {
  return textValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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
  if (typeof value !== "string") return "draft";

  const status = value.trim().toLowerCase();
  return status === "active" ? "active" : "draft";
}

function normalizeStockStatus(value: unknown) {
  const stockStatus = typeof value === "string" ? value.trim().toLowerCase() : "";
  return productStockStatuses.includes(stockStatus as never)
    ? (stockStatus as ProductCatalogItem["stockStatus"])
    : "in_stock";
}

function normalizeVisual(value: unknown): ProductCatalogItem["visualTheme"] {
  if (value === "cyan-night" || value === "rose-gold" || value === "blush-violet") {
    return value;
  }

  return "blush-violet";
}

export function validateProductInput(
  input: ProductMutationInput,
  options: { partial?: boolean } = {}
) {
  const errors: string[] = [];
  const slug = slugValue(input.slug);
  const name = textValue(input.name);
  const price = numberValue(input.price);
  const status =
    input.status === undefined ? undefined : textValue(input.status).toLowerCase();
  const stockStatus =
    input.stockStatus === undefined
      ? undefined
      : textValue(input.stockStatus).toLowerCase();

  if (!options.partial && !name) errors.push("Product name is required.");
  if (!options.partial && !slug) {
    errors.push("Slug is required.");
  } else if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push("Slug must be lowercase kebab-case.");
  }
  if ((!options.partial || input.price !== undefined) && (price === undefined || price < 0)) {
    errors.push("Price must be a non-negative number.");
  }
  if (status !== undefined && !productStatuses.includes(status as never)) {
    errors.push("Status must be active or draft.");
  }
  if (stockStatus !== undefined && !productStockStatuses.includes(stockStatus as never)) {
    errors.push("Stock status is invalid.");
  }

  return { errors };
}

export function buildProductInput(input: ProductMutationInput): ProductCatalogItem {
  const now = new Date().toISOString();
  const visualTheme = normalizeVisual(input.visualTheme ?? input.visual);
  const name = textValue(input.name);
  const slug = slugValue(input.slug) || slugValue(name) || `product-${Date.now()}`;

  return {
    id: textValue(input.id) || `product-${slug}-${Date.now()}`,
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
    slug: slugValue(row.slug),
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

function hasProductField(product: ProductMutationInput, field: keyof ProductMutationInput) {
  return Object.prototype.hasOwnProperty.call(product, field);
}

function toSupabasePayload(product: ProductMutationInput) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (hasProductField(product, "slug")) payload.slug = slugValue(product.slug);
  if (hasProductField(product, "name")) payload.name = product.name;
  if (hasProductField(product, "shortDescription")) {
    payload.short_description = product.shortDescription ?? "";
  }
  if (hasProductField(product, "description")) {
    payload.description = product.description ?? "";
  }
  if (hasProductField(product, "category")) {
    payload.category = product.category ?? "Reusable Period Panty";
  }
  if (hasProductField(product, "price")) payload.price = numberValue(product.price) ?? 0;
  if (hasProductField(product, "compareAtPrice")) {
    payload.compare_at_price = numberValue(product.compareAtPrice) ?? null;
  }
  if (hasProductField(product, "currency")) {
    payload.currency = product.currency ?? "USD";
  }
  if (hasProductField(product, "status")) payload.status = normalizeStatus(product.status);
  if (hasProductField(product, "featured")) payload.featured = Boolean(product.featured);
  if (hasProductField(product, "stockStatus")) {
    payload.stock_status = normalizeStockStatus(product.stockStatus);
  }
  if (hasProductField(product, "stockQuantity")) {
    payload.stock_quantity = numberValue(product.stockQuantity) ?? null;
  }
  if (hasProductField(product, "sizes")) payload.sizes = product.sizes ?? [];
  if (hasProductField(product, "colors")) payload.colors = product.colors ?? [];
  if (hasProductField(product, "visual") || hasProductField(product, "visualTheme")) {
    payload.visual = product.visual ?? product.visualTheme ?? "blush-violet";
    payload.visual_theme = product.visualTheme ?? product.visual ?? "blush-violet";
  }
  if (hasProductField(product, "visualVariant")) {
    payload.visual_variant =
      product.visualVariant ?? product.visualTheme ?? product.visual ?? null;
  }
  if (hasProductField(product, "absorbency")) {
    payload.absorbency = product.absorbency ?? "Moderate";
  }
  if (hasProductField(product, "absorbencyOptions")) {
    payload.absorbency_options = product.absorbencyOptions ?? [];
  }
  if (hasProductField(product, "imageUrl")) payload.image_url = product.imageUrl ?? null;
  if (hasProductField(product, "videoUrl")) payload.video_url = product.videoUrl ?? null;
  if (hasProductField(product, "posterUrl")) payload.poster_url = product.posterUrl ?? null;
  if (hasProductField(product, "benefits")) payload.benefits = product.benefits ?? [];
  if (hasProductField(product, "care")) payload.care = product.care ?? [];
  if (hasProductField(product, "seoTitle")) payload.seo_title = product.seoTitle ?? null;
  if (hasProductField(product, "seoDescription")) {
    payload.seo_description = product.seoDescription ?? null;
  }

  return payload;
}

async function listProductsFromSupabase() {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?select=*&order=created_at.desc`
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

async function createProductInSupabase(input: ProductCatalogItem) {
  const payload = {
    ...toSupabasePayload(input),
    created_at: input.createdAt ?? new Date().toISOString(),
  };

  if (isUuid(input.id)) {
    Object.assign(payload, { id: input.id });
  }

  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_PRODUCTS_TABLE}?select=*`),
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify(payload),
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

function logProductSource(
  source: ProductStorageMode,
  details: { count: number; scope: "admin" | "public"; reason?: string }
) {
  const reason = details.reason ? `, reason=${details.reason}` : "";
  console.info(
    `Product source: ${source} (${details.count} rows, scope=${details.scope}${reason})`
  );
}

export async function listProducts(
  options: { includeDrafts?: boolean; scope?: "admin" | "public" } = {}
) {
  const scope = options.scope ?? (options.includeDrafts ? "admin" : "public");
  const includeDrafts = scope === "admin" || Boolean(options.includeDrafts);
  const supabaseProducts = await safelyUseSupabase(listProductsFromSupabase);

  if (supabaseProducts && supabaseProducts.length > 0) {
    const products = includeDrafts
        ? supabaseProducts
        : supabaseProducts.filter((product) => product.status === "active");

    logProductSource("supabase", { count: products.length, scope });

    return {
      products,
      storageMode: "supabase" as ProductStorageMode,
    };
  }

  const products = includeDrafts
    ? demoProducts
    : demoProducts.filter((product) => product.status === "active");

  const storageMode = hasSupabaseConfig()
    ? ("fallback-static" as ProductStorageMode)
    : ("demo-memory" as ProductStorageMode);

  logProductSource(storageMode, {
    count: products.length,
    scope,
    reason: hasSupabaseConfig() ? "supabase-empty-or-unavailable" : "missing-supabase-config",
  });

  return {
    products,
    storageMode,
  };
}

export async function getProductBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const includeDrafts = Boolean(options.includeDrafts);
  const supabaseProducts = await safelyUseSupabase(listProductsFromSupabase);

  if (supabaseProducts && supabaseProducts.length > 0) {
    const supabaseProduct =
      supabaseProducts.find((product) => product.slug === slug) ?? null;

    console.info(
      `Product detail source: supabase (slug=${slug}, found=${Boolean(
        supabaseProduct
      )}, includeDrafts=${includeDrafts})`
    );

    if (!supabaseProduct) {
      return { product: null, storageMode: "supabase" as ProductStorageMode };
    }

    if (!includeDrafts && supabaseProduct.status !== "active") {
      return { product: null, storageMode: "supabase" as ProductStorageMode };
    }

    return {
      product: supabaseProduct,
      storageMode: "supabase" as ProductStorageMode,
    };
  }

  const product =
    demoProducts.find(
      (item) => item.slug === slug && (includeDrafts || item.status === "active")
    ) ?? null;

  console.info(
    `Product detail source: ${
      hasSupabaseConfig() ? "fallback-static" : "demo-memory"
    } (slug=${slug}, found=${Boolean(product)}, includeDrafts=${includeDrafts})`
  );

  return {
    product,
    storageMode: hasSupabaseConfig()
      ? ("fallback-static" as ProductStorageMode)
      : ("demo-memory" as ProductStorageMode),
  };
}

export async function createProduct(input: ProductMutationInput) {
  const product = buildProductInput(input);

  if (hasSupabaseConfig()) {
    const supabaseProduct = await createProductInSupabase(product);
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  demoProducts = [product, ...demoProducts.filter((item) => item.id !== product.id)];
  return { product, storageMode: "demo-memory" as ProductStorageMode };
}

export async function updateProduct(id: string, updates: ProductMutationInput) {
  const existing = demoProducts.find((product) => product.id === id);
  const merged = buildProductInput({ ...existing, ...updates, id });

  if (hasSupabaseConfig()) {
    const supabaseProduct = await updateProductInSupabase(id, updates);
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  if (!existing) {
    return { product: null, storageMode: "demo-memory" as ProductStorageMode };
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
