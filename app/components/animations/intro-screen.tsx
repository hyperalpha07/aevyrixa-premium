"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function AevIntroScreen({
  enabled = true,
  brand = "Aevyrixa Her Care",
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
    const mark = overlay.querySelector<HTMLElement>(".aev-intro-mark");
    const ring = overlay.querySelector<HTMLElement>(".aev-intro-ring");
    const title = overlay.querySelector<HTMLElement>(".aev-intro-title");

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        setVisible(false);
      },
    });

    tl.fromTo(
      ring,
      { opacity: 0, scale: 0.76 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.36,
        ease: "power3.out",
      }
    )
      .fromTo(
        mark,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" },
        "-=0.24"
      )
      .fromTo(
        title,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.24, ease: "power2.out" },
        "-=0.16"
      )
      .to(ring, { scale: 1.08, opacity: 0.62, duration: 0.22, ease: "sine.inOut" })
      .to(overlay, { opacity: 0, duration: 0.28, ease: "power2.in" });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const title = brand.trim() || "Aevyrixa Her Care";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 42%, rgba(255,77,184,0.15), transparent 28%), radial-gradient(circle at 50% 50%, rgba(49,230,212,0.08), transparent 38%), linear-gradient(180deg, #080611 0%, #04050D 100%)",
        zIndex: 99999,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <div
        className="aev-intro-ring pointer-events-none absolute h-36 w-36 rounded-full border border-white/10 sm:h-44 sm:w-44"
        style={{
          boxShadow: "0 0 48px rgba(255,77,184,0.18), 0 0 92px rgba(49,230,212,0.08), inset 0 0 28px rgba(255,179,209,0.08)",
          willChange: "transform, opacity",
        }}
      />

      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="aev-intro-mark relative h-14 w-14 rounded-full border border-white/12 object-cover shadow-[0_0_34px_rgba(255,77,184,0.24)] sm:h-16 sm:w-16"
          style={{ willChange: "transform, opacity" }}
        />
      ) : null}
      <p
        className="aev-intro-title relative mt-4 text-sm font-semibold text-[#FFE4F1] sm:text-base"
        style={{
          letterSpacing: "0.12em",
          willChange: "transform, opacity",
        }}
      >
        {title}
      </p>
    </div>
  );
}
