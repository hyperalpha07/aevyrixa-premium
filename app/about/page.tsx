import InfoPageShell from "@/app/components/info-page-shell";

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="About Aevyrixa"
      title="Reusable Her Care, designed with comfort and discretion."
      intro="Aevyrixa Her Care is building a premium reusable period panty and women hygiene experience for customers who want practical care to feel refined, considered, and easy to trust."
      sections={[
        {
          title: "Brand story",
          copy: "Aevyrixa started with a simple belief: intimate care products should feel personal without feeling clinical, and reusable choices should look and feel elevated enough for everyday life.",
        },
        {
          title: "Her Care focus",
          copy: "Our store focuses on reusable period panty essentials and women hygiene care that support comfort, discretion, and calm routines.",
        },
        {
          title: "What guides us",
          items: [
            "Comfort-first product selection for everyday movement.",
            "Discreet delivery and support language that respects privacy.",
            "Reusable care guidance that stays clear, practical, and non-medical.",
          ],
        },
        {
          title: "Promise",
          copy: "We keep the experience transparent: clear product information, 3-Day Hygiene-Safe Support, and direct order confirmation before dispatch.",
        },
      ]}
    />
  );
}
