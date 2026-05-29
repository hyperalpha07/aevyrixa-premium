export type WishlistItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  addedAt: string;
};

export const WISHLIST_STORAGE_KEY = "aevyrixa-wishlist";
export const WISHLIST_UPDATED_EVENT = "aevyrixa:wishlist-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readWishlistItems() {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is WishlistItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as WishlistItem).slug === "string" &&
        typeof (item as WishlistItem).name === "string"
      );
    });
  } catch {
    return [];
  }
}

export function writeWishlistItems(items: WishlistItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT));
}

export function isWishlistItemSaved(items: WishlistItem[], productId: string, slug: string) {
  return items.some((item) => item.productId === productId || item.slug === slug);
}
