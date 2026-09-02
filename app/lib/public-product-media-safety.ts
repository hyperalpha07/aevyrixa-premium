// Temporary launch-safety filter for public storefront product imagery only.
// Keep the source media in Supabase unchanged so administrators can review or
// restore an asset after its branding and product claims have been verified.
export const TEMPORARY_PUBLIC_PRODUCT_IMAGE_DENYLIST = [
  "516030da-8b6a-4950-a3eb-5269c6cd1651.jpg",
  "9b248a04-b653-4989-a2b8-66f9a3f76c95.jpg",
  "0b69b9ab-2f46-484b-b56d-b82cf16604b1.jpg",
  "536b4128-9b41-4ba2-8944-6b83f0422f9e.jpg",
  "a149ded5-c3d7-4046-b3c8-e93658ffe731.jpg",
  "476f49f3-cada-4ec9-b27a-f99e1c26947b.jpg",
  "5ddd3a84-e2ef-45dd-9174-cef8dd39b543.jpg",
  "86076b4e-bd9f-451a-98ee-89866d3a21a1.jpg",
  "89536c8d-043e-4060-9e17-440620721a91.jpg",
  "22d0082c-ef11-433a-8320-c088926121e9.jpg",
] as const;

const deniedPublicProductImageFilenames = new Set<string>(
  TEMPORARY_PUBLIC_PRODUCT_IMAGE_DENYLIST
);

function imageFilename(url: string) {
  return url.trim().split(/[?#]/, 1)[0].split("/").pop()?.toLowerCase() ?? "";
}

export function isPublicProductImageAllowed(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  return !deniedPublicProductImageFilenames.has(imageFilename(url));
}

export function filterPublicProductImageUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter(isPublicProductImageAllowed);
}
