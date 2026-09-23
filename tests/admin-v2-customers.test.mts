import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { customerOrderMetrics } from "../lib/admin-v2/customers/customer-metrics.ts";
import { customerListHref, queryCustomers } from "../lib/admin-v2/customers/customer-query.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const customers = Array.from({ length: 55 }, (_, index) => ({
  id: String(index), fullName: `Customer ${index}`, phone: `0170000${String(index).padStart(4, "0")}`,
  email: index === 3 ? "special@example.com" : undefined, isActive: true,
  orderCount: index % 3, totalSpent: 100, savedAddressesCount: 0,
}));

test("Customers routes are implemented and protected by customer access", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /module: "customers"[^\n]*implemented: true/);
  assert.match(routes, /module: "customerDetail"[^\n]*implemented: true/);
  const permissions = read("configs/admin-v2/permissions.ts");
  assert.match(permissions, /customers: \{ section: "customers" \}/);
  assert.match(permissions, /customerDetail: \{ section: "customers" \}/);
  assert.match(read("app/lib/admin-permissions.ts"), /section === "customers"\) return hasPermission\(session, "customers.view"\)/);
  for (const path of ["app/admin-v2/customers/page.tsx", "app/admin-v2/customers/[customerId]/page.tsx"]) assert.match(read(path), /requireAdminV2RouteAccess\(session, "customer/);
});

test("search supports name, phone, and email; filters and 25-per-page pagination", () => {
  assert.equal(queryCustomers(customers, "Customer 3", "all", 1).totalCount, 11);
  assert.equal(queryCustomers(customers, customers[3].phone, "all", 1).totalCount, 1);
  assert.equal(queryCustomers(customers, "special@example.com", "all", 1).totalCount, 1);
  assert.equal(queryCustomers(customers, "", "has-orders", 1).totalCount, customers.filter((item) => item.orderCount > 0).length);
  assert.equal(queryCustomers(customers, "", "no-orders", 1).totalCount, customers.filter((item) => item.orderCount === 0).length);
  assert.equal(queryCustomers(customers, "", "repeat", 1).totalCount, customers.filter((item) => item.orderCount > 1).length);
  assert.equal(queryCustomers(customers, "", "all", 2).customers.length, 25);
  assert.equal(queryCustomers(customers, "", "all", 3).customers.length, 5);
  assert.equal(queryCustomers(customers, "", "all", 99).page, 3);
  assert.equal(customerListHref("special@example.com", "repeat", 2), "/admin-v2/customers?q=special%40example.com&filter=repeat&page=2");
});

test("guest orders are excluded and cancelled orders count but do not add spend", () => {
  const metrics = customerOrderMetrics("a", [
    { customer_id: "a", total: 100, status: "Delivered", created_at: "2026-01-01" },
    { customer_id: "a", total: 80, status: "Cancelled", created_at: "2026-02-01" },
    { customer_id: null, total: 500, status: "Delivered" },
    { customer_id: "b", total: 300, status: "Delivered" },
  ]);
  assert.deepEqual(metrics, { orderCount: 2, totalSpent: 100, latestOrderAt: "2026-02-01" });
  const store = read("app/lib/customer-account-store.ts");
  assert.match(store, /orders\?customer_id=eq\./);
  assert.match(store, /customerOrderMetrics\(customerId/);
  assert.match(store, /customerOrderMetrics\(customer.id/);
});

test("detail provides linked order links and missing customer state", () => {
  assert.match(read("components/admin-v2/views/customers/AdminV2CustomerDetailView.tsx"), /\/admin-v2\/orders\/\$\{encodeURIComponent\(order.orderRef\)\}/);
  const page = read("app/admin-v2/customers/[customerId]/page.tsx");
  assert.match(page, /Customer not found/);
  assert.match(page, /Back to Customers/);
});

test("Customers navigation does not pass Next Link as a MUI component prop", () => {
  for (const path of [
    "components/admin-v2/views/customers/AdminV2CustomersView.tsx",
    "components/admin-v2/views/customers/AdminV2CustomerDetailView.tsx",
    "app/admin-v2/customers/page.tsx",
    "app/admin-v2/customers/[customerId]/page.tsx",
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /component=\{Link\}/);
  }
  assert.match(read("components/admin-v2/views/customers/AdminV2CustomersView.tsx"), /<Link href=\{`\/admin-v2\/customers\//);
  assert.match(read("components/admin-v2/views/customers/AdminV2CustomerDetailView.tsx"), /<V2Button href=\{`\/admin-v2\/orders\//);
});

test("Customers server views do not pass MUI elements through client component props", () => {
  for (const path of [
    "components/admin-v2/views/customers/AdminV2CustomersView.tsx",
    "components/admin-v2/views/customers/AdminV2CustomerDetailView.tsx",
  ]) {
    assert.doesNotMatch(read(path), /divider=\{<Divider/);
  }
});
