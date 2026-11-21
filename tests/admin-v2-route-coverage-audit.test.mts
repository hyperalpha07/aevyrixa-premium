import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { adminV2Routes } from "../configs/admin-v2/routes.ts";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("all configured Admin V2 static and dynamic page routes have session and permission guards",()=>{
  const unique=new Set<string>();
  for(const route of adminV2Routes){
    assert.equal(route.implemented,true,"Incomplete configured route: "+route.path);
    assert.ok(!unique.has(route.path),"Duplicate route: "+route.path);
    unique.add(route.path);
    const path="app"+route.path+"/page.tsx";
    assert.ok(existsSync(new URL("../"+path,import.meta.url)), "Missing page: "+path);
    const source=read(path);
    assert.ok(source.includes("await requireAdminV2Session()"),"Missing auth: "+path);
    assert.ok(source.includes('requireAdminV2RouteAccess(session, "'+route.module+'")')||
      source.includes('requireAdminV2RouteAccess(session,"'+route.module+'")'),
      "Missing module RBAC: "+path);
  }
  assert.ok(unique.size>=45,"Admin V2 route coverage unexpectedly shrank");
});

test("all dynamic order, customer and product workflows remain guarded",()=>{
  const dynamic=adminV2Routes.filter(route=>route.path.includes("["));
  assert.ok(dynamic.length>=8);
  for(const route of dynamic){
    const source=read("app"+route.path+"/page.tsx");
    assert.ok(source.includes("props.params")||source.includes("params"),"Dynamic params not read: "+route.path);
  }
});

test("Admin V2 keeps the original theme and does not weaken settings protections",()=>{
  const shell=read("components/admin-v2/core/AdminV2Shell.tsx");
  const page=read("app/admin-v2/settings/page.tsx");
  const api=read("app/api/settings/route.ts");
  assert.ok(shell.includes("AdminV2ThemeProvider"));
  assert.ok(page.includes("getStoreSettings()"));
  assert.ok(api.includes("requiredSettingsPermissions"));
  assert.ok(api.includes("getFreshAdminRequestSession"));
  assert.ok(api.includes("logStaffActivity"));
});
