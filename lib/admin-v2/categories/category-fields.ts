import type { AdminSettings, HomepageCategoryState } from "@/app/lib/admin-settings";

export const nativeCategoryDefinitions = [
  { id: "categoryReusablePeriodCare", label: "Reusable Period Care" },
  { id: "categoryComfortPanty", label: "Comfort Panty" },
  { id: "categorySoftSupportBra", label: "Soft Support Bra" },
  { id: "categoryNightwear", label: "Nightwear" },
  { id: "categoryHygieneEssentials", label: "Hygiene Essentials" },
  { id: "categoryBundles", label: "Bundles" },
  { id: "categoryNewArrivals", label: "New Arrivals" },
] as const;
export type CategoryId = typeof nativeCategoryDefinitions[number]["id"];
export type NativeCategory = {
  id: CategoryId;
  label: string;
  state: HomepageCategoryState;
  title: string;
  description: string;
  link: string;
  sortOrder: string;
};
export type CategoryUpdate = Pick<NativeCategory, "state" | "title" | "description" | "link" | "sortOrder">;

export function getNativeCategory(settings: AdminSettings, id: CategoryId): NativeCategory {
  const media = settings.homepageMediaSettings;
  const key = (suffix: string) => `${id}${suffix}` as keyof typeof media;
  return {
    id,
    label: nativeCategoryDefinitions.find(d => d.id === id)?.label ?? id,
    state: media[id],
    title: String(media[key("Title")] ?? ""),
    description: String(media[key("Description")] ?? ""),
    link: String(media[key("LinkUrl")] ?? ""),
    sortOrder: String(media[key("SortOrder")] ?? ""),
  };
}

export function validateNativeCategoryUpdate(raw: unknown): CategoryUpdate | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const state = o.state;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const description = typeof o.description === "string" ? o.description.trim() : "";
  const link = typeof o.link === "string" ? o.link.trim() : "";
  const sortOrder = typeof o.sortOrder === "string" ? o.sortOrder.trim() : "";
  const numericOrder = Number(sortOrder);
  if (!["active", "coming_soon", "hidden"].includes(String(state)) ||
     title.length < 2 || title.length > 100 || description.length > 400 ||
     !link.startsWith("/") || link.startsWith("//") || /[\\\s]/.test(link) ||
     !Number.isSafeInteger(numericOrder) || numericOrder < 0 || numericOrder > 999) return null;
  return { state: state as HomepageCategoryState, title, description, link, sortOrder };
}

export function mergeNativeCategory(settings: AdminSettings, id: CategoryId, update: CategoryUpdate): AdminSettings {
  const next = { ...settings.homepageMediaSettings } as Record<string, unknown>;
  next[id] = update.state;
  next[`${id}Title`] = update.title;
  next[`${id}Description`] = update.description;
  next[`${id}LinkUrl`] = update.link;
  next[`${id}SortOrder`] = update.sortOrder;
  return { ...settings, homepageMediaSettings: next as AdminSettings["homepageMediaSettings"] };
}
