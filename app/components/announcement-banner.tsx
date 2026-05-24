"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";

type Surface = "homepage" | "shop" | "product" | "checkout" | "other";

const styleClasses = {
  info: "border-cyan-200/20 bg-cyan-200/[0.08] text-cyan-50",
  promo: "border-fuchsia-200/22 bg-fuchsia-200/[0.08] text-fuchsia-50",
  warning: "border-amber-200/24 bg-amber-200/[0.10] text-amber-50",
  success: "border-emerald-200/24 bg-emerald-200/[0.09] text-emerald-50",
};

const safeShopFallbackItems = [
  "Discreet privacy packaging",
  "3-Day Hygiene-Safe Support",
  "Bangladesh delivery",
  "BDT pricing",
  "Secure checkout",
];

export default function AnnouncementBanner({
  settings,
  surface,
}: {
  settings: StorefrontSettings;
  surface: Surface;
}) {
  const announcement = settings.appearanceSettings;
  const [dismissed, setDismissed] = useState(false);

  const storageKey = useMemo(
    () => `aev-announcement-dismissed:${announcement.announcementText}`,
    [announcement.announcementText]
  );

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const surfaceEnabled =
    surface === "homepage"
      ? announcement.showOnHomepage
      : surface === "shop"
        ? announcement.showOnShop
        : surface === "product"
          ? announcement.showOnProductPages
          : surface === "checkout"
            ? announcement.showOnCheckout
            : false;

  const enabled =
    (announcement.enableAnnouncement || announcement.announcementBarEnabled) &&
    Boolean(announcement.announcementText.trim()) &&
    surfaceEnabled &&
    !dismissed;

  if (!enabled) {
    if (surface !== "shop") return null;

    return (
      <div className="aev-shop-announcement-strip border-b border-white/10 px-3 py-2 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 overflow-hidden">
          <div className="flex min-w-max items-center gap-2">
            {safeShopFallbackItems.map((item) => (
              <span
                key={item}
                className="aev-shop-announcement-item text-[0.66rem] font-semibold uppercase tracking-[0.14em]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tone = styleClasses[announcement.announcementStyle] ?? styleClasses.info;
  const href = announcement.announcementLinkUrl.trim();
  const label = announcement.announcementLinkLabel.trim();

  return (
    <div className={`aev-shop-announcement-admin border-b px-4 py-2.5 text-sm ${tone}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words leading-6">{announcement.announcementText}</p>
        <div className="flex shrink-0 items-center gap-3">
          {href && label && (
            href.startsWith("/") ? (
              <Link href={href} className="font-semibold underline-offset-4 hover:underline">
                {label}
              </Link>
            ) : (
              <a href={href} className="font-semibold underline-offset-4 hover:underline">
                {label}
              </a>
            )
          )}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(storageKey, "1");
              setDismissed(true);
            }}
            className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold"
            aria-label="Dismiss announcement"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
