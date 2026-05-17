"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const content = contentRef.current;
    const line = lineRef.current;
    if (!content || !line) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        content,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power4.out" }
      ).fromTo(
        line,
        { scaleX: 0, opacity: 1 },
        { scaleX: 1, duration: 0.65, ease: "power3.out" },
        "<"
      ).to(
        line,
        { opacity: 0, duration: 0.35, ease: "power2.in" },
        "+=0.15"
      );
    });

    return () => ctx.revert();
  }, [pathname]);

  return (
    <>
      <div
        ref={lineRef}
        className="pointer-events-none fixed left-0 top-0 z-[99997] h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #22d3ee 30%, #a855f7 70%, transparent)",
          transformOrigin: "left center",
          opacity: 0,
        }}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </div>
    </>
  );
}
