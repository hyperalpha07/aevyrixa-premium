import { validateAdminV2DraftProduct } from "./product-create";

export const draftEditFields = {
  name: 180, slug: 160, price: 24, compareAtPrice: 24, category: 120,
  shortDescription: 500, description: 10000, sizes: 8000, colors: 8000,
  absorbency: 120, benefits: 16000, care: 16000, seoTitle: 180,
  seoDescription: 500, stockStatus: 30, stockQuantity: 24, lowStockThreshold: 24,
} as const;
export type DraftEditField = keyof typeof draftEditFields;
export type DraftEditValues = Record<DraftEditField, string>;
export type DraftEditState = { errors: string[]; fields: Partial<Record<DraftEditField, string>> };

export function validateDraftEdit(raw: unknown) {
  const source = typeof raw === "object" && raw !== null && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  const fields: DraftEditState["fields"] = {};
  const errors: string[] = [];
  if (Object.keys(source).some((key) => !Object.hasOwn(draftEditFields, key))) {
    errors.push("Unsupported fields were submitted. Reload the edit form and try again.");
  }
  for (const [key, limit] of Object.entries(draftEditFields)) {
    const field = key as DraftEditField;
    if (typeof source[field] !== "string") fields[field] = "This field must be submitted as text.";
    else if (source[field].length > limit) fields[field] = `Use at most ${limit} characters.`;
  }
  const stock = source.stockStatus;
  if (typeof stock === "string" && !["", "in_stock", "low_stock", "out_of_stock", "preorder"].includes(stock)) {
    fields.stockStatus = "Choose a valid stock state.";
  }
  // Line-based lists preserve commas in existing benefits/care and never silently truncate copy.
  const lists: Record<string, string[]> = {};
  for (const field of ["sizes", "colors", "benefits", "care"] as const) {
    const lines = typeof source[field] === "string" ? source[field].split(/\r?\n/).map((v) => v.trim()).filter(Boolean) : [];
    if (lines.length > 40 || lines.some((line) => line.length > 100)) {
      fields[field] = "Use at most 40 lines, with at most 100 characters per line.";
    }
    lists[field] = lines;
  }
  const result = validateAdminV2DraftProduct({ ...source, ...lists });
  Object.assign(fields, result.fields);
  errors.push(...Object.values(fields));
  return { input: errors.length ? null : result.input, errors, fields };
}

export function draftEditQuery(id: string) {
  return new URLSearchParams({ id: `eq.${id}`, status: "eq.draft", deleted_at: "is.null", select: "id" });
}

export function duplicateDraftSlugQuery(id: string, slug: string) {
  return new URLSearchParams({ id: `neq.${id}`, slug: `eq.${slug}`, deleted_at: "is.null", select: "id", limit: "1" });
}

export function isEditableDraft(row: { status?: unknown; deleted_at?: unknown } | null) {
  return Boolean(row && row.status === "draft" && row.deleted_at == null);
}

export function draftEditPayload(raw: unknown, merchandising: unknown) {
  const validation = validateDraftEdit(raw);
  const p = validation.input;
  if (!p) return { ...validation, payload: null };
  const existing = typeof merchandising === "object" && merchandising !== null && !Array.isArray(merchandising)
    ? merchandising as Record<string, unknown> : {};
  return {
    ...validation,
    payload: {
      name: p.name, slug: p.slug, price: p.price, category: p.category,
      compare_at_price: p.compareAtPrice ?? null,
      short_description: p.shortDescription, description: p.description,
      sizes: p.sizes, colors: p.colors, absorbency: p.absorbency,
      benefits: p.benefits, care: p.care,
      seo_title: p.seoTitle || null, seo_description: p.seoDescription || null,
      stock_status: p.stockStatus ?? "out_of_stock", stock_quantity: p.stockQuantity ?? null,
      status: "draft", featured: false,
      merchandising: { ...existing, lowStockThreshold: p.lowStockThreshold ?? null,
        isTrending: false, isBestSeller: false, isNewArrival: false,
        showOnHomepage: false, showInFeaturedCollection: false },
    },
  };
}

