import Link from "next/link";
import { PackageX, ShieldCheck } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";

export default function ProductNotFound() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[5%] h-[310px] w-[310px] rounded-full bg-cyan-400/14 blur-[120px]" />
        <div className="absolute right-[-18%] top-[20%] h-[360px] w-[360px] rounded-full bg-fuchsia-400/14 blur-[140px]" />
      </div>

      <SiteHeader active="shop" />

      <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-4 py-16 text-center sm:px-6">
        <div className="w-full rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_0_48px_rgba(34,211,238,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10">
            <PackageX className="h-7 w-7 text-cyan-100" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-100/70">
            Product Unavailable
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-4xl">
            This Noromi Care product is not available in the storefront.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/64 sm:text-base">
            It may be in draft, temporarily paused, or no longer listed. You can
            continue browsing active reusable care essentials.
          </p>
          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm leading-6 text-white/68">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-200" />
            <span>Discreet Privacy Packaging and 3-Day Hygiene-Safe Support remain available for eligible orders.</span>
          </div>
          <Link
            href="/product"
            className="aev-action-primary mt-7 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.40)] transition hover:scale-[1.01] sm:w-auto"
          >
            View Active Products
          </Link>
        </div>
      </section>
    </main>
  );
}
