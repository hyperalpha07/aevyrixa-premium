import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact — Order Support & Her Care Questions",
  description:
    "Get in touch with Aevyrixa Her Care support for delivery, COD, size guidance, order tracking, and policy questions. WhatsApp and phone support available.",
};

export default async function ContactPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_48%,#030612_100%)]" />
      <SiteHeader settings={settings} />

      <section className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-200/72">
            Contact
          </p>
          <h1 className="mt-4 max-w-full break-words text-[2rem] font-semibold leading-tight [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl">
            Support for orders, sizing, and Her Care questions.
          </h1>
          <p className="mt-5 break-words text-base leading-8 text-white/66 [overflow-wrap:anywhere]">
            Contact {settings.brandShortName} support for delivery, COD
            questions, size guidance, order tracking, and policy support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {settings.whatsappUrl && (
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="aev-action-primary inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-7 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.40)] transition hover:scale-[1.01] sm:w-auto"
              >
                Chat with {settings.brandShortName} Support
              </a>
            )}
            <Link
              href="/faq"
              className="aev-action-secondary inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/50 hover:bg-[#2A183D] hover:text-white sm:w-auto"
            >
              Read FAQ
            </Link>
          </div>
        </div>

        <section className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-100/72">
            Support Details
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ContactDetail label="Store" value={settings.storeName} />
            <ContactDetail label="Location" value={settings.businessLocation} />
            <ContactDetail label="Support phone" value={settings.supportPhone} />
            <ContactDetail label="WhatsApp" value={settings.supportWhatsApp} />
            <ContactDetail label="Email" value={settings.supportEmail} />
            <ContactDetail label="Delivery" value={settings.deliveryCoverageText} />
          </div>
          <div className="mt-5 space-y-3 rounded-2xl border border-cyan-200/18 bg-cyan-200/[0.055] p-4 text-sm leading-7 text-white/72">
            <p>{settings.codMessage}</p>
            <p>{settings.privacyPackagingMessage}</p>
            <p>{settings.supportWindowMessage}</p>
            <p>{settings.hygieneReturnMessage}</p>
          </div>
          {settings.socialLinks.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {settings.socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="aev-action-secondary inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#FF4DB8]/30 bg-[#211633]/75 px-7 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/50 hover:bg-[#2A183D] hover:text-white sm:w-auto"
                >
                  Visit {link.label}
                </a>
              ))}
            </div>
          )}
        </section>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}

function ContactDetail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-white/82 [overflow-wrap:anywhere]">
        {value || "Not provided"}
      </p>
    </div>
  );
}
