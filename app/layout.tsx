import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/components/cart/cart-context";
import CartDrawer from "@/app/components/cart/cart-drawer";
import AnalyticsScripts from "@/app/components/analytics-scripts";
import WhatsAppWidget from "@/app/components/whatsapp-widget";
import {
  adminV2ColorSchemeSelector,
  adminV2ColorSchemeStorageKey,
  adminV2DefaultThemeSettings,
  adminV2ModeStorageKey,
} from "@/configs/admin-v2/theme";
import { brandName, noromiAssets } from "@/configs/brand/noromi";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.aevyrixa.com";
const PUBLIC_TITLE = `${brandName} - Premium Period Essentials in Bangladesh`;
const PUBLIC_DESCRIPTION =
  "Premium period essentials for everyday comfort, confidence, and discreet care in Bangladesh.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: PUBLIC_TITLE,
    // Retained for legacy admin pages. Public pages define absolute titles below.
    template: "%s | Aevyrixa Her Care",
  },
  description: PUBLIC_DESCRIPTION,
  icons: {
    // The file-based favicon is shared with legacy admin routes; defer replacement
    // until route-scoped icons can be introduced without changing admin branding.
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: brandName,
    title: PUBLIC_TITLE,
    description: PUBLIC_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: noromiAssets.coverBannerWide, width: 1672, height: 941, alt: brandName }],
  },
  twitter: {
    card: "summary_large_image",
    title: PUBLIC_TITLE,
    description: PUBLIC_DESCRIPTION,
    images: [noromiAssets.coverBannerWide],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "";
  const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";
  const ttPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <InitColorSchemeScript
          attribute={adminV2ColorSchemeSelector}
          defaultMode={adminV2DefaultThemeSettings.mode}
          modeStorageKey={adminV2ModeStorageKey}
          colorSchemeStorageKey={adminV2ColorSchemeStorageKey}
        />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <WhatsAppWidget />
        <AnalyticsScripts gaId={gaId} fbPixelId={fbPixelId} ttPixelId={ttPixelId} />
      </body>
    </html>
  );
}
