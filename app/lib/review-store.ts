import {
  reviewStatuses,
  type ProductReview,
  type PublicProductReview,
  type ReviewStatus,
  type ReviewSubmissionInput,
  type ReviewSummary,
} from "@/app/lib/review-types";

const SUPABASE_REVIEWS_TABLE = "product_reviews";
const demoReviews: ProductReview[] = [];

type SupabaseReviewRow = {
  id?: string;
  product_id?: string | null;
  product_slug?: string | null;
  order_id?: string | null;
  order_reference?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  rating?: number | string | null;
  title?: string | null;
  body?: string | null;
  media_urls?: unknown;
  status?: string | null;
  is_featured?: boolean | string | null;
  admin_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approved_at?: string | null;
};

export class ReviewStoreError extends Error {
  status: number;
  publicMessage: string;
  code: string;

  constructor(
    message: string,
    options: { status?: number; publicMessage?: string; code?: string } = {}
  ) {
    super(message);
    this.name = "ReviewStoreError";
    this.status = options.status ?? 500;
    this.publicMessage = options.publicMessage ?? "Review request failed.";
    this.code = options.code ?? "REVIEW_STORE_ERROR";
  }
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function supabaseHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");

  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

async function supabaseError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  const isMissingTable =
    response.status === 404 ||
    detail.includes("product_reviews") ||
    detail.includes("does not exist") ||
    detail.includes("schema cache");
  return new ReviewStoreError(
    `Supabase review ${action} failed with ${response.status}. ${detail.slice(0, 240)}`,
    {
      status: isMissingTable ? 503 : response.status,
      code: isMissingTable ? "REVIEWS_TABLE_MISSING" : "REVIEWS_SUPABASE_ERROR",
      publicMessage: isMissingTable
        ? "Review backend is not available. Run the Phase 44 product_reviews SQL migration in Supabase first."
        : "Review backend request failed.",
    }
  );
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const text = textValue(value);
  return text || undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function boolValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function normalizeStatus(value: unknown): ReviewStatus {
  return reviewStatuses.includes(value as never) ? (value as ReviewStatus) : "pending";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().startsWith("http"));
}

function clampRating(value: unknown) {
  const rating = Math.round(numberValue(value));
  return Math.min(5, Math.max(1, rating));
}

function uuidOrNull(value: unknown) {
  const text = sanitizeReviewText(value, 120);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function mapRow(row: SupabaseReviewRow): ProductReview {
  const createdAt = row.created_at || new Date().toISOString();
  return {
    id: textValue(row.id),
    productId: textValue(row.product_id),
    productSlug: textValue(row.product_slug),
    orderId: optionalText(row.order_id),
    orderReference: optionalText(row.order_reference),
    customerId: optionalText(row.customer_id),
    customerName: textValue(row.customer_name) || "Customer",
    customerPhone: optionalText(row.customer_phone),
    rating: clampRating(row.rating),
    title: optionalText(row.title),
    body: textValue(row.body),
    mediaUrls: stringArray(row.media_urls),
    status: normalizeStatus(row.status),
    isFeatured: boolValue(row.is_featured),
    adminNote: optionalText(row.admin_note),
    createdAt,
    updatedAt: row.updated_at || createdAt,
    approvedAt: optionalText(row.approved_at),
  };
}

function toPublicReview(review: ProductReview): PublicProductReview {
  return {
    id: review.id,
    productId: review.productId,
    productSlug: review.productSlug,
    customerName: maskCustomerName(review.customerName),
    rating: review.rating,
    title: review.title,
    body: review.body,
    mediaUrls: review.mediaUrls,
    isFeatured: review.isFeatured,
    createdAt: review.createdAt,
    approvedAt: review.approvedAt,
  };
}

export function maskCustomerName(name: string) {
  const safe = name.trim();
  if (!safe) return "Customer";
  const first = safe.split(/\s+/)[0] || safe;
  return first.length <= 1 ? `${first}***` : `${first.slice(0, 1)}***`;
}

export function sanitizeReviewText(value: unknown, maxLength: number) {
  return textValue(value).replace(/[<>]/g, "").slice(0, maxLength).trim();
}

export function validateReviewSubmission(input: ReviewSubmissionInput) {
  const errors: string[] = [];
  if (!sanitizeReviewText(input.productId, 120)) errors.push("Product is required.");
  if (!sanitizeReviewText(input.productSlug, 160)) errors.push("Product slug is required.");
  if (!sanitizeReviewText(input.customerName, 120)) errors.push("Customer name is required.");
  if (!sanitizeReviewText(input.body, 1200)) errors.push("Review body is required.");
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.push("Rating must be between 1 and 5.");
  }
  return errors;
}

