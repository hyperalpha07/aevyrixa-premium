"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AevHeroAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero headline word-split animation
      const headline = document.querySelector<HTMLElement>(".aev-hero-headline");
      if (headline) {
        const words = headline.innerText.split(" ");
        headline.innerHTML = words
          .map(
            (w) =>
              `<span class="aev-word" style="display:inline-block;overflow:hidden;vertical-align:top;margin-right:0.25em"><span class="aev-word-inner" style="display:inline-block">${w}</span></span>`
          )
          .join("");

        gsap.fromTo(
          ".aev-word-inner",
          { y: "110%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            duration: 0.9,
            stagger: 0.065,
            delay: 0.15,
            ease: "power4.out",
          }
        );
      }

      // 2. Staggered hero element fade-ups
      const heroItems: Array<[string, number]> = [
        [".aev-hero-badge", 0.2],
        [".aev-hero-sub", 0.55],
        [".aev-hero-actions", 0.72],
      ];
      heroItems.forEach(([sel, delay]) => {
        const el = document.querySelector(sel);
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.85, delay, ease: "power3.out" }
          );
        }
      });

      const visual = document.querySelector(".aev-hero-visual");
      if (visual) {
        gsap.fromTo(
          visual,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.85, delay: 0.3, ease: "power3.out" }
        );
      }

      // 3. .aev-reveal scroll-triggered fade-ups (skip ones inside hero stage)
      document
        .querySelectorAll<HTMLElement>(".aev-reveal")
        .forEach((el) => {
          if (el.closest(".aev-hero-stage")) return;
          gsap.fromTo(
            el,
            { opacity: 0, y: 44, filter: "blur(4px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.95,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });

      // 4. Product cards with stagger
      const cardSelectors = [
        ".aev-product-grid article",
        ".aev-products-row article",
        ".aev-premium-card",
      ];
      cardSelectors.forEach((sel) => {
        const cards = document.querySelectorAll(sel);
        if (!cards.length) return;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 32, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cards[0],
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 5. Hero parallax
      const stage = document.querySelector(".aev-hero-stage");
      if (stage) {
        gsap.to(stage, {
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // 6. Timeline dots
      document
        .querySelectorAll<HTMLElement>(".aev-timeline-dot")
        .forEach((dot, i) => {
          gsap.fromTo(
            dot,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.65,
              delay: i * 0.12,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: dot,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });

      // 7. FAQ articles
      const faqSection = document.querySelector("#faq");
      if (faqSection) {
        const faqItems = faqSection.querySelectorAll("article");
        gsap.fromTo(
          faqItems,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.75,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: faqSection,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
