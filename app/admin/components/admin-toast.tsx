"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type AdminToastType = "success" | "error" | "warning" | "info";

type AdminToastOptions = {
  title: string;
  description?: string;
  duration?: number;
  type?: AdminToastType;
};

type AdminToastRecord = Required<Pick<AdminToastOptions, "title" | "type">> &
  Pick<AdminToastOptions, "description" | "duration"> & {
    id: string;
  };

type AdminToastContextValue = {
  toast: (options: AdminToastOptions) => string;
  dismiss: (id: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const toastConfig = {
  success: { icon: CheckCircle2, className: "border-emerald-300/22 text-emerald-100" },
  error: { icon: XCircle, className: "border-rose-300/22 text-rose-100" },
  warning: { icon: AlertTriangle, className: "border-amber-300/22 text-amber-100" },
  info: { icon: Info, className: "border-cyan-300/22 text-cyan-100" },
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AdminToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration = 4200, type = "info", ...options }: AdminToastOptions) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const record: AdminToastRecord = { id, duration, type, ...options };
      setToasts((current) => [...current, record].slice(-5));
      if (duration > 0) window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[140] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((item) => {
          const config = toastConfig[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className={`admin-glow-border rounded-2xl border bg-slate-950/92 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl ${config.className}`}
              role="status"
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.description && <p className="mt-1 text-sm leading-5 text-slate-400">{item.description}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) throw new Error("useAdminToast must be used inside AdminToastProvider.");
  return context;
}

