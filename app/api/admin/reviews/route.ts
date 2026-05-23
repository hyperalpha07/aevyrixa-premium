import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  listAllReviews,
  createReview,
  deleteReview,
  reviewErrorResponse,
  sanitizeReviewText,
  updateReview,
} from "@/app/lib/review-store";
import {
  reviewSourceTypes,
  reviewStatuses,
  type ReviewSourceType,
  type ReviewStatus,
} from "@/app/lib/review-types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function statusValue(value: unknown): ReviewStatus | undefined {
  return reviewStatuses.includes(value as never) ? (value as ReviewStatus) : undefined;
}

function sourceTypeValue(value: unknown): ReviewSourceType {
  return reviewSourceTypes.includes(value as never)
    ? (value as ReviewSourceType)
    : "admin-added";
}

function ratingValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(5, Math.max(1, Math.round(parsed))) : 0;
}

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "reviews.view")) return forbiddenAdminResponse();

  try {
    const reviews = await listAllReviews();
    return Response.json({ reviews });
  } catch (error) {
    return reviewErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "reviews.manage")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "review",
      targetId: "create",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(payload)) {
    return Response.json({ errors: ["Invalid review payload."] }, { status: 400 });
  }

  try {
    const sourceType = sourceTypeValue(payload.sourceType);
    const status = statusValue(payload.status) ?? "pending";
    const review = await createReview({
      productId: sanitizeReviewText(payload.productId, 120),
      productSlug: sanitizeReviewText(payload.productSlug, 160),
      customerName: sanitizeReviewText(payload.customerName, 120),
      rating: ratingValue(payload.rating),
      title: sanitizeReviewText(payload.title, 120),
      body: sanitizeReviewText(payload.body, 1200),
      mediaUrls: Array.isArray(payload.mediaUrls)
        ? payload.mediaUrls.filter((url): url is string => typeof url === "string")
        : [],
      status,
      sourceType,
      verifiedPurchase: false,
      isFeatured: Boolean(payload.isFeatured) && status === "approved",
      adminNote: sanitizeReviewText(payload.adminNote, 500),
      createdAt: typeof payload.createdAt === "string" ? payload.createdAt : undefined,
    });

    await logStaffActivity({
      actor: session,
      action: "review.created",
      targetType: "review",
      targetId: review.id,
      metadata: { sourceType, status },
    });
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return reviewErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "reviews.manage") && !hasPermission(session, "reviews.moderate")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "review",
      targetId: "update",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(payload)) {
    return Response.json({ errors: ["Invalid review payload."] }, { status: 400 });
  }

  const id = sanitizeReviewText(payload.id, 120);
  if (!id) return Response.json({ errors: ["Review id is required."] }, { status: 400 });

  const nextStatus = statusValue(payload.status);
  const sourceType =
    payload.sourceType === undefined ? undefined : sourceTypeValue(payload.sourceType);
  const wantsFeatured = typeof payload.isFeatured === "boolean";
  const isFeatured = wantsFeatured ? Boolean(payload.isFeatured) : undefined;
  if (wantsFeatured && !hasPermission(session, "reviews.feature") && !hasPermission(session, "reviews.manage")) {
    return forbiddenAdminResponse();
  }

  try {
    const review = await updateReview(id, {
      status: nextStatus,
      isFeatured,
      adminNote:
        typeof payload.adminNote === "string"
          ? sanitizeReviewText(payload.adminNote, 500)
          : undefined,
      productId:
        typeof payload.productId === "string"
          ? sanitizeReviewText(payload.productId, 120)
          : undefined,
      productSlug:
        typeof payload.productSlug === "string"
          ? sanitizeReviewText(payload.productSlug, 160)
          : undefined,
      customerName:
        typeof payload.customerName === "string"
          ? sanitizeReviewText(payload.customerName, 120)
          : undefined,
      rating: payload.rating === undefined ? undefined : ratingValue(payload.rating),
      title:
        typeof payload.title === "string"
          ? sanitizeReviewText(payload.title, 120)
          : undefined,
      body:
        typeof payload.body === "string"
          ? sanitizeReviewText(payload.body, 1200)
          : undefined,
      mediaUrls: Array.isArray(payload.mediaUrls)
        ? payload.mediaUrls.filter((url): url is string => typeof url === "string")
        : undefined,
      sourceType,
      verifiedPurchase: sourceType && sourceType !== "order-linked" ? false : undefined,
      orderReference:
        typeof payload.orderReference === "string"
          ? sanitizeReviewText(payload.orderReference, 120)
          : undefined,
      createdAt: typeof payload.createdAt === "string" ? payload.createdAt : undefined,
    });
    await logStaffActivity({
      actor: session,
      action: "review.updated",
      targetType: "review",
      targetId: id,
      metadata: { status: nextStatus, isFeatured },
    });
    return Response.json({ review });
  } catch (error) {
    return reviewErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "reviews.manage")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "review",
      targetId: "delete",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(payload)) {
    return Response.json({ errors: ["Invalid review payload."] }, { status: 400 });
  }

  const id = sanitizeReviewText(payload.id, 120);
  if (!id) return Response.json({ errors: ["Review id is required."] }, { status: 400 });

  try {
    await deleteReview(id);
    await logStaffActivity({
      actor: session,
      action: "review.deleted",
      targetType: "review",
      targetId: id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return reviewErrorResponse(error);
  }
}
