import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function RefundPolicyPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Refund Policy"
      title={`${settings.supportWindowMessage} for Her Care Orders`}
      intro={`${settings.brandDisplayName} keeps support fair and transparent while respecting hygiene-sensitive product handling.`}
      sections={[
        {
          title: "3-Day Support Window",
          copy: settings.supportWindowMessage,
        },
        {
          title: "Hygiene-Sensitive Conditions",
          copy: settings.hygieneReturnMessage,
        },
        {
          title: "Size Check Rule",
          copy: "For size checking, try the product only over clean underwear or clean fitted clothing. Direct skin contact, washing, staining, odor, removed hygiene liner/seal, or damaged packaging may make the item ineligible for exchange/refund.",
        },
        {
          title: "Unboxing Proof",
          copy: "For wrong item, missing item, damaged item, or packaging issue claims, an unboxing video is required. The video should start before opening the parcel and clearly show the sealed package, label/order reference, opening process, and product condition.",
        },
        {
          title: "Used Product Policy",
          copy: "For hygiene and safety reasons, used, washed, stained, damaged, odor-marked, or directly worn intimate products cannot be returned or exchanged.",
        },
        {
          title: "Review First",
          copy: `All support, exchange, or refund requests are reviewed by the ${settings.brandDisplayName} team before approval.`,
        },
        {
          title: "Return Cost",
          copy: `If the issue is caused by ${settings.brandShortName}, we will support the correction. If the request is due to customer size preference or change of mind, delivery/return cost may be the customer's responsibility.`,
        },
      ]}
    />
  );
}
