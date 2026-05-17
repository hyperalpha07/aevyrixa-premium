import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="FAQ"
      title="Clear answers before you choose your Her Care essentials."
      intro={`Practical guidance on products, sizing, delivery, payment, and ${settings.supportWindowMessage}.`}
      sections={[
        {
          title: "What is Aevyrixa Her Care?",
          copy: `${settings.brandDisplayName} is a premium women's comfort, hygiene, reusable care, and intimate essentials brand. We deliver discreetly across Bangladesh with direct order confirmation before dispatch.`,
        },
        {
          title: "What products do you sell?",
          copy: "Our store carries reusable period care, comfort panties, hygiene essentials, and intimate care products — all selected for comfort, discretion, and everyday confidence.",
        },
        {
          title: "How do I choose a size?",
          copy: "Start with your usual underwear size. If you are between sizes, we recommend sizing up. Contact us before ordering if you need size guidance — our team is happy to help.",
        },
        {
          title: "Can I check size after delivery?",
          copy: "Yes. For size checking, try the product only over clean underwear or clean fitted clothing. Do not wear it directly against skin. Items must remain unused, unwashed, and in original packaging to remain eligible for size-related support.",
        },
        {
          title: "What is 3-Day Hygiene-Safe Support?",
          copy: settings.supportWindowMessage,
        },
        {
          title: "What are the support eligibility conditions?",
          copy: settings.hygieneReturnMessage,
        },
        {
          title: "Can used items be exchanged or refunded?",
          copy: "Used, washed, stained, odour-marked, damaged, or directly worn intimate products cannot be exchanged or refunded for hygiene and safety reasons.",
        },
        {
          title: "What proof is needed for wrong or damaged orders?",
          copy: "Wrong item, damaged item, missing item, or packaging issue claims require an unboxing video that starts before parcel opening and clearly shows the sealed package, label or order reference, opening process, and product condition.",
        },
        {
          title: "How does delivery work?",
          copy: settings.deliverySettings.estimatedDeliveryTime,
        },
        {
          title: "Do you offer privacy packaging?",
          copy: settings.privacyPackagingMessage,
        },
        {
          title: "How can I track my order?",
          copy: "Use the Track Order page and enter your order reference number and phone number. Our team also confirms dispatch details directly before sending your parcel.",
        },
        {
          title: "What payment methods are available?",
          copy: `${settings.codMessage} Enabled mobile wallet and bank transfer options are shown during checkout.`,
        },
        {
          title: "Will I receive order confirmation?",
          copy: "Yes. After checkout, your order reference appears on the confirmation screen. Our team will confirm delivery details directly before dispatch.",
        },
      ]}
    />
  );
}
