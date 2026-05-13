import InfoPageShell from "@/app/components/info-page-shell";

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Terms"
      title="Clear terms for browsing and ordering from Aevyrixa Her Care."
      intro="These terms keep the early-stage customer experience transparent while product, order, and backend systems continue to develop."
      sections={[
        {
          title: "Website use",
          copy: "Customers should use this website for lawful browsing, product review, and order submission only.",
        },
        {
          title: "Order confirmation",
          copy: "Submitting checkout details creates an order request. The Aevyrixa team confirms details before dispatch preparation.",
        },
        {
          title: "Product availability",
          copy: "Product availability, colors, sizes, pricing, and offers may change as inventory is reviewed.",
        },
        {
          title: "Payment and delivery",
          copy: "Available payment options are shown during checkout. Delivery cost, timing, and dispatch details may be confirmed directly by the team.",
        },
        {
          title: "Policies",
          copy: "Refund, shipping, privacy, and guarantee details are provided on the related policy pages and may be updated as operations mature.",
        },
        {
          title: "Policy changes",
          copy: "Aevyrixa Her Care may update website content and policies as the store grows, especially when backend features are added.",
        },
      ]}
    />
  );
}
