import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  listAllReviews,
  reviewErrorResponse,
  sanitizeReviewText,
  updateReview,
} from "@/app/lib/review-store";
import { reviewStatuses, type ReviewStatus } from "@/app/lib/review-types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function statusValue(value: unknown): ReviewStatus | undefined {
  return reviewStatuses.includes(value as never) ? (value as ReviewStatus) : undefined;
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
