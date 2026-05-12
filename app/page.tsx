import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Droplets,
  Leaf,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";

const trustItems = [
  "Discreet Delivery",
  "7-Day Money Back Guarantee",
  "Comfort Fit",
  "Reusable Protection",
];

const confidenceCards = [
  {
    title: "Leak Anxiety",
    copy: "Layered protection helps reduce daily worry during light to moderate flow, without overpromising.",
    accent: "from-cyan-200/80 to-sky-400/20",
    icon: ShieldCheck,
  },
  {
    title: "Comfort",
    copy: "Soft stretch, smooth edges, and a flexible fit are designed to move with your body.",
    accent: "from-fuchsia-200/75 to-violet-500/20",
    icon: Waves,
  },
  {
    title: "Discreet Everyday Wear",
    copy: "A refined silhouette supports confidence under everyday outfits and routines.",
    accent: "from-rose-200/80 to-amber-200/20",
    icon: Sparkles,
  },
];

const howItWorks = [
  {
    title: "Choose Your Fit",
    copy: "Select the size and coverage that matches your usual underwear feel and cycle needs.",
  },
  {
    title: "Wear With Confidence",
    copy: "Use as part of your period routine for comfortable, discreet daily protection.",
  },
  {
    title: "Rinse & Reuse",
    copy: "Rinse after wear, wash gently, air dry, and keep your piece ready for next time.",
  },
];

const careCards = [
  {
    title: "Size Guide",
    copy: "Choose your normal underwear size. If you are between sizes, consider the fit style you prefer: closer support or a softer relaxed feel.",
    icon: Ruler,
  },
  {
    title: "Care Tips",
    copy: "Rinse with cool water after wear, wash with mild detergent, and air dry. Avoid bleach, fabric softener, and high heat.",
    icon: Droplets,
  },
  {
    title: "Made to Last",
    copy: "Reusable construction and thoughtful care help each piece stay comfortable over repeated cycles.",
    icon: RotateCcw,
  },
];

