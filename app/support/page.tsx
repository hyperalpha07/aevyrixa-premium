import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { settings } = await loadStorefrontSettings();

  const contactCopy = settings.supportPhone
    ? `Reach us at ${settings.supportPhone} via call or WhatsApp. You can also visit the Contact page for all support details.`
    : "WhatsApp support details will be available soon. Visit the Contact page for current support options.";

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Support"
      title="3-Day Hygiene-Safe Support — we review every request personally."
      intro={`${settings.supportWindowMessage} Our team reviews each request individually and will guide you through the next steps.`}
      ctaLabel="View Contact Details"
      ctaHref="/contact"
      sections={[
        {
          title: "How to Request Support",
          items: [
            "Contact us via WhatsApp or phone within 3 days of receiving your order.",
            "Share your order reference number from the confirmation screen.",
            "Share the phone number used when placing the order.",
            "Describe the product concern clearly — wrong item, size concern, damaged packaging, or missing item.",
            "Attach photo or video proof where applicable.",
          ],
        },
        {
          title: "What Information to Provide",
          items: [
            "Order reference number (shown on your order confirmation screen).",
            "Phone number used at checkout.",
            "Product name, size, and colour ordered.",
            "Clear description of the concern.",
            "Photos or short video of the item and packaging if relevant.",
          ],
        },
        {
          title: "Eligible Support Conditions",
          copy: `${settings.hygieneReturnMessage} Items must be unused, unwashed, and in original packaging with tags and hygiene liner or seal intact where applicable.`,
        },
        {
          title: "Size Check Guidance",
          copy: "For size checking after delivery, try the product only over clean underwear or clean fitted clothing. Do not wear the item directly against skin. Contact support before trying if you are unsure about the size.",
        },
        {
          title: "Unboxing Proof Requirement",
          copy: "For wrong item, damaged item, missing item, or packaging issue claims, an unboxing video is required. The video must start before opening the parcel and clearly show the sealed package, the label or order reference, the opening process, and the product condition inside.",
        },
        {
          title: "Review Process",
          copy: `All support, exchange, or refund requests are individually reviewed by the ${settings.brandDisplayName} team. Our team will contact you on the phone number provided to confirm details and guide next steps. Review typically takes 1–3 working days after your request is received.`,
        },
        {
          title: "Used Product Policy",
          copy: "For hygiene and safety reasons, used, washed, stained, odour-marked, damaged, or directly worn intimate products cannot be returned or exchanged.",
        },
        {
          title: "Contact Support",
          copy: contactCopy,
        },
      ]}
    />
  );
}
