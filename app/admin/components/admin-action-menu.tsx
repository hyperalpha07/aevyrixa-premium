"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

type AdminActionMenuAction = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  description?: string;
};

type AdminActionMenuProps = {
  actions: AdminActionMenuAction[];
  align?: "left" | "right";
  triggerLabel?: string;
  className?: string;
};

export function AdminActionMenu({
  actions,
  align = "right",
  className = "",
  triggerLabel = "Open action menu",
}: AdminActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={triggerLabel}
        onClick={() => setOpen((current) => !current)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-cyan-200/25 hover:bg-white/[0.075] hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={[
            "absolute top-11 z-30 min-w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {actions.map((action) => {
            const content = (
              <>
                {action.icon && <span className="mt-0.5 shrink-0">{action.icon}</span>}
                <span className="min-w-0">
                  <span className="block truncate">{action.label}</span>
                  {action.description && (
                    <span className="mt-0.5 block text-[0.68rem] font-normal leading-4 text-slate-500">
                      {action.description}
                    </span>
                  )}
                </span>
              </>
            );
            const itemClass = [
              "flex w-full min-w-0 items-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
              action.danger
                ? "text-rose-100 hover:bg-rose-500/14"
                : "text-slate-200 hover:bg-white/[0.055]",
              action.disabled ? "pointer-events-none opacity-45" : "",
            ]
              .filter(Boolean)
              .join(" ");

            if (action.href && !action.disabled) {
              return (
                <Link key={action.label} href={action.href} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                className={itemClass}
                onClick={() => {
                  action.onClick?.();
                  setOpen(false);
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

