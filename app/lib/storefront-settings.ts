import {
  defaultAdminSettings,
  normalizeAdminSettings,
  whatsappHref,
  type AdminSettings,
} from "@/app/lib/admin-settings";

export type StorefrontSocialLink = {
  label: "Facebook" | "Instagram" | "TikTok";
  href: string;
};

export type StorefrontSettings = AdminSettings & {
  brandDisplayName: string;
  brandShortName: string;
  brandTagline: string;
  footerDescription: string;
  supportContact: string;
  whatsappUrl: string;
  socialLinks: StorefrontSocialLink[];
  trustBadges: string[];
};

function shortBrandName(storeName: string) {
  return storeName.replace(/\s+Her\s+Care\s*$/i, "").trim() || storeName;
}

function footerSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function footerDeliveryText(brandTagline: string, deliveryText: string) {
  const trimmed = deliveryText.trim();
  if (!/bangladesh$/i.test(brandTagline.trim())) return trimmed;

  return trimmed.replace(/^Bangladesh\s+delivery\b/i, "Delivery");
}

export function normalizeStorefrontSettings(value: unknown): StorefrontSettings {
  const settings = normalizeAdminSettings(value);
  const brandDisplayName = settings.storeName || defaultAdminSettings.storeName;
  const brandShortName = shortBrandName(brandDisplayName);
  const brandTagline =
    settings.storeProfile.brandSubtitle ||
    settings.appearanceSettings.homepageHeroSubtitle ||
    defaultAdminSettings.storeProfile.brandSubtitle;
  const supportContact = settings.supportWhatsApp || settings.supportPhone;
  const socialLinks: StorefrontSocialLink[] = [
    ["Facebook", settings.facebookPageUrl],
    ["Instagram", settings.instagramUrl],
    ["TikTok", settings.tiktokUrl],
  ]
    .filter((link): link is [StorefrontSocialLink["label"], string] =>
      Boolean(link[1])
    )
    .map(([label, href]) => ({ label, href }));

  return {
    ...settings,
    brandDisplayName,
    brandShortName,
    brandTagline,
    footerDescription: [
      brandTagline,
      footerDeliveryText(brandTagline, settings.deliveryCoverageText),
      settings.privacyPackagingMessage,
    ]
      .map(footerSentence)
      .filter(Boolean)
      .join(" "),
    supportContact,
    whatsappUrl: whatsappHref(settings.supportWhatsApp),
    socialLinks,
    trustBadges: [
      settings.privacyPackagingMessage,
      settings.supportWindowMessage,
      "Comfort Fit",
      "Reusable Protection",
    ],
  };
}

export const defaultStorefrontSettings =
  normalizeStorefrontSettings(defaultAdminSettings);

export async function fetchStorefrontSettings() {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const payload = (await response.json()) as { settings?: unknown };
    return payload.settings
      ? normalizeStorefrontSettings(payload.settings)
      : defaultStorefrontSettings;
  } catch {
    return defaultStorefrontSettings;
  }
}
