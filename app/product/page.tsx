import type { Metadata } from "next";
import SiteHeader from "@/app/components/cart/site-header";
import HomeMotionController from "@/app/components/home-motion-controller";
import SiteFooter from "@/app/components/site-footer";
import { publicProduct } from "@/app/lib/product-display";
import { listProducts } from "@/app/lib/product-store";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import ShopDiscoveryClient from "@/app/product/shop-discovery-client";
import { listReviewSummaries } from "@/app/lib/review-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Shop - Women's Comfort & Reusable Care Essentials",
  description:
    "Explore Aevyrixa Her Care's collection of reusable period care, comfort essentials, and hygiene products. 3-Day Hygiene-Safe Support, BDT pricing, discreet Bangladesh delivery.",
  openGraph: {
    title: "Shop Aevyrixa Her Care - Women's Comfort & Reusable Care",
    description:
      "Reusable period care, comfort essentials, and hygiene products with discreet Bangladesh delivery and hygiene-safe support.",
    url: "https://www.aevyrixa.com/product",
    type: "website",
  },
  twitter: {
    title: "Shop Aevyrixa Her Care - Women's Comfort & Reusable Care",
    description:
      "Reusable period care, comfort essentials, and hygiene products with discreet Bangladesh delivery and hygiene-safe support.",
  },
};

export default async function ProductCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ products }, { settings }, reviewSummaries, resolvedParams] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
    listReviewSummaries(),
    searchParams,
  ]);
  const requestedCategory =
    typeof resolvedParams.category === "string" ? resolvedParams.category : "";

  const displayProducts = products.map(publicProduct);
  const activeCategoryTitles = new Set(
    settings.activeCategories.map((category) => category.title)
  );
  const activeCategory = activeCategoryTitles.has(requestedCategory)
    ? requestedCategory
    : "";
  const primaryProductHref = displayProducts[0]
    ? `/product/${displayProducts[0].slug}`
    : "/product";

  return (
    <main className="aev-cinematic-page min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <HomeMotionController targetClass=".aev-cinematic-page" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[4%] h-[300px] w-[300px] rounded-full bg-[#FF4DB8]/[0.07] blur-[120px]" />
        <div className="absolute right-[-18%] top-[22%] h-[340px] w-[340px] rounded-full bg-[#A855F7]/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-14%] left-[30%] h-[280px] w-[280px] rounded-full bg-[#00D4C6]/[0.05] blur-[120px]" />
      </div>

      <SiteHeader
        active="shop"
        productHref={primaryProductHref}
        settings={settings}
      />

      <ShopDiscoveryClient
        products={displayProducts}
        activeCategories={settings.activeCategories}
        settings={settings}
        reviewSummaries={reviewSummaries}
        initialCategory={activeCategory}
      />

      <SiteFooter settings={settings} />
    </main>
  );
}
