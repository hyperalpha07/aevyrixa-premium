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
          copy: "Submitting checkout details creates an order request. The Aevyrixa Her Care team confirms product, size, payment, and delivery details before dispatch.",
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
          copy: "Support, exchange, or refund eligibility depends on unused condition, original packaging, hygiene liner/seal where applicable, proof, and support review.",
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
          copy: "Aevyrixa Her Care may update website content and policies as operations mature.",
        },
      ]}
    />
  );
}
