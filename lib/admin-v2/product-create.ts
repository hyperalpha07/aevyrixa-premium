import type { ProductMutationInput, ProductStockStatus } from "@/app/lib/product-types";

export type AdminV2DraftProductField =
  | "name"
  | "slug"
  | "price"
  | "compareAtPrice"
  | "category"
  | "stockQuantity"
  | "lowStockThreshold";

export type AdminV2DraftProductValidation = {
  input: ProductMutationInput | null;
  errors: string[];
  fields: Partial<Record<AdminV2DraftProductField, string>>;
};

const allowedStockStatuses = new Set<ProductStockStatus>([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "preorder",
]);

function text(value: unknown, maxLength = 5_000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalNumber(value: unknown) {
  if (typeof value === "string" && !value.trim()) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return value === undefined || value === null ? undefined : Number.NaN;
}

function cleanedList(value: unknown) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]/) : [];
  const seen = new Set<string>();

  return source
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 100))
    .filter((item) => {
      if (!item) return false;
      const key = item.toLocaleLowerCase("en");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

export function slugifyAdminV2ProductName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function validateAdminV2DraftProduct(raw: unknown): AdminV2DraftProductValidation {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const errors: string[] = [];
  const fields: Partial<Record<AdminV2DraftProductField, string>> = {};
  const addError = (field: AdminV2DraftProductField, message: string) => {
    errors.push(message);
    fields[field] = message;
  };

  const name = text(source.name, 180);
  const slug = text(source.slug, 160);
  const category = text(source.category, 120);
  const price = optionalNumber(source.price);
  const compareAtPrice = optionalNumber(source.compareAtPrice);
  const stockQuantity = optionalNumber(source.stockQuantity);
  const lowStockThreshold = optionalNumber(source.lowStockThreshold);
  const requestedStockStatus = text(source.stockStatus, 30) as ProductStockStatus;

  if (!name) addError("name", "Product name is required.");
  if (!slug) addError("slug", "Slug is required.");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    addError("slug", "Use lowercase letters, numbers, and single hyphens only.");
  }
  if (price === undefined || !Number.isFinite(price) || price <= 0) {
    addError("price", "Price must be greater than zero.");
  }
  if (
    compareAtPrice !== undefined &&
    (!Number.isFinite(compareAtPrice) || price === undefined || compareAtPrice <= price)
  ) {
    addError("compareAtPrice", "Compare-at price must be greater than the selling price.");
  }
  if (!category) addError("category", "Category is required.");
  if (
    stockQuantity !== undefined &&
    (!Number.isInteger(stockQuantity) || stockQuantity < 0)
  ) {
    addError("stockQuantity", "Stock quantity must be a whole number of zero or more.");
  }
  if (
    lowStockThreshold !== undefined &&
    (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)
  ) {
    addError("lowStockThreshold", "Low-stock threshold must be a whole number of zero or more.");
  }

  if (errors.length > 0 || price === undefined) return { input: null, errors, fields };

  const stockStatus = allowedStockStatuses.has(requestedStockStatus)
    ? requestedStockStatus
    : undefined;

  return {
    errors: [],
    fields: {},
    input: {
      name,
      slug,
      price,
      category,
      ...(compareAtPrice === undefined ? {} : { compareAtPrice }),
      shortDescription: text(source.shortDescription, 500),
      description: text(source.description, 10_000),
      sizes: cleanedList(source.sizes),
      colors: cleanedList(source.colors),
      absorbency: text(source.absorbency, 120),
      benefits: cleanedList(source.benefits),
      care: cleanedList(source.care),
      seoTitle: text(source.seoTitle, 180),
      seoDescription: text(source.seoDescription, 500),
      ...(stockStatus ? { stockStatus } : {}),
      ...(stockQuantity === undefined ? {} : { stockQuantity }),
      ...(lowStockThreshold === undefined ? {} : { lowStockThreshold }),
      status: "draft",
      featured: false,
      isTrending: false,
      isBestSeller: false,
      isNewArrival: false,
      showOnHomepage: false,
      showInFeaturedCollection: false,
    },
  };
}
