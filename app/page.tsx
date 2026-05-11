"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteHeader from "@/app/components/cart/site-header";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const trustRef = useRef<HTMLElement>(null);
  const problemRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();

    tl.from(heroRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    [trustRef, problemRef, stepsRef, previewRef, guideRef, faqRef, finalRef].forEach((ref) => {
      if (ref.current) {
        gsap.from(ref.current, {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
          },
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
        });
      }
    });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[10%] top-8 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-[10%] top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <SiteHeader active="home" />

      <section ref={heroRef} className="mx-auto max-w-7xl px-6 pb-20 pt-20 lg:pt-24">
        <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <div>
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-200/80">
              Her Care Collection
            </span>

            <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Reusable Period Care, Reimagined for Modern Confidence
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Aevyrixa Her Care brings soft, leak-resistant, reusable period protection with a premium comfort-first design.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/product"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:scale-[1.02]"
              >
                Shop Her Care
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                How It Works
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Discreet Delivery</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">7-Day Money Back Guarantee</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Comfort Fit</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Reusable Protection</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute right-0 bottom-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09101d]/90 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/10 to-transparent" />
              <div className="rounded-[1.75rem] border border-white/10 bg-[#0f172a]/90 p-6">
                <div className="mb-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm uppercase tracking-[0.3em] text-cyan-200/80">
                  <span>Period Panty Preview</span>
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-violet-200">
                    New
                  </span>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#0c1321] p-6">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-300/15 text-2xl text-cyan-300">
                    ♢
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Aevyrixa Her Care Period Panty</h2>
                  <p className="mt-4 text-sm leading-7 text-white/65">
                    Soft, discreet coverage with a premium fit and comfortable reusable protection.
                  </p>

                  <div className="mt-8 space-y-3 text-sm text-white/60">
                    <p>Soft stretch fabric for all-day wear.</p>
                    <p>Layered protection designed to reduce worry during light to moderate flow.</p>
                    <p>Effortless care with simple rinse and reuse.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={trustRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">The challenge</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Period care should feel secure, stylish, and easy to live with.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/70">
              Too many products leave behind discomfort, uncertainty, or waste. Aevyrixa Her Care offers a premium alternative built for everyday confidence.
            </p>

            <div className="mt-10 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="text-lg font-semibold text-white">Leaks that cause stress</p>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Modern reusable protection designed to help reduce worry while staying comfortable and discreet.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="text-lg font-semibold text-white">Stains and changing uncertainty</p>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Thoughtful coverage and premium fit work together to support a more reliable daily routine.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="text-lg font-semibold text-white">Discomfort from ordinary layers</p>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Soft fabrics and refined construction are made to move with your body instead of against it.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">The solution</p>
            <h3 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Confidence from premium reusable design
            </h3>
            <p className="mt-6 text-base leading-8 text-white/70">
              Aevyrixa Her Care combines soft stretch, layered protection, and a flattering silhouette so you can feel calm, comfortable, and ready for the day.
            </p>

            <ul className="mt-10 space-y-4 text-white/70">
              <li className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="font-semibold">Discreet, modern styling</p>
                <p className="mt-2 text-sm leading-7 text-white/60">Designed to look as good as it feels, with a premium finish.</p>
              </li>
              <li className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="font-semibold">Leak-resistant protection</p>
                <p className="mt-2 text-sm leading-7 text-white/60">Layered materials help manage light to moderate flow while staying reusable.</p>
              </li>
              <li className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="font-semibold">Comfort-first construction</p>
                <p className="mt-2 text-sm leading-7 text-white/60">Smooth seams, soft edges, and adaptable fabric for everyday wear.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section ref={stepsRef} id="how-it-works" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">How It Works</p>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">
            Simple steps to premium reusable period care
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/65">
            Our process is built for women who want easier care with a refined, confident experience.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-300/15 text-xl text-cyan-300">
              1
            </div>
            <h3 className="text-xl font-semibold text-white">Choose your fit</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Find the right cut and coverage for your needs, with guidance for comfort and support.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-violet-500/15 text-xl text-violet-300">
              2
            </div>
            <h3 className="text-xl font-semibold text-white">Wear with confidence</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Comfortable coverage for your routine, with design details focused on discreet everyday wear.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-300/15 text-xl text-amber-200">
              3
            </div>
            <h3 className="text-xl font-semibold text-white">Rinse and reuse</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Easy care instructions keep your pieces feeling fresh and ready for another cycle.
            </p>
          </div>
        </div>
      </section>

      <section ref={previewRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">Featured Product Preview</p>
            <h2 className="text-3xl font-semibold text-white md:text-5xl">
              The period panty built for comfort, discretion, and premium care
            </h2>
            <p className="max-w-xl text-base leading-8 text-white/70">
              Designed with soft fabrics, thoughtful layering, and a flattering shape for everyday confidence.
            </p>

            <ul className="space-y-4 text-white/70">
              <li className="flex gap-3 text-sm leading-7">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-300">✓</span>
                Soft, breathable fabrics with gentle stretch.
              </li>
              <li className="flex gap-3 text-sm leading-7">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">✓</span>
                Layered protection designed to reduce worry during light to moderate flow.
              </li>
              <li className="flex gap-3 text-sm leading-7">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">✓</span>
                Discreet silhouette that feels premium under every outfit.
              </li>
            </ul>

            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02]"
            >
              Explore Her Care
            </Link>
          </div>

          <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute right-8 bottom-10 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative rounded-[1.75rem] border border-white/10 bg-[#0a1223] p-8">
              <div className="mb-6 rounded-[1.5rem] bg-gradient-to-br from-cyan-300/10 via-violet-500/10 to-transparent p-6">
                <div className="h-60 rounded-[1.5rem] border border-white/10 bg-[#07101f]" />
              </div>
              <div className="space-y-4 text-white/70">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">Aevyrixa Her Care</p>
                <h3 className="text-2xl font-semibold text-white">Premium Reusable Period Panty</h3>
                <p className="text-sm leading-7">
                  Soft edges, discreet coverage, and layered comfort designed for modern confidence.
                </p>
                <div className="grid gap-3 text-sm">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold text-white">Premium Fit</p>
                    <p className="text-white/60">Tailored to move with your body, not against it.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold text-white">Reusable Care</p>
                    <p className="text-white/60">Simple upkeep for longer wear and reduced waste.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={guideRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">Size & Care</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Find the right fit and keep it fresh.</h2>
            <p className="mt-4 text-base leading-8 text-white/65">
              Practical guidance for sizing, care, and premium maintenance so your Aevyrixa pieces stay comfortable longer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
              <p className="font-semibold text-white">Size Guide</p>
              <p className="mt-2 text-sm leading-7 text-white/60">Choose a fit that balances coverage, support, and comfort for your cycle.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
              <p className="font-semibold text-white">Care Tips</p>
              <p className="mt-2 text-sm leading-7 text-white/60">Rinse gently after wear, wash with mild soap, and air dry for best results.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
              <p className="font-semibold text-white">Made to Last</p>
              <p className="mt-2 text-sm leading-7 text-white/60">Premium materials and clean construction support reusable performance over time.</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={faqRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">FAQ Preview</p>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Questions customers often ask</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/65">
            Honest answers help shoppers feel comfortable choosing a premium reusable solution.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">How do I choose my size?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Select the size that matches your usual underwear fit and coverage preference for the best comfort.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Is care difficult?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Not at all. Gentle rinse, mild soap, and air drying are all that’s needed to keep your pieces fresh.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Can I use them every day?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Yes, our design is built for repeated wear with thoughtful coverage and reusable comfort.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Do you offer returns?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              We offer a 7-day satisfaction guarantee to support confident shopping.
            </p>
          </div>
        </div>
      </section>

      <section ref={finalRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#08101d] via-[#090b16] to-[#160f29] p-1 shadow-2xl">
          <div className="rounded-[2rem] bg-[#050816] p-12 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">Ready for premium period care?</p>
            <h2 className="mt-6 text-4xl font-semibold text-white md:text-5xl">
              Discover Aevyrixa Her Care today
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/65">
              Upgrade your routine with thoughtfully designed reusable protection made for modern confidence.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/product"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 px-8 py-3 text-sm font-semibold text-black shadow-[0_0_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02]"
              >
                Shop Her Care
              </Link>
              <a
                href="#faq"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read FAQs
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1">
                  <Image
                    src="/logo.jpg"
                    alt="Aevyrixa Logo"
                    width={42}
                    height={42}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-[0.25em] text-white">
                    Aevyrixa
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">
                    Her Care
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                Aevyrixa Her Care blends premium-looking design, thoughtful comfort, and elevated ecommerce presentation for women who want quality reusable period care.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Shop</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Her Care Collection
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Comfort Fit
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Leak-Resistant Layers
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    New Arrivals
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Company</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    About Aevyrixa
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="transition hover:text-cyan-300">
                    Track Order
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Legal</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Shipping Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50 md:flex-row md:items-center">
            <p>© 2026 Aevyrixa. All rights reserved.</p>
            <p>Designed for a premium modern shopping experience.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
