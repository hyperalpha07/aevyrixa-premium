"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultAdminSettings,
  normalizeAdminSettings,
  whatsappHref,
  type AdminSettings,
} from "@/app/lib/admin-settings";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { label: "Her Care Collection", href: "/product" },
      { label: "Period Panty", href: "/product/everyday-comfort" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
  },
  {
    title: "Brand",
    links: [
      { label: "About Aevyrixa", href: "/about" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function SiteFooter() {
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);

  useEffect(() => {
    let isActive = true;

    void fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { settings?: unknown }) => {
        if (isActive && payload.settings) {
          setSettings(normalizeAdminSettings(payload.settings));
        }
      })
      .catch(() => null);

    return () => {
      isActive = false;
    };
  }, []);

  const whatsappUrl = whatsappHref(settings.supportWhatsApp);

  return (
    <footer className="border-t border-white/10 bg-[#02040d] px-4 pb-24 pt-12 text-white sm:px-6 sm:pb-16">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1">
              <Image
                src="/logo.jpg"
                alt="Aevyrixa Logo"
                width={42}
                height={42}
                sizes="42px"
                className="h-10 w-10 rounded-lg object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-[0.22em] text-white">
                Aevyrixa
              </p>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-cyan-200/68">
                Her Care
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/56">
            Premium reusable period care designed around comfort, discretion,
            BDT pricing, Bangladesh delivery/COD support, and discreet privacy
            packaging.
          </p>
          <div className="mt-5 space-y-2 text-sm leading-6 text-white/58">
            <p>{settings.supportWindowMessage}</p>
            {settings.supportPhone && <p>Support: {settings.supportPhone}</p>}
            {settings.supportEmail && <p>Email: {settings.supportEmail}</p>}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex font-semibold text-cyan-100 transition hover:text-white"
              >
                Chat with Aevyrixa Support
              </a>
            )}
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="font-semibold text-white">{group.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/55">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-cyan-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/42 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 Aevyrixa. All rights reserved.</p>
        <p>{settings.privacyPackagingMessage}</p>
      </div>
    </footer>
  );
}
