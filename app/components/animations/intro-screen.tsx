"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function AevIntroScreen() {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("aev:intro")) return;
    sessionStorage.setItem("aev:intro", "1");
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!visible || !overlayRef.current) return;

    document.body.style.overflow = "hidden";
    const overlay = overlayRef.current;
    const letters = overlay.querySelectorAll<HTMLElement>(".aev-intro-letter");
    const line = overlay.querySelector<HTMLElement>(".aev-intro-line");
    const tagline = overlay.querySelector<HTMLElement>(".aev-intro-tagline");

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        setVisible(false);
      },
    });

    tl.fromTo(
      letters,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.06,
        ease: "power4.out",
        delay: 0.15,
      }
    )
      .fromTo(
        line,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.7, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        tagline,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
        "-=0.3"
      )
      .to({}, { duration: 0.9 })
      .to(overlay, { opacity: 0, duration: 0.55, ease: "power2.in" });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const brand = "AEVYRIXA";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: "#050816",
        zIndex: 99999,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {/* Ambient orbs */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-10%",
          left: "-10%",
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: "-12%",
          right: "-8%",
          width: "52vw",
          height: "52vw",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />

      {/* Brand letters */}
      <div
        className="relative flex overflow-hidden"
        style={{ gap: "clamp(0.12rem, 0.6vw, 0.5rem)" }}
        aria-label="AEVYRIXA"
      >
        {brand.split("").map((ch, i) => (
          <span
            key={i}
            className="aev-intro-letter inline-block font-semibold text-white"
            style={{
              fontSize: "clamp(2.8rem, 9vw, 8rem)",
              letterSpacing: "0.18em",
              lineHeight: 1,
              willChange: "transform, opacity",
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Accent line */}
      <div
        className="aev-intro-line mt-5"
        style={{
          width: "clamp(14rem, 40vw, 36rem)",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, #22d3ee 30%, #a855f7 70%, transparent)",
          transformOrigin: "left center",
          willChange: "transform",
        }}
      />

      {/* Tagline */}
      <p
        className="aev-intro-tagline mt-5 uppercase tracking-widest text-white/60"
        style={{
          fontSize: "clamp(0.62rem, 1.4vw, 0.85rem)",
          letterSpacing: "0.38em",
          willChange: "transform, opacity",
        }}
      >
        Her Care
      </p>
    </div>
  );
}
