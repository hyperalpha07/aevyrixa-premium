import type { ProductReview, ReviewStatus } from "@/app/lib/review-types";

export const reviewPageSize = 20;
export const reviewFilters = ["all", "pending", "approved", "rejected", "hidden"] as const;

export type ReviewFilter = (typeof reviewFilters)[number];

export function parseReviewFilter(value: string | undefined): ReviewFilter {
  return reviewFilters.includes(value as ReviewFilter) ? (value as ReviewFilter) : "all";
}

export function reviewListHref(query: string, status: ReviewFilter, page = 1) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/admin-v2/reviews${suffix ? `?${suffix}` : ""}`;
}

export function queryReviews(
  reviews: ProductReview[],
  query: string,
  status: ReviewFilter,
  requestedPage: number,
) {
  const search = query.trim().toLowerCase();
  const filtered = reviews.filter((review) => {
    if (status !== "all" && review.status !== status) return false;
    if (!search) return true;
    return [review.customerName, review.productSlug, review.orderReference, review.title, review.body]
      .some((value) => value?.toLowerCase().includes(search));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / reviewPageSize));
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const start = (page - 1) * reviewPageSize;
  return { reviews: filtered.slice(start, start + reviewPageSize), page, totalPages, totalCount: filtered.length };
}

export function canFeatureReview(status: ReviewStatus) {
  return status === "approved";
}
