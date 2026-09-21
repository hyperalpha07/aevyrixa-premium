import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const modules = {
  dashboard: read("../app/account/account-dashboard-client.tsx"),
  orders: read("../app/account/orders/account-orders-client.tsx"),
  addresses: read("../app/account/addresses/account-addresses-client.tsx"),
  support: read("../app/account/support/account-support-client.tsx"),
};

test("each protected route imports its own Account implementation", () => {
  for (const [route, entry] of [
    ["../app/account/page.tsx", "AccountDashboardClient"],
    ["../app/account/orders/page.tsx", "AccountOrdersClient"],
    ["../app/account/addresses/page.tsx", "AccountAddressesClient"],
    ["../app/account/support/page.tsx", "AccountSupportClient"],
  ]) assert.match(read(route), new RegExp(entry));
});

test("each page owns only its required protected API calls and view module", () => {
  const expected = {
    dashboard: ["/api/account/orders", "/api/account/addresses"],
    orders: ["/api/account/orders"],
    addresses: ["/api/account/addresses"],
    support: ["/api/account/support"],
  };
  for (const [route, source] of Object.entries(modules)) {
    for (const endpoint of ["/api/account/orders", "/api/account/addresses", "/api/account/support"]) {
      assert.equal(source.includes(endpoint), expected[route as keyof typeof expected].includes(endpoint), `${route}: ${endpoint}`);
    }
    assert.match(source, new RegExp(`account-${route}-view`));
    assert.doesNotMatch(source, /account-client/);
  }
  assert.match(modules.dashboard, /WISHLIST_UPDATED_EVENT/);
  for (const route of ["orders", "addresses", "support"] as const) assert.doesNotMatch(modules[route], /wishlist/i);
});

test("shared shell owns session and 401 boundary but no page-specific data", () => {
  const shell = read("../app/account/_shared/account-shell.tsx");
  assert.match(shell, /\/api\/account\/session/);
  assert.match(shell, /error instanceof AccountRequestError && error\.status === 401/);
  for (const endpoint of ["/api/account/orders", "/api/account/addresses", "/api/account/support"]) {
    assert.doesNotMatch(shell, new RegExp(endpoint));
  }
});

test("page-specific view modules have no cross-feature imports", () => {
  const paths = {
    dashboard: "../app/account/account-dashboard-view.tsx",
    orders: "../app/account/orders/account-orders-view.tsx",
    addresses: "../app/account/addresses/account-addresses-view.tsx",
    support: "../app/account/support/account-support-view.tsx",
  };
  for (const [route, path] of Object.entries(paths)) {
    const source = read(path);
    for (const other of Object.keys(paths).filter((name) => name !== route)) {
      assert.doesNotMatch(source, new RegExp(`account-${other}-view`));
    }
  }
  assert.match(read(paths.dashboard), /account-recent-orders/);
  assert.doesNotMatch(read(paths.dashboard), /account-detailed-orders/);
  assert.match(read(paths.orders), /account-detailed-orders/);
  assert.doesNotMatch(read(paths.orders), /account-recent-orders/);
  assert.doesNotMatch(read("../app/account/_shared/account-ui.tsx"), /function OrderRows|No orders yet/);
});

test("each route imports its own stylesheet while shared shell owns shared styles", () => {
  const styles = {
    dashboard: "account-dashboard.css",
    orders: "account-orders.css",
    addresses: "account-addresses.css",
    support: "account-support.css",
  };
  for (const [route, source] of Object.entries(modules)) {
    assert.match(source, new RegExp(styles[route as keyof typeof styles]));
    for (const other of Object.keys(styles).filter((name) => name !== route)) {
      assert.doesNotMatch(source, new RegExp(styles[other as keyof typeof styles]));
    }
  }
  assert.match(read("../app/account/_shared/account-shell.tsx"), /account-shared\.css/);
  assert.doesNotMatch(read("../app/globals.css"), /\.aev-account-orders-workspace/);
  assert.doesNotMatch(read("../app/globals.css"), /\.aev-account-address-form-grid/);
  assert.doesNotMatch(read("../app/globals.css"), /\.aev-account-support-layout/);
});
