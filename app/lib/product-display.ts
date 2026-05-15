import type {
  ProductCatalogItem,
  ProductStockStatus,
  ProductVisualTheme,
} from "@/app/lib/product-types";
import { SITE_CURRENCY } from "@/app/lib/currency";

export const fallbackProductCopy = {
  category: "Reusable Period Panty",
  shortDescription:
    "Premium reusable Her Care comfort with a discreet, polished fit.",
  description:
    "A refined reusable Her Care essential designed for comfort, discretion, and a simple care routine.",
  absorbency: "Moderate",
  visualTheme: "blush-violet" as ProductVisualTheme,
  benefits: [
    "Soft comfort-first fit for routine wear",
    "Reusable design made for simple cycle care",
    "Discreet finish with a premium Her Care look",
  ],
  care: [
    "Rinse with cold water after wear",
    "Machine wash cold with mild detergent",
    "Air dry fully before storing or wearing again",
  ],
};

const visualThemes: ProductVisualTheme[] = [
  "blush-violet",
  "cyan-night",
  "rose-gold",
];

export function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanTextArray(values: unknown) {
  return Array.isArray(values)
    ? values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}

export function safeVisualTheme(value: unknown): ProductVisualTheme {
  return visualThemes.includes(value as ProductVisualTheme)
    ? (value as ProductVisualTheme)
    : fallbackProductCopy.visualTheme;
}

export function stockStatusLabel(status: ProductStockStatus) {
  const labels: Record<ProductStockStatus, string> = {
    in_stock: "In stock",
    low_stock: "Low stock",
    out_of_stock: "Out of stock",
    preorder: "Preorder",
  };

  return labels[status] ?? labels.in_stock;
}

export function isPurchasableStock(status: ProductStockStatus) {
  return status === "in_stock" || status === "low_stock" || status === "preorder";
}

export function publicProduct(product: ProductCatalogItem): ProductCatalogItem {
  const visualTheme = safeVisualTheme(product.visualTheme ?? product.visual);
  const absorbency = cleanText(product.absorbency) || fallbackProductCopy.absorbency;
  const absorbencyOptions = cleanTextArray(product.absorbencyOptions);

  return {
    ...product,
    slug: cleanText(product.slug),
    name: cleanText(product.name) || "Aevyrixa Her Care Essential",
    shortDescription:
      cleanText(product.shortDescription) || fallbackProductCopy.shortDescription,
    description: cleanText(product.description) || fallbackProductCopy.description,
    category: cleanText(product.category) || fallbackProductCopy.category,
    currency: SITE_CURRENCY,
    price: typeof product.price === "number" && Number.isFinite(product.price)
      ? product.price
      : 0,
    stockStatus: product.stockStatus ?? "in_stock",
    sizes: cleanTextArray(product.sizes),
    colors: cleanTextArray(product.colors),
    absorbency,
    absorbencyOptions:
      absorbencyOptions.length > 0 ? absorbencyOptions : [absorbency],
    visual: visualTheme,
    visualTheme,
    visualVariant: cleanText(product.visualVariant) || visualTheme,
    benefits: cleanTextArray(product.benefits),
    care: cleanTextArray(product.care),
  };
}

export function displayBenefits(product: ProductCatalogItem) {
  return product.benefits.length > 0 ? product.benefits : fallbackProductCopy.benefits;
}

export function displayCare(product: ProductCatalogItem) {
  return product.care.length > 0 ? product.care : fallbackProductCopy.care;
}
