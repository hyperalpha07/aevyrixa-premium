"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { brandName, noromiAssets } from "@/configs/brand/noromi";

export default function AevIntroScreen({
  enabled = true,
  brand = brandName,
  logoSrc = noromiAssets.logoMark,
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

    try {
      if (sessionStorage.getItem("aev:intro")) return;
      sessionStorage.setItem("aev:intro", "1");
    } catch {
      return;
    }

    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, [enabled]);

  useEffect(() => {
    if (!visible || !overlayRef.current) return;

    const lockOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const overlay = overlayRef.current;
    const mark = overlay.querySelector<HTMLElement>(".aev-intro-mark");
    const ring = overlay.querySelector<HTMLElement>(".aev-intro-ring");
    const sweep = overlay.querySelector<HTMLElement>(".aev-intro-sweep");
    const title = overlay.querySelector<HTMLElement>(".aev-intro-title");
    const subtext = overlay.querySelector<HTMLElement>(".aev-intro-subtext");

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        document.body.style.overflow = lockOverflow;
        setVisible(false);
      },
    });

    tl.to(overlay, { opacity: 1, duration: 0.08, ease: "sine.out" })
      .fromTo(ring, { opacity: 0, scale: 0.78 }, { opacity: 0.86, scale: 1, duration: 0.22 }, 0)
      .fromTo(
        mark,
        { opacity: 0, scale: 0.92, filter: "blur(5px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.22 },
        0.04
      )
      .fromTo(
        title,
        { opacity: 0, y: 7 },
        { opacity: 1, y: 0, duration: 0.18 },
        0.14
      )
      .fromTo(
        subtext,
        { opacity: 0, y: 5 },
        { opacity: 0.74, y: 0, duration: 0.16 },
        0.2
      )
      .fromTo(
        sweep,
        { opacity: 0, xPercent: -120 },
        { opacity: 0.52, xPercent: 120, duration: 0.28, ease: "sine.inOut" },
        0.18
      )
      .to(ring, { scale: 1.1, opacity: 0.36, duration: 0.22, ease: "sine.inOut" }, 0.32)
      .to(overlay, { opacity: 0, duration: 0.24, ease: "power2.inOut" }, 0.58);

    return () => {
      tl.kill();
      document.body.style.overflow = lockOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const title = brand.trim() || brandName;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 43%, rgba(255,77,184,0.18), transparent 18rem), radial-gradient(circle at 51% 50%, rgba(49,230,212,0.1), transparent 20rem), linear-gradient(180deg, #070510 0%, #02030A 100%)",
        opacity: 0,
        zIndex: 99999,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-56 max-w-[70vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.035] sm:w-72"
        style={{ transform: "translate(-50%, -50%) translateY(3.9rem)" }}
      >
        <span
          className="aev-intro-sweep block h-full w-1/2 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,179,209,0.78), rgba(49,230,212,0.72), transparent)",
            boxShadow: "0 0 18px rgba(255,77,184,0.22)",
            willChange: "transform, opacity",
          }}
        />
      </div>

      <div
        className="aev-intro-ring pointer-events-none absolute h-28 w-28 rounded-full border border-white/10 sm:h-36 sm:w-36"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.035), transparent 62%)",
          boxShadow: "0 0 44px rgba(255,77,184,0.2), 0 0 74px rgba(49,230,212,0.12), inset 0 0 24px rgba(255,179,209,0.08)",
          willChange: "transform, opacity",
        }}
      />

      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="aev-intro-mark relative h-12 w-12 rounded-full border border-white/15 object-cover shadow-[0_0_28px_rgba(255,77,184,0.28),0_0_46px_rgba(49,230,212,0.1)] sm:h-14 sm:w-14"
          style={{ willChange: "transform, opacity" }}
        />
      ) : null}
      <p
        className="aev-intro-title relative mt-3 max-w-[18rem] text-sm font-semibold leading-tight text-[#FFE4F1] sm:mt-4 sm:max-w-sm sm:text-base"
        style={{
          letterSpacing: "0.08em",
          willChange: "transform, opacity",
        }}
      >
        {title}
      </p>
      <p
        className="aev-intro-subtext relative mt-1 max-w-[16rem] text-[0.68rem] font-medium uppercase leading-tight text-white/65 sm:text-xs"
        style={{
          letterSpacing: "0.1em",
          willChange: "transform, opacity",
        }}
      >
        Premium Women's Care
      </p>
    </div>
  );
}
