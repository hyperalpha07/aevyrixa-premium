import { notFound } from "next/navigation";
import { getProductBySlug } from "@/app/lib/product-store";
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
  const [{ product }, { settings }] = await Promise.all([
    getProductBySlug(slug),
    loadStorefrontSettings(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} settings={settings} />;
}
