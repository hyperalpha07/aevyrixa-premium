import InfoPageShell from "@/app/components/info-page-shell";

export default function FaqPage() {
  return (
    <InfoPageShell
      eyebrow="FAQ"
      title="Clear answers before you choose your Her Care essentials."
      intro="Find practical guidance on sizing, washing, delivery, payment, order confirmation, and the 7-Day Money Back Guarantee."
      sections={[
        {
          title: "How do I choose a size?",
          copy: "Start with your usual underwear size. If you are between sizes, choose based on whether you prefer closer support or a softer relaxed fit.",
        },
        {
          title: "How should I wash reusable period panty products?",
          copy: "Rinse with cool water after wear, wash with mild detergent, and air dry fully. Avoid bleach, fabric softener, and high heat.",
        },
        {
          title: "What delivery experience should I expect?",
          copy: "Orders are reviewed first, then our team confirms delivery details before dispatch. Delivery packaging is handled discreetly.",
        },
        {
          title: "What does the guarantee cover?",
          copy: "Aevyrixa Her Care keeps a 7-Day Money Back Guarantee with fair, hygiene-sensitive conditions listed in the refund policy.",
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
