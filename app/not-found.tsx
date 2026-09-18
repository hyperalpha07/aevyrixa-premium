import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";

export default function NotFound() {
  return (
    <main className="aev-not-found-page min-h-screen overflow-x-hidden text-white">
      <SiteHeader active="neutral" />

      <section className="aev-not-found-stage mx-auto flex w-full max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="aev-not-found-shell mx-auto grid w-full max-w-5xl items-center gap-5 overflow-hidden rounded-[1.75rem] px-5 py-7 sm:px-9 sm:py-10 md:grid-cols-[0.72fr_1.28fr] md:gap-10 lg:px-12 lg:py-12">
          <div className="aev-not-found-visual" aria-hidden="true">
            <div className="aev-not-found-mark">404</div>
          </div>

          <div className="aev-not-found-copy min-w-0 text-center md:text-left">
            <div className="aev-not-found-icon mx-auto flex h-12 w-12 items-center justify-center rounded-2xl md:mx-0">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/78">
              Page not found
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              This path doesn&apos;t lead to a Noromi Care page.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base md:mx-0 md:leading-8">
              The page may have moved or the address may be incomplete. Return home or continue browsing our care collection.
            </p>

            <div className="aev-not-found-actions mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/"
                className="aev-action-primary aev-not-found-cta inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-7 text-sm font-bold text-white"
              >
                <span>Return Home</span>
              </Link>
              <Link
                href="/product"
                className="aev-button-secondary aev-not-found-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold"
              >
                <span>Shop Products</span>
                <ArrowRight className="aev-not-found-cta-arrow h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
