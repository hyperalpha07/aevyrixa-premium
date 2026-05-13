import InfoPageShell from "@/app/components/info-page-shell";

export default function RefundPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Refund Policy"
      title="A fair 7-Day Money Back Guarantee for Her Care orders."
      intro="Aevyrixa Her Care keeps the refund process professional and transparent while respecting hygiene-sensitive product handling."
      sections={[
        {
          title: "7-Day Money Back Guarantee",
          copy: "Customers may request support under the 7-Day Money Back Guarantee within 7 days of receiving the order.",
        },
        {
          title: "Hygiene-sensitive conditions",
          items: [
            "Products must be unused, unwashed, and returned with original packaging where return is requested.",
            "Opened or used intimate care products may be limited to replacement or store support depending on the issue.",
            "Fit, comfort, or product concerns should be reported with the order reference and customer phone number.",
          ],
        },
        {
          title: "Fair review",
          copy: "Each request is reviewed by the Aevyrixa team. Approved refunds, replacements, or adjustments are confirmed directly with the customer.",
        },
        {
          title: "What to prepare",
          copy: "Keep your order reference, phone number, product condition details, and any relevant photos ready when contacting support.",
        },
      ]}
    />
  );
}
