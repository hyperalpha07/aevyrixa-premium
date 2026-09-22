export type OrderImageItem = {
  image?: string | null;
  productId?: string | null;
  slug?: string | null;
};

export type CatalogImageProduct = {
  id: string;
  slug: string;
  primaryImageUrl?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  media?: unknown[] | null;
};

const lookupKey = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";
const slugKey = (value: string | null | undefined) => lookupKey(value).replace(/^\/+|\/+$/g, "").replace(/\s+/g, "-");

export function safeAccountOrderImage(
  value: unknown,
  normalizeImage: (value: string) => string | null,
  isPublicAllowed: (value: unknown) => boolean,
  supabaseUrl: string | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const image = normalizeImage(value);
  if (!image || !isPublicAllowed(image)) return null;

  if (image.startsWith("/") && !image.startsWith("//")) {
    const pathname = image.split(/[?#]/, 1)[0];
    let decoded: string;
    try { decoded = decodeURIComponent(pathname); } catch { return null; }
    if (decoded.includes("..") || decoded.includes("\\") || /\s/.test(decoded)) return null;
    return decoded.startsWith("/brand/noromi/products/") || decoded.startsWith("/products/") ? image : null;
  }

  try {
    const url = new URL(image);
    const base = supabaseUrl ? new URL(supabaseUrl) : null;
    if (!base || url.origin !== base.origin || url.username || url.password) return null;
    return url.pathname.startsWith("/storage/v1/object/public/product-media/") ? image : null;
  } catch {
    return null;
  }
}

export function createProductImageLookup(products: CatalogImageProduct[]) {
  const byId = new Map<string, CatalogImageProduct>();
  const bySlug = new Map<string, CatalogImageProduct>();
  for (const product of products) {
    if (lookupKey(product.id)) byId.set(lookupKey(product.id), product);
    if (slugKey(product.slug)) bySlug.set(slugKey(product.slug), product);
  }
  return { byId, bySlug };
}

export function resolveOrderItemImage(
  item: OrderImageItem,
  catalog: ReturnType<typeof createProductImageLookup> | null,
  safeImage: (image: unknown) => string | null,
): string | null {
  const snapshot = safeImage(item.image);
  if (snapshot) return snapshot;
  if (!catalog) return null;

  const candidates = [catalog.byId.get(lookupKey(item.productId)), catalog.bySlug.get(slugKey(item.slug))];
  for (const product of candidates) {
    if (!product) continue;
    const publicMedia = (product.media ?? []).flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      if (!entry || typeof entry !== "object") return [];
      const media = entry as Record<string, unknown>;
      if (media.type === "video") return [];
      return typeof media.url === "string" ? [media.url] : [];
    });
    for (const candidate of [product.primaryImageUrl, product.imageUrl, ...(product.images ?? []), ...publicMedia]) {
      const image = safeImage(candidate);
      if (image) return image;
    }
  }
  return null;
}

export function snapshotOrderItemImages<T extends OrderImageItem>(
  items: T[],
  products: CatalogImageProduct[],
  safeImage: (image: unknown) => string | null,
): T[] {
  const catalog = createProductImageLookup(products);
  return items.map((item) => ({ ...item, image: resolveOrderItemImage(item, catalog, safeImage) }));
}
