import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import type { OrderRecord } from "../app/lib/order-types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(root, specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(target) ? target : `${target}.ts`).href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!path.extname(target) && existsSync(`${target}.ts`)) return nextResolve(pathToFileURL(`${target}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { orderCsvRows } = await import("../components/admin-v2/views/orders/utils.ts");
hooks.deregister();
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

function order(i: number, isTestOrder: boolean, customerName = "Customer"): OrderRecord {
  return {
    orderId: `ID-${i}`,
    orderReference: `AEV-${i}`,
    customer: { fullName: customerName, phone: "01700000000", address: "Dhaka", cityArea: "Dhaka" },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items: [{ id: "item", name: "Period Panty", slug: "period-panty", price: 100, quantity: 1 }],
    totals: { totalItems: 1, subtotal: 100 },
    totalAmount: 100,
    status: "Pending",
    createdAt: "2026-10-01T00:00:00.000Z",
    isTestOrder,
  };
}

test("Orders CSV includes complete multi-page rows, explicit TEST/LIVE scope, and only authorized PII", () => {
  const orders = Array.from({ length: 21 }, (_, i) => order(i, i < 20, i === 0 ? "=HYPERLINK(\"https://invalid\")" : "Customer"));
  const withoutPii = orderCsvRows(orders, false);
  const withPii = orderCsvRows(orders, true);
  assert.equal(withoutPii.split("\r\n").length, 22);
  assert.match(withoutPii, /"data_scope"/);
  assert.equal((withoutPii.match(/"TEST"/g) || []).length, 20);
  assert.equal((withoutPii.match(/"LIVE"/g) || []).length, 1);
  assert.doesNotMatch(withoutPii, /"customer_name"/);
  assert.match(withPii, /"customer_name"/);
  assert.match(withPii, /"'=HYPERLINK/);
  assert.doesNotMatch(withPii, /"=HYPERLINK/);
});

test("Orders export uses a fresh session, permission checks, full filtered pages, audit and cap", () => {
  const endpoint = read("app/api/admin-v2/orders/export/route.ts");
  const view = read("components/admin-v2/views/orders/AdminV2OrdersView.tsx");
  const source = read("lib/admin-v2/orders.ts");
  assert.match(endpoint, /getFreshAdminRequestSession\(request\)/);
  assert.match(endpoint, /hasPermission\(session, "orders\.view"\)/);
  assert.match(endpoint, /hasPermission\(session, "orders\.export"\)/);
  assert.match(endpoint, /getCompleteAdminV2OrderRows\(query, first\.totalCount\)/);
  assert.match(endpoint, /first\.totalCount > 10000/);
  assert.match(endpoint, /orders\.length !== first\.totalCount/);
  assert.match(endpoint, /requireRecorded: true/);
  assert.match(endpoint, /record_scope: query\.recordScope/);
  assert.match(endpoint, /include_pii: includePii/);
  assert.match(source, /result\.rows\.length !== expectedSize/);
  assert.match(view, /\/api\/admin-v2\/orders\/export\?/);
  assert.match(view, /Complete filtered orders exported across all pages/);
  assert.doesNotMatch(view, /orderCsvRows\(orders/);
});
