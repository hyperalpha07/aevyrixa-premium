"use client";

import { usePathname } from "next/navigation";

export default function AevyrixaGlobalArt() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="aevyrixa-global-art" aria-hidden="true">
      <div className="aevyrixa-art-field" />
      <svg
        className="aevyrixa-art-veins"
        viewBox="0 0 1440 980"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="aev-global-line-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4DB8" />
            <stop offset="42%" stopColor="#A855F7" />
            <stop offset="72%" stopColor="#00D4C6" />
            <stop offset="100%" stopColor="#31E6D4" />
          </linearGradient>
          <linearGradient id="aev-global-line-b" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#31E6D4" />
            <stop offset="44%" stopColor="#FF4DB8" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path
          className="aevyrixa-art-path aevyrixa-art-path-a"
          d="M-60 255 C 132 98, 276 412, 438 246 S 774 52, 928 222 S 1180 558, 1510 286"
        />
        <path
          className="aevyrixa-art-path aevyrixa-art-path-b"
          d="M-88 735 C 166 560, 318 878, 548 648 S 828 388, 1034 568 S 1236 838, 1504 604"
        />
        <path
          className="aevyrixa-art-path aevyrixa-art-path-c"
          d="M120 1030 C 190 778, 420 780, 506 562 C 604 314, 754 338, 842 166 C 914 28, 1030 74, 1126 -46"
        />
      </svg>
      <div className="aevyrixa-art-petals">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
