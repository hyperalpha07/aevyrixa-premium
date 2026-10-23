import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import type { ProductCatalogItem } from "../app/lib/product-types.ts";
import type { OrderSubmissionInput } from "../app/lib/order-types.ts";

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
const [{ quoteCheckoutOrder }, { defaultAdminSettings }] = await Promise.all([
  import("../lib/checkout/trusted-quote.ts"),
  import("../app/lib/admin-settings.ts"),
]);
hooks.deregister();

const product = {
  id: "product-1", slug: "period-panty", name: "Original Product",
  price: 100, status: "active", stockStatus: "in_stock",
  sizes: [], colors: [], absorbencyOptions: [],
  visualTheme: "blush-violet", visual: "blush-violet",
} as ProductCatalogItem;

function cart(overrides: Record<string, unknown> = {}) {
  return {
    customer: { fullName: "Customer", phone: "01700000000", cityArea: "Dhaka", address: "Test Address" },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items: [{ id: "untrusted-cart-id", productId: "product-1", slug: "period-panty",
      name: "Untrusted Client Name", price: 100, quantity: 2 }],
    totals: { totalItems: 2, subtotal: 200 },
    deliveryCharge: 130, deliveryZone: "Outside Dhaka",
    ...overrides,
  } as OrderSubmissionInput;
}
const settings = structuredClone(defaultAdminSettings);

test("Server quotes trusted products, not user-supplied name, id or price", () => {
  const result = quoteCheckoutOrder(cart(), [product], settings);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quote.items[0].name, product.name);
  assert.equal(result.quote.items[0].productId, product.id);
  assert.equal(result.quote.items[0].price, 100);
  assert.equal(result.quote.items[0].lineTotal, 200);
  assert.equal(result.quote.totals.subtotal, 200);
  assert.equal(result.quote.totals.totalItems, 2);
  assert.equal(result.quote.deliveryCharge, 130);
  assert.notEqual(result.quote.items[0].id, "untrusted-cart-id");
});

test("Tampering with unit price, subtotal, line amount, zone or shipping rejects checkout", () => {
  const base = cart();
  const cases = [
    { ...base, items: [{ ...base.items[0], price: 1 }], totals: { totalItems: 2, subtotal: 2 } },
    { ...base, totals: { totalItems: 2, subtotal: 1 } },
    { ...base, totals: { totalItems: 3, subtotal: 200 } },
    { ...base, items: [{ ...base.items[0], lineTotal: 1 }] },
    { ...base, deliveryCharge: 0 },
    { ...base, deliveryZone: "Outside Bangladesh" },
    { ...base, items: [{ ...base.items[0], quantity: 0 }] },
    { ...base, items: [{ ...base.items[0], productId: "other-product" }] },
    { ...base, items: [{ ...base.items[0], slug: "not-a-real-product" }] },
  ];
  for (const tampered of cases) {
    assert.equal(quoteCheckoutOrder(tampered as OrderSubmissionInput, [product], settings).ok, false,
      `Tampered checkout should fail: ${JSON.stringify(tampered)}`);
  }
});

test("Inactive or unavailable products cannot be purchased; disabled payment methods cannot be used", () => {
  assert.equal(quoteCheckoutOrder(cart(), [{ ...product, status: "draft" }], settings).ok, false);
  assert.equal(quoteCheckoutOrder(cart(), [{ ...product, stockStatus: "out_of_stock" }], settings).ok, false);
  assert.equal(quoteCheckoutOrder(cart(), [{ ...product, deletedAt: "2026-10-01" }], settings).ok, false);
  const disabled = structuredClone(settings);
  disabled.paymentSettings.codEnabled = false;
  assert.equal(quoteCheckoutOrder(cart(), [product], disabled).ok, false);
});

test("Configured free delivery is computed server-side, not trusted from customer request", () => {
  const free = structuredClone(settings);
  free.checkoutSettings.freeDeliveryThreshold = "200";
  const result = quoteCheckoutOrder(cart({ deliveryCharge: 0 }), [product], free);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.quote.deliveryCharge, 0);
  assert.equal(quoteCheckoutOrder(cart({ deliveryCharge: 130 }), [product], free).ok, false);
});

test("POST endpoint refuses missing live catalog/settings, requires server quote before write", () => {
  const route = readFileSync(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  assert.match(route, /catalogResult\.storageMode !== "supabase"/);
  assert.match(route, /settings\?\.storageMode !== "supabase"/);
  assert.match(route, /quoteCheckoutOrder\(input, catalogResult\.products, settings\.settings\)/);
  assert.match(route, /items: quote\.quote\.items/);
  assert.match(route, /totals: quote\.quote\.totals/);
  assert.match(route, /deliveryCharge: quote\.quote\.deliveryCharge/);
  assert.ok(route.indexOf("quoteCheckoutOrder(input,") < route.indexOf("const result = await createOrder("));
});
