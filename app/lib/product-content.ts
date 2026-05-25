export type ProductSectionMediaKey = "story" | "promise" | "care" | "fit";

export type ProductMediaFit = "contain" | "cover" | "smart";

export type ProductSectionMedia = {
  url: string;
  type: "image" | "video" | "auto";
  alt: string;
  fit: ProductMediaFit;
  position?: ProductMediaPosition;
};

export type ProductSectionMediaMap = Partial<Record<ProductSectionMediaKey, ProductSectionMedia>>;

export type ProductMediaPosition = "center" | "top" | "bottom";

export type ProductDescriptionMediaItem = ProductSectionMedia & {
  id: string;
  caption: string;
  visible: boolean;
  sortOrder?: number;
};

export type ProductContentBlock = {
  id: string;
  type:
    | "text"
    | "image"
    | "video"
    | "image-text"
    | "video-text"
    | "feature-grid"
    | "comparison";
  title: string;
  subtitle: string;
  text: string;
  longText: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "auto";
  mediaAlt: string;
  mediaFit: ProductMediaFit;
  mediaPosition: "left" | "right" | "top" | "full";
  mediaObjectPosition: ProductMediaPosition;
  layout: "media-left" | "media-right" | "media-top" | "full-width" | "grid";
  visible: boolean;
  sortOrder?: number;
  ctaLabel: string;
  ctaLink: string;
};

export type ProductColorOption = {
  id: string;
  name: string;
  hex: string;
  secondaryHex: string;
  swatchImageUrl: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "auto";
  visible: boolean;
  stockQuantity?: number;
  sortOrder?: number;
};

export type ProductBenefitItem = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  badge: string;
  sortOrder?: number;
  visible: boolean;
};

export type ProductFaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder?: number;
  visible: boolean;
};

export type ProductVisualThemeSettings = {
  accentColor: string;
  secondaryAccent: string;
  mediaGlowColor: string;
};

export type ProductCmsContent = {
  sectionMedia: ProductSectionMediaMap;
  descriptionMedia: ProductDescriptionMediaItem[];
  contentBlocks: ProductContentBlock[];
  colorOptions: ProductColorOption[];
  benefitItems: ProductBenefitItem[];
  faqItems: ProductFaqItem[];
  visualThemeSettings: ProductVisualThemeSettings;
};

export const productSectionLabels: Record<ProductSectionMediaKey, string> = {
  story: "Product Story",
  promise: "Product Promise",
  care: "Care Guide",
  fit: "Fit / Size Guide",
};

export const defaultVisualThemeSettings: ProductVisualThemeSettings = {
  accentColor: "",
  secondaryAccent: "",
  mediaGlowColor: "",
};

export function createEmptySectionMedia(): ProductSectionMedia {
  return { url: "", type: "auto", alt: "", fit: "contain", position: "center" };
}

export function createDescriptionMediaItem(url = ""): ProductDescriptionMediaItem {
  const id = `desc-media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    url,
    type: "auto",
    alt: "",
    caption: "",
    fit: "contain",
    position: "center",
    visible: true,
  };
}

export function createContentBlock(): ProductContentBlock {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    type: "image-text",
    title: "",
    subtitle: "",
    text: "",
    longText: "",
    mediaUrl: "",
    mediaType: "auto",
    mediaAlt: "",
    mediaFit: "contain",
    mediaPosition: "right",
    mediaObjectPosition: "center",
    layout: "media-right",
    visible: true,
    ctaLabel: "",
    ctaLink: "",
  };
}

export function createColorOption(name = ""): ProductColorOption {
  const id = `color-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name,
    hex: safeColorHex(name),
    secondaryHex: "",
    swatchImageUrl: "",
    mediaUrl: "",
    mediaType: "auto",
    visible: true,
  };
}

export function createBenefitItem(): ProductBenefitItem {
  const id = `benefit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title: "",
    description: "",
    iconKey: "sparkles",
    badge: "",
    visible: true,
  };
}

export function createFaqItem(): ProductFaqItem {
  const id = `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return { id, question: "", answer: "", visible: true };
}

