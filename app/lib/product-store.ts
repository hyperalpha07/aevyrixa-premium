import {
  productStockStatuses,
  productStatuses,
  type ProductCatalogItem,
  type ProductMutationInput,
  type ProductStatus,
  type ProductStorageMode,
} from "@/app/lib/product-types";
import { legacyProductToCatalogItem, products as staticProducts } from "@/app/lib/products";
import { SITE_CURRENCY } from "@/app/lib/currency";

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
  primary_image_url?: string | null;
  primary_image_path?: string | null;
  video_path?: string | null;
  images?: unknown;
  media?: unknown;
  benefits?: unknown;
  care?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  deleted_at?: string | null;
  deleted_reason?: string | null;
  deleted_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  merchandising?: unknown;
};

class ProductStoreError extends Error {
  status: number;
  publicMessage: string;
  code: string;
  fields?: Record<string, string>;

  constructor(
    message: string,
    options: { status?: number; publicMessage?: string; code?: string; fields?: Record<string, string> } = {}
  ) {
    super(message);
    this.name = "ProductStoreError";
    this.status = options.status ?? 500;
    this.publicMessage = options.publicMessage ?? "Product operation failed.";
    this.code = options.code ?? "PRODUCT_STORE_ERROR";
    this.fields = options.fields;
  }
}

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
  let publicMessage = `Product ${action} failed.`;
  let code = "SUPABASE_PRODUCT_ERROR";

  try {
    const parsed = JSON.parse(detail) as {
      code?: unknown;
      message?: unknown;
      hint?: unknown;
      details?: unknown;
    };
    if (parsed.code === "23505") {
      publicMessage = "A product with this slug already exists.";
      code = "PRODUCT_SLUG_EXISTS";
    } else if (
      parsed.code === "42703" &&
      typeof parsed.message === "string" &&
      (parsed.message.includes("deleted_at") ||
        parsed.message.includes("deleted_reason") ||
        parsed.message.includes("deleted_by"))
    ) {
      publicMessage =
        "Product trash columns are missing. Add deleted_at timestamptz and deleted_reason text to public.products.";
      code = "PRODUCT_TRASH_COLUMNS_MISSING";
    } else if (parsed.code === "42703" && typeof parsed.message === "string") {
      publicMessage = `Column missing in products table: ${parsed.message.trim()}`;
      code = "PRODUCT_COLUMN_MISSING";
    } else if (response.status >= 400 && response.status < 500) {
      const msg = typeof parsed.message === "string" ? parsed.message.trim() : "";
      const hint = typeof parsed.hint === "string" ? parsed.hint.trim() : "";
      publicMessage = msg
        ? `Validation failed: ${msg}${hint ? ` — ${hint}` : ""}`
        : "Product data was rejected by the backend.";
    }
  } catch {
    const trashColumnInError =
      detail.includes("deleted_at") ||
      detail.includes("deleted_reason") ||
      detail.includes("deleted_by");
    if (trashColumnInError && detail.includes("does not exist")) {
      publicMessage =
        "Product trash columns are missing. Add deleted_at timestamptz and deleted_reason text to public.products.";
      code = "PRODUCT_TRASH_COLUMNS_MISSING";
    } else if (response.status >= 400 && response.status < 500) {
      publicMessage = "Product data was rejected by the backend.";
    }
  }

  return new ProductStoreError(
    `Supabase ${action} failed with ${response.status}.${suffix}`,
    { status: response.status, publicMessage, code }
  );
}

export function productStoreErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ProductStoreError) {
    const body: Record<string, unknown> = {
      errors: [error.publicMessage],
      code: error.code,
    };
    if (error.fields && Object.keys(error.fields).length > 0) {
      body.fields = error.fields;
    }
    return { status: error.status, body };
  }

  return {
    status: 500,
    body: { errors: [fallback], code: "PRODUCT_STORE_ERROR" },
  };
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

function recordValue(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
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

  if (process.env.NODE_ENV === "development" && value !== undefined && value !== null && value !== "") {
    console.warn(`[product-store] Unknown visual theme "${String(value)}" — falling back to "blush-violet".`);
  }

  return "blush-violet";
}

