"use client";

type AdminHudBackgroundProps = {
  variant?: "radar" | "grid" | "orb" | "finance" | "media" | "none";
  intensity?: "low" | "medium" | "high";
};

const intensityClasses = {
  low: "opacity-30",
  medium: "opacity-50",
  high: "opacity-70",
};

const variantClasses = {
  none: "",
  radar:
    "bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.16),transparent_28%),repeating-radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.22)_0_1px,transparent_1px_58px)]",
  grid: "admin-hud-grid",
  orb: "bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.22),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.16),transparent_26%)]",
  finance:
    "bg-[linear-gradient(115deg,rgba(16,185,129,0.12),transparent_38%),radial-gradient(circle_at_78%_12%,rgba(34,211,238,0.14),transparent_28%)]",
  media:
    "bg-[linear-gradient(135deg,rgba(236,72,153,0.13),transparent_32%),radial-gradient(circle_at_80%_64%,rgba(168,85,247,0.16),transparent_30%)]",
};

export function AdminHudBackground({
  intensity = "low",
  variant = "grid",
}: AdminHudBackgroundProps) {
  if (variant === "none") return null;

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]",
        "motion-safe:animate-[admin-float-soft_12s_ease-in-out_infinite]",
        intensityClasses[intensity],
        variantClasses[variant],
      ].join(" ")}
    />
  );
}

