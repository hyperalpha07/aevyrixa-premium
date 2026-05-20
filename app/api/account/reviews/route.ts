import { requireCustomer, customerErrorResponse } from "@/app/api/account/_utils";
import { normalizeCustomerPhone } from "@/app/lib/customer-account-store";
import { listOrders } from "@/app/lib/order-store";
import { createReview, listAllReviews, reviewErrorResponse, sanitizeReviewText } from "@/app/lib/review-store";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ratingValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function reviewableStatus(status?: string, deliveryStatus?: string) {
  return (
    status === "Confirmed" ||
    status === "Delivered" ||
    deliveryStatus === "delivered"
  );
}

function uuidOrUndefined(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

export async function POST(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;

    const payload = (await request.json().catch(() => null)) as unknown;
    if (!isRecord(payload)) {
      return Response.json({ errors: ["Invalid review payload."] }, { status: 400 });
    }

    const orderReference = sanitizeReviewText(payload.orderReference, 120);
    const productId = sanitizeReviewText(payload.productId, 120);
    const productSlug = sanitizeReviewText(payload.productSlug, 160);
    const { orders } = await listOrders();
    const customerPhone = normalizeCustomerPhone(customer.phone);
    const order = orders
      .filter((item) => !item.deletedAt && !item.softDeletedAt)
      .find((item) => {
        const sameOrder = (item.orderReference || item.orderId) === orderReference;
        if (!sameOrder) return false;
        if (item.customerId) return item.customerId === customer.id;
        return normalizeCustomerPhone(item.customer.phone) === customerPhone;
      });

    if (!order) {
      return Response.json(
        { errors: ["This order is not linked to your account."] },
        { status: 403 }
      );
    }

    if (!reviewableStatus(order.status, order.deliveryStatus)) {
      return Response.json(
        { errors: ["Reviews are available after your order is confirmed or delivered."] },
        { status: 403 }
      );
    }

    const purchasedItem = order.items.find((item) => {
      const itemProductId = sanitizeReviewText(item.productId, 120);
      const itemSlug = sanitizeReviewText(item.slug, 160);
      return (productId && itemProductId === productId) || (productSlug && itemSlug === productSlug);
    });

    if (!purchasedItem) {
      return Response.json(
        { errors: ["This product was not found in the selected order."] },
        { status: 403 }
      );
    }

    const existingReviews = await listAllReviews().catch(() => []);
    const duplicate = existingReviews.some((review) => {
      const sameCustomer = review.customerId
        ? review.customerId === customer.id
        : normalizeCustomerPhone(review.customerPhone || "") === customerPhone;
      const sameOrder = review.orderReference === (order.orderReference || order.orderId);
      const sameProduct =
        (productId && review.productId === productId) ||
        (productSlug && review.productSlug === productSlug);
      return sameCustomer && sameOrder && sameProduct && review.status !== "rejected";
    });
    if (duplicate) {
      return Response.json(
        { errors: ["You already submitted a review for this product from this order."] },
        { status: 409 }
      );
    }

    const review = await createReview({
      productId: productId || purchasedItem.productId || purchasedItem.id,
      productSlug: productSlug || purchasedItem.slug || "",
      orderId: uuidOrUndefined(order.orderId),
      orderReference: order.orderReference || order.orderId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      rating: ratingValue(payload.rating),
      title: sanitizeReviewText(payload.title, 120),
      body: sanitizeReviewText(payload.body, 1200),
      mediaUrls: [],
    });

    return Response.json(
      {
        review: {
          id: review.id,
          status: review.status,
          rating: review.rating,
          productSlug: review.productSlug,
        },
        message: "Review submitted. It will appear after admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    const response = reviewErrorResponse(error);
    if (response.status !== 500) return response;
    return customerErrorResponse(error);
  }
}
