import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Dashboard remains isolated and loads only its required account data", () => {
  const client = read("../app/account/account-dashboard-client.tsx");
  assert.match(client, /\/api\/account\/bootstrap\?view=dashboard/);
  assert.doesNotMatch(client, /readAccountJson/);
  assert.doesNotMatch(client, /\/api\/account\/support/);
  assert.match(client, /orders\.slice\(0, 3\)/);
  assert.match(client, /WISHLIST_UPDATED_EVENT/);
});

test("Dashboard metrics link to existing destinations and recent orders use API images", () => {
  const dashboard = read("../app/account/account-dashboard-view.tsx");
  const recent = read("../app/account/account-recent-orders.tsx");
  assert.match(dashboard, /aev-account-dashboard-home/);
  assert.match(dashboard, /label="Total Orders"[^>]*href="\/account\/orders"/);
  assert.match(dashboard, /label="Saved Addresses"[^>]*href="\/account\/addresses"/);
  assert.match(recent, /order\.items\[0\]\?\.image/);
  assert.match(recent, /orders\.slice\(0, 2\)/);
  assert.match(recent, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(recent, /Product image unavailable/);
  assert.match(recent, /orderDetailHref\(order\.orderRef\)/);
  assert.match(recent, /trackOrderHref\(order\)/);
});

test("desktop Dashboard styles are isolated from Orders and shared account styles", () => {
  const css = read("../app/account/account-dashboard.css");
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1279px\)/);
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1099px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(read("../app/account/orders/account-orders.css"), /aev-account-dashboard-order-row/);
  assert.doesNotMatch(read("../app/account/_shared/account-shared.css"), /aev-account-dashboard-order-row/);
});

test("Dashboard and Orders inherit the original shared Account background", () => {
  const shared = read("../app/account/_shared/account-shared.css");
  const dashboard = read("../app/account/account-dashboard.css");
  const orders = read("../app/account/orders/account-orders.css");
  assert.match(shared, /\.aev-account-page-background\.aev-account-dashboard-page\s*\{/);
  assert.match(shared, /account-hub-bg-01\.avif/);
  assert.match(shared, /account-hub-bg-01\.webp/);
  assert.match(shared, /background-attachment: scroll, scroll, fixed/);
  assert.doesNotMatch(dashboard, /\.aev-account-dashboard-page:has\(\.aev-account-dashboard-home\)\s*\{/);
  assert.doesNotMatch(orders, /\.aev-account-page-background\.aev-account-orders-page\s*\{/);
});
