import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  eventTypeForStatusChange,
  getOrderByReference,
  recordOrderEvent,
  updateOrderOperations,
  updateOrderStatusWithEvent,
} from "@/app/lib/order-store";
import { validNextAdminV2OrderStatuses } from "@/lib/admin-v2/orders/order-status-transitions";
import {
  deliveryStatuses,
  orderSources,
  orderStatuses,
  paymentStatuses,
  paymentVerificationStatuses,
  proofReceivedStatuses,
  type DeliveryStatus,
  type OrderOperationsUpdate,
  type OrderSource,
  type OrderStatus,
  type PaymentStatus,
  type PaymentVerificationStatus,
  type ProofReceivedStatus,
} from "@/app/lib/order-types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

function optionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
}

function validateOperationsPayload(payload: unknown): {
  updates?: OrderOperationsUpdate;
  errors: string[];
} {
  if (!isRecord(payload)) return { errors: ["Invalid order operations payload."] };

  const updates: OrderOperationsUpdate = {};
  const errors: string[] = [];

  if ("status" in payload) {
    if (!orderStatuses.includes(payload.status as OrderStatus)) {
      errors.push("Order status is invalid.");
    } else {
      updates.status = payload.status as OrderStatus;
    }
  }

  const textFields = [
    ["courierName", "courierName"],
    ["trackingId", "trackingId"],
    ["deliveryArea", "deliveryArea"],
    ["deliveryZone", "deliveryZone"],
    ["deliveryNote", "deliveryNote"],
    ["customerConfirmationNote", "customerConfirmationNote"],
    ["paymentReference", "paymentReference"],
    ["paymentNote", "paymentNote"],
    ["refundExchangeRequest", "refundExchangeRequest"],
    ["sizeIssueReport", "sizeIssueReport"],
    ["adminInternalNote", "adminInternalNote"],
    ["assignedStaff", "assignedStaff"],
    ["archivedAt", "archivedAt"],
    ["deletedAt", "deletedAt"],
    ["softDeletedAt", "softDeletedAt"],
    ["cancelledReason", "cancelledReason"],
  ] as const;

  textFields.forEach(([payloadKey, updateKey]) => {
    if (payloadKey in payload) {
      updates[updateKey] = optionalText(payload[payloadKey]);
    }
  });

  if ("deliveryCharge" in payload) {
    const deliveryCharge = optionalNumber(payload.deliveryCharge);
    if (Number.isNaN(deliveryCharge) || (deliveryCharge ?? 0) < 0) {
      errors.push("Delivery charge must be a positive number.");
    } else {
      updates.deliveryCharge = deliveryCharge;
    }
  }

  if ("deliveryStatus" in payload) {
    if (!deliveryStatuses.includes(payload.deliveryStatus as DeliveryStatus)) {
      errors.push("Delivery status is invalid.");
    } else {
      updates.deliveryStatus = payload.deliveryStatus as DeliveryStatus;
    }
  }

  if ("paymentStatus" in payload) {
    if (!paymentStatuses.includes(payload.paymentStatus as PaymentStatus)) {
      errors.push("Payment status is invalid.");
    } else {
      updates.paymentStatus = payload.paymentStatus as PaymentStatus;
    }
  }

  if ("paymentVerificationStatus" in payload) {
    if (
      !paymentVerificationStatuses.includes(
        payload.paymentVerificationStatus as PaymentVerificationStatus
      )
    ) {
      errors.push("Payment verification status is invalid.");
    } else {
      updates.paymentVerificationStatus =
        payload.paymentVerificationStatus as PaymentVerificationStatus;
    }
  }

  if ("proofReceived" in payload) {
    if (!proofReceivedStatuses.includes(payload.proofReceived as ProofReceivedStatus)) {
      errors.push("Proof received status is invalid.");
    } else {
      updates.proofReceived = payload.proofReceived as ProofReceivedStatus;
    }
  }

  if ("orderSource" in payload) {
    if (!orderSources.includes(payload.orderSource as OrderSource)) {
      errors.push("Order source is invalid.");
    } else {
      updates.orderSource = payload.orderSource as OrderSource;
    }
  }

  if ("isTestOrder" in payload) {
    const isTestOrder = optionalBoolean(payload.isTestOrder);
    if (typeof isTestOrder !== "boolean") {
      errors.push("Test order flag is invalid.");
    } else {
      updates.isTestOrder = isTestOrder;
    }
  }

  if (Object.keys(updates).length === 0 && errors.length === 0) {
    errors.push("At least one order operation field is required.");
  }

  return errors.length > 0 ? { errors } : { updates, errors };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderRef: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();

  const { orderRef } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const { updates, errors } = validateOperationsPayload(payload);
  if (!updates) return Response.json({ errors }, { status: 400 });

  const needsArchivePermission = "archivedAt" in updates || "isTestOrder" in updates;
  const needsCourierPermission =
    "courierName" in updates ||
    "trackingId" in updates ||
    "deliveryStatus" in updates ||
    "deliveryCharge" in updates ||
    "deliveryArea" in updates ||
    "deliveryZone" in updates ||
    "deliveryNote" in updates;
  const needsStatusPermission = "status" in updates;

  if (
    (needsArchivePermission && !hasPermission(session, "orders.archiveTest")) ||
    (needsCourierPermission && !hasPermission(session, "orders.editCourier")) ||
    (needsStatusPermission && !hasPermission(session, "orders.editStatus")) ||
    (!needsArchivePermission &&
      !needsCourierPermission &&
      !needsStatusPermission &&
      !hasPermission(session, "orders.editStatus"))
  ) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "order",
      targetId: orderRef,
      metadata: { reason: "missing_permission", fields: Object.keys(updates) },
    });
    return forbiddenAdminResponse();
  }

  try {
    let previousStatus: OrderStatus | undefined;
    if ("status" in updates) {
      const existing = await getOrderByReference(orderRef);
      if (!existing.order) {
        return Response.json(
          { errors: ["Order was not found."], storageMode: existing.storageMode },
          { status: 404 }
        );
      }
      const currentStatus = existing.order.status;
      previousStatus = currentStatus;
      if (!validNextAdminV2OrderStatuses(currentStatus).includes(updates.status as OrderStatus)) {
        return Response.json(
          { errors: ["Order status transition is not valid for the current order state."] },
          { status: 409 }
        );
      }
      if (updates.status === "Cancelled" && !updates.cancelledReason?.trim()) {
        return Response.json(
          { errors: ["Cancellation reason is required."] },
          { status: 400 }
        );
      }
    }

    const result =
      previousStatus && updates.status
        ? await updateOrderStatusWithEvent({
            orderRef,
            status: updates.status,
            cancelledReason: updates.cancelledReason,
            previousStatus,
            actor: session,
          })
        : await updateOrderOperations(orderRef, updates);

    if (!result.order) {
      return Response.json(
        { errors: ["Order was not found."], storageMode: result.storageMode },
        { status: 404 }
      );
    }

    await logStaffActivity({
      actor: session,
      action: needsCourierPermission ? "order.courier_updated" : "order.updated",
      targetType: "order",
      targetId: orderRef,
      metadata: { fields: Object.keys(updates) },
    });

    if (!previousStatus && updates.status) {
      await recordOrderEvent({
        orderRef,
        eventType: eventTypeForStatusChange(updates.status),
        fromStatus: previousStatus,
        toStatus: updates.status,
        reason: updates.cancelledReason,
        actor: session,
        metadata: { fields: Object.keys(updates) },
      }).catch((eventError) => {
        console.error("Failed to record order event:", eventError);
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Failed to update order operations:", error);
    return Response.json(
      {
        errors: [
          "Order operations could not be updated. If Supabase is configured, confirm the Phase 37 order operation columns exist.",
        ],
      },
      { status: 500 }
    );
  }
}