function toInsertPayload(input: ReviewSubmissionInput) {
  return {
    product_id: sanitizeReviewText(input.productId, 120),
    product_slug: sanitizeReviewText(input.productSlug, 160),
    order_id: uuidOrNull(input.orderId),
    order_reference: sanitizeReviewText(input.orderReference, 120) || null,
    customer_id: uuidOrNull(input.customerId),
    customer_name: sanitizeReviewText(input.customerName, 120),
    customer_phone: sanitizeReviewText(input.customerPhone, 40) || null,
    rating: clampRating(input.rating),
    title: sanitizeReviewText(input.title, 120) || null,
    body: sanitizeReviewText(input.body, 1200),
    media_urls: stringArray(input.mediaUrls).slice(0, 3),
    status: "pending",
    is_featured: false,
  };
}

function toUpdatePayload(updates: {
  status?: ReviewStatus;
  isFeatured?: boolean;
  adminNote?: string;
}) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.status) {
    payload.status = updates.status;
    payload.approved_at =
      updates.status === "approved" ? new Date().toISOString() : null;
  }
  if (typeof updates.isFeatured === "boolean") payload.is_featured = updates.isFeatured;
  if (updates.adminNote !== undefined) {
    payload.admin_note = sanitizeReviewText(updates.adminNote, 500) || null;
  }
  return payload;
}

async function listReviewsFromSupabase(query: string) {
  const response = await fetch(supabaseEndpoint(query), {
    headers: supabaseHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw await supabaseError(response, "list");
  const rows = (await response.json()) as SupabaseReviewRow[];
  return rows.map(mapRow);
}

async function createReviewInSupabase(input: ReviewSubmissionInput) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_REVIEWS_TABLE}?select=*`),
    {
      method: "POST",
      headers: { ...supabaseHeaders(), prefer: "return=representation" },
      body: JSON.stringify(toInsertPayload(input)),
      cache: "no-store",
    }
  );
  if (!response.ok) throw await supabaseError(response, "create");
  const rows = (await response.json()) as SupabaseReviewRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

async function updateReviewInSupabase(
  id: string,
  updates: { status?: ReviewStatus; isFeatured?: boolean; adminNote?: string }
) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_REVIEWS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`),
    {
      method: "PATCH",
      headers: { ...supabaseHeaders(), prefer: "return=representation" },
      body: JSON.stringify(toUpdatePayload(updates)),
      cache: "no-store",
    }
  );
  if (!response.ok) throw await supabaseError(response, "update");
  const rows = (await response.json()) as SupabaseReviewRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function listApprovedReviewsForProduct(productSlug: string, limit = 20) {
  if (!hasSupabaseConfig()) {
    return demoReviews
      .filter((review) => review.status === "approved" && review.productSlug === productSlug)
      .slice(0, limit)
      .map(toPublicReview);
  }

  try {
    const reviews = await listReviewsFromSupabase(
      `${SUPABASE_REVIEWS_TABLE}?product_slug=eq.${encodeURIComponent(productSlug)}&status=eq.approved&select=*&order=is_featured.desc,created_at.desc&limit=${limit}`
    );
    return reviews.map(toPublicReview);
  } catch (error) {
    console.error("Review product lookup fell back empty:", error);
    return [];
  }
}

export async function listFeaturedTestimonials(limit = 6) {
  if (!hasSupabaseConfig()) {
    return demoReviews
      .filter((review) => review.status === "approved")
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
      .slice(0, limit)
      .map(toPublicReview);
  }

  try {
    const reviews = await listReviewsFromSupabase(
      `${SUPABASE_REVIEWS_TABLE}?status=eq.approved&select=*&order=is_featured.desc,created_at.desc&limit=${limit}`
    );
    return reviews.map(toPublicReview);
  } catch (error) {
    console.error("Review testimonials lookup fell back empty:", error);
    return [];
  }
}

