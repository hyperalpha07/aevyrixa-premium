import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { filterOrders, firstOrderImage, orderGroup, paginateOrders, paginationNumbers } from "../app/account/orders/account-orders-model.ts";
import { createProductImageLookup, resolveOrderItemImage, safeAccountOrderImage, snapshotOrderItemImages } from "../app/account/orders/account-order-image.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("status metrics partition orders without refetching", () => {
  const orders = [
    { status: "Pending", deliveryStatus: "processing" },
    { status: "Delivered", deliveryStatus: "delivered" },
    { status: "Shipped", deliveryStatus: "returned" },
    { status: "Confirmed", deliveryStatus: "in_transit" },
  ];
  assert.deepEqual(orders.map(orderGroup), ["pending", "delivered", "other", "other"]);
  assert.equal(filterOrders(orders, "all").length, 4);
  assert.equal(filterOrders(orders, "pending").length, 1);
  assert.equal(filterOrders(orders, "delivered").length, 1);
  assert.equal(filterOrders(orders, "other").length, 2);
  assert.doesNotMatch(read("../app/account/orders/account-orders-view.tsx"), /readAccountJson|fetch\(/);
});

test("pagination limits initial history to five and clamps pages", () => {
  const values = Array.from({ length: 12 }, (_, index) => index + 1);
  assert.deepEqual(paginateOrders(values, 1), { items: [1, 2, 3, 4, 5], currentPage: 1, pageCount: 3 });
  assert.deepEqual(paginateOrders(values, 3), { items: [11, 12], currentPage: 3, pageCount: 3 });
  assert.equal(paginateOrders(values, 99).currentPage, 3);
  assert.deepEqual(paginationNumbers(9, 20), [1, 8, 9, 10, 20]);
});

test("order thumbnail uses the resolved first item image and has a genuine missing-image fallback", () => {
  assert.equal(firstOrderImage([{ image: "https://example.com/product.webp" }, { image: null }]), "https://example.com/product.webp");
  assert.equal(firstOrderImage([{ image: null }, { image: "https://example.com/second.webp" }]), null);
  assert.equal(firstOrderImage([{ image: null }]), null);
  const api = read("../app/api/account/orders/account-order-data.ts");
  assert.match(api, /listProducts\(\{ scope: "admin" \}\)/);
  assert.match(api, /resolveOrderItemImage\(item, catalog, safeImage\)/);
  assert.match(api, /isPublicProductImageAllowed/);
  assert.match(read("../app/account/orders/account-detailed-orders.tsx"), /onError=\{\(\) => setFailed\(true\)\}/);
});

test("new order snapshots reject theme tokens and use canonical catalog photos", () => {
  const safe = (value: unknown) => typeof value === "string" && value.startsWith("/products/") ? value : null;
  const items = [
    { productId: "id-1", slug: "first", image: "cyan-night" },
    { productId: "id-2", slug: "second", image: "/products/retained.webp" },
    { productId: "missing", slug: "missing", image: "rose-gold" },
  ];
  const products = [
    { id: "id-1", slug: "first", primaryImageUrl: "/products/real.webp" },
    { id: "id-2", slug: "second", primaryImageUrl: "/products/catalog.webp" },
  ];
  assert.deepEqual(snapshotOrderItemImages(items, products, safe).map((item) => item.image), [
    "/products/real.webp", "/products/retained.webp", null,
  ]);
  const route = read("../app/api/orders/route.ts");
  assert.match(route, /snapshotOrderItemImages\(orderInput\.items, catalogResult\.products, safeOrderImage\)/);
});

test("snapshot wins; catalog fallback uses product ID before slug and primary before gallery", () => {
  const catalog = createProductImageLookup([
    { id: "id-1", slug: "first", primaryImageUrl: "/products/primary.webp", imageUrl: "/products/legacy.webp", images: ["/products/gallery.webp"] },
    { id: "id-2", slug: "second", primaryImageUrl: "/products/second.webp" },
  ]);
  const safe = (value: unknown) => typeof value === "string" && value.startsWith("/products/") ? value : null;
  assert.equal(resolveOrderItemImage({ image: "/products/historical.webp", productId: "id-1", slug: "first" }, catalog, safe), "/products/historical.webp");
  assert.equal(resolveOrderItemImage({ image: "blush-violet", productId: "id-1", slug: "second" }, catalog, safe), "/products/primary.webp");
  assert.equal(resolveOrderItemImage({ productId: "missing", slug: "second" }, catalog, safe), "/products/second.webp");
  const staleId = createProductImageLookup([
    { id: "old", slug: "old", primaryImageUrl: "not-an-image" },
    { id: "new", slug: "actual", media: [{ type: "image", url: "/products/media.webp" }] },
  ]);
  assert.equal(resolveOrderItemImage({ productId: "old", slug: "actual" }, staleId, safe), "/products/media.webp");
  assert.equal(resolveOrderItemImage({ productId: "missing", slug: "missing" }, catalog, safe), null);
  assert.equal(resolveOrderItemImage({ productId: "id-1" }, null, safe), null);
});

test("unsafe or private image URLs are rejected before snapshot or catalog display", () => {
  const origin = "https://store.supabase.co";
  const safe = (value: unknown) => safeAccountOrderImage(value, (image) => image, (image) => typeof image === "string" && !image.includes("denied.webp"), origin);
  const publicUrl = `${origin}/storage/v1/object/public/product-media/order/photo.webp`;
  assert.equal(safe(publicUrl), publicUrl);
  assert.equal(safe("/brand/noromi/products/photo.webp"), "/brand/noromi/products/photo.webp");
  assert.equal(safe("/brand/noromi/shop/shop-hero-collection.webp"), null);
  for (const unsafe of ["data:image/png;base64,abc", "javascript:alert(1)", "https://external.example/photo.webp", "/admin/private.webp", "/brand/noromi/../admin/private.webp", `${origin}/storage/v1/object/sign/product-media/private.webp`, `${origin}/storage/v1/object/public/product-media/denied.webp`]) {
    assert.equal(safe(unsafe), null, unsafe);
  }
  const catalog = createProductImageLookup([{ id: "id-1", slug: "first", primaryImageUrl: "https://external.example/photo.webp", images: [publicUrl] }]);
  assert.equal(resolveOrderItemImage({ image: "javascript:alert(1)", productId: "id-1" }, catalog, safe), publicUrl);
});

test("Orders design stays isolated from other Account routes", () => {
  const css = read("../app/account/orders/account-orders.css");
  assert.match(css, /aev-account-orders-page/);
  for (const path of ["../app/globals.css", "../app/account/_shared/account-shared.css", "../app/account/account-dashboard.css", "../app/account/addresses/account-addresses.css", "../app/account/support/account-support.css"]) {
    assert.doesNotMatch(read(path), /aev-account-orders-metric|aev-account-order-thumbnail|aev-account-orders-pagination/);
  }
});
