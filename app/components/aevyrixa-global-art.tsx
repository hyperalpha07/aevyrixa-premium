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
          <linearGradient id="aev-global-arc-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4DB8" stopOpacity="0.72" />
            <stop offset="48%" stopColor="#A855F7" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#00D4C6" stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id="aev-global-orbital-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB3D1" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#31E6D4" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Original flowing vein paths */}
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

        {/* Fabric flow — soft mid-page S-curve */}
        <path
          className="aevyrixa-art-fabric"
          d="M-100 490 C 220 320, 420 680, 720 490 S 1100 260, 1380 490 C 1420 510, 1445 522, 1540 490"
        />

        {/* Protection shell arcs — concentric at lower page (brand identity) */}
        <path
          className="aevyrixa-art-arc aevyrixa-art-arc-inner"
          d="M 400 940 A 320 240 0 0 1 1040 940"
        />
        <path
          className="aevyrixa-art-arc aevyrixa-art-arc-outer"
          d="M 300 970 A 420 320 0 0 1 1140 970"
        />

        {/* Orbital care aura ellipses at corners */}
        <ellipse
          className="aevyrixa-art-orbital"
          cx="1260"
          cy="180"
          rx="200"
          ry="130"
          fill="none"
        />
        <ellipse
          className="aevyrixa-art-orbital aevyrixa-art-orbital-b"
          cx="180"
          cy="800"
          rx="155"
          ry="98"
          fill="none"
        />
      </svg>
      <div className="aevyrixa-art-petals">
        <span />
        <span />
        <span />
      </div>
      <div className="aevyrixa-art-packaging">
        <span />
        <span />
      </div>
    </div>
  );
}
