type ProductOptionSource = {
  id: string;
  sizes: string[];
  colors: string[];
  absorbency?: string;
  absorbencyOptions: string[];
};

export type ProductSelections = {
  size?: string;
  color?: string;
  absorbency?: string;
};

export function normalizeProductOptions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (typeof value !== "string") return [];
    const clean = value.trim();
    const key = clean.toLocaleLowerCase();
    if (!clean || seen.has(key)) return [];
    seen.add(key);
    return [clean];
  });
}

export function initialProductOption(values: string[]): string {
  const options = normalizeProductOptions(values);
  return options.length === 1 ? options[0] : "";
}

function validSelection(label: string, selected: string | undefined, values: string[]) {
  const options = normalizeProductOptions(values);
  const value = selected?.trim() ?? "";
  if (options.length > 1 && !value) return `Please select a ${label}.`;
  if (value && !options.some((option) => option.toLocaleLowerCase() === value.toLocaleLowerCase())) {
    return `The selected ${label} is no longer available.`;
  }
  return null;
}

export function validateProductSelections(product: ProductOptionSource, selections: ProductSelections) {
  const absorbencyOptions = normalizeProductOptions(product.absorbencyOptions);
  const allowedAbsorbency = absorbencyOptions.length ? absorbencyOptions : normalizeProductOptions([product.absorbency]);
  return [
    validSelection("size", selections.size, product.sizes),
    validSelection("color", selections.color, product.colors),
    validSelection("absorbency", selections.absorbency, allowedAbsorbency),
  ].filter((error): error is string => Boolean(error));
}

function linePart(value: string | undefined) {
  return encodeURIComponent(value?.trim().toLocaleLowerCase() || "-");
}

export function productCartLineId(productId: string, selections: ProductSelections) {
  return [productId, linePart(selections.size), linePart(selections.color), linePart(selections.absorbency)].join("::");
}

export function productVariantSummary(selections: ProductSelections) {
  return [selections.size, selections.color, selections.absorbency].map((value) => value?.trim()).filter(Boolean).join(" / ");
}

export function colorImageUrl(color: string | undefined, colorOptions: unknown, fallback?: string) {
  const selected = color?.trim().toLocaleLowerCase();
  if (!selected) return fallback;
  const options = Array.isArray(colorOptions) ? colorOptions : [];
  const option = options.find((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
    const name = (item as Record<string, unknown>).name;
    return typeof name === "string" && name.trim().toLocaleLowerCase() === selected;
  }) as Record<string, unknown> | undefined;
  return typeof option?.mediaUrl === "string" && option.mediaUrl.trim() ? option.mediaUrl.trim() : fallback;
}
