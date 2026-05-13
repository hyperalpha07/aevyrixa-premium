import Link from "next/link";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";

export default function ContactPage() {
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
            Support and contact details will be updated soon. Until backend
            messaging is connected, this page provides the inquiry layout for
            the next phase.
          </p>
          <Link
            href="/faq"
            className="mt-8 inline-flex w-full min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white transition hover:border-cyan-200/40 sm:w-auto"
          >
            Read FAQ
          </Link>
        </div>

        <form className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-100/72">
            Inquiry Card
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ContactField label="Full Name" />
            <ContactField label="Phone or Email" />
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-white/75">Inquiry Type</span>
            <select className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none">
              <option>Order support</option>
              <option>Size guidance</option>
              <option>Product care</option>
              <option>General question</option>
            </select>
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-white/75">Message</span>
            <textarea
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none"
            />
          </label>
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3.5 text-sm font-semibold text-black"
          >
            Inquiry Form Preview
          </button>
          <p className="mt-4 text-xs leading-6 text-white/45">
            No backend submission is connected yet.
          </p>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}

function ContactField({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/75">{label}</span>
      <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none" />
    </label>
  );
}