const faqs = [
  {
    question: "Is it completely leak proof?",
    answer:
      "No reusable period underwear should be described as 100% leak proof. Aevyrixa Her Care is designed to help manage light to moderate flow with layered protection.",
  },
  {
    question: "Can I wear it by itself?",
    answer:
      "Many customers use period underwear on its own for lighter days. For heavier flow, pair it with your preferred backup protection.",
  },
  {
    question: "How do I wash it?",
    answer:
      "Rinse with cool water, machine wash or hand wash with mild detergent, then air dry before storing.",
  },
  {
    question: "What is the guarantee?",
    answer:
      "Aevyrixa Her Care includes a 7-day money back guarantee so you can shop with more confidence.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030612] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,#030612_0%,#07101f_46%,#050612_100%)]" />

      <SiteHeader active="home" />

      <section className="relative isolate overflow-hidden px-4 pb-18 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28">
        <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden">
          <div className="aev-glow absolute left-1/2 top-16 h-72 w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-cyan-300/18 blur-3xl" />
          <div className="aev-float-slow absolute -left-16 top-32 h-72 w-72 rounded-full bg-violet-500/18 blur-3xl" />
          <div className="aev-float absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-rose-200/12 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="min-w-0">
            <p className="inline-flex max-w-full rounded-full border border-cyan-200/20 bg-white/[0.06] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/90 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:tracking-[0.36em]">
              Aevyrixa Her Care
            </p>
            <h1 className="mt-7 max-w-4xl text-balance text-[2.45rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Reusable Period Care, Reimagined for Modern Confidence
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/72 sm:text-lg">
              Soft, discreet, reusable protection designed for comfort,
              confidence, and everyday movement.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row sm:mt-10">
              <Link
                href="/product"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.28)]"
              >
                Shop Her Care
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/[0.09]"
              >
                Explore How It Works
              </a>
            </div>

            <div className="mt-9 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/76 backdrop-blur-xl"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-cyan-300/14 via-violet-500/12 to-rose-200/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.065] p-3 shadow-2xl backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-5">
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12),transparent_28%,rgba(255,255,255,0.04)_56%,transparent_72%)]" />
              <div className="relative min-h-[30rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#061020] p-5 sm:min-h-[36rem] sm:rounded-[2rem] sm:p-7">
                <div className="aev-wave absolute left-[8%] top-[13%] h-44 w-[84%] rounded-[54%_46%_64%_36%/44%_42%_58%_56%] border border-cyan-100/18 bg-gradient-to-r from-cyan-100/18 via-white/8 to-violet-300/14" />
                <div className="aev-wave-delayed absolute bottom-[19%] left-[7%] h-36 w-[86%] rounded-[40%_60%_44%_56%/62%_48%_52%_38%] border border-rose-100/14 bg-gradient-to-r from-violet-300/14 via-rose-100/12 to-cyan-200/10" />

                <div className="relative ml-auto w-fit rounded-full border border-white/12 bg-black/25 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
                  reusable layer system
                </div>

                <div className="absolute inset-x-8 bottom-24 h-44 rounded-[48%_52%_34%_36%/58%_58%_32%_30%] border border-white/18 bg-gradient-to-br from-white/26 via-cyan-100/14 to-violet-300/20 shadow-[inset_0_1px_30px_rgba(255,255,255,0.26),0_34px_90px_rgba(0,0,0,0.32)] backdrop-blur-md sm:inset-x-16 sm:bottom-28 sm:h-56" />
                <div className="absolute bottom-[9.2rem] left-[28%] right-[28%] h-12 rounded-b-full border-b border-white/35 bg-white/18 sm:bottom-[11.8rem]" />
                <div className="absolute bottom-[8.3rem] left-[30%] right-[30%] h-7 rounded-full bg-cyan-300/16 blur-lg sm:bottom-[10.8rem]" />

                <div className="absolute bottom-5 left-5 right-5 rounded-[1.35rem] border border-white/12 bg-[#050816]/72 p-4 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-rose-100/70">
                        Aevyrixa Her Care
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                        Period Panty
                      </h2>
                    </div>
                    <div className="rounded-full border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">
                      <Leaf size={20} strokeWidth={1.7} />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[0.68rem] text-white/68">
                    <span className="rounded-full bg-white/[0.07] px-2 py-2">Soft</span>
                    <span className="rounded-full bg-white/[0.07] px-2 py-2">Layered</span>
                    <span className="rounded-full bg-white/[0.07] px-2 py-2">Discreet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Confidence System
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Three quiet upgrades for the moments that usually feel uncertain.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {confidenceCards.map(({ title, copy, accent, icon: Icon }) => (
              <article
                key={title}
                className="aev-border-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 sm:p-7"
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
                <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07] text-cyan-100 transition duration-300 group-hover:scale-105">
                  <Icon size={22} strokeWidth={1.7} />
                </div>
                <h3 className="text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/65">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                How It Works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                A simple reusable rhythm.
              </h2>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white/65 lg:justify-self-end">
              Aevyrixa Her Care is designed to feel intuitive from first wear to
              wash day: choose thoughtfully, wear comfortably, and care for it
              gently.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {howItWorks.map((step, index) => (
              <article
                key={step.title}
                className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-cyan-100/25 sm:p-7"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-200/10 blur-2xl transition duration-300 group-hover:bg-violet-300/14" />
                <div className="relative mb-12 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-lg font-semibold text-white">
                  0{index + 1}
                </div>
                <h3 className="relative text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-4 text-sm leading-7 text-white/64">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-2xl sm:min-h-[34rem] sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(244,196,212,0.16),transparent_30%),radial-gradient(circle_at_20%_76%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%)]" />
            <div className="absolute left-1/2 top-20 h-56 w-[72%] -translate-x-1/2 rounded-[50%_50%_38%_38%/38%_38%_58%_58%] border border-white/20 bg-gradient-to-br from-white/24 via-cyan-100/14 to-fuchsia-300/18 shadow-[inset_0_2px_28px_rgba(255,255,255,0.28),0_34px_90px_rgba(0,0,0,0.28)] backdrop-blur-md sm:h-72" />
            <div className="absolute left-[24%] right-[24%] top-[8.3rem] h-14 rounded-b-full border-b border-white/35 bg-white/18 sm:top-[10.6rem]" />
            <div className="absolute bottom-24 left-10 right-10 h-14 rounded-full bg-[#020617]/35 blur-2xl sm:bottom-28" />

            <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
              {["Comfort knit", "Absorbent core", "Protective layer"].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Featured Product
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Aevyrixa Her Care Period Panty
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              A polished reusable period panty made for soft contact, discreet
              wear, and calm movement through everyday plans.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Soft fabric feel with flexible everyday support.",
                "Layered protection designed for light to moderate flow.",
                "Reusable care routine that helps reduce single-use waste.",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-white/70"
                >
                  <ShieldCheck
                    className="mt-1 shrink-0 text-cyan-200"
                    size={18}
                    strokeWidth={1.8}
                  />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Link
              href="/product/her-care-period-panty"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.24)] transition duration-300 hover:-translate-y-0.5"
            >
              View Product
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] p-5 backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                  Size & Care
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  Clear care for a better fit and longer wear.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {careCards.map(({ title, copy, icon: Icon }) => (
                  <article
                    key={title}
                    className="rounded-[1.35rem] border border-white/10 bg-[#050816]/58 p-5"
                  >
                    <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.07] text-cyan-100">
                      <Icon size={20} strokeWidth={1.7} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              FAQ Preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Honest answers before checkout.
            </h2>
          </div>

          <div className="mt-10 grid gap-3">
            {faqs.map((faq, index) => (
              <article
                key={faq.question}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {faq.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {faq.answer}
                    </p>
                  </div>
                  <ChevronDown
                    className="mt-1 hidden shrink-0 text-white/38 sm:block"
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="relative px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_82%_68%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,rgba(244,196,212,0.1),transparent_38%)]" />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-100/72">
                Ready for reusable confidence?
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Make period care feel softer, calmer, and more considered.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66">
                Discover premium reusable protection with discreet delivery and
                a 7-day money back guarantee.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                <Link
                  href="/product"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617]"
                >
                  Shop Her Care
                </Link>
                <a
                  href="#faq"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl"
                >
                  Read FAQs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#02040d] px-4 pb-24 pt-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1">
                <Image
                  src="/logo.jpg"
                  alt="Aevyrixa Logo"
                  width={42}
                  height={42}
                  sizes="42px"
                  className="h-10 w-10 rounded-lg object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-[0.22em] text-white">
                  Aevyrixa
                </p>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-cyan-200/68">
                  Her Care
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/56">
              Premium reusable period care designed around comfort, discretion,
              and a more confident everyday routine.
            </p>
          </div>

          {[
            ["Shop", "Her Care Collection", "Period Panty", "Size Guide"],
            ["Support", "FAQ", "Care Tips", "7-Day Guarantee"],
            ["Brand", "Aevyrixa", "Discreet Delivery", "Reusable Care"],
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white">{title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/55">
                {links.map((label) => (
                  <li key={label}>
                    <Link href="/product" className="transition hover:text-cyan-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/42 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 Aevyrixa. All rights reserved.</p>
          <p>Reusable care guidance is informational and not medical advice.</p>
        </div>
      </footer>
    </main>
  );
}