export function validateProductInput(
  input: ProductMutationInput,
  options: { partial?: boolean } = {}
) {
  const errors: string[] = [];
  const fields: Record<string, string> = {};

  const addError = (field: string | null, message: string) => {
    errors.push(message);
    if (field) fields[field] = message;
  };

  const slug = slugValue(input.slug);
  const name = textValue(input.name);
  const price = numberValue(input.price);
  const status =
    input.status === undefined ? undefined : textValue(input.status).toLowerCase();
  const stockStatus =
    input.stockStatus === undefined
      ? undefined
      : textValue(input.stockStatus).toLowerCase();

  if (!options.partial && !name) addError("name", "Product name is required.");
  if (!options.partial && !slug) {
    addError("slug", "Slug is required.");
  } else if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    addError("slug", "Slug must be lowercase kebab-case.");
  }
  if ((!options.partial || input.price !== undefined) && (price === undefined || price < 0)) {
    addError("price", "Price must be a non-negative number.");
  }
  if (status !== undefined && !productStatuses.includes(status as never)) {
    addError("status", "Status must be active or draft.");
  }
  if (stockStatus !== undefined && !productStockStatuses.includes(stockStatus as never)) {
    addError("stockStatus", "Stock status is invalid.");
  }

  // Active products require more complete data; draft products are saved with minimal fields.
  if (!options.partial && status === "active") {
    if (!textValue(input.shortDescription)) {
      addError("shortDescription", "Short description is required for active products.");
    }
    if (!textValue(input.description)) {
      addError("description", "Description is required for active products.");
    }
    if (!textValue(input.category)) {
      addError("category", "Category is required for active products.");
    }
  }

  return { errors, fields };
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
    currency: SITE_CURRENCY,
    status: normalizeStatus(input.status),
    featured: Boolean(input.featured),
    isTrending: Boolean(input.isTrending),
    isBestSeller: Boolean(input.isBestSeller),
    isNewArrival: Boolean(input.isNewArrival),
    badgeText: optionalText(input.badgeText),
    badgeStyle: optionalText(input.badgeStyle),
    sortOrder: numberValue(input.sortOrder),
    lowStockThreshold: numberValue(input.lowStockThreshold),
    showOnHomepage: input.showOnHomepage !== false,
    showInFeaturedCollection: input.showInFeaturedCollection ?? Boolean(input.featured),
    stockStatus: normalizeStockStatus(input.stockStatus),
    stockQuantity: numberValue(input.stockQuantity),
    sizes: stringArrayValue(input.sizes),
    colors: stringArrayValue(input.colors),
    absorbency: textValue(input.absorbency) || "Moderate",
    absorbencyOptions: stringArrayValue(input.absorbencyOptions),
    visual: visualTheme,
    visualTheme,
    visualVariant: optionalText(input.visualVariant) ?? visualTheme,
    imageUrl: optionalText(input.primaryImageUrl ?? input.imageUrl),
    videoUrl: optionalText(input.videoUrl),
    posterUrl: optionalText(input.posterUrl),
    primaryImageUrl: optionalText(input.primaryImageUrl ?? input.imageUrl),
    primaryImagePath: optionalText(input.primaryImagePath),
    videoPath: optionalText(input.videoPath),
    images: Array.isArray(input.images) ? input.images : [],
    media: Array.isArray(input.media) ? input.media : [],
    benefits: stringArrayValue(input.benefits),
    care: stringArrayValue(input.care),
    seoTitle: optionalText(input.seoTitle),
    seoDescription: optionalText(input.seoDescription),
    deletedAt: input.deletedAt,
    deletedReason: optionalText(input.deletedReason),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function mapSupabaseProduct(row: SupabaseProductRow): ProductCatalogItem {
  const visualTheme = normalizeVisual(row.visual_theme ?? row.visual);
  const merchandising = recordValue(row.merchandising);

  return {
    id: row.id ?? "",
    slug: slugValue(row.slug),
    name: row.name ?? "",
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    category: row.category ?? "Reusable Period Panty",
    price: numberValue(row.price) ?? 0,
    compareAtPrice: numberValue(row.compare_at_price),
    currency: SITE_CURRENCY,
    status: normalizeStatus(row.status),
    featured: Boolean(row.featured),
    isTrending: Boolean(merchandising.isTrending),
    isBestSeller: Boolean(merchandising.isBestSeller),
    isNewArrival: Boolean(merchandising.isNewArrival),
    badgeText: optionalText(merchandising.badgeText),
    badgeStyle: optionalText(merchandising.badgeStyle),
    sortOrder: numberValue(merchandising.sortOrder),
    lowStockThreshold: numberValue(merchandising.lowStockThreshold),
    showOnHomepage: booleanValue(merchandising.showOnHomepage) ?? true,
    showInFeaturedCollection:
      booleanValue(merchandising.showInFeaturedCollection) ?? Boolean(row.featured),
    stockStatus: normalizeStockStatus(row.stock_status),
    stockQuantity: numberValue(row.stock_quantity),
    sizes: stringArrayValue(row.sizes),
    colors: stringArrayValue(row.colors),
    absorbency: row.absorbency ?? "Moderate",
    absorbencyOptions: stringArrayValue(row.absorbency_options),
    visual: visualTheme,
    visualTheme,
    visualVariant: row.visual_variant ?? visualTheme,
    imageUrl: row.primary_image_url ?? row.image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    posterUrl: row.poster_url ?? undefined,
    primaryImageUrl: row.primary_image_url ?? undefined,
    primaryImagePath: row.primary_image_path ?? undefined,
    videoPath: row.video_path ?? undefined,
    images: Array.isArray(row.images)
      ? (row.images as string[]).filter((u): u is string => typeof u === "string")
      : [],
    media: Array.isArray(row.media) ? (row.media as unknown[]) : [],
    benefits: stringArrayValue(row.benefits),
    care: stringArrayValue(row.care),
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    deletedReason: row.deleted_reason ?? undefined,
    deletedBy: row.deleted_by ?? undefined,
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
    payload.currency = SITE_CURRENCY;
  }
  if (hasProductField(product, "status")) payload.status = normalizeStatus(product.status);
  if (hasProductField(product, "featured")) payload.featured = Boolean(product.featured);
  const merchandising = {
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    badgeText: optionalText(product.badgeText) ?? "",
    badgeStyle: optionalText(product.badgeStyle) ?? "info",
    sortOrder: numberValue(product.sortOrder) ?? null,
    lowStockThreshold: numberValue(product.lowStockThreshold) ?? null,
    showOnHomepage: product.showOnHomepage !== false,
    showInFeaturedCollection:
      product.showInFeaturedCollection ?? Boolean(product.featured),
  };
  if (
    hasProductField(product, "isTrending") ||
    hasProductField(product, "isBestSeller") ||
    hasProductField(product, "isNewArrival") ||
    hasProductField(product, "badgeText") ||
    hasProductField(product, "badgeStyle") ||
    hasProductField(product, "sortOrder") ||
    hasProductField(product, "lowStockThreshold") ||
    hasProductField(product, "showOnHomepage") ||
    hasProductField(product, "showInFeaturedCollection")
  ) {
    payload.merchandising = merchandising;
  }
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
  if (hasProductField(product, "primaryImageUrl") || hasProductField(product, "imageUrl")) {
    const imgUrl = optionalText(product.primaryImageUrl ?? product.imageUrl) ?? null;
    payload.primary_image_url = imgUrl;
    payload.image_url = imgUrl;
  }
  if (hasProductField(product, "primaryImagePath")) {
    payload.primary_image_path = product.primaryImagePath ?? null;
  }
  if (hasProductField(product, "videoUrl")) payload.video_url = optionalText(product.videoUrl) ?? null;
  if (hasProductField(product, "videoPath")) payload.video_path = product.videoPath ?? null;
  if (hasProductField(product, "posterUrl")) payload.poster_url = optionalText(product.posterUrl) ?? null;
  if (hasProductField(product, "images")) payload.images = product.images ?? [];
  if (hasProductField(product, "media")) payload.media = Array.isArray(product.media) ? product.media : [];
  if (hasProductField(product, "benefits")) payload.benefits = product.benefits ?? [];
  if (hasProductField(product, "care")) payload.care = product.care ?? [];
  if (hasProductField(product, "seoTitle")) payload.seo_title = product.seoTitle ?? null;
  if (hasProductField(product, "seoDescription")) {
    payload.seo_description = product.seoDescription ?? null;
  }
  if (hasProductField(product, "deletedAt")) payload.deleted_at = product.deletedAt ?? null;
  if (hasProductField(product, "deletedReason")) {
    payload.deleted_reason = product.deletedReason ?? null;
  }

  return payload;
}

