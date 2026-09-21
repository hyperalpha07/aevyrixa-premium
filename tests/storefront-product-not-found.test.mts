import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const productNotFoundSource = readFileSync(
  new URL("../app/product/[slug]/not-found.tsx", import.meta.url),
  "utf8",
);
const productPageSource = readFileSync(
  new URL("../app/product/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const globalNotFoundSource = readFileSync(
  new URL("../app/not-found.tsx", import.meta.url),
  "utf8",
);
const globalStylesSource = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("product unavailable state keeps product-area navigation and recovery actions", () => {
  assert.match(productNotFoundSource, /SiteHeader active="product" productHref="\/product"/);
  assert.match(productNotFoundSource, /href="\/product"/);
  assert.match(productNotFoundSource, /Browse Products/);
  assert.match(productNotFoundSource, /href="\/"/);
  assert.match(productNotFoundSource, /Return Home/);
  assert.match(productNotFoundSource, /<SiteFooter \/>/);
});

test("product unavailable state is visually isolated from the global not-found page", () => {
  assert.match(productNotFoundSource, /aev-product-unavailable-page/);
  assert.match(productNotFoundSource, /aev-product-unavailable-preview/);
  assert.match(productNotFoundSource, /Unavailable product preview/);
  assert.match(productNotFoundSource, /Unavailable/);
  assert.doesNotMatch(productNotFoundSource, /aev-not-found-page/);
  assert.match(globalNotFoundSource, /aev-not-found-page/);
  assert.doesNotMatch(globalNotFoundSource, /aev-product-unavailable-page/);
  assert.match(globalStylesSource, /shop-hero-collection-unavailable\.webp/);
  assert.doesNotMatch(
    globalStylesSource.match(/\.aev-product-unavailable-media \{[\s\S]*?\n\}/)?.[0] ?? "",
    /shop-hero-collection\.png/,
  );
});

test("product JSON-LD remains typed, escaped, and isolated to real products", () => {
  assert.match(productPageSource, /<script/);
  assert.match(productPageSource, /type="application\/ld\+json"/);
  assert.match(productPageSource, /JSON\.stringify\(productStructuredData\)\.replace\(\/<\/g, "\\\\u003c"\)/);
  assert.match(productPageSource, /if \(!product\) \{\s*notFound\(\);\s*\}/);
  assert.doesNotMatch(productNotFoundSource, /application\/ld\+json/);
});
