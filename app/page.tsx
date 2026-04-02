"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteHeader from "@/app/components/cart/site-header";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featuredRef = useRef<HTMLElement>(null);
  const featuredCardsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLElement>(null);
  const trustRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const testimonialCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();

    tl.from(badgeRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
    })
      .from(
        titleRef.current,
        {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power4.out",
        },
        "-=0.3"
      )
      .from(
        textRef.current,
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      )
      .from(
        buttonsRef.current,
        {
          y: 25,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      )
      .from(
        statsRef.current,
        {
          y: 25,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      )
      .from(
        cardRef.current,
        {
          x: 80,
          opacity: 0,
          scale: 0.95,
          duration: 1.1,
          ease: "power4.out",
        },
        "-=1"
      );

    gsap.to(cardRef.current, {
      y: -10,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    if (featuredRef.current && featuredCardsRef.current) {
      gsap.from(featuredRef.current, {
        scrollTrigger: {
          trigger: featuredRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      });

      gsap.from(featuredCardsRef.current.children, {
        scrollTrigger: {
          trigger: featuredCardsRef.current,
          start: "top 85%",
        },
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
      });
    }

    if (whyRef.current) {
      gsap.from(whyRef.current, {
        scrollTrigger: {
          trigger: whyRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    }

    if (trustRef.current) {
      gsap.from(trustRef.current, {
        scrollTrigger: {
          trigger: trustRef.current,
          start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    }

    if (faqRef.current) {
      gsap.from(faqRef.current, {
        scrollTrigger: {
          trigger: faqRef.current,
          start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    }

    if (testimonialCardsRef.current) {
      gsap.from(testimonialCardsRef.current.children, {
        scrollTrigger: {
          trigger: testimonialCardsRef.current,
          start: "top 85%",
        },
        y: 45,
        opacity: 0,
        duration: 0.9,
        stagger: 0.18,
        ease: "power3.out",
        clearProps: "all",
      });
    }
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[8%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[30%] h-[280px] w-[280px] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <SiteHeader active="home" />

      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:border-fuchsia-400/35 hover:bg-white/8 hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/product"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:border-fuchsia-400/35 hover:bg-white/8 hover:text-white"
            >
              Shop
            </Link>
            <Link
              href="/product/rgb-lamp"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:border-fuchsia-400/35 hover:bg-white/8 hover:text-white"
            >
              Featured Product
            </Link>

            <Link
              href="/product"
              className="mt-2 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-center text-sm font-semibold text-black"
            >
              Explore
            </Link>
          </div>
        </div>
      )}

      <section
        className="relative mx-auto flex min-h-[92vh] max-w-7xl items-center px-6 py-20"
      >
        <div className="grid w-full items-center gap-16 md:grid-cols-2">
          <div>
            <p
              ref={badgeRef}
              className="mb-4 text-sm uppercase tracking-[0.4em] text-cyan-300/80"
            >
              Luxury • Futuristic • Premium
            </p>

            <h1
              ref={titleRef}
              className="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl"
            >
              Elevate Everyday Living With a{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 bg-clip-text text-transparent">
                VIP Smart Home Experience
              </span>
            </h1>

            <p
              ref={textRef}
              className="mt-6 max-w-xl text-base leading-8 text-white/65 md:text-lg"
            >
              A high-end ecommerce experience crafted for modern customers with
              cinematic visuals, premium layout, luxury interactions, and a
              futuristic brand atmosphere.
            </p>

            <div ref={buttonsRef} className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/product"
                className="rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(56,189,248,0.25)] transition hover:scale-[1.04]"
              >
                Shop Now
              </Link>

              <Link
                href="/product"
                className="rounded-full border border-fuchsia-400/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-300 hover:border-fuchsia-400/40 hover:bg-white/8 hover:text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.14)]"
              >
                View Collection
              </Link>
            </div>

            <div
              ref={statsRef}
              className="mt-12 grid max-w-xl grid-cols-3 gap-4"
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-2xl font-semibold text-white">VIP</p>
                <p className="mt-1 text-sm text-white/60">Luxury UI</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-2xl font-semibold text-white">Fast</p>
                <p className="mt-1 text-sm text-white/60">Responsive</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-2xl font-semibold text-white">Smooth</p>
                <p className="mt-1 text-sm text-white/60">Animations</p>
              </div>
            </div>
          </div>

          <div ref={cardRef} className="relative">
            <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute right-10 top-20 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#0b1020] via-[#13182d] to-[#1d1030] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
                      Featured Drop
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      Smart Home Collection
                    </h3>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/70">
                    New Season
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="h-40 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent" />
                    <h4 className="mt-4 text-lg font-medium">
                      Ambient RGB Lamp
                    </h4>
                    <p className="mt-2 text-sm text-white/60">$49.00</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="h-40 rounded-2xl bg-gradient-to-br from-fuchsia-400/20 via-purple-500/10 to-transparent" />
                    <h4 className="mt-4 text-lg font-medium">
                      Luxury Diffuser
                    </h4>
                    <p className="mt-2 text-sm text-white/60">$39.00</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm leading-7 text-white/60">
                    Designed with premium spacing, cinematic glow, futuristic
                    color harmony, and a polished luxury aesthetic for a truly
                    elite ecommerce presence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={featuredRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300/75">
              Featured Products
            </p>
            <h2 className="text-3xl font-semibold md:text-5xl">
              Designed for a Premium Lifestyle
            </h2>
          </div>

          <Link
            href="/product"
            className="hidden rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-cyan-300 hover:text-black md:inline-flex"
          >
            View All Products
          </Link>
        </div>

        <div ref={featuredCardsRef} className="grid gap-6 md:grid-cols-3">
          <div className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-cyan-300/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <div className="mb-5 rounded-[1.5rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent p-6">
              <div className="h-56 rounded-[1.25rem] border border-white/10 bg-[#0b1120]" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
              Smart Lighting
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Ambient RGB Lamp</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Premium smart lighting for a modern luxury room setup with a
              futuristic glow.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg font-semibold">$49.00</span>
              <Link
                href="/product/rgb-lamp"
                className="inline-flex min-w-[110px] items-center justify-center rounded-full border border-fuchsia-400/20 bg-white px-6 py-3 text-base font-semibold !text-black transition duration-300 hover:border-fuchsia-400/40 hover:bg-white/90 hover:shadow-[0_0_30px_rgba(217,70,239,0.16)]"
              >
                Buy Now
              </Link>
            </div>
          </div>

          <div className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-fuchsia-400/30 hover:shadow-[0_0_40px_rgba(217,70,239,0.12)]">
            <div className="mb-5 rounded-[1.5rem] bg-gradient-to-br from-fuchsia-400/20 via-purple-500/10 to-transparent p-6">
              <div className="h-56 rounded-[1.25rem] border border-white/10 bg-[#0b1120]" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300/70">
              Home Wellness
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Luxury Diffuser</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Elegant aroma diffusion for calm, style, and a high-end home
              atmosphere.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg font-semibold">$39.00</span>
              <Link
                href="/product/diffuser"
                className="inline-flex min-w-[110px] items-center justify-center rounded-full border border-fuchsia-400/20 bg-white px-6 py-3 text-base font-semibold !text-black transition duration-300 hover:border-fuchsia-400/40 hover:bg-white/90 hover:shadow-[0_0_30px_rgba(217,70,239,0.16)]"
              >
                Buy Now
              </Link>
            </div>
          </div>

          <div className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-amber-300/30 hover:shadow-[0_0_40px_rgba(251,191,36,0.10)]">
            <div className="mb-5 rounded-[1.5rem] bg-gradient-to-br from-amber-300/20 via-orange-400/10 to-transparent p-6">
              <div className="h-56 rounded-[1.25rem] border border-white/10 bg-[#0b1120]" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
              Smart Essentials
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              Minimal Desk Gadget
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              A sleek smart accessory that brings elegance and function to your
              daily setup.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg font-semibold">$29.00</span>
              <Link
                href="/product/desk-gadget"
                className="inline-flex min-w-[110px] items-center justify-center rounded-full border border-fuchsia-400/20 bg-white px-6 py-3 text-base font-semibold !text-black transition duration-300 hover:border-fuchsia-400/40 hover:bg-white/90 hover:shadow-[0_0_30px_rgba(217,70,239,0.16)]"
              >
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={whyRef}
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300/75">
              Why Choose Aevyrixa
            </p>
            <h2 className="max-w-2xl text-3xl font-semibold md:text-5xl">
              Premium products with a luxury digital experience
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/65">
              We combine elegant product presentation, fast performance, modern
              design language, and a premium shopping atmosphere to create a
              store experience that feels refined from the first second.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-xl text-cyan-300">
                  ✦
                </div>
                <h3 className="text-xl font-semibold">Luxury UI System</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  A premium visual language with glow, spacing, depth, and refined interactions.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/15 text-xl text-fuchsia-300">
                  ⚡
                </div>
                <h3 className="text-xl font-semibold">Fast Experience</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Optimized structure for a smooth and modern browsing experience across devices.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-xl text-amber-200">
                  ◆
                </div>
                <h3 className="text-xl font-semibold">Premium Curation</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Selected products designed for modern homes, elegant setups, and elevated living.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-xl text-cyan-300">
                  ☰
                </div>
                <h3 className="text-xl font-semibold">Responsive Design</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Built to look strong, balanced, and premium on both desktop and mobile screens.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-52 w-52 rounded-full bg-fuchsia-500/15 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#0b1020] via-[#12172a] to-[#1b1030] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">
                  Signature Experience
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <h4 className="text-lg font-semibold">Modern luxury atmosphere</h4>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Dark premium visual direction with futuristic glow accents and strong contrast.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <h4 className="text-lg font-semibold">Trust-first ecommerce feel</h4>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      A clean and polished structure that makes the store feel professional and reliable.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <h4 className="text-lg font-semibold">Smooth premium interactions</h4>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Buttons, sections, hover states, and animations are designed to feel refined.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={trustRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl md:p-8">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
              <div className="mb-3 text-2xl text-cyan-300">🔒</div>
              <h3 className="text-lg font-semibold">Secure Payment</h3>
              <p className="mt-2 text-sm text-white/60">
                Protected checkout experience
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
              <div className="mb-3 text-2xl text-fuchsia-300">💰</div>
              <h3 className="text-lg font-semibold">7-Day Guarantee</h3>
              <p className="mt-2 text-sm text-white/60">
                Risk-free customer confidence
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
              <div className="mb-3 text-2xl text-amber-200">🚚</div>
              <h3 className="text-lg font-semibold">Fast Shipping</h3>
              <p className="mt-2 text-sm text-white/60">
                Quick order fulfillment flow
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
              <div className="mb-3 text-2xl text-cyan-300">📞</div>
              <h3 className="text-lg font-semibold">24/7 Support</h3>
              <p className="mt-2 text-sm text-white/60">
                Always here when needed
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300/75">
            Customer Reviews
          </p>
          <h2 className="text-3xl font-semibold md:text-5xl">
            Trusted by customers who love premium living
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/65">
            A refined shopping experience feels even stronger when real customer
            satisfaction is visible across the storefront.
          </p>
        </div>

        <div ref={testimonialCardsRef} className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:border-cyan-300/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <div className="mb-4 flex items-center gap-1 text-amber-300">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>

            <p className="min-h-[160px] text-base leading-8 text-white/75">
              “The whole shopping experience feels premium. The design, product
              presentation, and overall vibe make the store look far above average.”
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-semibold text-cyan-300">
                S
              </div>
              <div>
                <p className="font-semibold text-white">Sophia R.</p>
                <p className="text-sm text-white/55">New York, USA</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:border-fuchsia-400/30 hover:shadow-[0_0_40px_rgba(217,70,239,0.12)]">
            <div className="mb-4 flex items-center gap-1 text-amber-300">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>

            <p className="min-h-[160px] text-base leading-8 text-white/75">
              “Clean layout, elegant colors, and a very modern luxury feel. It
              honestly looks like a high-end brand instead of a typical online store.”
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-400/15 text-lg font-semibold text-fuchsia-300">
                D
              </div>
              <div>
                <p className="font-semibold text-white">Daniel M.</p>
                <p className="text-sm text-white/55">California, USA</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:border-amber-300/30 hover:shadow-[0_0_40px_rgba(251,191,36,0.10)]">
            <div className="mb-4 flex items-center gap-1 text-amber-300">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>

            <p className="min-h-[160px] text-base leading-8 text-white/75">
              “The products feel curated, the interface is smooth, and everything
              gives a polished premium impression. Very professional experience.”
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-300/15 text-lg font-semibold text-amber-200">
                E
              </div>
              <div>
                <p className="font-semibold text-white">Emily K.</p>
                <p className="text-sm text-white/55">Texas, USA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={faqRef} className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300/75">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold md:text-5xl">
            Everything customers usually want to know
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/65">
            Clear answers help customers feel confident, reduce hesitation, and
            make the buying experience smoother.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">How long does shipping take?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Shipping times vary by location, but we always aim for fast and
              reliable delivery with clear order updates throughout the process.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Do you offer a guarantee?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Yes, we offer a 7-day guarantee to help customers shop with more confidence.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Is payment secure?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Yes, customer payment information is handled through secure checkout methods.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold">Can I contact support anytime?</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Our support team is available to help with questions, updates, and order concerns.
            </p>
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
                    AEVYRIXA
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">
                    Premium Smart Living
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                Aevyrixa brings together premium product selection, modern luxury
                design, and a refined ecommerce experience for customers who want more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Shop</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Smart Lighting
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Home Essentials
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="transition hover:text-cyan-300">
                    Wellness Products
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
                    About Us
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