import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("Courier page uses only LIVE server-side orders, never prior TEST financial records", () => {
  const page = read("app/admin-v2/couriers/page.tsx");
  assert.match(page, /requireAdminV2RouteAccess\(session, "couriers"\)/);
  assert.match(page, /recordScope: "live"/);
  assert.match(page, /pageSize: "25"/);
  assert.match(page, /getAdminV2Orders\(params\)/);
  assert.match(page, /hasPermission\(session, "orders\.editCourier"\)/);
});

test("Courier updates reuse secured existing order operations API and do not simulate live carrier booking", () => {
  const view = read("components/admin-v2/views/couriers/AdminV2CouriersView.tsx");
  const securedRoute = read("app/api/orders/[orderRef]/route.ts");
  assert.match(view, /\/api\/orders\/\$\{encodeURIComponent\(selected\.orderReference\)\}/);
  assert.match(view, /courierName: courierName\.trim\(\)/);
  assert.match(view, /trackingId: trackingId\.trim\(\)/);
  assert.match(view, /deliveryStatus, deliveryNote: deliveryNote\.trim\(\)/);
  assert.match(view, /Manual courier mode/);
  assert.match(view, /automated booking are not connected/);
  assert.match(securedRoute, /getFreshAdminRequestSession\(request\)/);
  assert.match(securedRoute, /"orders\.editCourier"/);
  assert.match(securedRoute, /"order\.courier_updated"/);
  assert.doesNotMatch(view, /createParcel\(|recordPayment\(|voidRefund\(/);
});

test("Courier page is native manual-mode implemented without enabling unverified providers", () => {
  const route = read("configs/admin-v2/routes.ts");
  assert.match(route, /module: "couriers"[^\n]+implemented: true/);
  const pathao = read("app/lib/courier/pathao-courier.ts");
  const steadfast = read("app/lib/courier/steadfast-courier.ts");
  assert.match(pathao, /not_implemented/);
  assert.match(steadfast, /not_implemented/);
});