export function safeColorHex(name: string) {
  const normalized = name.trim().toLowerCase();
  const known: Record<string, string> = {
    black: "#050505",
    nude: "#d7b59b",
    beige: "#d8b89c",
    gray: "#8a8f98",
    grey: "#8a8f98",
    white: "#f8f6f2",
    pink: "#ff80c8",
    "soft pink": "#ff9ed5",
    rose: "#fb7185",
    red: "#ef4444",
    blue: "#60a5fa",
    green: "#34d399",
    purple: "#a855f7",
    violet: "#8b5cf6",
    brown: "#8b5e3c",
  };
  return known[normalized] ?? "#6b6475";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mediaType(value: unknown): "image" | "video" | "auto" {
  return value === "image" || value === "video" || value === "auto" ? value : "auto";
}

function mediaFit(value: unknown): ProductMediaFit {
  return value === "cover" || value === "smart" || value === "contain" ? value : "contain";
}

function mediaObjectPosition(value: unknown): ProductMediaPosition {
  return value === "top" || value === "bottom" || value === "center" ? value : "center";
}

function contentBlockType(value: unknown): ProductContentBlock["type"] {
  return value === "text" ||
    value === "image" ||
    value === "video" ||
    value === "image-text" ||
    value === "video-text" ||
    value === "feature-grid" ||
    value === "comparison"
    ? value
    : "image-text";
}

function contentBlockLayout(value: unknown): ProductContentBlock["layout"] {
  return value === "media-left" ||
    value === "media-right" ||
    value === "media-top" ||
    value === "full-width" ||
    value === "grid"
    ? value
    : "media-right";
}

function normalizeSectionMedia(value: unknown): ProductSectionMediaMap {
  if (!isRecord(value)) return {};
  return (Object.keys(productSectionLabels) as ProductSectionMediaKey[]).reduce((acc, key) => {
    const item = value[key];
    if (!isRecord(item)) return acc;
    const url = text(item.url);
    if (!url) return acc;
    acc[key] = {
      url,
      type: mediaType(item.type),
      alt: text(item.alt),
      fit: mediaFit(item.fit),
      position: mediaObjectPosition(item.position),
    };
    return acc;
  }, {} as ProductSectionMediaMap);
}

function normalizeDescriptionMedia(value: unknown): ProductDescriptionMediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index): ProductDescriptionMediaItem | null => {
      const url = text(item.url);
      if (!url) return null;
      return {
        id: text(item.id) || `desc-media-${index}`,
        url,
        type: mediaType(item.type),
        alt: text(item.alt),
        caption: text(item.caption),
        fit: mediaFit(item.fit),
        position: mediaObjectPosition(item.position),
        sortOrder: optionalNumber(item.sortOrder),
        visible: item.visible !== false,
      };
    })
    .filter((item): item is ProductDescriptionMediaItem => Boolean(item && item.visible))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

function normalizeContentBlocks(value: unknown): ProductContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item, index) => {
    const mediaPosition: ProductContentBlock["mediaPosition"] =
      item.mediaPosition === "left" ||
      item.mediaPosition === "top" ||
      item.mediaPosition === "full"
        ? item.mediaPosition
        : "right";
    const layout = contentBlockLayout(item.layout);
    return {
      id: text(item.id) || `block-${index}`,
      type: contentBlockType(item.type),
      title: text(item.title),
      subtitle: text(item.subtitle),
      text: text(item.text),
      longText: text(item.longText || item.long_text),
      mediaUrl: text(item.mediaUrl),
      mediaType: mediaType(item.mediaType),
      mediaAlt: text(item.mediaAlt),
      mediaFit: mediaFit(item.mediaFit || item.fit),
      mediaPosition,
      mediaObjectPosition: mediaObjectPosition(item.mediaObjectPosition || item.mediaPositionY),
      layout,
      visible: item.visible !== false,
      sortOrder: optionalNumber(item.sortOrder),
      ctaLabel: text(item.ctaLabel),
      ctaLink: text(item.ctaLink),
    };
  }).filter((item) => item.visible && (item.title || item.subtitle || item.text || item.longText || item.mediaUrl))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function normalizeColorOptions(value: unknown, legacyColors: string[] = []): ProductColorOption[] {
  const fromJson = Array.isArray(value)
    ? value.filter(isRecord).map((item, index): ProductColorOption | null => {
        const name = text(item.name || item.label);
        if (!name) return null;
        const hex = text(item.hex);
        return {
          id: text(item.id) || `color-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name,
          hex: /^#[0-9a-f]{6}$/i.test(hex) ? hex : safeColorHex(name),
          secondaryHex: text(item.secondaryHex),
          swatchImageUrl: text(item.swatchImageUrl || item.swatchImage),
          mediaUrl: text(item.mediaUrl || item.productMediaUrl),
          mediaType: mediaType(item.mediaType),
          visible: item.visible !== false,
          stockQuantity: optionalNumber(item.stockQuantity),
          sortOrder: optionalNumber(item.sortOrder),
        } satisfies ProductColorOption;
      }).filter((item): item is ProductColorOption => Boolean(item && item.visible))
    : [];

  if (fromJson.length > 0) {
    return [...fromJson].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }

  return legacyColors.map((name, index) => ({
    ...createColorOption(name),
    id: `legacy-color-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    visible: true,
    sortOrder: index + 1,
  }));
}

