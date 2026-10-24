import type { AppearanceSettings, HomepageMediaSettings, HomepageSectionMedia } from "@/app/lib/admin-settings";

export const homepageVisibilityKeys = [
  "showHero","showTrustStrip","showStatStrip","showMarquee","showCategories",
  "showFeaturedProducts","showStorySections","showTestimonials","showFAQ","showBottomCTA",
  "splashEnabled",
] as const satisfies readonly (keyof HomepageMediaSettings)[];

export const homepageTextKeys = [
  "splashTitle","splashLogoUrl",
  "statItem1Value","statItem1Label","statItem2Value","statItem2Label",
  "statItem3Value","statItem3Label","marqueeItems",
  "featuredProductsEyebrow","featuredProductsHeading","featuredProductsDescription",
  "collectionsEyebrow","collectionsHeading","collectionsDescription",
] as const satisfies readonly (keyof HomepageMediaSettings)[];

export const homepageSectionKeys = ["heroMedia","careMedia","experienceMedia"] as const satisfies readonly (keyof HomepageMediaSettings)[];
export const homepageAppearanceKeys = [
  "heroBadgeText","homepageHeroTitle","homepageHeroSubtitle","primaryCtaText","secondaryCtaText",
] as const satisfies readonly (keyof AppearanceSettings)[];

export type HomepageContentDraft = Pick<HomepageMediaSettings,
  (typeof homepageVisibilityKeys)[number] | (typeof homepageTextKeys)[number] | (typeof homepageSectionKeys)[number]>;
export type HomepageAppearanceDraft = Pick<AppearanceSettings,(typeof homepageAppearanceKeys)[number]>;

export const homepageMediaFields = ["mode","imageUrl","videoUrl","altText","eyebrow","heading","subheading","ctaText","ctaLink"] as const satisfies readonly (keyof HomepageSectionMedia)[];

export function extractHomepageContent(settings: HomepageMediaSettings): HomepageContentDraft {
  const values={} as HomepageContentDraft;
  for(const key of homepageVisibilityKeys) (values as unknown as Record<string,unknown>)[key]=settings[key];
  for(const key of homepageTextKeys) (values as unknown as Record<string,unknown>)[key]=settings[key];
  for(const key of homepageSectionKeys) (values as unknown as Record<string,unknown>)[key]={...settings[key]};
  return values;
}
export function extractHomepageAppearance(settings: AppearanceSettings): HomepageAppearanceDraft {
 const values={} as HomepageAppearanceDraft;
 for(const key of homepageAppearanceKeys)values[key]=settings[key];
 return values;
}

const urlSafe=(value:string)=>
 !value || (value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value)) ||
 /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value);

export function validateHomepageContent(input: unknown): input is HomepageContentDraft {
 if(!input || typeof input!=="object" || Array.isArray(input))return false;
 const data=input as Record<string,unknown>;
 const accepted=[...homepageVisibilityKeys,...homepageTextKeys,...homepageSectionKeys];
 if(Object.keys(data).length!==accepted.length || Object.keys(data).some(k=>!accepted.includes(k as typeof accepted[number])))return false;
 for(const key of homepageVisibilityKeys)if(typeof data[key]!=="boolean")return false;
 for(const key of homepageTextKeys){
  const v=data[key];
  if(typeof v!=="string"||v.length>(key==="marqueeItems"?1200:500))return false;
  if(key==="splashLogoUrl"&&!urlSafe(v))return false;
 }
 for(const key of homepageSectionKeys){
  const section=data[key];
  if(!section||typeof section!=="object"||Array.isArray(section))return false;
  const record=section as Record<string,unknown>;
  if(Object.keys(record).length!==homepageMediaFields.length||
    Object.keys(record).some(k=>!homepageMediaFields.includes(k as typeof homepageMediaFields[number])))return false;
  if(!["animation","image","video"].includes(String(record.mode)))return false;
  for(const field of homepageMediaFields.filter(k=>k!=="mode")){
   const value=record[field];
   if(typeof value!=="string"||value.length>500)return false;
   if(["imageUrl","videoUrl","ctaLink"].includes(field)&&!urlSafe(value))return false;
  }
 }
 return true;
}
export function validateHomepageAppearance(input: unknown): input is HomepageAppearanceDraft {
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const data=input as Record<string,unknown>;
 return Object.keys(data).length===homepageAppearanceKeys.length &&
  Object.keys(data).every(k=>homepageAppearanceKeys.includes(k as typeof homepageAppearanceKeys[number])) &&
  homepageAppearanceKeys.every(k=>typeof data[k]==="string"&&(data[k] as string).length<=500);
}
export function mergeHomepageContent(settings:HomepageMediaSettings,content:HomepageContentDraft):HomepageMediaSettings {
 return {...settings,...content};
}
export function mergeHomepageAppearance(settings:AppearanceSettings,content:HomepageAppearanceDraft):AppearanceSettings {
 return {...settings,...content};
}
