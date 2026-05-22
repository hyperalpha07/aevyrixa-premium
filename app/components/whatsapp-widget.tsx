"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

export default function WhatsAppWidget() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetchStorefrontSettings()
      .then((next) => {
        setSettings(next);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  // Don't render on admin pages or until settings loaded
  if (!ready || !pathname || pathname.startsWith("/admin")) return null;

  const { homepageMediaSettings, supportWhatsApp, whatsappUrl } = settings;

  if (!homepageMediaSettings.whatsappWidgetEnabled || !supportWhatsApp || !whatsappUrl) {
    return null;
  }

  const label = homepageMediaSettings.whatsappWidgetLabel || "Support";
  const hideOnActionHeavyMobileRoute =
    pathname.startsWith("/account") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/track-order") ||
    (pathname.startsWith("/product/") && pathname !== "/product/");
  const productDetailOffset =
    pathname.startsWith("/product/") && pathname !== "/product/"
      ? "bottom-[calc(var(--aev-mobile-bottom-nav-height)+5.25rem+env(safe-area-inset-bottom,0px))]"
      : "bottom-[calc(var(--aev-mobile-bottom-nav-height)+0.75rem+env(safe-area-inset-bottom,0px))]";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp Support"
      className={`aev-whatsapp-widget fixed ${productDetailOffset} right-4 z-50 flex items-center gap-2 rounded-full border border-[#00D4C6]/30 bg-[#151024]/92 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,212,198,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#00D4C6]/50 hover:bg-[#211633] hover:shadow-[0_6px_28px_rgba(0,212,198,0.24)] md:bottom-8 sm:right-6 ${hideOnActionHeavyMobileRoute ? "hidden md:flex" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      <span className="aev-whatsapp-widget-label">{label}</span>
    </a>
  );
}