export async function listReviewSummaries() {
  const reviews = hasSupabaseConfig()
    ? await listReviewsFromSupabase(
        `${SUPABASE_REVIEWS_TABLE}?status=eq.approved&select=product_id,product_slug,rating`
      ).catch((error) => {
        console.error("Review summary lookup fell back empty:", error);
        return [];
      })
    : demoReviews.filter((review) => review.status === "approved");

  const grouped = new Map<string, { productId: string; productSlug: string; total: number; count: number }>();
  for (const review of reviews) {
    const key = review.productSlug || review.productId;
    if (!key) continue;
    const current = grouped.get(key) ?? {
      productId: review.productId,
      productSlug: review.productSlug,
      total: 0,
      count: 0,
    };
    current.total += review.rating;
    current.count += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map<ReviewSummary>((item) => ({
    productId: item.productId,
    productSlug: item.productSlug,
    averageRating: Math.round((item.total / item.count) * 10) / 10,
    reviewCount: item.count,
  }));
}

export async function listAllReviews() {
  if (!hasSupabaseConfig()) return [...demoReviews];
  return listReviewsFromSupabase(
    `${SUPABASE_REVIEWS_TABLE}?select=*&order=created_at.desc&limit=200`
  );
}

export async function createReview(input: ReviewSubmissionInput) {
  const errors = validateReviewSubmission(input);
  if (errors.length > 0) {
    throw new ReviewStoreError(errors.join(" "), {
      status: 400,
      code: "INVALID_REVIEW",
      publicMessage: errors[0],
    });
  }

  if (!hasSupabaseConfig()) {
    const now = new Date().toISOString();
    const review: ProductReview = {
      ...toInsertPayload(input),
      id: `demo-${Date.now()}`,
      productId: sanitizeReviewText(input.productId, 120),
      productSlug: sanitizeReviewText(input.productSlug, 160),
      orderId: sanitizeReviewText(input.orderId, 120) || undefined,
      orderReference: sanitizeReviewText(input.orderReference, 120) || undefined,
      customerId: sanitizeReviewText(input.customerId, 120) || undefined,
      customerName: sanitizeReviewText(input.customerName, 120),
      customerPhone: sanitizeReviewText(input.customerPhone, 40) || undefined,
      rating: clampRating(input.rating),
      title: sanitizeReviewText(input.title, 120) || undefined,
      body: sanitizeReviewText(input.body, 1200),
      mediaUrls: stringArray(input.mediaUrls).slice(0, 3),
      status: "pending",
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    };
    demoReviews.unshift(review);
    return review;
  }

  const review = await createReviewInSupabase(input);
  if (!review) {
    throw new ReviewStoreError("Review insert returned no row.", {
      publicMessage: "Review could not be submitted.",
    });
  }
  return review;
}

export async function updateReview(
  id: string,
  updates: { status?: ReviewStatus; isFeatured?: boolean; adminNote?: string }
) {
  if (updates.status && !reviewStatuses.includes(updates.status)) {
    throw new ReviewStoreError("Invalid review status.", {
      status: 400,
      publicMessage: "Invalid review status.",
      code: "INVALID_REVIEW_STATUS",
    });
  }

  if (!hasSupabaseConfig()) {
    const index = demoReviews.findIndex((review) => review.id === id);
    if (index < 0) return null;
    demoReviews[index] = {
      ...demoReviews[index],
      ...(updates.status ? { status: updates.status } : {}),
      ...(typeof updates.isFeatured === "boolean" ? { isFeatured: updates.isFeatured } : {}),
      ...(updates.adminNote !== undefined ? { adminNote: sanitizeReviewText(updates.adminNote, 500) } : {}),
      approvedAt: updates.status === "approved" ? new Date().toISOString() : demoReviews[index].approvedAt,
      updatedAt: new Date().toISOString(),
    };
    return demoReviews[index];
  }

  return updateReviewInSupabase(id, updates);
}

export function reviewErrorResponse(error: unknown) {
  if (error instanceof ReviewStoreError) {
    return Response.json(
      { errors: [error.publicMessage], code: error.code },
      { status: error.status }
    );
  }
  console.error("Review API error:", error);
  return Response.json({ errors: ["Review request failed."] }, { status: 500 });
}
