import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { defaultAdminSettings } from "../app/lib/admin-settings.ts";
import {
 extractHomepageAppearance,extractHomepageContent,homepageVisibilityKeys,homepageSectionKeys,
 mergeHomepageAppearance,mergeHomepageContent,validateHomepageAppearance,validateHomepageContent,
} from "../lib/admin-v2/homepage/homepage-settings.ts";

const read=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),"utf8");
const replace=(source:object,values:Record<string,unknown>)=>({...source,...values});

test("Homepage projection preserves all unrelated payment, categories and store settings",()=>{
 const settings=defaultAdminSettings;
 const content=extractHomepageContent(settings.homepageMediaSettings);
 const appearance=extractHomepageAppearance(settings.appearanceSettings);
 assert.equal(homepageVisibilityKeys.length,11);
 assert.equal(homepageSectionKeys.length,3);
 assert.equal(validateHomepageContent(content),true);
 assert.equal(validateHomepageAppearance(appearance),true);
 const next=mergeHomepageContent(settings.homepageMediaSettings,replace(content,{
  showHero:false,featuredProductsHeading:"New premium edit",
 }) as typeof content);
 assert.equal(next.showHero,false);
 assert.equal(next.featuredProductsHeading,"New premium edit");
 assert.equal(next.categoryComfortPanty,settings.homepageMediaSettings.categoryComfortPanty);
 assert.equal(next.categoryComfortPantyImageUrl,settings.homepageMediaSettings.categoryComfortPantyImageUrl);
 assert.equal(next.categoryBundlesSortOrder,settings.homepageMediaSettings.categoryBundlesSortOrder);
 const copied=mergeHomepageAppearance(settings.appearanceSettings,replace(appearance,{
  homepageHeroTitle:"Safe verified campaign",
 }) as typeof appearance);
 assert.equal(copied.homepageHeroTitle,"Safe verified campaign");
 assert.equal(copied.announcementText,settings.appearanceSettings.announcementText);
});

test("Homepage editor forbids unknown fields, unsafe URLs, wrong media modes and string toggles",()=>{
 const normal=extractHomepageContent(defaultAdminSettings.homepageMediaSettings);
 assert.equal(validateHomepageContent(replace(normal,{showHero:"false"})),false);
 assert.equal(validateHomepageContent(replace(normal,{paymentSettings:{bkashEnabled:true}})),false);
 assert.equal(validateHomepageContent(replace(normal,{splashLogoUrl:"javascript:alert(1)"})),false);
 assert.equal(validateHomepageContent(replace(normal,{splashLogoUrl:"//evil.example"})),false);
 assert.equal(validateHomepageContent(replace(normal,{heroMedia:{...normal.heroMedia,mode:"script"}})),false);
 assert.equal(validateHomepageContent(replace(normal,{heroMedia:{...normal.heroMedia,ctaLink:"javascript:alert(1)"}})),false);
 assert.equal(validateHomepageContent(replace(normal,{heroMedia:{...normal.heroMedia,videoUrl:"https://example.com/video.mp4"}})),true);
 const brand=extractHomepageAppearance(defaultAdminSettings.appearanceSettings);
 assert.equal(validateHomepageAppearance(replace(brand,{extra:"secret"})),false);
 assert.equal(validateHomepageAppearance(replace(brand,{heroBadgeText:"x".repeat(501)})),false);
});

test("Homepage mutations check fresh staff session and exact permission per group",()=>{
 const api=read("app/api/admin-v2/homepage/route.ts");
 const page=read("app/admin-v2/homepage/page.tsx");
 const routes=read("configs/admin-v2/routes.ts");
 const permissions=read("configs/admin-v2/permissions.ts");
 assert.match(api,/getFreshAdminRequestSession\(request\)/);
 assert.match(api,/kind==="content"\?"homepage\.manage":"settings\.editBasic"/);
 assert.match(api,/JSON\.stringify\(existing\)!==JSON\.stringify\(before\)/);
 assert.match(api,/const saved=await saveStoreSettings\(next\)/);
 assert.match(api,/saved\.storageMode!=="supabase"/);
 assert.match(api,/metadata:\{source:"admin-v2-homepage"/);
 assert.match(page,/requireAdminV2RouteAccess\(session,"homepage"\)/);
 assert.match(page,/hasPermission\(session,"homepage.manage"\)/);
 assert.match(page,/hasPermission\(session,"settings.editBasic"\)/);
 assert.match(routes,/module: "homepage"[^\n]+implemented: true/);
 assert.match(permissions,/homepage: \{ permission: "homepage.manage" \}/);
});

test("Media uploading uses existing protected API; no fabricated stored image URLs",()=>{
 const view=read("components/admin-v2/views/homepage/AdminV2HomepageView.tsx");
 const existingUpload=read("app/api/homepage-media/upload/route.ts");
 assert.match(view,/fetch\("\/api\/homepage-media\/upload"/);
 assert.match(view,/form\.append\("file",file\)/);
 assert.match(view,/form\.append\("section"/);
 assert.match(view,/save\("content"\)/);
 assert.match(view,/save\("appearance"\)/);
 assert.match(existingUpload,/homepage\.manage/);
 assert.match(existingUpload,/ALLOWED_IMAGE_TYPES/);
 assert.match(existingUpload,/IMAGE_MAX_BYTES/);
});
