import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function ShippingPolicyPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow="Shipping Policy"
      title="Discreet Delivery Across Bangladesh"
      intro={settings.deliveryCoverageText}
      sections={[
        {
          title: "Bangladesh Delivery",
          copy: settings.deliveryCoverageText,
        },
        {
          title: "Discreet Privacy Packaging",
          copy: settings.privacyPackagingMessage,
        },
        {
          title: "Delivery Review",
          copy: `${settings.codMessage} Delivery cost, courier details, and estimated timing are confirmed by our team before dispatch.`,
        },
        {
          title: "Parcel Check",
          copy: "Please check the outer parcel condition at delivery. If the package looks damaged, wet, opened, or tampered with, take photos/video before opening.",
        },
        {
          title: "Possible Delays",
          copy: "Remote areas, courier delays, holidays, weather, or high order volume may affect delivery timing.",
        },
      ]}
    />
  );
}
