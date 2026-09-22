"use client";

import "@/app/account/_shared/account-shared.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Headphones, ShieldCheck } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import LiveChatWidget from "@/app/components/live-chat-widget";
import { defaultStorefrontSettings, fetchStorefrontSettings, type StorefrontSettings } from "@/app/lib/storefront-settings";
import { AccountRequestError, readAccountJson } from "@/app/account/_shared/account-request";
import { Panel, type AccountView } from "@/app/account/_shared/account-ui";
import type { Customer } from "@/app/account/_shared/account-types";

export type AccountShellContext = {
  customer: Customer;
  settings: StorefrontSettings;
  bootstrapData: unknown;
  logout: () => Promise<void>;
  openLiveChat: () => void;
};

const protectedAccountPaths: Record<AccountView, string> = {
  dashboard: "/account",
  orders: "/account/orders",
  addresses: "/account/addresses",
  support: "/account/support",
};

export default function AccountShell({
  view,
  bootstrapUrl,
  children,
}: {
  view: AccountView;
  bootstrapUrl?: string;
  children: (context: AccountShellContext) => ReactNode;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bootstrapData, setBootstrapData] = useState<unknown>(null);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    void fetchStorefrontSettings().then((next) => {
      if (isActive) setSettings(next);
    });
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function loadSession() {
      setIsLoading(true);
      setIsAuthRequired(false);
      setBootstrapData(null);
      try {
        const session = await readAccountJson<{ customer: Customer }>(bootstrapUrl ?? "/api/account/session");
        if (isActive) {
          setCustomer(session.customer);
          setBootstrapData(session);
        }
      } catch (error) {
        if (!isActive) return;
        setCustomer(null);
        setIsAuthRequired(error instanceof AccountRequestError && error.status === 401);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadSession();
    return () => { isActive = false; };
  }, [loadAttempt, bootstrapUrl]);

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    router.replace("/account/login");
  };

  const openLiveChat = () => {
    const openEvent = new CustomEvent("aevyrixa:open-live-chat", { cancelable: true });
    if (window.dispatchEvent(openEvent)) router.push("/support");
  };

  const returnToQuery = new URLSearchParams({ returnTo: protectedAccountPaths[view] }).toString();
  const homeMedia = settings.homepageMediaSettings;
  const canShowWhatsappSupport = ["whatsapp", "both"].includes(settings.storeProfile.liveSupportMode);
  const canShowLiveChatSupport = ["live_chat", "both"].includes(settings.storeProfile.liveSupportMode);

  return (
    <main className={`aev-account-page-background aev-account-dashboard-page min-h-screen overflow-x-hidden text-white ${view === "dashboard" || view === "orders" ? "aev-account-background-framed" : ""} ${view === "orders" ? "aev-account-orders-page" : ""} ${view === "addresses" ? "aev-account-addresses-page" : ""} ${view === "support" ? "aev-account-support-page" : ""}`}>
      <SiteHeader settings={settings} active="account" compactMobile />
      <section className="aev-account-shell mx-auto w-full max-w-7xl px-4 pb-[calc(var(--aev-mobile-bottom-nav-height)+2.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pt-6 md:pb-20 md:pt-8">
        {isLoading ? (
          <Panel>Loading your account...</Panel>
        ) : customer ? (
          <div className="grid gap-5 lg:gap-6"><section className="min-w-0">
            {children({ customer, settings, bootstrapData, logout, openLiveChat })}
          </section></div>
        ) : isAuthRequired ? (
          <section className="aev-account-auth-required" aria-labelledby="account-auth-required-title">
            <div className="aev-account-auth-required-icon" aria-hidden="true"><ShieldCheck className="h-6 w-6" /></div>
            <p className="aev-account-auth-required-eyebrow">Private account access</p>
            <h1 id="account-auth-required-title">Sign in to access your account</h1>
            <p className="aev-account-auth-required-copy">Your orders, saved addresses, and support history stay private and become available after you sign in.</p>
            <div className="aev-account-auth-required-actions">
              <Link className="action-primary" href={`/account/login?${returnToQuery}`}>Sign In</Link>
              <Link className="action-muted" href={`/account/register?${returnToQuery}`}>Create Account</Link>
            </div>
            <Link className="aev-account-auth-required-track" href="/track-order">Track an order without signing in <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </section>
        ) : (
          <section className="aev-account-service-error" aria-labelledby="account-service-error-title">
            <div className="aev-account-auth-required-icon" aria-hidden="true"><Headphones className="h-6 w-6" /></div>
            <p className="aev-account-auth-required-eyebrow">Account service</p>
            <h1 id="account-service-error-title">We couldn&apos;t load your account right now.</h1>
            <p>Please check your connection and try again. Your account information remains safe.</p>
            <button type="button" className="action-primary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try Again</button>
          </section>
        )}
      </section>
      <div className="aev-account-footer"><SiteFooter settings={settings} /></div>
      <LiveChatWidget
        enabled={canShowLiveChatSupport && homeMedia.liveChatEnabled}
        label={homeMedia.liveChatLabel}
        placement={homeMedia.liveChatPlacement}
        whatsappAlsoEnabled={canShowWhatsappSupport && homeMedia.whatsappWidgetEnabled && !!settings.whatsappUrl && (homeMedia.whatsappWidgetPlacement === "homepage" || homeMedia.whatsappWidgetPlacement === "all")}
        whatsappUrl={settings.whatsappUrl}
        supportPhone={settings.supportPhone}
        hideLauncherOnMobile
      />
    </main>
  );
}
