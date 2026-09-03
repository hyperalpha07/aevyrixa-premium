import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/app/lib/product-store";
import ProductDetailClient from "@/app/product/[slug]/product-detail-client";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import { listApprovedReviewsForProduct } from "@/app/lib/review-store";
import { publicProduct } from "@/app/lib/product-display";
import { brandName, noromiAssets } from "@/configs/brand/noromi";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const SITE_URL = "https://www.aevyrixa.com";
const OG_FALLBACK_IMAGE = `${SITE_URL}${noromiAssets.coverBannerWide}`;

function withBrandSuffix(value: string) {
  const title = value.trim();
  return title.toLocaleLowerCase().endsWith(brandName.toLocaleLowerCase())
    ? title
    : `${title} | ${brandName}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!product) {
    return { title: { absolute: `Product Not Found | ${brandName}` } };
  }

  const displayProduct = publicProduct(product);

  const title = withBrandSuffix(displayProduct.seoTitle || displayProduct.name);
  const description =
    displayProduct.seoDescription || displayProduct.shortDescription || `Shop ${displayProduct.name} from ${brandName}.`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const ogImage =
    product.primaryImageUrl || product.imageUrl || OG_FALLBACK_IMAGE;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: displayProduct.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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

  const displayProduct = publicProduct(product);

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.status === "active" && !p.deletedAt)
    .map((candidate) => {
      const sameCategory = candidate.category === product.category ? 4 : 0;
      const sameAbsorbency = candidate.absorbency === product.absorbency ? 2 : 0;
      const merchandisingSignal =
        Number(Boolean(candidate.isBestSeller)) +
        Number(Boolean(candidate.isTrending)) +
        Number(Boolean(candidate.featured || candidate.showInFeaturedCollection));
      return { candidate, score: sameCategory + sameAbsorbency + merchandisingSignal };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => candidate)
    .slice(0, 3);
  const reviews = await listApprovedReviewsForProduct(product.slug);

  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const productImage = product.primaryImageUrl || product.imageUrl;
  const availability =
    product.stockStatus === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayProduct.name,
    description: displayProduct.shortDescription,
    ...(productImage ? { image: productImage } : {}),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability,
      seller: {
        "@type": "Organization",
        name: brandName,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <ProductDetailClient
        product={product}
        settings={settings}
        relatedProducts={relatedProducts}
        reviews={reviews}
      />
    </>
  );
}
