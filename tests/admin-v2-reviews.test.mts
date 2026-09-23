import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
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
