"use client";

import Link from "next/link";
import { ArrowRight, Headphones, MessageSquare, PackageSearch, ShieldCheck } from "lucide-react";
import { AccountMobileMenu, DashboardSidebar, Panel } from "@/app/account/_shared/account-ui";
import type { Customer } from "@/app/account/_shared/account-types";
import type { StorefrontSettings } from "@/app/lib/storefront-settings";

export default function SupportView({
  message,
  settings,
  customer,
  onLogout,
  onOpenLiveChat,
}: {
  message: string;
  settings: StorefrontSettings;
  customer: Customer;
  onLogout: () => void;
  onOpenLiveChat: () => void;
}) {
  const supportActions: Array<{
    label: string;
    helper: string;
    icon: typeof MessageSquare;
    onClick?: () => void;
    href?: string;
    external?: boolean;
  }> = [
    { label: "Live Chat", helper: "Chat with Noromi Care support.", icon: MessageSquare, onClick: onOpenLiveChat },
    {
      label: "WhatsApp",
      helper: settings.supportWhatsApp || "Open the current support contact details.",
      icon: Headphones,
      href: settings.whatsappUrl || "/support",
      external: Boolean(settings.whatsappUrl),
    },
    { label: "Support Center", helper: "Review support and care guidance.", icon: ShieldCheck, href: "/support" },
    { label: "Track Order", helper: "Check the latest delivery progress.", icon: PackageSearch, href: "/track-order" },
  ];

  return (
    <div className="aev-account-dashboard-workspace aev-account-support-workspace">
      <DashboardSidebar customer={customer} activeView="support" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-support-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">Support Requests</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Get private, thoughtful help with your orders, delivery, sizing, or product concerns.
            </p>
          </div>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="support" hero onLogout={onLogout} />
          </div>
        </section>

        <div className="aev-account-support-layout">
          <Panel className="aev-account-support-history">
            <div className="aev-account-support-heading">
              <span><MessageSquare className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#FFB3D1]/72">Account support</p>
                <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">Support history</h2>
              </div>
            </div>
            <div className="aev-account-support-message">
              <p>{message || "Live chat conversations are currently token-based and not safely linked to customer accounts yet."}</p>
            </div>
            <div className="aev-account-support-reassurance">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <p>Share your order reference when contacting support so the team can help efficiently.</p>
            </div>
          </Panel>

          <Panel className="aev-account-support-utilities">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#31E6D4]/72">Support tools</p>
            <h2 className="mt-1.5 text-xl font-semibold text-white">How can we help?</h2>
            <div className="aev-account-support-action-list">
              {supportActions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <>
                    <span><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <strong>{action.label}</strong>
                      <small>{action.helper}</small>
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-55" />
                  </>
                );
                const className = "aev-account-support-action";

                if (action.onClick) {
                  return <button key={action.label} type="button" onClick={action.onClick} className={className}>{content}</button>;
                }
                if (action.external) {
                  return <a key={action.label} href={action.href} target="_blank" rel="noreferrer" className={className}>{content}</a>;
                }
                return <Link key={action.label} href={action.href || "/support"} className={className}>{content}</Link>;
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