function toSupabaseCreatePayload(product: ProductCatalogItem) {
  return {
    slug: slugValue(product.slug),
    name: textValue(product.name),
    short_description: textValue(product.shortDescription),
    description: textValue(product.description),
    category: textValue(product.category) || "Reusable Period Panty",
    price: numberValue(product.price) ?? 0,
    compare_at_price: numberValue(product.compareAtPrice) ?? null,
    currency: SITE_CURRENCY,
    status: normalizeStatus(product.status),
    featured: Boolean(product.featured),
    merchandising: {
      isTrending: Boolean(product.isTrending),
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: Boolean(product.isNewArrival),
      badgeText: product.badgeText ?? "",
      badgeStyle: product.badgeStyle ?? "info",
      sortOrder: product.sortOrder ?? null,
      lowStockThreshold: product.lowStockThreshold ?? null,
      showOnHomepage: product.showOnHomepage !== false,
      showInFeaturedCollection:
        product.showInFeaturedCollection ?? Boolean(product.featured),
    },
    stock_status: normalizeStockStatus(product.stockStatus),
    stock_quantity: numberValue(product.stockQuantity) ?? null,
    sizes: stringArrayValue(product.sizes),
    colors: stringArrayValue(product.colors),
    absorbency: textValue(product.absorbency) || "Moderate",
    absorbency_options: stringArrayValue(product.absorbencyOptions),
    visual: normalizeVisual(product.visual),
    visual_theme: normalizeVisual(product.visualTheme),
    visual_variant: optionalText(product.visualVariant) ?? normalizeVisual(product.visualTheme),
    benefits: stringArrayValue(product.benefits),
    care: stringArrayValue(product.care),
    seo_title: optionalText(product.seoTitle) ?? null,
    seo_description: optionalText(product.seoDescription) ?? null,
    image_url: optionalText(product.primaryImageUrl ?? product.imageUrl) ?? null,
    video_url: optionalText(product.videoUrl) ?? null,
    poster_url: optionalText(product.posterUrl) ?? null,
    primary_image_url: optionalText(product.primaryImageUrl ?? product.imageUrl) ?? null,
    primary_image_path: optionalText(product.primaryImagePath) ?? null,
    video_path: optionalText(product.videoPath) ?? null,
    images: Array.isArray(product.images) ? product.images : [],
    media: Array.isArray(product.media) ? product.media : [],
  };
}

