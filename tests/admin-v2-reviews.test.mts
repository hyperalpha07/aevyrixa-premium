import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { reviewProductOptions, selectedReviewProduct } from "../lib/admin-v2/reviews/review-product.ts";
import { reviewStatuses, reviewSourceTypes } from "../app/lib/review-types.ts";
import { hasPermission, normalizePermissions, type AdminSessionUser } from "../app/lib/admin-permissions.ts";
import type { ProductReview } from "../app/lib/review-types.ts";
import { reviewMetrics } from "../lib/admin-v2/reviews/review-metrics.ts";
import { canFeatureReview, queryReviews, reviewListHref } from "../lib/admin-v2/reviews/review-query.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const makeReview = (index: number, status: ProductReview["status"]): ProductReview => ({
  id: String(index), productId: index === 0 ? "product-id" : "", productSlug: `product-${index}`,
  orderReference: index === 0 ? "AEV-ORDER-1" : undefined, customerName: `Customer ${index}`,
  rating: (index % 5) + 1, title: `Title ${index}`, body: index === 3 ? "special feedback" : `Body ${index}`,
  mediaUrls: [], status, sourceType: index === 0 ? "order-linked" : "admin-added",
  verifiedPurchase: index === 0, isApproved: status === "approved", isFeatured: index === 0,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
});
const reviews = Array.from({ length: 45 }, (_, index) => makeReview(index, (["pending", "approved", "rejected", "hidden"] as const)[index % 4]));

test("Reviews route is implemented and protected by existing review access", () => {
  assert.match(read("configs/admin-v2/routes.ts"), /module: "reviews"[^\n]*implemented: true/);
  assert.match(read("configs/admin-v2/permissions.ts"), /reviews: \{ section: "reviews" \}/);
  const page = read("app/admin-v2/reviews/page.tsx");
  assert.match(page, /requireAdminV2RouteAccess\(session, "reviews"\)/);
  assert.match(page, /listAllReviews\(\)/);
});

test("review search, status filters, and 20-per-page pagination use real fields", () => {
  assert.equal(queryReviews(reviews, "Customer 3", "all", 1).totalCount, 11);
  assert.equal(queryReviews(reviews, "special feedback", "all", 1).totalCount, 1);
  assert.equal(queryReviews(reviews, "AEV-ORDER-1", "all", 1).totalCount, 1);
  for (const status of ["pending", "approved", "rejected", "hidden"] as const) {
    assert.equal(queryReviews(reviews, "", status, 1).totalCount, reviews.filter((review) => review.status === status).length);
  }
  assert.equal(queryReviews(reviews, "", "all", 1).reviews.length, 20);
  assert.equal(queryReviews(reviews, "", "all", 3).reviews.length, 5);
  assert.equal(reviewListHref("Title", "approved", 2), "/admin-v2/reviews?q=Title&status=approved&page=2");
});

test("summary and featured rules count approved featured reviews only", () => {
  const metrics = reviewMetrics(reviews);
  assert.equal(metrics.total, 45);
  assert.equal(metrics.pending, reviews.filter((review) => review.status === "pending").length);
  assert.equal(metrics.approved, reviews.filter((review) => review.status === "approved").length);
  assert.equal(metrics.featured, 0);
  assert.equal(canFeatureReview("approved"), true);
  assert.equal(canFeatureReview("pending"), false);
  const store = read("app/lib/review-store.ts");
  assert.match(store, /updates\.status && updates\.status !== "approved"\) payload\.is_featured = false/);
  assert.match(read("app/api/admin/reviews/route.ts"), /Only approved reviews can be featured/);
});

test("permission-specific controls and links stay inside the Reviews workspace", () => {
  const page = read("app/admin-v2/reviews/page.tsx");
  assert.match(page, /reviews\.moderate/);
  assert.match(page, /reviews\.feature/);
  assert.match(page, /reviews\.manage/);
  const view = read("components/admin-v2/views/reviews/AdminV2ReviewsView.tsx");
  assert.match(view, /permissions\.canManage \? <V2Button/);
  assert.match(view, />Add review<\/V2Button>/);
  const row = read("components/admin-v2/views/reviews/AdminV2ReviewRow.tsx");
  assert.match(row, /canModerate \?/);
  assert.match(row, /canFeature && review\.status === "approved"/);
  assert.match(row, /window\.confirm/);
  assert.match(row, /\/admin-v2\/orders\/\$\{encodeURIComponent\(review\.orderReference\)\}/);
  assert.match(row, /\/admin-v2\/products\/\$\{encodeURIComponent\(review\.productId\)\}/);
});

