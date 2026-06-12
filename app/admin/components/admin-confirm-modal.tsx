"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import { AdminButton } from "./admin-button";

type ConfirmVariant = "danger" | "warning" | "info" | "success";

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  requireText?: string;
  reasonRequired?: boolean;
  reasonLabel?: string;
  impactItems?: string[];
  loading?: boolean;
  onConfirm: (payload: { reason: string; confirmationText: string }) => void | Promise<void>;
  onCancel: () => void;
};

const variantConfig = {
  danger: {
    icon: ShieldAlert,
    ring: "border-rose-300/28 bg-rose-500/14 text-rose-100",
    button: "danger" as const,
  },
  warning: {
    icon: AlertTriangle,
    ring: "border-amber-300/28 bg-amber-400/14 text-amber-100",
    button: "warning" as const,
  },
  info: {
    icon: Info,
    ring: "border-cyan-300/28 bg-cyan-400/12 text-cyan-100",
    button: "neon" as const,
  },
  success: {
    icon: CheckCircle2,
    ring: "border-emerald-300/28 bg-emerald-400/12 text-emerald-100",
    button: "success" as const,
  },
};

export function AdminConfirmModal({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  impactItems,
  loading = false,
  onCancel,
  onConfirm,
  open,
  reasonLabel = "Reason",
  reasonRequired = false,
  requireText,
  title,
  variant = "danger",
}: AdminConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");
  const titleId = useId();
  const descriptionId = useId();
  const config = variantConfig[variant];
  const Icon = config.icon;
  const canConfirm =
    (!requireText || confirmationText === requireText) &&
    (!reasonRequired || reason.trim().length > 0) &&
    !loading;

  useEffect(() => {
    if (!open) {
      setConfirmationText("");
      setReason("");
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center px-4 py-6" role="presentation">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 cursor-default bg-slate-950/78 backdrop-blur-sm"
        disabled={loading}
        onClick={() => !loading && onCancel()}
      />
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="admin-glow-border relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950/92 p-5 text-slate-100 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        role="dialog"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(236,72,153,0.16),transparent_34%),radial-gradient(circle_at_90%_12%,rgba(34,211,238,0.12),transparent_30%)]" />
        <div className="relative flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${config.ring}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-white">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={loading}
            onClick={onCancel}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {impactItems && impactItems.length > 0 && (
          <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Impact
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {impactItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="relative mt-5 space-y-4">
          {requireText && (
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">
                Type <span className="text-rose-200">{requireText}</span> to confirm
              </span>
              <input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                disabled={loading}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/35"
                placeholder={requireText}
              />
            </label>
          )}

          {reasonRequired && (
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">{reasonLabel}</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={loading}
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/35"
                placeholder="Add a clear reason for this admin action"
              />
            </label>
          )}
        </div>

        <div className="relative mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={config.button}
            loading={loading}
            disabled={!canConfirm}
            onClick={() => onConfirm({ reason: reason.trim(), confirmationText })}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </section>
    </div>
  );
}