function normalizeBenefitItems(value: unknown): ProductBenefitItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item, index) => ({
    id: text(item.id) || `benefit-${index}`,
    title: text(item.title),
    description: text(item.description),
    iconKey: text(item.iconKey) || "sparkles",
    badge: text(item.badge),
    sortOrder: optionalNumber(item.sortOrder),
    visible: item.visible !== false,
  })).filter((item) => item.title || item.description);
}

function normalizeFaqItems(value: unknown): ProductFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item, index) => ({
    id: text(item.id) || `faq-${index}`,
    question: text(item.question),
    answer: text(item.answer),
    sortOrder: optionalNumber(item.sortOrder),
    visible: item.visible !== false,
  })).filter((item) => item.question && item.answer);
}

function normalizeVisualSettings(value: unknown): ProductVisualThemeSettings {
  if (!isRecord(value)) return defaultVisualThemeSettings;
  return {
    accentColor: text(value.accentColor),
    secondaryAccent: text(value.secondaryAccent),
    mediaGlowColor: text(value.mediaGlowColor),
  };
}

export function extractProductCmsContent(media: unknown, legacyColors: string[] = []): ProductCmsContent {
  const mediaItems = Array.isArray(media) ? media : [];
  const cmsEntry = mediaItems.find((item) => isRecord(item) && item.kind === "product_cms");
  const source = isRecord(cmsEntry) ? cmsEntry : {};
  return {
    sectionMedia: normalizeSectionMedia(source.sectionMedia),
    descriptionMedia: normalizeDescriptionMedia(source.descriptionMedia),
    contentBlocks: normalizeContentBlocks(source.contentBlocks),
    colorOptions: normalizeColorOptions(source.colorOptions, legacyColors),
    benefitItems: normalizeBenefitItems(source.benefitItems),
    faqItems: normalizeFaqItems(source.faqItems),
    visualThemeSettings: normalizeVisualSettings(source.visualThemeSettings),
  };
}

export function buildProductCmsMedia(
  existingMedia: unknown,
  cms: ProductCmsContent
) {
  const mediaItems = Array.isArray(existingMedia) ? existingMedia.filter(isRecord) : [];
  const withoutCms = mediaItems.filter((item) => item.kind !== "product_cms");
  return [
    ...withoutCms,
    {
      kind: "product_cms",
      version: 1,
      sectionMedia: cms.sectionMedia,
      descriptionMedia: cms.descriptionMedia,
      contentBlocks: cms.contentBlocks,
      colorOptions: cms.colorOptions,
      benefitItems: cms.benefitItems,
      faqItems: cms.faqItems,
      visualThemeSettings: cms.visualThemeSettings,
    },
  ];
}

export function inferMediaType(url: string, explicit: "image" | "video" | "auto" = "auto") {
  if (explicit !== "auto") return explicit;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) ? "video" : "image";
}
