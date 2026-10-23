import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(p:string)=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("No V2 links lead to fabricated Classic discount, media or integration dashboards",()=>{
 const routes=read("configs/admin-v2/routes.ts");
 for(const name of ["discounts","media","integrations"]){
  const page=read(`app/admin-v2/${name}/page.tsx`);
  const legacy=read(`app/admin/${name}/page.tsx`);
  assert.match(routes,new RegExp(`module: "${name}"[^\\n]+implemented: true`));
  assert.match(page,/requireAdminV2RouteAccess\(/);
  assert.ok(legacy.includes(`redirect("/admin-v2/${name}")`));
 }
});

test("Media totals derive solely from persisted product images, not fake storage usage",()=>{
 const view=read("components/admin-v2/views/media/AdminV2MediaView.tsx");
 const page=read("app/admin-v2/media/page.tsx");
 assert.match(page,/getAdminV2ProductCatalog\(\)/);
 assert.match(view,/data\.products\.flatMap/);
 assert.match(view,/new Set\(referenced\.map/);
 assert.match(view,/data\.available/);
 assert.doesNotMatch(view,/4,892|132\.48 GB|3,621|842 videos/);
});

test("Discount analytics show only real active product markdowns and configured shipping",()=>{
 const view=read("components/admin-v2/views/discounts/AdminV2DiscountsView.tsx");
 const page=read("app/admin-v2/discounts/page.tsx");
 assert.match(page,/getStoreSettings\(\)/);
 assert.match(page,/getAdminV2ProductCatalog\(\)/);
 assert.match(view,/p\.compareAtPrice>p\.price/);
 assert.match(view,/Free delivery from BDT/);
 assert.doesNotMatch(view,/24,892|12\.38%|MOMLOVE25|FLASH20/);
});

test("Integration status never claims unverified payment or courier API connectivity",()=>{
 const page=read("app/admin-v2/integrations/page.tsx");
 const view=read("components/admin-v2/views/integrations/AdminV2IntegrationsView.tsx");
 assert.match(page,/const persisted=source\.storageMode==="supabase"/);
 assert.match(page,/Manual only/);
 assert.match(page,/Payment verification is manual/);
 assert.match(page,/Credential presence is not proof/);
 assert.match(view,/No connected-service totals/);
 assert.doesNotMatch(view,/98\.7%|token refreshed|webhook synced/);
});
