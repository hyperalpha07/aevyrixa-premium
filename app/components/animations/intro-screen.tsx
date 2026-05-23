"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function AevIntroScreen({
  enabled = true,
  brand = "AEVYRIXA",
  logoSrc = "/logo.jpg",
}: {
  enabled?: boolean;
  brand?: string;
  logoSrc?: string;
}) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("aev:intro")) return;
    sessionStorage.setItem("aev:intro", "1");
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, [enabled]);

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
      .to({}, { duration: 0.35 })
      .to(overlay, { opacity: 0, duration: 0.42, ease: "power2.in" });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const title = brand.trim() || "AEVYRIXA";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, rgba(255,77,184,0.14), transparent 34%), linear-gradient(180deg, #080611 0%, #050711 100%)",
        zIndex: 99999,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-x-[12%] top-1/2 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,179,209,0.38), rgba(49,230,212,0.32), transparent)",
          transform: "translateY(-50%)",
        }}
      />
      <div
        className="pointer-events-none absolute h-48 w-48 rounded-full border border-white/10"
        style={{
          boxShadow: "0 0 72px rgba(255,77,184,0.16), inset 0 0 36px rgba(49,230,212,0.08)",
        }}
      />

      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="relative mb-6 h-16 w-16 rounded-full border border-white/12 object-cover shadow-[0_0_38px_rgba(255,77,184,0.28)]"
        />
      ) : null}
      <div
        className="relative flex overflow-hidden"
        style={{ gap: "clamp(0.12rem, 0.6vw, 0.5rem)" }}
        aria-label={title}
      >
        {title.split("").map((ch, i) => (
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
