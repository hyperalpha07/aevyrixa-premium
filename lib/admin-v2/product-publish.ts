export const PUBLISH_CONFIRMATION = "PUBLISH";

export type PublishCheck = { key: string; label: string; passed: boolean; detail: string; action?: "edit" | "media" };
export type PublishWarning = { key: string; label: string; detail: string };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

export function publishSlugQuery(productId: string, slug: string) {
  return new URLSearchParams({ id: `neq.${productId}`, slug: `eq.${slug}`, deleted_at: "is.null", select: "id", limit: "1" });
}

export function publishUpdateQuery(productId: string, updatedAt?: string) {
  const query = new URLSearchParams({ id: `eq.${productId}`, status: "eq.draft", deleted_at: "is.null", select: "id" });
  if (updatedAt) query.set("updated_at", `eq.${updatedAt}`);
  return query;
}

export function publishPayload(now: string) {
  return { status: "active", updated_at: now } as const;
}

export function validatePublishConfirmation(value: unknown) {
  return value === PUBLISH_CONFIRMATION ? null : `Type ${PUBLISH_CONFIRMATION} exactly to confirm.`;
}

export function evaluatePublishReadiness(
  row: Record<string, unknown> | null,
  context: { reachableImageCount: number; duplicateSlug: boolean; unsafeMediaWarning?: boolean }
) {
  const slug = text(row?.slug);
  const checks: PublishCheck[] = [
    { key: "draft", label: "Product is a draft", passed: row?.status === "draft", detail: "Only draft products can be published." },
    { key: "deleted", label: "Product is not deleted", passed: Boolean(row && row.deleted_at == null), detail: "Deleted products cannot be published." },
    { key: "name", label: "Product name exists", passed: Boolean(text(row?.name)), detail: "Add a product name.", action: "edit" },
    { key: "slug", label: "Public slug is valid", passed: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), detail: "Use lowercase letters, numbers, and single hyphens.", action: "edit" },
    { key: "category", label: "Category exists", passed: Boolean(text(row?.category)), detail: "Choose a category.", action: "edit" },
    { key: "price", label: "Selling price is valid", passed: Number.isFinite(number(row?.price)) && number(row?.price) > 0, detail: "Set a price greater than zero.", action: "edit" },
    { key: "shortDescription", label: "Short description exists", passed: Boolean(text(row?.short_description)), detail: "Add a concise short description.", action: "edit" },
    { key: "description", label: "Full description exists", passed: Boolean(text(row?.description)), detail: "Add the full product description.", action: "edit" },
    { key: "image", label: "At least one reachable image exists", passed: context.reachableImageCount > 0, detail: "Upload at least one usable product image.", action: "media" },
    { key: "uniqueSlug", label: "Public slug is unique", passed: Boolean(slug) && !context.duplicateSlug, detail: "Another non-deleted product uses this slug.", action: "edit" },
    { key: "safeMedia", label: "No obvious legacy media reference detected", passed: !context.unsafeMediaWarning, detail: "Review legacy or placeholder media before publishing.", action: "media" },
  ];
  const warnings: PublishWarning[] = [];
  if (row?.stock_status === "out_of_stock" || number(row?.stock_quantity) === 0) warnings.push({ key: "stock", label: "Stock needs review", detail: "The product is out of stock or has zero quantity." });
  if (!text(row?.seo_title) || !text(row?.seo_description)) warnings.push({ key: "seo", label: "SEO is incomplete", detail: "SEO title or description is missing." });
  if (!Number.isFinite(number(row?.compare_at_price))) warnings.push({ key: "compare", label: "No compare-at price", detail: "A compare-at price is optional." });
  if (!Array.isArray(row?.sizes) || row.sizes.length === 0) warnings.push({ key: "sizes", label: "No sizes", detail: "Size options are missing." });
  if (!Array.isArray(row?.colors) || row.colors.length === 0) warnings.push({ key: "colors", label: "No colors", detail: "Color options are missing." });
  return { checks, warnings, ready: checks.every((check) => check.passed) };
}

export function hasObviousLegacyMediaReference(row: Record<string, unknown>) {
  const values = [row.primary_image_url, row.image_url, ...(Array.isArray(row.images) ? row.images : [])];
  return values.some((value) => typeof value === "string" && /aevyrixa|her[-_ ]?care|hygeia|(?:^|[/_-])logo(?:[._/-]|$)/i.test(value));
}
