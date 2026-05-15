import type { ProductCatalogItem, ProductVisualTheme } from "@/app/lib/product-types";
import { formatCurrency, SITE_CURRENCY } from "@/app/lib/currency";

export type { ProductCatalogItem, ProductVisualTheme } from "@/app/lib/product-types";

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  numericPrice: number;
  category: string;
  sizes: string[];
  colors: string[];
  absorbency: "Light" | "Moderate" | "Heavy/Night";
  absorbencyOptions: string[];
  benefits: string[];
  care: string[];
  seoTitle: string;
  seoDescription: string;
  visualTheme: ProductVisualTheme;
};

export const productSizes = ["XS", "S", "M", "L", "XL", "XXL"];
export const productColors = ["Black", "Nude", "Soft Pink"];

export const products: Product[] = [
  {
    id: "aev-her-care-everyday-comfort",
    slug: "everyday-comfort",
    name: "Aevyrixa Her Care Period Panty - Everyday Comfort",
    shortDescription:
      "Soft reusable period underwear for lighter routine days with a smooth, discreet fit.",
    description:
      "Everyday Comfort is designed for light-flow days, backup coverage, and calm daily wear. The silhouette feels refined under outfits while the reusable layered gusset supports a simpler care routine.",
    price: "BDT 1,200",
    compareAtPrice: "BDT 1,500",
    numericPrice: 1200,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Light",
    absorbencyOptions: ["Light", "Moderate"],
    benefits: [
      "Smooth low-profile shape for everyday outfits",
      "Soft stretch waistband for flexible comfort",
      "Reusable design made for simple cycle routines",
      "Discreet finish with a premium Her Care look",
    ],
    care: [
      "Rinse with cold water after wear",
      "Machine wash cold with similar colors",
      "Use mild detergent and avoid bleach or fabric softener",
      "Air dry fully before storing or wearing again",
    ],
    seoTitle: "Aevyrixa Her Care Everyday Comfort Period Panty",
    seoDescription:
      "Shop Aevyrixa Her Care Everyday Comfort reusable period panty for light-flow days, discreet comfort, and simple care.",
    visualTheme: "blush-violet",
  },
  {
    id: "aev-her-care-heavy-flow-support",
    slug: "heavy-flow-support",
    name: "Aevyrixa Her Care Period Panty - Heavy Flow Support",
    shortDescription:
      "A supportive reusable panty for heavier routine days with secure coverage and soft structure.",
    description:
      "Heavy Flow Support brings a more anchored Her Care feel for days when you want extra coverage. The design focuses on comfort, discretion, and reusable protection without a bulky look.",
    price: "BDT 1,450",
    compareAtPrice: "BDT 1,800",
    numericPrice: 1450,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Moderate",
    absorbencyOptions: ["Moderate", "Heavy/Night"],
    benefits: [
      "Supportive coverage for heavier routine days",
      "Soft contouring edges designed to reduce visible bulk",
      "Reusable layered gusset for repeat wear",
      "Premium dark-cyan visual identity for a confident feel",
    ],
    care: [
      "Rinse in cold water until water runs clearer",
      "Machine wash cold on a gentle cycle",
      "Do not use bleach, fabric softener, or high heat",
      "Air dry in a ventilated space before reuse",
    ],
    seoTitle: "Aevyrixa Her Care Heavy Flow Support Period Panty",
    seoDescription:
      "Explore Aevyrixa Her Care Heavy Flow Support reusable period panty with secure comfort and discreet reusable coverage.",
    visualTheme: "cyan-night",
  },
  {
    id: "aev-her-care-night-comfort",
    slug: "night-comfort",
    name: "Aevyrixa Her Care Period Panty - Night Comfort",
    shortDescription:
      "Extended comfort for sleep, travel, and long wear moments with a soft secure feel.",
    description:
      "Night Comfort is shaped for overnight routines and longer wear windows. It pairs extended coverage with a smooth waistband and soft materials so rest feels less interrupted.",
    price: "BDT 1,650",
    compareAtPrice: "BDT 2,100",
    numericPrice: 1650,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Heavy/Night",
    absorbencyOptions: ["Heavy/Night"],
    benefits: [
      "Extended coverage designed for overnight comfort",
      "Soft rise and waistband for relaxed long wear",
      "Reusable construction for repeat cycle support",
      "Rose-gold and ivory accents for a premium care mood",
    ],
    care: [
      "Rinse cold after use before washing",
      "Wash cold with gentle detergent",
      "Avoid ironing, dry cleaning, bleach, and fabric softener",
      "Air dry completely; do not tumble dry on high heat",
    ],
    seoTitle: "Aevyrixa Her Care Night Comfort Period Panty",
    seoDescription:
      "Shop Aevyrixa Her Care Night Comfort reusable period panty for overnight routines, soft coverage, and reusable care.",
    visualTheme: "rose-gold",
  },
];

export function legacyProductToCatalogItem(
  product: Product,
  overrides: Partial<ProductCatalogItem> = {}
): ProductCatalogItem {
  const now = new Date(0).toISOString();

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category,
    price: product.numericPrice,
    compareAtPrice: priceTextToNumber(product.compareAtPrice),
    currency: SITE_CURRENCY,
    status: "active",
    featured: true,
    stockStatus: "in_stock",
    stockQuantity: undefined,
    sizes: product.sizes,
    colors: product.colors,
    absorbency: product.absorbency,
    absorbencyOptions: product.absorbencyOptions,
    visual: product.visualTheme,
    visualTheme: product.visualTheme,
    visualVariant: product.visualTheme,
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function catalogItemToLegacyProduct(
  product: ProductCatalogItem
): Product {
  const visualTheme = product.visualTheme ?? product.visual;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: formatProductPrice(product),
    compareAtPrice:
      typeof product.compareAtPrice === "number"
        ? formatProductPrice({ ...product, price: product.compareAtPrice })
        : undefined,
    numericPrice: product.price,
    category: product.category,
    sizes: product.sizes.length > 0 ? product.sizes : productSizes,
    colors: product.colors.length > 0 ? product.colors : productColors,
    absorbency:
      product.absorbency === "Light" ||
      product.absorbency === "Moderate" ||
      product.absorbency === "Heavy/Night"
        ? product.absorbency
        : "Moderate",
    absorbencyOptions:
      product.absorbencyOptions.length > 0
        ? product.absorbencyOptions
        : [product.absorbency || "Moderate"],
    benefits: product.benefits,
    care: product.care,
    seoTitle: product.seoTitle || product.name,
    seoDescription: product.seoDescription || product.shortDescription,
    visualTheme,
  };
}

export function formatProductPrice(product: Pick<ProductCatalogItem, "price" | "currency">) {
  return formatCurrency(product.price);
}

function priceTextToNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]+/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