test("Reviews avoids unsafe RSC element and Link component props", () => {
  for (const path of [
    "app/admin-v2/reviews/page.tsx",
    "components/admin-v2/views/reviews/AdminV2ReviewsView.tsx",
    "components/admin-v2/views/reviews/AdminV2ReviewRow.tsx",
    "components/admin-v2/views/reviews/AdminV2ReviewCreateDialog.tsx",
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /divider=\{<Divider/);
    assert.doesNotMatch(source, /component=\{Link\}/);
  }
});

const catalogProducts = [
  { id: "active-id", name: "Active product", slug: "active-product", status: "active", price: 100 },
  { id: "draft-id", name: "Draft product", slug: "draft-product", status: "draft", price: 200 },
  { id: "deleted-id", name: "Deleted product", slug: "deleted-product", status: "active", deletedAt: "2026-01-01" },
];

test("picker exposes only serializable product identity and disables ineligible selections", () => {
  const options = reviewProductOptions(catalogProducts);
  assert.deepEqual(options, catalogProducts.slice(0, 2).map(({ id, name, slug, status }) => ({ id, name, slug, status })));
  assert.deepEqual(JSON.parse(JSON.stringify(options)), options);
  assert.deepEqual(selectedReviewProduct(options, "active-id"), { productId: "active-id", productSlug: "active-product" });
  for (const id of ["draft-id", "deleted-id", "missing-id", "", null]) assert.equal(selectedReviewProduct(catalogProducts, id), null);
  const dialog = read("components/admin-v2/views/reviews/AdminV2ReviewCreateDialog.tsx");
  assert.doesNotMatch(dialog, /label="Product (slug|ID)/);
  assert.doesNotMatch(dialog, /formData\.get\("product(Id|Slug)"\)/);
  assert.match(dialog, /label="Product" select required/);
  assert.match(dialog, /disabled=\{!selectedReviewProduct\(products, product.id\)\}/);
  assert.match(dialog, /disabled=\{!selectedProduct\}/);
  assert.match(dialog, /\.\.\.selectedProduct/);
  assert.match(dialog, /No active products are available\. Publish a product before adding a storefront review\./);
});

// Execute the real POST handler with in-memory dependencies; no network or database writes.
function reviewPostHarness(role: "manager" | "viewer" = "manager", storageMode = "supabase") {
  const created: Record<string, unknown>[] = [];
  let reads = 0;
  const session: AdminSessionUser = { userType: "staff", username: "test", displayName: "Test", role, permissions: normalizePermissions(role, {}) };
  const dependencies: Record<string, unknown> = {
    "@/app/lib/admin-auth": {
      getFreshAdminRequestSession: async () => session,
      forbiddenAdminResponse: () => Response.json({}, { status: 403 }),
      unauthorizedAdminResponse: () => Response.json({}, { status: 401 }),
    },
    "@/app/lib/admin-permissions": { hasPermission },
    "@/app/lib/admin-staff": { logStaffActivity: async () => {} },
    "@/app/lib/product-store": { listProducts: async (options: unknown) => {
      assert.deepEqual(options, { scope: "admin" }); reads++;
      return { products: catalogProducts, storageMode };
    } },
    "@/lib/admin-v2/reviews/review-product": { selectedReviewProduct },
    "@/app/lib/review-types": { reviewStatuses, reviewSourceTypes },
    "@/app/lib/review-store": {
      sanitizeReviewText: (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "",
      createReview: async (input: Record<string, unknown>) => { created.push(input); return { id: "new-review", ...input }; },
      ReviewStoreError: class extends Error {},
    },
  };
  const output = ts.transpileModule(read("app/api/admin/reviews/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  new Function("require", "exports", output)((name: string) => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`); return dependencies[name];
  }, exports);
  return { created, reads: () => reads, post: (payload: Record<string, unknown>) => exports.POST!(new Request("http://localhost/api/admin/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })) };
}

test("real POST rejects draft, deleted, missing and blank products before creating a review", async () => {
  for (const productId of ["draft-id", "deleted-id", "missing-id", "", undefined]) {
    const harness = reviewPostHarness();
    const response = await harness.post({ productId, productSlug: "active-product", body: "Feedback" });
    assert.equal(response.status, 400);
    assert.equal(harness.created.length, 0);
  }
});

test("real POST canonicalizes active ID and slug for admin-added/imported reviews", async () => {
  for (const sourceType of ["admin-added", "imported"]) {
    const harness = reviewPostHarness();
    const response = await harness.post({ productId: "active-id", productSlug: "forged-draft-slug", sourceType, status: "approved", body: "Feedback", customerName: "Test", rating: 5 });
    assert.equal(response.status, 201);
    assert.equal(harness.created.length, 1);
    assert.equal(harness.created[0].productId, "active-id");
    assert.equal(harness.created[0].productSlug, "active-product");
    assert.equal(harness.created[0].status, "approved");
    assert.equal((await response.json()).review.productSlug, "active-product");
  }
});

test("real POST retains manage permission and rejects unavailable/fallback catalog", async () => {
  const viewer = reviewPostHarness("viewer");
  assert.equal((await viewer.post({ productId: "active-id" })).status, 403);
  assert.equal(viewer.reads(), 0);
  assert.equal(viewer.created.length, 0);
  for (const mode of ["fallback-static", "demo-memory"]) {
    const harness = reviewPostHarness("manager", mode);
    assert.equal((await harness.post({ productId: "active-id" })).status, 503);
    assert.equal(harness.created.length, 0);
  }
});
