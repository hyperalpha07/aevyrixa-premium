"use client";

import type { HTMLAttributes, ReactNode } from "react";

type AdminInteractiveCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverLift?: boolean;
  glow?: boolean;
  selected?: boolean;
  danger?: boolean;
};

export function AdminInteractiveCard({
  children,
  className = "",
  danger = false,
  glow = false,
  hoverLift = true,
  selected = false,
  ...props
}: AdminInteractiveCardProps) {
  return (
    <div
      {...props}
      className={[
        "rounded-2xl border bg-white/[0.035] p-4 backdrop-blur transition",
        danger
          ? "border-rose-300/20 shadow-[0_0_28px_rgba(244,63,94,0.08)]"
          : selected
            ? "border-cyan-200/28 bg-cyan-400/[0.07]"
            : "border-white/10",
        glow ? "admin-glow-border" : "",
        hoverLift ? "hover:-translate-y-0.5 hover:border-fuchsia-200/22 hover:bg-white/[0.055] motion-reduce:hover:translate-y-0" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

