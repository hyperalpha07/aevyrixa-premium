import Link from "next/link";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import {
  defaultStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

export type InfoSection = {
  title: string;
  copy?: string;
  items?: string[];
};

export default function InfoPageShell({
  eyebrow,
  title,
  intro,
  sections,
  ctaLabel = "Shop Her Care",
  ctaHref = "/product",
  settings = defaultStorefrontSettings,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoSection[];
  ctaLabel?: string;
  ctaHref?: string;
  settings?: StorefrontSettings;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_48%,#030612_100%)]" />

      <SiteHeader settings={settings} />

      <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-16">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/72 sm:tracking-[0.42em]">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-full break-words text-[2rem] font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/66 [overflow-wrap:anywhere] md:text-lg">
            {intro}
          </p>
          <Link
            href={ctaHref}
            className="aev-action-primary mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-7 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.40)] transition hover:-translate-y-0.5 sm:w-auto"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="mt-10 grid min-w-0 gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6"
            >
              <h2 className="break-words text-xl font-semibold text-white [overflow-wrap:anywhere]">
                {section.title}
              </h2>
              {section.copy && (
                <p className="mt-3 max-w-full break-words text-sm leading-7 text-white/64 [overflow-wrap:anywhere]">
                  {section.copy}
                </p>
              )}
              {section.items && (
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/64">
                  {section.items.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200" />
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
