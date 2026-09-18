import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const notFoundSource = readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("global storefront not-found uses neutral navigation and standard chrome", () => {
  assert.match(notFoundSource, /<SiteHeader active="neutral" \/>/);
  assert.match(notFoundSource, /<SiteFooter \/>/);
  assert.match(notFoundSource, /href="\/"/);
  assert.match(notFoundSource, /href="\/product"/);
});

test("global not-found styling is isolated and uses production AVIF/WebP artwork", () => {
  assert.match(notFoundSource, /aev-not-found-page/);
  assert.match(globalStyles, /\.aev-not-found-page::before/);
  assert.match(globalStyles, /mystical_blossom_ribbon_journey\.avif/);
  assert.match(globalStyles, /mystical_blossom_ribbon_journey\.webp/);
  assert.match(globalStyles, /dreamy_plum_floral_silk_bloom\.avif/);
  assert.match(globalStyles, /dreamy_plum_floral_silk_bloom\.webp/);
});

test("global not-found recovery links reuse the storefront CTA interaction system", () => {
  assert.match(notFoundSource, /aev-action-primary aev-not-found-cta/);
  assert.match(notFoundSource, /aev-button-secondary aev-not-found-cta/);
  assert.match(notFoundSource, /aev-not-found-cta-arrow/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.aev-not-found-cta/);
});
