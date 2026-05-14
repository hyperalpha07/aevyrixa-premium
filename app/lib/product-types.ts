export type ProductVisualTheme = "blush-violet" | "cyan-night" | "rose-gold";

export type ProductStatus = "active" | "draft";

export type ProductStockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "preorder";

export type ProductCatalogItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  stockStatus: ProductStockStatus;
  stockQuantity?: number;
  sizes: string[];
  colors: string[];
  absorbency: "Light" | "Moderate" | "Heavy/Night" | string;
  absorbencyOptions: string[];
  visual: ProductVisualTheme;
  visualTheme: ProductVisualTheme;
  visualVariant?: string;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  benefits: string[];
  care: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductMutationInput = Partial<
  Omit<ProductCatalogItem, "id">
> & {
  id?: string;
  name?: string;
  slug?: string;
  price?: number;
};

export type ProductStorageMode = "supabase" | "fallback-static" | "demo-memory";

export const productStatuses = ["active", "draft"] as const;

export const productStockStatuses = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "preorder",
] as const;
