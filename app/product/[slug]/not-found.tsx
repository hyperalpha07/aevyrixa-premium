import Link from "next/link";
import { ArrowRight, PackageX } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";

export default function ProductNotFound() {
  return (
    <main className="aev-product-unavailable-page min-h-screen overflow-x-hidden text-white">
      <SiteHeader active="product" productHref="/product" />

      <section className="aev-product-unavailable-stage mx-auto flex w-full max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="aev-product-unavailable-shell mx-auto grid w-full max-w-5xl items-center gap-7 overflow-hidden rounded-[1.75rem] px-5 py-7 sm:px-9 sm:py-10 md:grid-cols-[0.78fr_1.22fr] md:gap-10 lg:px-12 lg:py-12">
          <div className="aev-product-unavailable-visual" aria-hidden="true">
            <div className="aev-product-unavailable-preview">
              <div className="aev-product-unavailable-media">
                <span className="aev-product-unavailable-badge">
                  <PackageX className="h-3.5 w-3.5" />
                  Unavailable
                </span>
                <span className="aev-product-unavailable-status-mark">
                  <PackageX className="h-6 w-6" />
                </span>
              </div>
              <div className="aev-product-unavailable-preview-body">
                <span>Unavailable product preview</span>
                <strong>Product unavailable</strong>
                <div className="aev-product-unavailable-preview-lines">
                  <i />
                  <i />
                </div>
                <small>No longer listed</small>
              </div>
            </div>
          </div>

          <div className="aev-product-unavailable-copy min-w-0 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
              Product unavailable
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              This care essential isn&apos;t available right now.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base md:mx-0 md:leading-8">
              It may have moved, been unpublished, or be temporarily unavailable. Explore the current Noromi Care collection or return home.
            </p>

            <div className="aev-product-unavailable-actions mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/product"
                className="aev-action-primary aev-product-unavailable-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-7 text-sm font-bold text-white"
              >
                <span>Browse Products</span>
                <ArrowRight className="aev-product-unavailable-arrow h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/"
                className="aev-button-secondary aev-product-unavailable-cta inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-semibold"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
