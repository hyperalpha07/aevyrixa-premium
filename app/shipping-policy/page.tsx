import InfoPageShell from "@/app/components/info-page-shell";

export default function ShippingPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Shipping Policy"
      title="Discreet Delivery Across Bangladesh"
      intro="Orders are reviewed and confirmed before dispatch so delivery details stay clear and private."
      sections={[
        {
          title: "Bangladesh Delivery",
          copy: "Estimated delivery is 2-7 working days across Bangladesh after order confirmation.",
        },
        {
          title: "Discreet Privacy Packaging",
          copy: "Your order is packed with privacy-focused handling. Outer packaging will not expose sensitive product details.",
        },
        {
          title: "Delivery Review",
          copy: "Delivery cost, courier details, and estimated timing are confirmed by our team before dispatch.",
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
