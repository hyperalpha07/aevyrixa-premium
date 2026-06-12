"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "ghost"
  | "neon"
  | "outline";

type AdminButtonSize = "xs" | "sm" | "md" | "lg";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<AdminButtonVariant, string> = {
  primary:
    "border-fuchsia-300/25 bg-gradient-to-r from-fuchsia-500/85 to-pink-500/85 text-white shadow-[0_0_24px_rgba(236,72,153,0.24)] hover:border-fuchsia-200/45 hover:from-fuchsia-500 hover:to-pink-500",
  secondary:
    "border-white/10 bg-white/[0.055] text-slate-100 hover:border-cyan-200/22 hover:bg-white/[0.085]",
  danger:
    "border-rose-300/25 bg-rose-500/14 text-rose-100 shadow-[0_0_22px_rgba(244,63,94,0.12)] hover:border-rose-200/45 hover:bg-rose-500/22",
  success:
    "border-emerald-300/24 bg-emerald-400/12 text-emerald-100 hover:border-emerald-200/45 hover:bg-emerald-400/20",
  warning:
    "border-amber-300/24 bg-amber-400/12 text-amber-100 hover:border-amber-200/45 hover:bg-amber-400/20",
  ghost:
    "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.045] hover:text-white",
  neon:
    "border-cyan-200/28 bg-cyan-400/10 text-cyan-100 shadow-[0_0_26px_rgba(34,211,238,0.16)] hover:border-fuchsia-200/35 hover:bg-fuchsia-400/12 hover:text-white",
  outline:
    "border-fuchsia-200/22 bg-black/16 text-slate-100 hover:border-cyan-200/30 hover:bg-white/[0.045]",
};

const sizeClasses: Record<AdminButtonSize, string> = {
  xs: "min-h-7 gap-1.5 rounded-lg px-2 text-[0.68rem]",
  sm: "min-h-9 gap-2 rounded-xl px-3 text-xs",
  md: "min-h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "min-h-12 gap-2.5 rounded-2xl px-5 text-sm",
};

export function AdminButton({
  children,
  className = "",
  disabled,
  fullWidth,
  icon,
  loading,
  rightIcon,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: AdminButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={[
        "admin-pressable inline-flex items-center justify-center border font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-55",
        fullWidth ? "w-full" : "",
        sizeClasses[size],
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
      {rightIcon}
    </button>
  );
}

