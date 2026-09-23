export type ReviewProductOption = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type CatalogProduct = ReviewProductOption & { deletedAt?: string | null };

export function reviewProductOptions(products: CatalogProduct[]): ReviewProductOption[] {
  return products.filter((product) => !product.deletedAt).map(({ id, name, slug, status }) => ({ id, name, slug, status }));
}

export function selectedReviewProduct(products: CatalogProduct[], id: unknown) {
  if (typeof id !== "string" || !id.trim()) return null;
  const product = products.find((item) => item.id === id.trim());
  if (!product || product.deletedAt || product.status !== "active" || !product.slug) return null;
  return { productId: product.id, productSlug: product.slug };
}
