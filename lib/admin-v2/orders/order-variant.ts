function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitVariantTokens(value: string) {
  return value
    .split("/")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normalizeAdminV2ItemVariant(
  variant: string | null | undefined,
  size: string | null | undefined,
  color: string | null | undefined
) {
  const rawVariant = cleanText(variant);
  if (!rawVariant) return null;

  const tokens = splitVariantTokens(rawVariant);
  if (tokens.length <= 1) return rawVariant;

  const removable = [cleanText(size), cleanText(color)]
    .filter((value): value is string => Boolean(value))
    .map(normalizeToken);

  if (removable.length === 0) return rawVariant;

  const remaining = tokens.filter((token) => !removable.includes(normalizeToken(token)));
  return remaining.join(" / ") || null;
}
