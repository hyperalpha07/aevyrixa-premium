"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { label: "Her Care Collection", href: "/product" },
      { label: "Reusable Period Care", href: "/product" },
      { label: "Comfort Panty", href: "/product" },
      { label: "Hygiene Essentials", href: "/product" },
      { label: "New Arrivals", href: "/product" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Request Support", href: "/support" },
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

export default function SiteFooter({
  settings: initialSettings = defaultStorefrontSettings,
}: {
  settings?: StorefrontSettings;
}) {
  const [settings, setSettings] = useState<StorefrontSettings>(initialSettings);

  useEffect(() => {
    let isActive = true;

    void fetchStorefrontSettings()
      .then((nextSettings) => {
        if (isActive) setSettings(nextSettings);
      })
      .catch(() => null);

    return () => {
      isActive = false;
    };
  }, []);

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
                {settings.brandShortName}
              </p>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-cyan-200/68">
                Her Care
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/56">
            {settings.footerDescription}
          </p>
          <div className="mt-5 space-y-2 text-sm leading-6 text-white/58">
            <p>{settings.supportWindowMessage}</p>
            {settings.supportPhone && <p>Support: {settings.supportPhone}</p>}
            {settings.supportEmail && <p>Email: {settings.supportEmail}</p>}
            {settings.businessLocation && <p>Location: {settings.businessLocation}</p>}
            {settings.whatsappUrl && (
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex font-semibold text-cyan-100 transition hover:text-white"
              >
                Chat with {settings.brandShortName} Support
              </a>
            )}
            {settings.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                {settings.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/60 transition hover:border-cyan-200/30 hover:bg-white/[0.10] hover:text-cyan-100"
                  >
                    {link.label === "Facebook" && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    {link.label === "Instagram" && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    )}
                    {link.label === "TikTok" && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="font-semibold text-white">{group.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/55">
              {group.links.map((link, linkIndex) => (
                <li key={`${group.title}-${link.label}-${link.href}-${linkIndex}`}>
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
        <p>Copyright 2026 {settings.brandShortName}. All rights reserved.</p>
        <p>{settings.privacyPackagingMessage}</p>
      </div>
    </footer>
  );
}
