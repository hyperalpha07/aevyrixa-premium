import InfoPageShell from "@/app/components/info-page-shell";

export default function FaqPage() {
  return (
    <InfoPageShell
      eyebrow="FAQ"
      title="Clear answers before you choose your Her Care essentials."
      intro="Find practical guidance on sizing, washing, delivery, payment, order confirmation, and 3-Day Hygiene-Safe Support."
      sections={[
        {
          title: "How do I choose a size?",
          copy: "Start with your usual underwear size. For size checking after delivery, try the product only over clean underwear or clean fitted clothing.",
        },
        {
          title: "How should I wash reusable period panty products?",
          copy: "Rinse with cool water after wear, wash with mild detergent, and air dry fully. Avoid bleach, fabric softener, and high heat.",
        },
        {
          title: "What delivery experience should I expect?",
          copy: "Orders are reviewed first, then our team confirms delivery details before dispatch. Delivery is estimated 2-7 working days across Bangladesh after confirmation, and privacy packaging does not expose sensitive product details.",
        },
        {
          title: "What does 3-Day Hygiene-Safe Support cover?",
          copy: "Request support within 3 days of delivery for size issues, wrong item, damaged item, or order concerns. Approval depends on product condition, packaging, proof, and support review.",
        },
        {
          title: "Can used items be exchanged or refunded?",
          copy: "Used, washed, stained, odor-marked, damaged, or directly worn intimate products cannot be exchanged or refunded for hygiene and safety reasons.",
        },
        {
          title: "What proof is needed for wrong or damaged orders?",
          copy: "Wrong item, damaged item, missing item, or packaging issue claims require an unboxing video that starts before parcel opening and clearly shows the sealed package, label/order reference, opening process, and product condition.",
        },
        {
          title: "Which payment methods are available?",
          copy: "Checkout currently supports Cash on Delivery, Mobile Wallet Payment, and Bank Transfer options shown during checkout.",
        },
        {
          title: "Will I receive order confirmation?",
          copy: "Yes. After checkout, your order reference appears on the confirmation screen and our team will confirm details directly before dispatch.",
        },
      ]}
    />
  );
}
