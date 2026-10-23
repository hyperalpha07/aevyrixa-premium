import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { trustworthyHomeStats } from "../app/lib/trust-statistics.ts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const fallbacks = [
  { value: "BDT", label: "Local Pricing" },
  { value: "3-Day", label: "Hygiene-Safe Support" },
  { value: "Care", label: "Discreet Packaging" },
];

test("Storefront cannot show unverified customers, review ratings or 100% guarantees", () => {
  const misleading = [
    { value: "5000+", label: "Happy Customers" },
    { value: "4.8★", label: "Customer Rating" },
    { value: "100%", label: "Discreet Packaging" },
  ];
  assert.deepEqual(trustworthyHomeStats(misleading, fallbacks), fallbacks);
});

test("Trustworthy CMS service copy remains configurable without fake claims", () => {
  const actual = trustworthyHomeStats([
    { value: "Bangladesh", label: "Delivery Coverage" },
    { value: "3-Day", label: "Hygiene-Safe Support" },
    { value: "Care", label: "Privacy Packaging" },
  ], fallbacks);
  assert.equal(actual[0].value, "Bangladesh");
  assert.equal(actual[1].label, "Hygiene-Safe Support");
  assert.equal(actual[2].label, "Privacy Packaging");
});

test("Live site uses filtered stats instead of manually entered social proof", () => {
  const homepage = read("app/page.tsx");
  assert.match(homepage, /trustworthyHomeStats\(homepageStatItems, statItems\)/);
  assert.match(homepage, /verifiedHomepageStatItems\.map/);
  assert.doesNotMatch(homepage, /homepageStatItems\.length \? homepageStatItems/);
});

test("Preorder merchandise is not advertised as in-stock in schema or checkout", () => {
  const productPage = read("app/product/[slug]/page.tsx");
  const cart = read("app/cart/page.tsx");
  const checkout = read("app/checkout/page.tsx");
  assert.match(productPage, /product\.stockStatus === "preorder"/);
  assert.match(productPage, /https:\/\/schema\.org\/PreOrder/);
  assert.match(cart, /item\.stockStatus === "preorder"/);
  assert.match(checkout, /item\.stockStatus === "preorder"/);
  assert.match(checkout, /confirm availability and dispatch timing/);
});
