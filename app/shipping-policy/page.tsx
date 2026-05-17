import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function ShippingPolicyPage() {
  const { settings } = await loadStorefrontSettings();

  const insideCharge = settings.deliverySettings.insideDhakaDeliveryCharge;
  const outsideCharge = settings.deliverySettings.outsideDhakaDeliveryCharge;

  const chargeItems: string[] = [];
  if (insideCharge) chargeItems.push(`Inside Dhaka: BDT ${insideCharge}`);
  if (outsideCharge) chargeItems.push(`Outside Dhaka / all other areas: BDT ${outsideCharge}`);
  chargeItems.push(
    "Delivery charge may vary by location or order size. Our team will confirm the exact charge before dispatch."
  );

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Shipping Policy"
      title="Discreet Delivery Across Bangladesh"
      intro={settings.deliveryCoverageText}
      sections={[
        {
          title: "Estimated Delivery Time",
          copy: settings.deliverySettings.estimatedDeliveryTime,
        },
        {
          title: "Delivery Charges",
          items: chargeItems,
        },
        {
          title: "Discreet Privacy Packaging",
          copy: settings.privacyPackagingMessage,
        },
        {
          title: "Order Confirmation Before Dispatch",
          copy: `Our team confirms your phone number and delivery address before sending any parcel. ${settings.codMessage}`,
        },
        {
          title: "Parcel Check at Delivery",
          copy: "Please check the outer parcel condition at delivery. If the package looks damaged, wet, opened, or tampered with, take photos or video before opening and contact support.",
        },
        {
          title: "Possible Delays",
          copy: "Remote areas, courier delays, public holidays, weather conditions, or high order volume may affect delivery timing. Our team will keep you updated where possible.",
        },
      ]}
    />
  );
}
