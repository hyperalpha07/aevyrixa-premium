"use client";

import { useEffect } from "react";

export default function HomeMotionController() {
  useEffect(() => {
    const root = document.querySelector(".aev-home");

    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root?.querySelectorAll(".aev-reveal").forEach((element) => {
        element.classList.add("aev-reveal-visible");
      });
      return;
    }

    const revealItems = Array.from(root.querySelectorAll(".aev-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("aev-reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    revealItems.forEach((element, index) => {
      element.setAttribute("style", `--aev-reveal-delay: ${Math.min(index % 4, 3) * 70}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
