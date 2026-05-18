"use client";

import { useState } from "react";
import { HelpCircle, MessageCircle, Package, Ruler, X } from "lucide-react";

type Props = {
  enabled: boolean;
  label: string;
  placement: string;
  whatsappAlsoEnabled: boolean;
  whatsappUrl: string;
  supportPhone: string;
};

export default function LiveChatWidget({
  enabled,
  label,
  placement,
  whatsappAlsoEnabled,
  whatsappUrl,
  supportPhone,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!enabled || (placement !== "homepage" && placement !== "all")) return null;

  const bottomClass = whatsappAlsoEnabled
    ? "bottom-[4.75rem] sm:bottom-[5.5rem]"
    : "bottom-6 sm:bottom-8";

  return (
    <>
      <div className={`fixed ${bottomClass} right-4 z-50 sm:right-6`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-white/20 bg-[#1a1a2e]/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:border-cyan-200/40 hover:bg-[#1e2240]"
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-cyan-300" />
          <span>{label || "Need Help?"}</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#0a0f1e] shadow-[0_24px_80px_rgba(0,0,0,0.72)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
                <span className="text-sm font-semibold text-white">Aevyrixa Support</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close support panel"
                className="rounded-full p-1 text-white/50 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="mb-4 text-sm text-white/70">
                We&apos;re here to help. Choose an option below.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/track"
                  className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/80 transition hover:border-cyan-200/30 hover:bg-white/[0.07]"
                >
                  <Package className="h-4 w-4 text-cyan-300" />
                  <span className="text-xs font-medium">Track Order</span>
                </a>

                <a
                  href="/product"
                  className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/80 transition hover:border-violet-200/30 hover:bg-white/[0.07]"
                >
                  <HelpCircle className="h-4 w-4 text-violet-300" />
                  <span className="text-xs font-medium">Product Help</span>
                </a>

                <a
                  href="/product#size-guide"
                  className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/80 transition hover:border-sky-200/30 hover:bg-white/[0.07]"
                >
                  <Ruler className="h-4 w-4 text-sky-300" />
                  <span className="text-xs font-medium">Size Help</span>
                </a>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-start gap-1.5 rounded-2xl border border-green-500/25 bg-green-500/[0.06] px-3 py-3 text-green-300/80 transition hover:border-green-500/40 hover:bg-green-500/[0.1]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 fill-green-400"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="text-xs font-medium">WhatsApp</span>
                  </a>
                ) : supportPhone ? (
                  <a
                    href={`tel:${supportPhone}`}
                    className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/80 transition hover:border-rose-200/30 hover:bg-white/[0.07]"
                  >
                    <MessageCircle className="h-4 w-4 text-rose-300" />
                    <span className="text-xs font-medium">Call Us</span>
                  </a>
                ) : (
                  <a
                    href="/support"
                    className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/80 transition hover:border-rose-200/30 hover:bg-white/[0.07]"
                  >
                    <MessageCircle className="h-4 w-4 text-rose-300" />
                    <span className="text-xs font-medium">Contact</span>
                  </a>
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.08] px-5 py-3">
              <p className="text-center text-xs text-white/40">
                No live agent · For urgent help use WhatsApp or visit{" "}
                <a href="/support" className="underline hover:text-white/60">
                  support
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
