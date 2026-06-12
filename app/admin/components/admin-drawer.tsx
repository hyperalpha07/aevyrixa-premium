"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { X } from "lucide-react";

type AdminDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  side?: "right" | "left";
  width?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  loading?: boolean;
  className?: string;
};

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-none",
};

export function AdminDrawer({
  children,
  className = "",
  footer,
  loading = false,
  onClose,
  open,
  side = "right",
  subtitle,
  title,
  width = "md",
}: AdminDrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose, open]);

  return (
    <div className={`fixed inset-0 z-[110] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close drawer"
        disabled={loading}
        onClick={() => !loading && onClose()}
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        role="dialog"
        className={[
          "absolute top-0 h-full w-full border-white/10 bg-slate-950/94 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          widthClasses[width],
          open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
          className,
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <header className="border-b border-white/10 bg-white/[0.035] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-base font-semibold text-white">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={loading}
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <footer className="border-t border-white/10 bg-white/[0.035] p-4">{footer}</footer>}
        </div>
      </aside>
    </div>
  );
}

