import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  liveMediaUpdateQuery, canRemovePublishedProductImage, draftMediaUpdateQuery,
  appendDraftProductImage, removeDraftProductImage, draftProductMediaUrls,
} from "../lib/admin-v2/product-media.ts";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const id = "f014db35-cf90-4ee0-8be9-8b91f93a6812";

test("Active product gallery updates require active record, not a deleted or stale record", () => {
  const q=liveMediaUpdateQuery(id,"2026-10-23T09:00:00.000Z");
  assert.equal(q.get("id"),`eq.${id}`);
  assert.equal(q.get("status"),"eq.active");
  assert.equal(q.get("updated_at"),"eq.2026-10-23T09:00:00.000Z");
  assert.equal(q.get("deleted_at"),"is.null");
  assert.equal(q.get("select"),"id,status");
  assert.equal(draftMediaUpdateQuery(id).get("status"),"eq.draft");
});

test("Published products must retain an image and only remove current references", () => {
  const row={images:["first.webp","second.webp"],primary_image_url:"first.webp",image_url:"first.webp"};
  assert.equal(canRemovePublishedProductImage(row,"first.webp"),true);
  assert.equal(canRemovePublishedProductImage({...row,images:["first.webp"]},"first.webp"),false);
  assert.equal(canRemovePublishedProductImage(row,"not-in-gallery.webp"),false);
  assert.equal(draftProductMediaUrls(row).length,2);
  const payload=removeDraftProductImage(row,id,"first.webp");
  assert.deepEqual(payload?.images,["second.webp"]);
  assert.equal(payload?.primary_image_url,"second.webp");
  assert.deepEqual(appendDraftProductImage(row,"third.webp","products/x/images/third.webp").images,["first.webp","second.webp","third.webp"]);
});

test("Media actions authorize staff and never mutate status or delete published storage", () => {
  const actions=read("app/admin-v2/products/[productId]/media/actions.ts");
  assert.ok(actions.includes('hasPermission(session, "products.media")'));
  assert.ok(actions.includes('row.status !== "draft" && row.status !== "active"'));
  assert.ok(actions.includes('row.status === "active"'));
  assert.ok(actions.includes("liveMediaUpdateQuery(productId, row.updated_at)"));
  assert.ok(actions.includes("canRemovePublishedProductImage(row, imageUrl)"));
  assert.ok(actions.includes('typedOperation === "remove" && row.status === "draft"'));
  assert.ok(actions.includes("updated_at: new Date().toISOString()"));
  assert.doesNotMatch(actions,/body: JSON\.stringify\(\{[^\n]*status:/);
});

test("Active product media is accessible through guarded editor route and product detail", () => {
  const page=read("app/admin-v2/products/[productId]/media/page.tsx");
  const detail=read("components/admin-v2/views/products/AdminV2ProductDetailView.tsx");
  const view=read("components/admin-v2/views/products/AdminV2ProductMediaView.tsx");
  assert.ok(page.includes('requireAdminV2RouteAccess(session, "productMedia")'));
  assert.ok(page.includes('product.status !== "draft" && product.status !== "active"'));
  assert.ok(detail.includes('(product.status === "draft" || product.status === "active")'));
  assert.ok(view.includes('status === "active" && images.length <= 1'));
  assert.ok(view.includes("Upload to live product"));
  assert.ok(view.includes("Removed live images are unlinked, not deleted from Storage."));
});