// TODO: Add limit/offset pagination when product catalog grows beyond ~200 rows.
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

async function getProductBySlugFromSupabase(slug: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?slug=eq.${encodeURIComponent(slug)}&deleted_at=is.null&select=*&limit=1`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw await supabaseError(response, "product slug lookup");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function getProductByIdFromSupabase(id: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw await supabaseError(response, "product lookup");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function createProductInSupabase(input: ProductCatalogItem) {
  const payload = toSupabaseCreatePayload(input);

  let response = await fetch(
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

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (/merchandising|schema cache|column/i.test(detail)) {
      const fallbackPayload: Record<string, unknown> = { ...payload };
      delete fallbackPayload.merchandising;
      response = await fetch(
        supabaseEndpoint(`${SUPABASE_PRODUCTS_TABLE}?select=*`),
        {
          method: "POST",
          headers: {
            ...supabaseHeaders(),
            prefer: "return=representation",
          },
          body: JSON.stringify(fallbackPayload),
        }
      );
    } else {
      throw await supabaseError(new Response(detail, { status: response.status }), "product insert");
    }
  }

  if (!response.ok) throw await supabaseError(response, "product insert");

  const rows = (await response.json()) as SupabaseProductRow[];
  if (!rows[0]) {
    throw new ProductStoreError("Supabase product insert returned no rows.", {
      status: 502,
      publicMessage: "Product was created but the backend did not return it.",
      code: "PRODUCT_CREATE_EMPTY_RESPONSE",
    });
  }

  return mapSupabaseProduct(rows[0]);
}

async function updateProductInSupabase(id: string, updates: ProductMutationInput) {
  const existing = await getProductByIdFromSupabase(id);
  if (!existing) return null;
  if (existing.deletedAt) {
    throw new ProductStoreError("Cannot update a deleted product.", {
      status: 409,
      publicMessage: "Restore this product before editing it.",
      code: "PRODUCT_DELETED",
    });
  }

  let payload = toSupabasePayload(updates);
  let response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`
    ),
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (/merchandising|schema cache|column/i.test(detail) && "merchandising" in payload) {
      payload = { ...payload };
      delete payload.merchandising;
      response = await fetch(
        supabaseEndpoint(
          `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`
        ),
        {
          method: "PATCH",
          headers: {
            ...supabaseHeaders(),
            prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );
    } else {
      throw await supabaseError(new Response(detail, { status: response.status }), "product update");
    }
  }

  if (!response.ok) throw await supabaseError(response, "product update");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function softDeleteProductInSupabase(id: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=*`
    ),
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify({
        deleted_at: new Date().toISOString(),
        deleted_reason: "Deleted from admin",
        deleted_by: "admin",
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) throw await supabaseError(response, "product delete");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function restoreProductInSupabase(id: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null&select=*`
    ),
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify({
        deleted_at: null,
        deleted_reason: null,
        deleted_by: null,
        status: "draft",
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) throw await supabaseError(response, "product restore");

  const rows = (await response.json()) as SupabaseProductRow[];
  return rows[0] ? mapSupabaseProduct(rows[0]) : null;
}

async function permanentlyDeleteProductInSupabase(id: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null`
    ),
    {
      method: "DELETE",
      headers: supabaseHeaders(),
    }
  );

  if (!response.ok) throw await supabaseError(response, "product permanent delete");

  return true;
}

async function purgeDeletedProductsInSupabase(cutoffIso: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_PRODUCTS_TABLE}?deleted_at=lt.${encodeURIComponent(cutoffIso)}&deleted_at=not.is.null`
    ),
    {
      method: "DELETE",
      headers: {
        ...supabaseHeaders(),
        prefer: "count=exact",
      },
    }
  );

  if (!response.ok) throw await supabaseError(response, "product deleted purge");

  const contentRange = response.headers.get("content-range");
  const deletedCount = contentRange ? Number(contentRange.split("/").at(-1)) : undefined;
  return Number.isFinite(deletedCount) ? deletedCount : 0;
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
  details: { count: number; scope: "admin" | "public" | "deleted"; reason?: string }
) {
  const reason = details.reason ? `, reason=${details.reason}` : "";
  console.info(
    `Product source: ${source} (${details.count} rows, scope=${details.scope}${reason})`
  );
}

