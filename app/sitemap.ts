import type { MetadataRoute } from "next";
import { listProducts } from "@/app/lib/product-store";

const SITE_URL = "https://www.aevyrixa.com";

export const dynamic = "force-dynamic";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "weekly", priority: 1.0 },
  { url: `${SITE_URL}/product`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/shipping-policy`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/refund-policy`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/terms`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/track-order`, changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const { products } = await listProducts();
    productRoutes = products
      .filter((p) => p.status === "active" && p.slug)
      .map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      }));
  } catch {
    // Supabase unavailable at sitemap generation time — static routes only
  }

  return [...staticRoutes, ...productRoutes];
}
