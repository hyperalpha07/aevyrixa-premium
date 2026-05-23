import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/app/lib/product-store";
import ProductDetailClient from "@/app/product/[slug]/product-detail-client";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import { listApprovedReviewsForProduct } from "@/app/lib/review-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const SITE_URL = "https://www.aevyrixa.com";
const OG_FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title =
    product.seoTitle
      ? `${product.seoTitle} | Aevyrixa Her Care`
      : `${product.name} | Aevyrixa Her Care`;
  const description =
    product.seoDescription || product.shortDescription || `Shop ${product.name} from Aevyrixa Her Care.`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const ogImage =
    product.primaryImageUrl || product.imageUrl || OG_FALLBACK_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
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
    name: product.name,
    description: product.shortDescription,
    ...(productImage ? { image: productImage } : {}),
    brand: {
      "@type": "Brand",
      name: "Aevyrixa Her Care",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability,
      seller: {
        "@type": "Organization",
        name: "Aevyrixa Her Care",
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
