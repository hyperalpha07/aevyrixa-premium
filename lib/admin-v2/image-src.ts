const knownVisualSlugs = new Set(["blush-violet", "cyan-night", "rose-gold"]);
const imageExtensionPattern = /\.(avif|gif|jpe?g|png|webp|svg)(\?.*)?$/i;

function trimmedText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function isPlainLabel(value: string) {
  return !value.startsWith("/") && !value.includes("/") && !imageExtensionPattern.test(value);
}

function hasProtocolLikePrefix(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function normalizeRootRelativePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (hasControlCharacters(value) || /\s/.test(value)) return null;
  return value;
}

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function productStoragePublicUrl(objectPath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  try {
    const base = new URL(supabaseUrl);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    const cleanPath = objectPath.replace(/^\/+/, "");
    if (!cleanPath || cleanPath.includes("..") || hasControlCharacters(cleanPath)) return null;
    base.pathname = `${base.pathname.replace(/\/$/, "")}/storage/v1/object/public/product-media/${cleanPath}`;
    return base.toString();
  } catch {
    return null;
  }
}

export function normalizeAdminV2ImageSrc(value: string | null | undefined) {
  const src = trimmedText(value);
  if (!src || knownVisualSlugs.has(src) || hasControlCharacters(src)) return null;

  const rootRelative = normalizeRootRelativePath(src);
  if (rootRelative) return rootRelative;

  const httpUrl = normalizeHttpUrl(src);
  if (httpUrl) return httpUrl;

  if (hasProtocolLikePrefix(src)) return null;
  if (isPlainLabel(src)) return null;
  if (!imageExtensionPattern.test(src)) return null;

  return productStoragePublicUrl(src);
}
