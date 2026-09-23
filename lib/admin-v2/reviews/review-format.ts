import type { ReviewSourceType, ReviewStatus } from "@/app/lib/review-types";

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
};

export const reviewSourceLabels: Record<ReviewSourceType, string> = {
  "order-linked": "Order-linked",
  "admin-added": "Admin-added",
  imported: "Imported",
};

export function formatReviewDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
