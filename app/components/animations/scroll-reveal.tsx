"use client";

import {
  useEffect,
  useRef,
  CSSProperties,
  ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Direction = "up" | "down" | "left" | "right" | "scale" | "none";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  from?: Direction;
  distance?: number;
  stagger?: number;
  once?: boolean;
  start?: string;
}

function buildFrom(dir: Direction, dist: number) {
  const base = { opacity: 0, filter: "blur(3px)" } as gsap.TweenVars;
  if (dir === "up") return { ...base, y: dist };
  if (dir === "down") return { ...base, y: -dist };
  if (dir === "left") return { ...base, x: dist };
  if (dir === "right") return { ...base, x: -dist };
  if (dir === "scale") return { ...base, scale: 0.9 };
  return base;
}

export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  duration = 0.95,
  from = "up",
  distance = 48,
  stagger = 0,
  once = true,
  start = "top 88%",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const targets =
        stagger > 0 ? Array.from(wrap.children) : wrap;

      gsap.fromTo(
        targets,
        buildFrom(from, distance),
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          x: 0,
          scale: 1,
          duration,
          delay,
          stagger: stagger > 0 ? stagger : undefined,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrap,
            start,
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
        }
      );
    }, wrap);

    return () => ctx.revert();
  }, [delay, distance, duration, from, once, start, stagger]);

  return (
    <div ref={wrapRef} className={className} style={style}>
      {children}
    </div>
  );
}
