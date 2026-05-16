"use client";

import { useEffect, useRef, useState } from "react";

const CHAPTERS = [
  { id: "chapter-1", label: "Hero" },
  { id: "chapter-2", label: "Layers" },
  { id: "chapter-3", label: "Trust" },
  { id: "chapter-4", label: "Privacy" },
  { id: "chapter-5", label: "Shop" },
];

export default function CinematicChapterUI() {
  const [active, setActive] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      if (!barRef.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      barRef.current.style.width = `${pct}%`;
    };

    if (!reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const best = visible.reduce((a, b) =>
          a.intersectionRatio >= b.intersectionRatio ? a : b
        );
        const idx = CHAPTERS.findIndex((c) => c.id === best.target.id);
        if (idx !== -1) setActive(idx);
      },
      { threshold: [0.2, 0.5] }
    );

    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={barRef}
        className="aev-scroll-bar pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 w-0"
        aria-hidden="true"
      />
      <nav
        className="aev-chapter-nav pointer-events-none fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 sm:flex"
        aria-label="Page chapters"
      >
        {CHAPTERS.map((ch, i) => (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className={`aev-chapter-dot pointer-events-auto flex items-center justify-end gap-2${i === active ? " aev-chapter-dot--active" : ""}`}
            aria-label={ch.label}
          >
            <span className="aev-chapter-dot__label">{ch.label}</span>
            <span className="aev-chapter-dot__pip" aria-hidden="true" />
          </a>
        ))}
      </nav>
    </>
  );
}
