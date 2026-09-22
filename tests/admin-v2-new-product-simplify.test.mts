import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateAdminV2DraftProduct } from "../lib/admin-v2/product-create.ts";

const form = readFileSync(new URL("../components/admin-v2/views/products/AdminV2NewProductView.tsx", import.meta.url), "utf8");
const createAction = readFileSync(new URL("../app/admin-v2/products/new/actions.ts", import.meta.url), "utf8");
const mediaPage = readFileSync(new URL("../app/admin-v2/products/[productId]/media/page.tsx", import.meta.url), "utf8");
const mediaView = readFileSync(new URL("../components/admin-v2/views/products/AdminV2ProductMediaView.tsx", import.meta.url), "utf8");

test("required essentials stay required while slug is generated from the name", () => {
  const valid = validateAdminV2DraftProduct({ name: "Noromi Cotton Comfort", category: "Period care", price: "850" });
  assert.equal(valid.input?.slug, "noromi-cotton-comfort");
  assert.equal(valid.input?.status, "draft");
  assert.equal(valid.input?.stockStatus, undefined);
  const invalid = validateAdminV2DraftProduct({ name: "", category: "", price: "" });
  assert.equal(invalid.input, null);
  for (const field of ["name", "category", "price"]) assert.ok(invalid.fields[field as keyof typeof invalid.fields]);
});

test("manual slug and optional advanced product fields remain supported", () => {
  const result = validateAdminV2DraftProduct({
    name: "Noromi Cotton Comfort", slug: "custom-cotton-comfort", category: "Period care", price: "850",
    compareAtPrice: "950", stockStatus: "low_stock", stockQuantity: "12", lowStockThreshold: "3",
    sizes: "S, M, s", colors: "Black, Nude, black", absorbency: "Medium", description: "Full copy",
    benefits: "Soft, Breathable", care: "Wash gently, Air dry", seoTitle: "Search title", seoDescription: "Search copy",
  });
  assert.equal(result.input?.slug, "custom-cotton-comfort");
  assert.equal(result.input?.status, "draft");
  assert.equal(result.input?.compareAtPrice, 950);
  assert.equal(result.input?.stockQuantity, 12);
  assert.equal(result.input?.lowStockThreshold, 3);
  assert.deepEqual(result.input?.sizes, ["S", "M"]);
  assert.deepEqual(result.input?.colors, ["Black", "Nude"]);
  assert.deepEqual(result.input?.benefits, ["Soft", "Breathable"]);
  assert.deepEqual(result.input?.care, ["Wash gently", "Air dry"]);
  assert.equal(result.input?.seoTitle, "Search title");
  assert.equal(result.input?.seoDescription, "Search copy");
  assert.equal(result.input?.description, "Full copy");
  assert.equal(result.input?.absorbency, "Medium");
});

test("one essential workspace retains all fields and focused advanced validation", () => {
  for (const field of ["name", "category", "price", "shortDescription", "stockStatus", "stockQuantity",
    "slug", "compareAtPrice", "lowStockThreshold", "sizes", "colors", "absorbency", "description", "benefits", "care", "seoTitle", "seoDescription"]) {
    assert.match(form, new RegExp(`name="${field}"`));
  }
  for (const title of ["More pricing options", "Product options", "Description & care", "SEO settings", "Advanced"]) {
    assert.ok(form.includes(title));
  }
  assert.match(form, /revealAndFocus\(firstField/);
  assert.match(form, /Create Product/);
  assert.match(form, /Product image/);
  assert.equal([...form.matchAll(/<V2Card/g)].length, 1);
});

test("creation keeps least privilege and sends media-capable staff directly to upload", () => {
  assert.match(createAction, /hasPermission\(session, "products\.create"\)/);
  assert.match(createAction, /createDraftProduct\(validation\.input\)/);
  assert.match(createAction, /hasPermission\(session, "products\.media"\) \? `\$\{detailPath\}\/media\?created=1` : detailPath/);
  assert.match(mediaPage, /created: searchParams\.created === "1"/);
  assert.match(mediaView, /Product created\. Add product images\./);
  assert.doesNotMatch(createAction, /uploadProductMediaObject|publishProduct/);
});
