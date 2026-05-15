import Link from "next/link";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { whatsappHref } from "@/app/lib/admin-settings";
import { getStoreSettings } from "@/app/lib/settings-store";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const { settings } = await getStoreSettings();
  const whatsappUrl = whatsappHref(settings.supportWhatsApp);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_48%,#030612_100%)]" />
      <SiteHeader />

      <section className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-200/72">
            Contact
          </p>
          <h1 className="mt-4 max-w-full break-words text-[2rem] font-semibold leading-tight [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl">
            Support for orders, sizing, and Her Care questions.
          </h1>
          <p className="mt-5 break-words text-base leading-8 text-white/66 [overflow-wrap:anywhere]">
            Contact Aevyrixa support for Bangladesh delivery, COD questions,
            size guidance, order tracking, and 3-Day Hygiene-Safe Support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-7 text-sm font-semibold text-black transition hover:scale-[1.01] sm:w-auto"
              >
                Chat with Aevyrixa Support
              </a>
            )}
            <Link
              href="/faq"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white transition hover:border-cyan-200/40 sm:w-auto"
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
          {settings.facebookPageUrl && (
            <a
              href={settings.facebookPageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white transition hover:border-cyan-200/40 sm:w-auto"
            >
              Visit Facebook Page
            </a>
          )}
        </section>
      </section>

      <SiteFooter />
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
