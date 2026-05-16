import Link from "next/link";
import { ArrowRight, Droplets, Sparkles, Truck } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import ProductVisual from "@/app/components/product-visual";
import { listProducts } from "@/app/lib/product-store";
import { publicProduct, stockStatusLabel } from "@/app/lib/product-display";
import { formatProductPrice, type ProductVisualTheme } from "@/app/lib/products";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import SiteFooter from "@/app/components/site-footer";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const themeStyles: Record<
  ProductVisualTheme,
  {
    border: string;
    badge: string;
    button: string;
  }
> = {
  "blush-violet": {
    border: "border-fuchsia-300/20 hover:border-fuchsia-200/45",
    badge: "border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100",
    button:
      "border-fuchsia-200/25 bg-fuchsia-200/10 hover:border-fuchsia-100/45 hover:bg-fuchsia-200/15",
  },
  "cyan-night": {
    border: "border-cyan-300/20 hover:border-cyan-200/45",
    badge: "border-cyan-200/25 bg-cyan-300/10 text-cyan-100",
    button:
      "border-cyan-200/25 bg-cyan-200/10 hover:border-cyan-100/45 hover:bg-cyan-200/15",
  },
  "rose-gold": {
    border: "border-rose-200/25 hover:border-rose-100/50",
    badge: "border-rose-100/30 bg-rose-200/10 text-rose-100",
    button:
      "border-rose-100/30 bg-rose-200/10 hover:border-rose-100/55 hover:bg-rose-200/15",
  },
};

export default async function ProductCollectionPage() {
  const [{ products }, { settings }] = await Promise.all([
    listProducts(),
    loadStorefrontSettings(),
  ]);
  const displayProducts = products.map(publicProduct);
  const primaryProductHref = displayProducts[0]
    ? `/product/${displayProducts[0].slug}`
    : "/product";

  return (
    <main className="aev-cinematic-page min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[4%] h-[300px] w-[300px] rounded-full bg-cyan-400/14 blur-[120px]" />
        <div className="absolute right-[-18%] top-[22%] h-[340px] w-[340px] rounded-full bg-fuchsia-400/14 blur-[130px]" />
        <div className="absolute bottom-[-14%] left-[30%] h-[280px] w-[280px] rounded-full bg-rose-200/10 blur-[120px]" />
      </div>

      <SiteHeader
        active="shop"
        productHref={primaryProductHref}
        settings={settings}
      />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 md:pb-12 md:pt-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70 sm:text-sm sm:tracking-[0.42em]">
            {settings.brandDisplayName}
          </p>
          <h1 className="mt-4 break-words text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl md:text-6xl">
            Premium women's comfort &amp; reusable care
          </h1>
          <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/65 [overflow-wrap:anywhere] md:text-lg">
            {settings.brandTagline}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            [settings.privacyPackagingMessage, Truck],
            [settings.supportWindowMessage, Sparkles],
            ["Reusable Protection", Droplets],
          ].map(([label, Icon]) => (
            <div
              key={label as string}
              className="aev-cinematic-chip flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 backdrop-blur-xl"
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
              <span>{label as string}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayProducts.map((product) => {
            const style = themeStyles[product.visualTheme] ?? themeStyles["blush-violet"];

            return (
              <article
                key={product.id}
                className={`aev-shop-card group min-w-0 overflow-hidden rounded-[1.75rem] border bg-white/[0.045] p-3 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 ${style.border}`}
              >
                <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#07111f]">
                  <div className="relative aspect-[1.08] w-full">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                      />
                    ) : (
                      <ProductVisual
                        visualTheme={product.visualTheme}
                        label={product.absorbency}
                      />
                    )}
                  </div>
                </div>

                <div className="px-2 pb-3 pt-5">
                  <div className="flex min-w-0 flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
                      {product.absorbency}
                    </span>
                    <span className="max-w-full break-words text-xs uppercase tracking-[0.16em] text-white/42 [overflow-wrap:anywhere] min-[420px]:tracking-[0.22em]">
                      {product.category}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/58">
                      {stockStatusLabel(product.stockStatus)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/58">
                      {product.visualTheme.replace("-", " ")}
                    </span>
                  </div>

                  <h2 className="mt-4 break-words text-xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-2xl">
                    {product.name}
                  </h2>
                  <p className="mt-3 break-words text-sm leading-7 text-white/62 [overflow-wrap:anywhere]">
                    {product.shortDescription}
                  </p>

                  <div className="mt-5 flex items-end gap-3">
                    <span className="text-3xl font-semibold">
                      {formatProductPrice(product)}
                    </span>
                    {typeof product.compareAtPrice === "number" && (
                      <span className="pb-1 text-sm text-white/35 line-through">
                        {formatProductPrice({
                          price: product.compareAtPrice,
                          currency: product.currency,
                        })}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/product/${product.slug}`}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-white transition ${style.button}`}
                  >
                    View Product
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
