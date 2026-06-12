"use client";

import type { ReactNode } from "react";
import { AdminButton } from "./admin-button";

type AdminEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
};

export function AdminEmptyState({
  actionLabel,
  className = "",
  compact = false,
  description,
  icon,
  onAction,
  title,
}: AdminEmptyStateProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.035] text-center backdrop-blur",
        compact ? "p-4" : "p-8",
        className,
      ].join(" ")}
    >
      {icon && (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/18 bg-cyan-400/10 text-cyan-100">
          {icon}
        </div>
      )}
      <h3 className={`${icon ? "mt-4" : ""} text-sm font-semibold text-white`}>{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <AdminButton className="mt-5" variant="neon" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      )}
    </div>
  );
}

