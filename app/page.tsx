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
import SiteFooter from "@/app/components/site-footer";
import AevyrixaMotionPanel from "@/app/components/aevyrixa-motion-panel";
import HomeMotionController from "@/app/components/home-motion-controller";

const trustItems = [
  "Discreet Privacy Packaging",
  "3-Day Hygiene-Safe Support",
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
    question: "How much protection should I expect?",
    answer:
      "Aevyrixa Her Care is designed to help manage light to moderate flow with layered protection, without overpromising protection levels.",
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
    question: "What support is available?",
    answer:
      "Aevyrixa Her Care offers 3-Day Hygiene-Safe Support. Approval depends on product condition, packaging, proof, and support review.",
  },
];

export default function Home() {
  return (
    <main className="aev-home relative min-h-screen overflow-x-hidden bg-[#030612] text-white">
      <HomeMotionController />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,#030612_0%,#07101f_46%,#050612_100%)]" />

      <SiteHeader active="home" />

      <section className="aev-hero-stage relative isolate overflow-hidden px-4 pb-18 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28">
        <div className="aev-hero-cinema pointer-events-none absolute inset-0 -z-10" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden">
          <div className="aev-glow absolute left-1/2 top-16 h-72 w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-cyan-300/18 blur-3xl" />
          <div className="aev-float-slow absolute -left-16 top-32 h-72 w-72 rounded-full bg-violet-500/18 blur-3xl" />
          <div className="aev-float absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-rose-200/12 blur-3xl" />
          <div className="aev-hero-shimmer absolute left-0 top-0 h-full w-full" />
        </div>
        <div className="aev-hero-load-wash pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="min-w-0">
            <p className="aev-hero-kicker inline-flex max-w-full rounded-full border border-cyan-200/20 bg-white/[0.06] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/90 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:tracking-[0.36em]">
              Aevyrixa Her Care
            </p>
            <h1 className="aev-hero-headline mt-7 max-w-4xl text-[1.7rem] font-semibold leading-[1.05] tracking-tight text-white min-[430px]:text-[2.15rem] sm:text-6xl lg:text-7xl">
              <span className="block">Reusable Period</span>
              <span className="block">Care, Reimagined</span>
              <span className="block sm:inline">for Modern</span>
              <span className="block sm:inline"> Confidence</span>
            </h1>
            <p className="aev-hero-copy mt-6 max-w-2xl text-pretty text-base leading-8 text-white/72 sm:text-lg">
              <span className="block">Soft, discreet, reusable protection</span>
              <span className="block">designed for comfort, confidence,</span>
              <span className="block">and everyday movement.</span>
            </p>

            <div className="aev-hero-actions mt-8 flex flex-col gap-3 min-[768px]:flex-row sm:mt-10">
              <Link
                href="/product"
                className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.28)]"
              >
                Shop Her Care
              </Link>
              <a
                href="#how-it-works"
                className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/[0.09]"
              >
                Explore How It Works
              </a>
            </div>

            <div className="aev-hero-trust mt-9 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="aev-trust-badge rounded-full border border-white/10 bg-white/[0.055] px-4 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/76 backdrop-blur-xl"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="aev-hero-visual relative min-w-0 max-w-full">
            <div className="aev-product-glow absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-cyan-300/14 via-violet-500/12 to-rose-200/10 blur-2xl" />
            <div className="aev-product-edge absolute -inset-2 rounded-[2.4rem] border border-cyan-100/10" />
            <div className="aev-product-float relative">
              <AevyrixaMotionPanel
                mp4Src="/videos/aevyrixa-hero-motion.mp4"
                eyebrow="Reusable Layer System"
                title="Period care in motion"
                copy="Floating comfort layers, glass reflections, and soft cyan-violet light create a cinematic product intro without explicit visuals."
                variant="hero"
              />
              <div className="aev-hero-product-chip absolute bottom-5 left-5 right-5 rounded-[1.35rem] border border-white/12 bg-[#050816]/72 p-4 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
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
      </section>

      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
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
                className="aev-border-card aev-reveal aev-premium-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 sm:p-7"
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

      <section id="how-it-works" className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
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
                className="aev-reveal aev-premium-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-cyan-100/25 sm:p-7"
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

      <section className="aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
          <AevyrixaMotionPanel
            mp4Src="/videos/aevyrixa-care-system.mp4"
            eyebrow="Aevyrixa Care Motion"
            title="Layered reusable care, softly engineered."
            copy="Comfort knit, absorbent core, and a protective layer move as abstract fabric forms, supporting discreet daily confidence and privacy packaging."
            variant="care"
            className="aev-reveal"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Aevyrixa Care Motion
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Premium comfort, reusable care, and discreet protection in one calm system.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              A polished reusable period panty made for soft contact, discreet
              wear, gentle care after use, and privacy-minded delivery from
              order to arrival.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Soft fabric feel with flexible everyday support.",
                "Layered protection designed for light to moderate flow.",
                "Reusable routine with discreet Privacy Packaging.",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="aev-reveal flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-white/70"
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
              href="/product/everyday-comfort"
              className="aev-action-primary mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617] shadow-[0_0_42px_rgba(34,211,238,0.24)] transition duration-300 hover:-translate-y-0.5"
            >
              View Product
            </Link>
          </div>
        </div>
      </section>

      <section className="aev-experience-section aev-scroll-section px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          <div className="aev-reveal min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              Aevyrixa Experience
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              A cinematic care experience that stays calm, premium, and lightweight.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Moving glass, layered fabric forms, soft glow, and tactile tap
              feedback create a video-style moment while staying fast and
              mobile-safe.
            </p>
          </div>

          <AevyrixaMotionPanel
            mp4Src="/videos/aevyrixa-experience.mp4"
            eyebrow="Premium Experience"
            title="Video-style motion, coded fallback."
            copy="A cinematic glass frame with flowing care layers, soft reflections, and reveal motion keeps the brand alive even when video files are not installed."
            labels={["Comfort", "Discretion", "Privacy Pack"]}
            variant="experience"
            className="aev-reveal"
          />
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
                    className="aev-reveal aev-premium-card rounded-[1.35rem] border border-white/10 bg-[#050816]/58 p-5"
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
                className="aev-reveal aev-premium-card rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6"
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
                3-Day Hygiene-Safe Support.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                <Link
                  href="/product"
                  className="aev-action-primary inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-400 px-7 text-sm font-bold text-[#020617]"
                >
                  Shop Her Care
                </Link>
                <a
                  href="#faq"
                  className="aev-action-secondary inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-xl"
                >
                  Read FAQs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
