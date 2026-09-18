import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const headerSource = readFileSync(
  new URL("../app/components/cart/site-header.tsx", import.meta.url),
  "utf8"
);
const infoShellSource = readFileSync(
  new URL("../app/components/info-page-shell.tsx", import.meta.url),
  "utf8"
);
const contactSource = readFileSync(new URL("../app/contact/page.tsx", import.meta.url), "utf8");
const productSource = readFileSync(new URL("../app/product/page.tsx", import.meta.url), "utf8");

test("informational pages explicitly request a neutral header state", () => {
  assert.match(headerSource, /\| "neutral"/);
  assert.match(infoShellSource, /<SiteHeader active="neutral" settings=\{settings\} \/>/);
  assert.match(headerSource, /active !== "shop" && active !== "neutral"/);
});

test("explicit Product and Contact active states remain unchanged", () => {
  assert.match(productSource, /active="shop"/);
  assert.match(contactSource, /active="none"/);
  assert.match(headerSource, /active === "shop"\s+\? navActive : navMuted/);
  assert.match(headerSource, /active === "none" \? navActive : navMuted/);
});

test("neutral state cannot activate desktop or mobile primary navigation", () => {
  assert.doesNotMatch(headerSource, /active === "neutral"\s*\?/);
});
