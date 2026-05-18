import {
  defaultAdminSettings,
  normalizeAdminSettings,
  whatsappHref,
  type AdminSettings,
  type HomepageCategoryState,
} from "@/app/lib/admin-settings";

export type StorefrontSocialLink = {
  label: "Facebook" | "Instagram" | "TikTok" | "YouTube";
  href: string;
};

export type CategoryCmsEntry = {
  key: string;
  slug: string;
  title: string;
  description: string;
  linkUrl: string;
  status: HomepageCategoryState;
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
  allCategories: CategoryCmsEntry[];
  activeCategories: CategoryCmsEntry[];
  shopFooterCategories: CategoryCmsEntry[];
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

const categoryDefs = [
  { key: "categoryReusablePeriodCare", slug: "reusable-period-care" },
  { key: "categoryComfortPanty", slug: "comfort-panty" },
  { key: "categorySoftSupportBra", slug: "soft-support-bra" },
  { key: "categoryNightwear", slug: "nightwear" },
  { key: "categoryHygieneEssentials", slug: "hygiene-essentials" },
  { key: "categoryBundles", slug: "bundles" },
  { key: "categoryNewArrivals", slug: "new-arrivals" },
] as const;

function buildCategories(settings: AdminSettings): CategoryCmsEntry[] {
  const hms = settings.homepageMediaSettings;
  return categoryDefs.map(({ key, slug }) => {
    const status = hms[key as keyof typeof hms] as HomepageCategoryState;
    const titleKey = `${key}Title` as keyof typeof hms;
    const descKey = `${key}Description` as keyof typeof hms;
    const linkKey = `${key}LinkUrl` as keyof typeof hms;
    return {
      key,
      slug,
      title: (hms[titleKey] as string) || key,
      description: (hms[descKey] as string) || "",
      linkUrl: (hms[linkKey] as string) || "",
      status,
    };
  });
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
    ["YouTube", settings.youtubeUrl],
  ]
    .filter((link): link is [StorefrontSocialLink["label"], string] =>
      Boolean(link[1])
    )
    .map(([label, href]) => ({ label, href }));

  const allCategories = buildCategories(settings);
  const activeCategories = allCategories.filter((c) => c.status === "active");
  const shopFooterCategories = activeCategories.filter((c) => c.linkUrl);

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
    allCategories,
    activeCategories,
    shopFooterCategories,
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