export type DraftEditRequest = (query: URLSearchParams, init?: RequestInit) => Promise<Response>;
export type DraftEditRow = Record<string, unknown> & { id: string; status: string; deleted_at: unknown; updated_at?: string };

export async function readDraftEditProduct(id: string, request: DraftEditRequest): Promise<DraftEditRow | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const response = await request(new URLSearchParams({ id: `eq.${id}`, deleted_at: "is.null", select: "*", limit: "1" }));
  if (!response.ok) throw new Error("Product data is currently unavailable.");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Product data is currently unavailable.");
  return rows[0] ?? null;
}

export function draftEditInitialValues(row: DraftEditRow): DraftEditValues {
  const text = (value: unknown) => value == null ? "" : String(value);
  const list = (value: unknown) => Array.isArray(value) ? value.filter((v) => typeof v === "string").join("\n") : "";
  const merchandising = row.merchandising as Record<string, unknown> | null;
  return {
    name: text(row.name), slug: text(row.slug), category: text(row.category), price: text(row.price),
    compareAtPrice: text(row.compare_at_price), shortDescription: text(row.short_description),
    description: text(row.description), sizes: list(row.sizes), colors: list(row.colors),
    absorbency: text(row.absorbency), benefits: list(row.benefits), care: list(row.care),
    seoTitle: text(row.seo_title), seoDescription: text(row.seo_description),
    stockStatus: text(row.stock_status), stockQuantity: text(row.stock_quantity),
    lowStockThreshold: text(merchandising?.lowStockThreshold),
  };
}

// The injected transport allows full write-path tests without contacting a database.
export async function persistDraftEdit(id: string, raw: unknown, request: DraftEditRequest): Promise<DraftEditState & { saved?: boolean }> {
  const validation = validateDraftEdit(raw);
  if (!validation.input) return { errors: validation.errors, fields: validation.fields };
  const row = await readDraftEditProduct(id, request);
  if (!row) return { errors: ["Product was not found or has been deleted."], fields: {} };
  if (!isEditableDraft(row)) return { errors: ["Only draft products can be edited. Active products remain read-only."], fields: {} };
  const supportsMerchandising = Object.hasOwn(row, "merchandising");
  if (!supportsMerchandising && validation.input.lowStockThreshold !== undefined) {
    return { errors: ["Low-stock threshold is not supported by the current schema."], fields: { lowStockThreshold: "Not available for this database." } };
  }
  const duplicate = await request(duplicateDraftSlugQuery(id, validation.input.slug!));
  if (!duplicate.ok) return { errors: ["Could not check slug availability. No changes were saved."], fields: {} };
  const duplicates = await duplicate.json();
  if (!Array.isArray(duplicates)) return { errors: ["Could not check slug availability."], fields: {} };
  const conflict = { errors: ["This slug is already in use by another product."], fields: { slug: "Choose a different slug." } };
  if (duplicates.length) return conflict;
  const { payload } = draftEditPayload(raw, row.merchandising);
  // SELECT * establishes column availability before writing; never retry a failed write.
  // Older schemas have no merchandising flags to update. Draft + featured=false remain enforced.
  const updatePayload: Record<string, unknown> = { ...payload };
  if (!supportsMerchandising) delete updatePayload.merchandising;
  const query = draftEditQuery(id);
  // Protect against concurrent changes between this read and the PATCH, including JSON settings.
  if (row.updated_at) query.set("updated_at", `eq.${row.updated_at}`);
  const response = await request(query, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...updatePayload, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    if (detail.code === "23505") return conflict;
    return { errors: ["Draft changes could not be saved. Reload the product before retrying."], fields: {} };
  }
  const updated = await response.json();
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0].id !== id) {
    return { errors: ["The product changed or is no longer an editable draft. Reload the product."], fields: {} };
  }
  return { saved: true, errors: [], fields: {} };
}
