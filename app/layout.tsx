import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/components/cart/cart-context";
import CartDrawer from "@/app/components/cart/cart-drawer";
import AnalyticsScripts from "@/app/components/analytics-scripts";
import WhatsAppWidget from "@/app/components/whatsapp-widget";
import AevyrixaGlobalArt from "@/app/components/aevyrixa-global-art";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.aevyrixa.com";
const OG_FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aevyrixa Her Care",
    template: "%s | Aevyrixa Her Care",
  },
  description:
    "Aevyrixa Her Care is a premium women's comfort, hygiene, reusable care, and intimate essentials brand in Bangladesh. Discreet privacy packaging, careful order review, and 3-Day Hygiene-Safe Support.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "Aevyrixa Her Care",
    title: "Aevyrixa Her Care",
    description:
      "Premium women's comfort, hygiene, reusable care, and intimate essentials with discreet Bangladesh delivery.",
    url: SITE_URL,
    images: [{ url: OG_FALLBACK_IMAGE, width: 1200, height: 630, alt: "Aevyrixa Her Care" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aevyrixa Her Care",
    description:
      "Premium women's comfort, hygiene, reusable care, and intimate essentials with discreet Bangladesh delivery.",
    images: [OG_FALLBACK_IMAGE],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AevyrixaGlobalArt />
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
