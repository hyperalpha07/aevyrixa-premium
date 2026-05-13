import InfoPageShell from "@/app/components/info-page-shell";

export default function ShippingPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Shipping Policy"
      title="Discreet delivery, confirmed before dispatch."
      intro="Shipping is currently handled through direct team review so customers receive clear confirmation before an order is prepared for delivery."
      sections={[
        {
          title: "Order review first",
          copy: "After checkout, our team reviews the order details and contacts the customer to confirm delivery information before dispatch preparation.",
        },
        {
          title: "Discreet delivery",
          copy: "Aevyrixa Her Care uses discreet delivery wording and respectful handling for women hygiene products.",
        },
        {
          title: "Cost and timing",
          copy: "Shipping cost and delivery timing will be confirmed by the team for now. Live automated shipping rules will be connected in a future backend phase.",
        },
        {
          title: "Customer details",
          copy: "Please provide a reachable phone number and complete address at checkout so confirmation can happen without delay.",
        },
      ]}
    />
  );
}
