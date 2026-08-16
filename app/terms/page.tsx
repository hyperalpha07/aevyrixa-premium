import type { Metadata } from "next";
import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";
import { brandName } from "@/configs/brand/noromi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Terms & Conditions | ${brandName}` },
  description:
    "Terms and conditions for browsing and ordering from Noromi Care, including delivery, payment, and hygiene-sensitive product handling.",
};

export default async function TermsPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Terms"
      title={`Clear terms for browsing and ordering from ${brandName}.`}
      intro="These terms keep the early-stage customer experience transparent while product, order, and backend systems continue to develop."
      sections={[
        {
          title: "Website use",
          copy: "Customers should use this website for lawful browsing, product review, and order submission only.",
        },
        {
          title: "Order confirmation",
          copy: `Submitting checkout details creates an order request. The ${brandName} team confirms product, size, payment, and delivery details before dispatch.`,
        },
        {
          title: "Product availability",
          copy: "Product availability, price, color, and size may change before confirmation as inventory and order details are reviewed.",
        },
        {
          title: "Payment and delivery",
          copy: "Available payment options are shown during checkout. Delivery cost, timing, and dispatch details may be confirmed directly by the team.",
        },
        {
          title: "Hygiene-sensitive eligibility",
          copy: `${settings.supportWindowMessage} ${settings.hygieneReturnMessage}`,
        },
        {
          title: "Used intimate products",
          copy: "Used, washed, stained, damaged, odor-marked, or directly worn intimate products cannot be returned or exchanged.",
        },
        {
          title: "Policies",
          copy: "Refund, shipping, privacy, and support details are provided on the related policy pages and may be updated as operations mature.",
        },
        {
          title: "Policy changes",
          copy: `${brandName} may update website content and policies as operations mature.`,
        },
      ]}
    />
  );
}
