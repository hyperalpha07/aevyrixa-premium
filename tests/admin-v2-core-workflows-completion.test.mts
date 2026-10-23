import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("All Classic Admin bridges require session and Admin V2 permission before redirect", () => {
  const bridge = read("lib/admin-v2/classic-module-bridge.ts");
  assert.match(bridge, /await requireAdminV2Session\(\)/);
  assert.match(bridge, /requireAdminV2RouteAccess\(session, module\)/);
  assert.ok(bridge.indexOf("requireAdminV2RouteAccess(session, module)") < bridge.indexOf("redirect(classicModules[module])"));
  for (const module of ["categories", "discounts", "media", "settings", "integrations"]) {
    assert.match(bridge, new RegExp(`${module}: "/admin/${module}"`));
    const route = read(`app/admin-v2/${module}/page.tsx`);
    assert.match(route, new RegExp(`openClassicAdminV2Module\\("${module}"\\)`));
    const legacy = read(`app/admin/${module}/page.tsx`);
    assert.match(legacy, /getAdminSession\(\)/);
    assert.match(legacy, /canAccessSection\(session,/);
  }
});

test("Classic workflows are distinguished from not-yet-built native Admin V2 modules", () => {
  const routes = read("configs/admin-v2/routes.ts");
  const nav = read("components/admin-v2/navigation/AdminV2Sidebar.tsx");
  for (const module of ["categories", "discounts", "media", "settings", "integrations"]) {
    assert.match(routes, new RegExp(`module: "${module}", description: "[^"]+", implemented: false, classicPath: "/admin/${module}"`));
  }
  assert.match(nav, /usesClassic \? "Classic" : "Soon"/);
  assert.match(routes, /module: "inventory", description: "[^"]+", implemented: true/);
});

test("Inventory screen gets the actual protected catalog, not demo stock", () => {
  const page = read("app/admin-v2/inventory/page.tsx");
  const source = read("components/admin-v2/views/inventory/AdminV2InventoryView.tsx");
  assert.match(page, /requireAdminV2RouteAccess\(session, "inventory"\)/);
  assert.match(page, /getAdminV2ProductCatalog\(\)/);
  assert.match(page, /hasPermission\(session, "products.edit"\)/);
  assert.match(source, /Live product inventory is unavailable/);
  assert.match(source, /data\.available/);
  assert.match(source, /\/api\/admin-v2\/inventory\//);
  assert.match(source, /previousStockStatus: selected\.stockStatus/);
  assert.match(source, /previousStockQuantity: selected\.stockQuantity/);
});

test("Stock-only write route validates a fresh permission, input bounds, and conflict detection", () => {
  const api = read("app/api/admin-v2/inventory/[id]/route.ts");
  assert.match(api, /verifyFreshAdminRequestPermission\(request, "products.edit"\)/);
  assert.match(api, /Number\.isSafeInteger\(quantity\)/);
  assert.match(api, /quantity > 1000000/);
  assert.match(api, /current\.stockStatus !== previousStockStatus/);
  assert.match(api, /Inventory was changed by another editor/);
  assert.match(api, /result\.storageMode !== "supabase"/);
  assert.match(api, /updateProduct\(id, \{ stockStatus:/);
  assert.match(api, /logStaffActivity\(/);
  assert.doesNotMatch(api, /updates\.price|updates\.status/);
});

test("Notifications only summarize real permission-scoped queues and never invent unread receipts", () => {
  const route = read("app/admin-v2/notifications/page.tsx");
  const drawer = read("components/admin-v2/core/AdminV2NotificationDrawer.tsx");
  assert.match(route, /requireAdminV2RouteAccess\(session, "notifications"\)/);
  assert.match(route, /getAdminV2DashboardData\(session\)/);
  assert.match(route, /data\.orders\.available/);
  assert.match(route, /data\.reviews\.available/);
  assert.match(route, /data\.support\.available/);
  assert.match(route, /No per-user read receipts or message-delivery history/);
  assert.doesNotMatch(drawer, /label="Unread"/);
});

test("System health shows real source availability, never fabricated uptime", () => {
  const route = read("app/admin-v2/system-health/page.tsx");
  assert.match(route, /requireAdminV2RouteAccess\(session, "systemHealth"\)/);
  assert.match(route, /getAdminV2DashboardData\(session\)/);
  assert.match(route, /source\.available/);
  assert.match(route, /not an uptime monitor/);
  assert.doesNotMatch(route, /99\.9%|100% uptime/);
});

test("Chat reuses the protected real Support Inbox without creating a fake chat backend", () => {
  const page = read("app/admin-v2/chat/page.tsx");
  assert.match(page, /await requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "chat"\)/);
  assert.match(page, /redirect\("\/admin-v2\/support"\)/);
});
