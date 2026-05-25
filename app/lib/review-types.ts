export const reviewStatuses = ["pending", "approved", "rejected", "hidden"] as const;
export const reviewSourceTypes = ["order-linked", "customer-submitted", "admin-added", "imported"] as const;

export type ReviewStatus = (typeof reviewStatuses)[number];
export type ReviewSourceType = (typeof reviewSourceTypes)[number];

export type ProductReview = {
  id: string;
  productId: string;
  productSlug: string;
  orderId?: string;
  orderReference?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  title?: string;
  body: string;
  mediaUrls: string[];
  status: ReviewStatus;
  sourceType: ReviewSourceType;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};

export type PublicProductReview = Pick<
  ProductReview,
  | "id"
  | "productId"
  | "productSlug"
  | "rating"
  | "title"
  | "body"
  | "mediaUrls"
  | "sourceType"
  | "verifiedPurchase"
  | "isFeatured"
  | "createdAt"
  | "approvedAt"
> & {
  customerName: string;
};

export type ReviewSummary = {
  productId: string;
  productSlug: string;
  averageRating: number;
  reviewCount: number;
};

export type ReviewSubmissionInput = {
  productId: string;
  productSlug: string;
  orderId?: string;
  orderReference?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  title?: string;
  body: string;
  mediaUrls?: string[];
  sourceType?: ReviewSourceType;
  verifiedPurchase?: boolean;
  status?: ReviewStatus;
  isFeatured?: boolean;
  adminNote?: string;
  createdAt?: string;
};
