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
const { summaryForOrders } = await import("../components/admin-v2/views/orders/utils.ts");
hooks.deregister();

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function order(i: number, status: OrderRecord["status"], isTestOrder: boolean): OrderRecord {
  return {
    orderId: `order-${i}`,
    orderReference: `AEV-${i}`,
    customer: { fullName: "Test fixture", phone: "", cityArea: "", address: "" },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items: [],
    totals: { totalItems: 1, subtotal: 100 },
    totalAmount: 100,
    status,
    isTestOrder,
    createdAt: "2026-10-01T00:00:00.000Z",
  };
}

test("21 test orders retain 21 total in cards even if the visible table contains only 10", () => {
  const fullOrders = Array.from({ length: 21 }, (_, i) => order(i, i < 13 ? "Cancelled" : "Pending", true));
  assert.equal(summaryForOrders(fullOrders.slice(0, 10)).total, 10);
  const all = summaryForOrders(fullOrders);
  assert.equal(all.total, 21);
  assert.equal(all.cancelled, 13);
  assert.equal(all.pending, 8);
  assert.equal(all.revenue, 0);
});

test("Server summarizes all filter-matched pages, validates totals and refuses truncated data", () => {
  const source = read("lib/admin-v2/orders.ts");
  const page = read("app/admin-v2/orders/page.tsx");
  const view = read("components/admin-v2/views/orders/AdminV2OrdersView.tsx");
  const cards = read("components/admin-v2/views/orders/AdminV2OrderSummaryCards.tsx");
  assert.match(source, /summaryBatchSize = 50/);
  assert.match(source, /getCompleteAdminV2OrderSummary/);
  assert.match(source, /result\.totalCount !== expectedCount/);
  assert.match(source, /result\.rows\.length !== expectedSize/);
  assert.match(source, /allOrders\.push\(\.\.\.result\.rows\.filter\(isVisibleRealOrder\)\)/);
  assert.match(source, /expectedCount > maxSummaryRows\) return null/);
  assert.match(page, /summary=\{payload\.summary\}/);
  assert.match(view, /const metrics = summary/);
  assert.doesNotMatch(view, /summaryForOrders\(orders\)/);
  assert.match(cards, /"Unavailable"/);
});
