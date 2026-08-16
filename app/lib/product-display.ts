import type {
  ProductCatalogItem,
  ProductStockStatus,
  ProductVisualTheme,
} from "@/app/lib/product-types";
import { SITE_CURRENCY } from "@/app/lib/currency";
import { extractProductCmsContent } from "@/app/lib/product-content";
import { brandName } from "@/configs/brand/noromi";

function publicBrandText(value: string) {
  return value
    .replace(/Aevyrixa Her Care/gi, brandName)
    .replace(/\bAevyrixa\b(?![.@:/_-])/gi, brandName)
    .replace(/\bHer Care\b/gi, brandName);
}

export const fallbackProductCopy = {
  category: "Reusable Period Care",
  shortDescription:
    `Premium reusable ${brandName} comfort with a discreet, polished fit.`,
  description:
    `A refined reusable ${brandName} essential designed for comfort, discretion, and a simple care routine.`,
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

export function stockBadgeClass(status: ProductStockStatus): string {
  switch (status) {
    case "in_stock":
      return "border-[#00D4C6]/28 bg-[#00D4C6]/[0.08] text-[#31E6D4]";
    case "low_stock":
      return "border-[#FFB84D]/32 bg-[#FFB84D]/[0.09] text-[#FFC36A]";
    case "out_of_stock":
      return "border-red-300/35 bg-red-500/[0.09] text-red-200";
    case "preorder":
      return "border-[#A855F7]/28 bg-[#A855F7]/[0.09] text-[#D8CBE8]";
    default:
      return "border-[#FF4DB8]/18 bg-[#211633]/80 text-[#D8CBE8]";
  }
}

export function isPurchasableStock(status: ProductStockStatus) {
  return status === "in_stock" || status === "low_stock" || status === "preorder";
}

export function publicProduct(product: ProductCatalogItem): ProductCatalogItem {
  const visualTheme = safeVisualTheme(product.visualTheme ?? product.visual);
  const absorbency = cleanText(product.absorbency) || fallbackProductCopy.absorbency;
  const absorbencyOptions = cleanTextArray(product.absorbencyOptions);
  const colors = cleanTextArray(product.colors);
  const cms = extractProductCmsContent(product.media, colors);

  return {
    ...product,
    slug: cleanText(product.slug),
    name: publicBrandText(cleanText(product.name)) || `${brandName} Essential`,
    shortDescription:
      publicBrandText(cleanText(product.shortDescription)) || fallbackProductCopy.shortDescription,
    description: publicBrandText(cleanText(product.description)) || fallbackProductCopy.description,
    seoTitle: publicBrandText(cleanText(product.seoTitle)),
    seoDescription: publicBrandText(cleanText(product.seoDescription)),
    category: cleanText(product.category) || fallbackProductCopy.category,
    currency: SITE_CURRENCY,
    price: typeof product.price === "number" && Number.isFinite(product.price)
      ? product.price
      : 0,
    stockStatus: product.stockStatus ?? "in_stock",
    sizes: cleanTextArray(product.sizes),
    colors,
    absorbency,
    absorbencyOptions:
      absorbencyOptions.length > 0 ? absorbencyOptions : [absorbency],
    visual: visualTheme,
    visualTheme,
    visualVariant: cleanText(product.visualVariant) || visualTheme,
    benefits: cleanTextArray(product.benefits),
    care: cleanTextArray(product.care),
    sectionMedia: product.sectionMedia ?? cms.sectionMedia,
    contentBlocks: product.contentBlocks ?? cms.contentBlocks,
    colorOptions: product.colorOptions ?? cms.colorOptions,
    benefitItems: product.benefitItems ?? cms.benefitItems,
    faqItems: product.faqItems ?? cms.faqItems,
    visualThemeSettings: product.visualThemeSettings ?? cms.visualThemeSettings,
  };
}

export function displayBenefits(product: ProductCatalogItem) {
  return product.benefits.length > 0 ? product.benefits : fallbackProductCopy.benefits;
}

export function displayCare(product: ProductCatalogItem) {
  return product.care.length > 0 ? product.care : fallbackProductCopy.care;
}