export async function listProducts(
  options: { includeDrafts?: boolean; scope?: "admin" | "public" | "deleted" } = {}
) {
  const scope = options.scope ?? (options.includeDrafts ? "admin" : "public");
  const includeDrafts = scope === "admin" || Boolean(options.includeDrafts);
  const supabaseProducts = await safelyUseSupabase(listProductsFromSupabase);

  if (supabaseProducts !== null) {
    const products =
      scope === "deleted"
        ? supabaseProducts.filter((product) => Boolean(product.deletedAt))
        : includeDrafts
          ? supabaseProducts.filter((product) => !product.deletedAt)
          : supabaseProducts.filter(
              (product) => product.status === "active" && !product.deletedAt
            );

    logProductSource("supabase", { count: products.length, scope });

    return {
      products,
      storageMode: "supabase" as ProductStorageMode,
    };
  }

  const products = includeDrafts
    ? demoProducts.filter((product) => !product.deletedAt)
    : scope === "deleted"
      ? demoProducts.filter((product) => Boolean(product.deletedAt))
      : demoProducts.filter((product) => product.status === "active" && !product.deletedAt);

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

  if (hasSupabaseConfig()) {
    const supabaseProduct = await safelyUseSupabase(() => getProductBySlugFromSupabase(slug));

    if (supabaseProduct !== null) {
      console.info(
        `Product detail source: supabase (slug=${slug}, found=${Boolean(supabaseProduct)}, includeDrafts=${includeDrafts})`
      );

      if (!includeDrafts && supabaseProduct.status !== "active") {
        return { product: null, storageMode: "supabase" as ProductStorageMode };
      }

      return {
        product: supabaseProduct,
        storageMode: "supabase" as ProductStorageMode,
      };
    }

    // safelyUseSupabase returned null: Supabase unavailable or table missing — fall through to static.
    const fallbackProduct =
      demoProducts.find(
        (item) => item.slug === slug && !item.deletedAt && (includeDrafts || item.status === "active")
      ) ?? null;

    console.info(
      `Product detail source: fallback-static (slug=${slug}, found=${Boolean(fallbackProduct)}, includeDrafts=${includeDrafts})`
    );

    return {
      product: fallbackProduct,
      storageMode: "fallback-static" as ProductStorageMode,
    };
  }

  const product =
    demoProducts.find(
      (item) =>
        item.slug === slug &&
        !item.deletedAt &&
        (includeDrafts || item.status === "active")
    ) ?? null;

  console.info(
    `Product detail source: demo-memory (slug=${slug}, found=${Boolean(product)}, includeDrafts=${includeDrafts})`
  );

  return {
    product,
    storageMode: "demo-memory" as ProductStorageMode,
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
  if (existing.deletedAt) {
    throw new ProductStoreError("Cannot update a deleted product.", {
      status: 409,
      publicMessage: "Restore this product before editing it.",
      code: "PRODUCT_DELETED",
    });
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
  if (hasSupabaseConfig()) {
    const supabaseProduct = await softDeleteProductInSupabase(id);
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  const existing = demoProducts.find((product) => product.id === id && !product.deletedAt);
  if (!existing) return { product: null, storageMode: "demo-memory" as ProductStorageMode };

  const deletedProduct = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedReason: "Deleted from admin",
    updatedAt: new Date().toISOString(),
  };
  demoProducts = demoProducts.map((product) =>
    product.id === id ? deletedProduct : product
  );
  return { product: deletedProduct, storageMode: "demo-memory" as ProductStorageMode };
}

export async function restoreProduct(id: string) {
  if (hasSupabaseConfig()) {
    const supabaseProduct = await restoreProductInSupabase(id);
    return { product: supabaseProduct, storageMode: "supabase" as ProductStorageMode };
  }

  const existing = demoProducts.find((product) => product.id === id && product.deletedAt);
  if (!existing) return { product: null, storageMode: "demo-memory" as ProductStorageMode };

  const restoredProduct = {
    ...existing,
    status: "draft" as ProductStatus,
    deletedAt: undefined,
    deletedReason: undefined,
    updatedAt: new Date().toISOString(),
  };
  demoProducts = demoProducts.map((product) =>
    product.id === id ? restoredProduct : product
  );
  return { product: restoredProduct, storageMode: "demo-memory" as ProductStorageMode };
}

export async function permanentlyDeleteProduct(id: string) {
  if (hasSupabaseConfig()) {
    const existing = await getProductByIdFromSupabase(id);
    if (!existing) return { deleted: false, storageMode: "supabase" as ProductStorageMode };
    if (!existing.deletedAt) {
      throw new ProductStoreError("Cannot permanently delete a non-deleted product.", {
        status: 409,
        publicMessage: "Move this product to Deleted before permanently deleting it.",
        code: "PRODUCT_NOT_DELETED",
      });
    }

    await permanentlyDeleteProductInSupabase(id);
    return { deleted: true, storageMode: "supabase" as ProductStorageMode };
  }

  const existing = demoProducts.find((product) => product.id === id);
  if (!existing) return { deleted: false, storageMode: "demo-memory" as ProductStorageMode };
  if (!existing.deletedAt) {
    throw new ProductStoreError("Cannot permanently delete a non-deleted product.", {
      status: 409,
      publicMessage: "Move this product to Deleted before permanently deleting it.",
      code: "PRODUCT_NOT_DELETED",
    });
  }

  demoProducts = demoProducts.filter((product) => product.id !== id);
  return { deleted: true, storageMode: "demo-memory" as ProductStorageMode };
}

export async function purgeDeletedProductsOlderThan(days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (hasSupabaseConfig()) {
    const deletedCount = await purgeDeletedProductsInSupabase(cutoff);
    return { deletedCount, cutoff, storageMode: "supabase" as ProductStorageMode };
  }

  const before = demoProducts.length;
  demoProducts = demoProducts.filter((product) => {
    if (!product.deletedAt) return true;
    return Date.parse(product.deletedAt) >= Date.parse(cutoff);
  });

  return {
    deletedCount: before - demoProducts.length,
    cutoff,
    storageMode: "demo-memory" as ProductStorageMode,
  };
}

// TODO: Expand this adapter when inventory variants become first-class rows.
// Product-level stock fields are intentionally simple for Phase 15.
