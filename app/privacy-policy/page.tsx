import InfoPageShell from "@/app/components/info-page-shell";

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Privacy Policy"
      title="Simple privacy standards for an early-stage Her Care store."
      intro="Aevyrixa Her Care uses customer information only to process orders, provide support, and improve the customer experience."
      sections={[
        {
          title: "Information we collect",
          copy: "Checkout may ask for name, phone number, optional email, delivery area, address, order notes, and payment reference details where relevant.",
        },
        {
          title: "How information is used",
          items: [
            "To confirm and prepare customer orders.",
            "To provide delivery and payment support.",
            "To review support, exchange, refund, or product concern requests.",
          ],
        },
        {
          title: "No selling customer data",
          copy: "Aevyrixa Her Care does not sell customer data. Customer details are handled for store operations and support only.",
        },
        {
          title: "Future updates",
          copy: "As backend systems are added, this policy may be updated to explain any new account, tracking, analytics, or communication features.",
        },
      ]}
    />
  );
}
