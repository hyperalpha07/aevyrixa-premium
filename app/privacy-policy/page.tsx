import type { Metadata } from "next";
import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Aevyrixa Her Care",
  description:
    "Aevyrixa Her Care privacy policy. Customer information is used only to process orders, provide support, and improve the experience. No customer data is sold.",
};

export default async function PrivacyPolicyPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Privacy Policy"
      title="Simple privacy standards for an early-stage Her Care store."
      intro={`${settings.brandDisplayName} uses customer information only to process orders, provide support, and improve the customer experience.`}
      sections={[
        {
          title: "Information we collect",
          copy: "Checkout may ask for name, phone number, optional email, delivery area, address, order notes, and payment reference details where relevant.",
        },
        {
          title: "How information is used",
          items: [
            "To confirm and prepare customer orders.",
            `To provide delivery and payment support through ${settings.supportPhone || settings.supportEmail || "configured support channels"}.`,
            "To review support, exchange, refund, or product concern requests.",
          ],
        },
        {
          title: "No selling customer data",
          copy: `${settings.brandDisplayName} does not sell customer data. Customer details are handled for store operations and support only.`,
        },
        {
          title: "Future updates",
          copy: "As backend systems are added, this policy may be updated to explain any new account, tracking, analytics, or communication features.",
        },
      ]}
    />
  );
}
