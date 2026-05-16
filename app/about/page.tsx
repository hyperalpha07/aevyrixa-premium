import InfoPageShell from "@/app/components/info-page-shell";
import { loadStorefrontSettings } from "@/app/lib/storefront-settings-loader";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { settings } = await loadStorefrontSettings();

  return (
    <InfoPageShell
      settings={settings}
      eyebrow={`About ${settings.brandShortName}`}
      title="Premium Her Care, designed for comfort, discretion, and everyday confidence."
      intro={`${settings.brandDisplayName} is a premium women's comfort, hygiene, reusable care, and intimate essentials brand built for customers who want practical care to feel refined, considered, and easy to trust.`}
      sections={[
        {
          title: "Brand story",
          copy: `${settings.brandShortName} started with a simple belief: intimate care products should feel personal without feeling clinical, and reusable choices should look and feel elevated enough for everyday life.`,
        },
        {
          title: "Her Care focus",
          copy: "Our store brings together reusable period care, comfort wear, hygiene essentials, and intimate care — all designed for comfort, discretion, and calm routines.",
        },
        {
          title: "What guides us",
          items: [
            "Comfort-first product selection for everyday movement.",
            settings.privacyPackagingMessage,
            "Reusable care guidance that stays clear, practical, and non-medical.",
          ],
        },
        {
          title: "Promise",
          copy: `We keep the experience transparent: clear product information, ${settings.supportWindowMessage}, and direct order confirmation before dispatch.`,
        },
      ]}
    />
  );
}
