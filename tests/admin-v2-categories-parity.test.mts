import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { defaultAdminSettings } from "../app/lib/admin-settings.ts";
import {
 adminV2CategoryDefinitions, extractAdminV2Categories, mergeAdminV2Categories,
 validateAdminV2CategoryCards,
} from "../lib/admin-v2/categories/category-settings.ts";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("Seven categories preserve all settings fields, identity and exact original order",()=>{
 const settings=defaultAdminSettings.homepageMediaSettings;
 const initial=extractAdminV2Categories(settings);
 assert.equal(initial.length,7);
 assert.deepEqual(initial.map(x=>x.slug),adminV2CategoryDefinitions.map(x=>x.slug));
 assert.equal(validateAdminV2CategoryCards(initial),null);
 assert.deepEqual(mergeAdminV2Categories(settings,initial),settings);
 const updated=initial.map((x,i)=>i===2?{
  ...x,status:"active" as const,title:"Gentle Support Bra",
  linkUrl:"/product?category=Soft%20Support%20Bra",
  sortOrder:"6",mediaMode:"image_text" as const,imageUrl:"https://example.com/approved.webp",
 }:i===5?{...x,sortOrder:"3"}:x);
 const merged=mergeAdminV2Categories(settings,updated);
 assert.equal(merged.categorySoftSupportBraTitle,"Gentle Support Bra");
 assert.equal(merged.categorySoftSupportBraSortOrder,"6");
 assert.equal(merged.categoryBundlesSortOrder,"3");
 assert.equal(merged.categorySoftSupportBraImageUrl,"https://example.com/approved.webp");
 assert.equal(merged.collectionsHeading,settings.collectionsHeading);
 assert.equal(merged.showCategories,settings.showCategories);
});

test("Reject unsafe links, duplicate positions, missing active links or identity drift",()=>{
 const initial=extractAdminV2Categories(defaultAdminSettings.homepageMediaSettings);
 const altered=(index:number, changes:Record<string,unknown>)=>
  initial.map((item,i)=>index===i?{...item,...changes}:item);
 assert.ok(validateAdminV2CategoryCards(altered(0,{linkUrl:"javascript:alert(1)"})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{linkUrl:"//evil.example"})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{status:"active",linkUrl:""})));
 assert.ok(validateAdminV2CategoryCards(altered(1,{sortOrder:initial[0].sortOrder})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{sortOrder:"0"})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{title:""})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{mediaMode:"javascript"})));
 assert.ok(validateAdminV2CategoryCards(altered(0,{slug:"hijacked"})));
 assert.equal(validateAdminV2CategoryCards(altered(0,{imageUrl:"https://example.com/photo.webp"})),null);
});

test("Category page and PATCH only save verified settings, maintain least privilege",()=>{
 const page=read("app/admin-v2/categories/page.tsx");
 const ui=read("components/admin-v2/views/categories/AdminV2CategoriesView.tsx");
 const settingsApi=read("app/api/settings/route.ts");
 assert.ok(page.includes('requireAdminV2RouteAccess(session, "categories")'));
 assert.ok(page.includes('hasPermission(session, "categories.manage")'));
 assert.ok(page.includes('getStoreSettings()'));
 assert.ok(ui.includes('fetch("/api/settings"'));
 assert.ok(ui.includes('method:"PATCH"'));
 assert.ok(ui.includes("JSON.stringify(freshCards)!==JSON.stringify(baseline)"));
 assert.ok(ui.includes("mergeAdminV2Categories(result.settings.homepageMediaSettings,cards)"));
 assert.ok(settingsApi.includes('permission) => !hasPermission(session, permission)'));
 assert.ok(settingsApi.includes('changedHomepagePermissions(current, next)'));
});

test("Category uploads remain limited to allowed sections for category staff",()=>{
 const route=read("app/api/homepage-media/upload/route.ts");
 assert.ok(route.includes('hasPermission(session, "categories.manage")'));
 assert.ok(route.includes('hasPermission(session, "homepage.manage")'));
 for(const {slug} of adminV2CategoryDefinitions) {
  assert.ok(route.includes(`"category-${slug}"`));
 }
 assert.ok(route.includes('!permittedCategorySections.has(section)'));
 assert.ok(route.includes('return forbiddenAdminResponse()'));
});

test("Keep old Categories page accessible until authenticated parity QA has passed",()=>{
 const routes=read("configs/admin-v2/routes.ts");
 const old=read("app/admin/categories/page.tsx");
 assert.match(routes,/module: "categories"[^\n]+implemented: true, classicPath: "\/admin\/categories"/);
 assert.ok(old.includes('<AdminPanel view="categories"'));
});
