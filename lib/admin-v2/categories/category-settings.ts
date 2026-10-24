import type { HomepageMediaSettings, HomepageCategoryMediaMode, HomepageCategoryState } from "@/app/lib/admin-settings";

export const adminV2CategoryDefinitions = [
  { prefix: "categoryReusablePeriodCare", slug: "reusable", label: "Reusable Period Care" },
  { prefix: "categoryComfortPanty", slug: "comfort-panty", label: "Comfort Panty" },
  { prefix: "categorySoftSupportBra", slug: "soft-bra", label: "Soft Support Bra" },
  { prefix: "categoryNightwear", slug: "nightwear", label: "Nightwear" },
  { prefix: "categoryHygieneEssentials", slug: "hygiene", label: "Hygiene Essentials" },
  { prefix: "categoryBundles", slug: "bundles", label: "Bundles" },
  { prefix: "categoryNewArrivals", slug: "new-arrivals", label: "New Arrivals" },
] as const;

export const adminV2CategoryModes: HomepageCategoryMediaMode[] =
  ["animation", "image_text", "video_text", "background_media_text", "media_only"];

export type AdminV2CategoryCard = {
  slug: string;
  label: string;
  status: HomepageCategoryState;
  title: string;
  description: string;
  linkUrl: string;
  sortOrder: string;
  imageUrl: string;
  videoUrl: string;
  mediaMode: HomepageCategoryMediaMode;
  altText: string;
};

export function extractAdminV2Categories(settings: HomepageMediaSettings): AdminV2CategoryCard[] {
  const data = settings as unknown as Record<string, string>;
  return adminV2CategoryDefinitions.map(({ prefix, slug, label }) => ({
    slug, label,
    status: data[prefix] as HomepageCategoryState,
    title: data[`${prefix}Title`],
    description: data[`${prefix}Description`],
    linkUrl: data[`${prefix}LinkUrl`],
    sortOrder: data[`${prefix}SortOrder`],
    imageUrl: data[`${prefix}ImageUrl`],
    videoUrl: data[`${prefix}VideoUrl`],
    mediaMode: data[`${prefix}MediaMode`] as HomepageCategoryMediaMode,
    altText: data[`${prefix}AltText`],
  }));
}

export function mergeAdminV2Categories(
  settings: HomepageMediaSettings,
  cards: AdminV2CategoryCard[]
): HomepageMediaSettings {
  const merged: Record<string,string|boolean|object> = { ...settings };
  for (const definition of adminV2CategoryDefinitions) {
    const card = cards.find((entry) => entry.slug === definition.slug);
    if (!card) throw new Error(`Missing category ${definition.slug}.`);
    const p=definition.prefix;
    merged[p]=card.status;
    merged[`${p}Title`]=card.title;
    merged[`${p}Description`]=card.description;
    merged[`${p}LinkUrl`]=card.linkUrl;
    merged[`${p}SortOrder`]=card.sortOrder;
    merged[`${p}ImageUrl`]=card.imageUrl;
    merged[`${p}VideoUrl`]=card.videoUrl;
    merged[`${p}MediaMode`]=card.mediaMode;
    merged[`${p}AltText`]=card.altText;
  }
  return merged as HomepageMediaSettings;
}

export function validateAdminV2CategoryCards(cards: AdminV2CategoryCard[]): string | null {
  if (cards.length !== adminV2CategoryDefinitions.length ||
    new Set(cards.map(c=>c.slug)).size !== adminV2CategoryDefinitions.length ||
    cards.some((c,i)=>c.slug !== adminV2CategoryDefinitions[i].slug)) return "The seven category identities are invalid.";
  const orders=new Set<number>();
  const safeUrl=(text:string)=>!text ||
    (text.startsWith("/") && !text.startsWith("//") && !/[\\\\\u0000-\u001f]/.test(text)) ||
    /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(text);
  for (const card of cards) {
    if (!["active","coming_soon","hidden"].includes(card.status)) return "Invalid category status.";
    if (!adminV2CategoryModes.includes(card.mediaMode)) return "Invalid media mode.";
    if (!card.title.trim() || card.title.length>100) return `Valid title required for ${card.label}.`;
    if (card.description.length>400 || card.altText.length>240) return `Description or alt text too long for ${card.label}.`;
    if ([card.linkUrl,card.imageUrl,card.videoUrl].some(x=>x.length>500 || !safeUrl(x))) return `Invalid URL for ${card.label}.`;
    if (card.status==="active" && !card.linkUrl) return `An active ${card.label} requires a category link.`;
    if (!/^[1-9]\d{0,2}$/.test(card.sortOrder)) return `Sort order must be 1–999 for ${card.label}.`;
    const n=Number(card.sortOrder);
    if (orders.has(n)) return "Category sort orders must be unique.";
    orders.add(n);
  }
  return null;
}
