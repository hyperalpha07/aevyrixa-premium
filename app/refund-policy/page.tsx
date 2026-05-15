import InfoPageShell from "@/app/components/info-page-shell";
import { getStoreSettings } from "@/app/lib/settings-store";

export const dynamic = "force-dynamic";

export default async function RefundPolicyPage() {
  const { settings } = await getStoreSettings();

  return (
    <InfoPageShell
      eyebrow="Refund Policy"
      title="3-Day Hygiene-Safe Support for Her Care Orders"
      intro="Aevyrixa Her Care keeps support fair and transparent while respecting hygiene-sensitive product handling."
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
          copy: "All support, exchange, or refund requests are reviewed by the Aevyrixa Her Care team before approval.",
        },
        {
          title: "Return Cost",
          copy: "If the issue is caused by Aevyrixa, we will support the correction. If the request is due to customer size preference or change of mind, delivery/return cost may be the customer's responsibility.",
        },
      ]}
    />
  );
}
