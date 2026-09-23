import type { ProductReview } from "@/app/lib/review-types";

export function reviewMetrics(reviews: ProductReview[]) {
  return {
    total: reviews.length,
    pending: reviews.filter((review) => review.status === "pending").length,
    approved: reviews.filter((review) => review.status === "approved").length,
    featured: reviews.filter((review) => review.status === "approved" && review.isFeatured).length,
  };
}
