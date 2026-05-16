import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/app/lib/product-store";
import ProductDetailClient from "@/app/product/[slug]/product-detail-client";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ product }, { settings }, { products }] = await Promise.all([
    getProductBySlug(slug),
    loadStorefrontSettings(),
    listProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <ProductDetailClient
      product={product}
      settings={settings}
      relatedProducts={relatedProducts}
    />
  );
}
