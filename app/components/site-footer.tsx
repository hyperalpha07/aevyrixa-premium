"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

const defaultShopLinks = [
  { label: "Her Care Collection", href: "/product" },
];

const supportLinks = [
  { label: "Track Order", href: "/track-order" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Request Support", href: "/support" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
];

const policyLinks = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
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
      .then((next) => {
        if (isActive) setSettings(next);
      })
      .catch(() => null);
    return () => {
      isActive = false;
    };
  }, []);

  const {
    whatsappUrl,
    socialLinks,
    supportEmail,
    supportPhone,
    brandShortName,
    footerDescription,
    shopFooterCategories,
    storeProfile,
  } = settings;

  const shopLinks = [
    ...defaultShopLinks,
    ...shopFooterCategories.map((c) => ({ label: c.title, href: c.linkUrl })),
  ];

  return (
    <footer className="aev-site-footer relative overflow-hidden border-t border-[#FF4DB8]/10 bg-[#0D0918] px-4 pb-28 pt-10 text-white sm:px-6 sm:pb-16 sm:pt-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF4DB8]/25 to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-48 bg-gradient-to-b from-[#FF4DB8]/[0.04] to-transparent" />
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-[200px] w-[200px] rounded-full bg-[#A855F7]/[0.06] blur-[80px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[30%] h-[160px] w-[160px] rounded-full bg-[#00D4C6]/[0.05] blur-[80px]" />

      {/* Premium brand statement */}
      <div className="aev-footer-brand aev-glass relative mx-auto mb-7 max-w-7xl overflow-hidden p-5 pb-7 sm:mb-9 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#FF4DB8]/55">Her Care by Aevyrixa</p>
        <p className="mt-3 max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-white/80 sm:text-3xl">
          Premium women&apos;s care, delivered discreetly across Bangladesh.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {["Premium Comfort", "Discreet Packaging", "Bangladesh Delivery", "3-Day Hygiene-Safe Support"].map((tag) => (
            <span key={tag} className="aev-footer-proof aev-pill px-3 py-1.5 text-xs font-semibold text-[#FFB3D1]/80">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="aev-footer-columns relative mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 md:grid-cols-[1.2fr_0.8fr_0.9fr_1fr] md:gap-6">

        {/* Column 1: Brand */}
        <div className="aev-footer-column aev-footer-brand-block">
          <div className="flex items-center gap-3">
            <div className="shrink-0 overflow-hidden rounded-xl border border-[#FF4DB8]/24 bg-[#1B1230] p-1 shadow-[0_0_24px_rgba(255,64,184,0.10)]">
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
                {brandShortName}
              </p>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[#FF4DB8]/65">
                Her Care
              </p>
            </div>
          </div>
          {footerDescription && (
            <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/55">
              {footerDescription}
            </p>
          )}
        </div>

        {/* Column 2: Shop */}
        <div className="aev-footer-column">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8CBE8]/70">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/50">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="aev-footer-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className="aev-footer-column">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8CBE8]/70">Support</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/50">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="aev-footer-link aev-footer-link-cyan">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Connect */}
        <div className="aev-footer-column">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8CBE8]/70">Connect</h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {/* WhatsApp */}
            {storeProfile.showWhatsAppFooterIcon && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp Support"
                className="aev-footer-social flex h-9 w-9 items-center justify-center rounded-full border border-[#00D4C6]/30 bg-[#00D4C6]/[0.08] text-[#31E6D4] transition hover:border-[#00D4C6]/55 hover:bg-[#00D4C6]/15"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            )}

            {/* Social icons */}
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="aev-footer-social flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition hover:border-[#FF4DB8]/35 hover:bg-[#FF4DB8]/[0.08] hover:text-[#FFB3D1]"
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
                {link.label === "YouTube" && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                )}
              </a>
            ))}

            {/* Email */}
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                aria-label="Email support"
                className="aev-footer-social flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition hover:border-[#00D4C6]/35 hover:bg-[#00D4C6]/[0.08] hover:text-[#31E6D4]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </a>
            )}
          </div>

          {(supportEmail || supportPhone) && (
            <div className="aev-footer-contact mt-4 space-y-2 text-xs text-white/45">
              {supportEmail && <p className="break-all">{supportEmail}</p>}
              {supportPhone && <p>{supportPhone}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative mx-auto mt-8 max-w-7xl border-t border-white/[0.07] pt-5 sm:mt-10 sm:pt-6">
        <div className="flex flex-col gap-3 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 {brandShortName}. All rights reserved.</p>
          {storeProfile.showFooterLegalLinks && (
            <div className="flex flex-wrap gap-4">
              {policyLinks.map((link) => (
                <Link key={link.label} href={link.href} className="aev-footer-link transition hover:text-[#D8CBE8]">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
