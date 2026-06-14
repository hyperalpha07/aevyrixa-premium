import {
  deliveryStatuses,
  type OrderEventRecord,
  type OrderEventType,
  type OrderInvoiceRecord,
  type OrderNoteRecord,
  type OrderNoteType,
  orderSources,
  orderStatuses,
  paymentStatuses,
  paymentVerificationStatuses,
  proofReceivedStatuses,
} from "@/app/lib/order-types";
import { calculateAdminV2PayableTotal } from "@/lib/admin-v2/orders/order-financials";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { getAdminV2OrderAmounts, warnAdminV2OrderAmountDiscrepancy } from "@/lib/admin-v2/orders/order-amounts";
import { adminV2OrderTotalPages, type AdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";
import { eventTypeForStatusChange, sanitizeOrderEventMetadata } from "@/lib/admin-v2/orders/order-events";
import { createDeterministicInvoiceNumber, createOrderInvoiceSnapshot } from "@/lib/admin-v2/orders/order-invoices";
import type {
  OrderCartItem,
  OrderRecord,
  OrderOperationsUpdate,
  OrderSaveResult,
  OrderStorageMode,
  OrderStatus,
  OrderSubmissionInput,
} from "@/app/lib/order-types";

const demoOrders: OrderRecord[] = [];
const SUPABASE_ORDERS_TABLE = "orders";

type SupabaseOrderRow = {
  id?: string;
  order_ref?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  city_area?: string | null;
  delivery_address?: string | null;
  size_fit_note?: string | null;
  delivery_note?: string | null;
  items?: unknown;
  subtotal?: number | string | null;
  total?: number | string | null;
  discount_amount?: number | string | null;
  paid_amount?: number | string | null;
  due_amount?: number | string | null;
  refunded_amount?: number | string | null;
  currency_code?: string | null;
  payment_method?: string | null;
  wallet_provider?: string | null;
  payment_type?: string | null;
  receiver_number?: string | null;
  sender_number?: string | null;
  transaction_id?: string | null;
  status?: string | null;
  courier_name?: string | null;
  tracking_id?: string | null;
  delivery_status?: string | null;
  delivery_charge?: number | string | null;
  delivery_area?: string | null;
  delivery_zone?: string | null;
  assigned_staff?: string | null;
  customer_confirmation_note?: string | null;
  payment_status?: string | null;
  payment_verified_at?: string | null;
  payment_verification_status?: string | null;
  payment_reference?: string | null;
  payment_note?: string | null;
  refund_exchange_request?: string | null;
  size_issue_report?: string | null;
  proof_received?: string | null;
  admin_internal_note?: string | null;
  order_source?: string | null;
  is_test_order?: boolean | string | null;
  test_order?: boolean | string | null;
  archived_at?: string | null;
  is_archived?: boolean | string | null;
  deleted_at?: string | null;
  soft_deleted_at?: string | null;
  cancelled_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // Backward compatibility for the earlier Phase 12 draft Supabase shape.
  order_id?: string;
  order_reference?: string;
  customer?: unknown;
  payment_details?: unknown;
  totals?: unknown;
  total_amount?: number | string | null;
};

type SupabaseOrderNoteRow = {
  id?: string;
  order_ref?: string | null;
  note_body?: string | null;
  note_type?: string | null;
  created_by_admin_id?: string | null;
  created_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type SupabaseOrderEventRow = {
  id?: string;
  order_ref?: string | null;
  event_type?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  reason?: string | null;
  metadata?: unknown;
  actor_admin_id?: string | null;
  actor_name?: string | null;
  created_at?: string | null;
};

type SupabaseInvoiceRow = {
  id?: string;
  invoice_number?: string | null;
  order_ref?: string | null;
  status?: string | null;
  issued_at?: string | null;
  issued_by?: string | null;
  subtotal_amount?: number | string | null;
  discount_amount?: number | string | null;
  delivery_amount?: number | string | null;
  total_amount?: number | string | null;
  currency_code?: string | null;
  snapshot?: unknown;
  created_at?: string | null;
};

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getStorageMode(): OrderStorageMode {
  return hasSupabaseConfig() ? "supabase" : "demo-memory";
}

function createOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AEV-${stamp}-${suffix}`;
}

function buildOrder(input: OrderSubmissionInput): OrderRecord {
  const orderReference = input.orderReference?.trim() || createOrderReference();
  const createdAt = new Date().toISOString();
  const payableTotal =
    calculateAdminV2PayableTotal({
      subtotal: input.totals.subtotal,
      discount: null,
      deliveryCharge: input.deliveryCharge,
    }) ?? input.totals.subtotal;

  return {
    orderId: orderReference,
    orderReference,
    customerId: input.customerId,
    customer: input.customer,
    paymentDetails: input.paymentDetails,
    items: input.items,
    totals: input.totals,
    totalAmount: payableTotal,
    status: "Pending",
    createdAt,
    deliveryCharge: input.deliveryCharge,
    deliveryArea: input.deliveryArea ?? input.customer.cityArea,
    deliveryZone: input.deliveryZone,
    deliveryNote: input.deliveryNote ?? input.customer.deliveryNote,
    paymentStatus: input.paymentStatus,
    paymentReference:
      input.paymentReference ?? input.paymentDetails.transactionReference,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value);
    return Number.isFinite(next) ? next : undefined;
  }
  return undefined;
}

function nullableText(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function safeActorName(actor?: { displayName?: string; username?: string } | null) {
  return actor?.displayName || actor?.username || "Owner";
}

function normalizeStatus(value: unknown): OrderStatus {
  if (
    value === "Pending" ||
    value === "Confirmed" ||
    value === "Shipped" ||
    value === "Delivered" ||
    value === "Cancelled"
  ) {
    return value;
  }

  return "Pending";
}

function normalizeItems(value: unknown): OrderCartItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    id: textValue(item.id) ?? "",
    productId: textValue(item.productId),
    sku: textValue(item.sku),
    slug: textValue(item.slug) ?? "",
    name: textValue(item.name) ?? "",
    price: numberValue(item.price) ?? 0,
    image: normalizeAdminV2ImageSrc(textValue(item.image)) ?? null,
    visualTheme: textValue(item.visualTheme) as OrderCartItem["visualTheme"],
    visualVariant: textValue(item.visualVariant),
    stockStatus: textValue(item.stockStatus) as OrderCartItem["stockStatus"],
    size: textValue(item.size),
    color: textValue(item.color),
    absorbency: textValue(item.absorbency),
    variant: textValue(item.variant),
    quantity: numberValue(item.quantity) ?? 0,
    lineTotal: numberValue(item.lineTotal),
  }));
}

function normalizePaymentVerificationStatus(value: unknown) {
  return paymentVerificationStatuses.includes(value as never)
    ? (value as OrderRecord["paymentVerificationStatus"])
    : undefined;
}

function normalizePaymentStatus(value: unknown) {
  return paymentStatuses.includes(value as never)
    ? (value as OrderRecord["paymentStatus"])
    : undefined;
}

function normalizeDeliveryStatus(value: unknown) {
  return deliveryStatuses.includes(value as never)
    ? (value as OrderRecord["deliveryStatus"])
    : undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
}

function normalizeProofReceived(value: unknown) {
  return proofReceivedStatuses.includes(value as never)
    ? (value as OrderRecord["proofReceived"])
    : undefined;
}

function normalizeOrderSource(value: unknown) {
  return orderSources.includes(value as never)
    ? (value as OrderRecord["orderSource"])
    : undefined;
}

function countItems(items: OrderCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
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

function storageUnavailableError(feature: string) {
  return new Error(`${feature} requires Supabase order storage.`);
}

async function supabaseError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  const suffix = detail ? ` ${detail.slice(0, 240)}` : "";
  return new Error(`Supabase ${action} failed with ${response.status}.${suffix}`);
}

function orderToSupabaseInsertPayload(order: OrderRecord, includeOperationDefaults = true) {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    order_ref: order.orderReference,
    customer_name: order.customer.fullName,
    customer_phone: order.customer.phone,
    customer_email: nullableText(order.customer.email),
    city_area: order.customer.cityArea,
    delivery_address: order.customer.address,
    size_fit_note: nullableText(order.customer.sizeFitNote),
    delivery_note: nullableText(order.customer.deliveryNote),
    items: order.items,
    subtotal: order.totals.subtotal,
    total: order.totalAmount,
    payment_method: order.paymentDetails.paymentMethod,
    wallet_provider: nullableText(order.paymentDetails.walletProvider),
    payment_type: nullableText(order.paymentDetails.paymentType),
    receiver_number: nullableText(order.paymentDetails.receiverNumber),
    sender_number: nullableText(order.paymentDetails.walletSenderNumber),
    transaction_id: nullableText(order.paymentDetails.transactionReference),
    status: order.status,
    delivery_charge: order.deliveryCharge ?? null,
    created_at: order.createdAt,
    updated_at: now,
  };

  if (includeOperationDefaults) {
    payload.customer_id = nullableText(order.customerId);
    payload.delivery_area = nullableText(order.deliveryArea);
    payload.delivery_zone = nullableText(order.deliveryZone);
    payload.discount_amount = order.discountAmount ?? 0;
    payload.paid_amount = order.paidAmount ?? 0;
    payload.due_amount =
      order.dueAmount ??
      (order.paymentDetails.paymentMethod === "Cash on Delivery" ? order.totalAmount : 0);
    payload.refunded_amount = order.refundedAmount ?? 0;
    payload.currency_code = order.currencyCode ?? "BDT";
    payload.payment_status = order.paymentStatus ?? null;
    payload.payment_reference = nullableText(order.paymentReference);
    payload.payment_verified_at = order.paymentVerifiedAt ?? null;
  }

  return payload;
}

async function insertOrderPayload(order: OrderRecord, includeOperationDefaults: boolean) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_ORDERS_TABLE}?select=*`),
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify(orderToSupabaseInsertPayload(order, includeOperationDefaults)),
    }
  );

  return response;
}

async function saveOrderToSupabase(order: OrderRecord) {
  let response = await insertOrderPayload(order, true);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const missingOptionalOperationColumn =
      response.status === 400 &&
      /customer_id|delivery_area|delivery_zone|payment_status|payment_reference|payment_verified_at|discount_amount|paid_amount|due_amount|refunded_amount|currency_code|schema cache|column/i.test(
        detail
      );

    if (!missingOptionalOperationColumn) {
      throw await supabaseError(new Response(detail, { status: response.status }), "order insert");
    }

    response = await insertOrderPayload(order, false);
    if (!response.ok) {
      throw await supabaseError(response, "order insert");
    }
  }

  const rows = (await response.json()) as SupabaseOrderRow[];
  return rows[0] ? mapSupabaseOrder(rows[0]) : order;
}

// TODO: Add cursor/offset pagination when order volume requires it.
async function listOrdersFromSupabase(limit = 100) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_ORDERS_TABLE}?select=*&order=created_at.desc&limit=${limit}`),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw await supabaseError(response, "order list");
  }

  const rows = (await response.json()) as SupabaseOrderRow[];
  return rows.map(mapSupabaseOrder);
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

async function queryOrdersFromSupabase(query: AdminV2OrderQuery) {
  const params = ["select=*"];
  const visibility = ["archived_at.is.null", "deleted_at.is.null", "soft_deleted_at.is.null"];

  if (query.status !== "all") appendFilter(params, "status", "eq", query.status);
  if (query.payment !== "all") appendFilter(params, "payment_method", "eq", query.payment);
  if (query.paymentStatus !== "all") appendFilter(params, "payment_status", "eq", query.paymentStatus);
  if (query.delivery !== "all") appendFilter(params, "delivery_status", "eq", query.delivery);
  if (query.from) appendFilter(params, "created_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "created_at", "lte", `${query.to}T23:59:59.999Z`);

  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    const encoded = encodeURIComponent(`*${safeSearch}*`);
    params.push(
      `or=(order_ref.ilike.${encoded},customer_name.ilike.${encoded},customer_phone.ilike.${encoded},customer_email.ilike.${encoded})`
    );
  }

  params.push(`and=(${visibility.join(",")})`);

  if (query.sort === "oldest") params.push("order=created_at.asc");
  else if (query.sort === "highest") params.push("order=total.desc.nullslast");
  else if (query.sort === "lowest") params.push("order=total.asc.nullslast");
  else params.push("order=created_at.desc");

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`${SUPABASE_ORDERS_TABLE}?${params.join("&")}`), {
    headers: {
      ...supabaseHeaders(),
      prefer: "count=exact",
      range: `${from}-${to}`,
    },
    cache: "no-store",
  });

  if (!response.ok) throw await supabaseError(response, "order query");

  const rows = ((await response.json()) as SupabaseOrderRow[]).map(mapSupabaseOrder);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  const totalCount = Number.isFinite(count) ? count : rows.length;

  return {
    rows,
    totalCount,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: adminV2OrderTotalPages(totalCount, query.pageSize),
    appliedFilters: query,
  };
}

async function getOrderByReferenceFromSupabase(orderRef: string) {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_ORDERS_TABLE}?order_ref=eq.${encodeURIComponent(
        orderRef
      )}&select=*&limit=1`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw await supabaseError(response, "order lookup");
  }

  const rows = (await response.json()) as SupabaseOrderRow[];
  return rows[0] ? mapSupabaseOrder(rows[0]) : null;
}

async function updateOrderStatusInSupabase(
  orderRef: string,
  status: OrderStatus
) {
  return updateOrderOperationsInSupabase(orderRef, { status });
}

function orderOperationsToSupabasePayload(updates: OrderOperationsUpdate) {
  const payload: Record<string, string | number | boolean | null> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) payload.status = updates.status;
  if ("courierName" in updates) payload.courier_name = nullableText(updates.courierName);
  if ("trackingId" in updates) payload.tracking_id = nullableText(updates.trackingId);
  if ("deliveryStatus" in updates) payload.delivery_status = updates.deliveryStatus ?? null;
  if ("deliveryCharge" in updates) payload.delivery_charge = updates.deliveryCharge ?? null;
  if ("deliveryArea" in updates) payload.delivery_area = nullableText(updates.deliveryArea);
  if ("deliveryZone" in updates) payload.delivery_zone = nullableText(updates.deliveryZone);
  if ("deliveryNote" in updates) payload.delivery_note = nullableText(updates.deliveryNote);
  if ("customerConfirmationNote" in updates) {
    payload.customer_confirmation_note = nullableText(updates.customerConfirmationNote);
  }
  if ("paymentStatus" in updates) payload.payment_status = updates.paymentStatus ?? null;
  if ("paymentReference" in updates) {
    payload.payment_reference = nullableText(updates.paymentReference);
  }
  if ("paymentNote" in updates) payload.payment_note = nullableText(updates.paymentNote);
  if ("paymentVerificationStatus" in updates) {
    payload.payment_verification_status = updates.paymentVerificationStatus ?? null;
  }
  if ("refundExchangeRequest" in updates) {
    payload.refund_exchange_request = nullableText(updates.refundExchangeRequest);
  }
  if ("sizeIssueReport" in updates) {
    payload.size_issue_report = nullableText(updates.sizeIssueReport);
  }
  if ("proofReceived" in updates) payload.proof_received = updates.proofReceived ?? null;
  if ("adminInternalNote" in updates) {
    payload.admin_internal_note = nullableText(updates.adminInternalNote);
  }
  if ("orderSource" in updates) payload.order_source = updates.orderSource ?? null;
  if ("assignedStaff" in updates) payload.assigned_staff = nullableText(updates.assignedStaff);
  if ("isTestOrder" in updates) {
    payload.is_test_order = updates.isTestOrder ?? null;
  }
  if ("archivedAt" in updates) payload.archived_at = updates.archivedAt ?? null;
  if ("deletedAt" in updates) payload.deleted_at = updates.deletedAt ?? null;
  if ("softDeletedAt" in updates) payload.soft_deleted_at = updates.softDeletedAt ?? null;
  if ("cancelledReason" in updates) payload.cancelled_reason = nullableText(updates.cancelledReason);

  return payload;
}

async function updateOrderOperationsInSupabase(
  orderRef: string,
  updates: OrderOperationsUpdate
) {
  let payload = orderOperationsToSupabasePayload(updates);
  let response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_ORDERS_TABLE}?order_ref=eq.${encodeURIComponent(
        orderRef
      )}&select=*`
    ),
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const canRetryTestOrder =
      "isTestOrder" in updates &&
      /is_test_order|schema cache|column/i.test(detail);
    const canRetryArchive =
      "archivedAt" in updates && /archived_at|schema cache|column/i.test(detail);

    if (!canRetryTestOrder && !canRetryArchive) {
      throw await supabaseError(
        new Response(detail, { status: response.status }),
        "order operations update"
      );
    }

    payload = { ...payload };
    if (canRetryTestOrder) {
      delete payload.is_test_order;
      payload.test_order = updates.isTestOrder ?? null;
    }
    if (canRetryArchive) {
      delete payload.archived_at;
      payload.is_archived = Boolean(updates.archivedAt);
    }

    response = await fetch(
      supabaseEndpoint(
        `${SUPABASE_ORDERS_TABLE}?order_ref=eq.${encodeURIComponent(
          orderRef
        )}&select=*`
      ),
      {
        method: "PATCH",
        headers: {
          ...supabaseHeaders(),
          prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw await supabaseError(response, "order operations update");
    }
  }

  const rows = (await response.json()) as SupabaseOrderRow[];
  return rows[0] ? mapSupabaseOrder(rows[0]) : null;
}

async function updateOrderStatusWithEventInSupabase(input: {
  orderRef: string;
  status: OrderStatus;
  cancelledReason?: string;
  previousStatus?: OrderStatus;
  actor?: { staffId?: string; displayName?: string; username?: string } | null;
}) {
  const response = await fetch(supabaseEndpoint("rpc/admin_v2_update_order_status_with_event"), {
    method: "POST",
    headers: { ...supabaseHeaders(), prefer: "return=representation" },
    body: JSON.stringify({
      p_order_ref: input.orderRef,
      p_to_status: input.status,
      p_reason: input.cancelledReason ?? null,
      p_actor_admin_id: input.actor?.staffId ?? null,
      p_actor_name: safeActorName(input.actor),
      p_metadata: { fields: ["status", ...(input.cancelledReason ? ["cancelledReason"] : [])] },
    }),
  });

  if (!response.ok) throw await supabaseError(response, "atomic order status update");
  const rows = (await response.json()) as SupabaseOrderRow[];
  return rows[0] ? mapSupabaseOrder(rows[0]) : null;
}

function mapSupabaseOrder(row: SupabaseOrderRow): OrderRecord {
  const legacyCustomer = isRecord(row.customer) ? row.customer : {};
  const legacyPayment = isRecord(row.payment_details) ? row.payment_details : {};
  const legacyTotals = isRecord(row.totals) ? row.totals : {};
  const items = normalizeItems(row.items);
  const subtotal =
    numberValue(row.subtotal) ??
    numberValue(legacyTotals.subtotal) ??
    numberValue(row.total_amount) ??
    0;
  const total = numberValue(row.total) ?? numberValue(row.total_amount) ?? subtotal;
  const orderReference = row.order_ref ?? row.order_reference ?? row.order_id ?? "";

  const order: OrderRecord = {
    orderId: orderReference,
    orderReference,
    customerId: row.customer_id ?? undefined,
    customer: {
      fullName: row.customer_name ?? textValue(legacyCustomer.fullName) ?? "",
      phone: row.customer_phone ?? textValue(legacyCustomer.phone) ?? "",
      email: row.customer_email ?? textValue(legacyCustomer.email),
      cityArea: row.city_area ?? textValue(legacyCustomer.cityArea) ?? "",
      address: row.delivery_address ?? textValue(legacyCustomer.address) ?? "",
      sizeFitNote: row.size_fit_note ?? textValue(legacyCustomer.sizeFitNote),
      deliveryNote: row.delivery_note ?? textValue(legacyCustomer.deliveryNote),
    },
    paymentDetails: {
      paymentMethod:
        (row.payment_method ??
          textValue(legacyPayment.paymentMethod) ??
          "Cash on Delivery") as OrderRecord["paymentDetails"]["paymentMethod"],
      walletProvider:
        (row.wallet_provider ??
          textValue(
            legacyPayment.walletProvider
          )) as OrderRecord["paymentDetails"]["walletProvider"],
      paymentType:
        (row.payment_type ??
          textValue(
            legacyPayment.paymentType
          )) as OrderRecord["paymentDetails"]["paymentType"],
      receiverNumber:
        row.receiver_number ?? textValue(legacyPayment.receiverNumber),
      walletSenderNumber:
        row.sender_number ?? textValue(legacyPayment.walletSenderNumber),
      transactionReference:
        row.transaction_id ?? textValue(legacyPayment.transactionReference),
    },
    items,
    totals: {
      totalItems: numberValue(legacyTotals.totalItems) ?? countItems(items),
      subtotal,
    },
    totalAmount: total,
    discountAmount: numberValue(row.discount_amount),
    paidAmount: numberValue(row.paid_amount),
    dueAmount: numberValue(row.due_amount),
    refundedAmount: numberValue(row.refunded_amount),
    currencyCode: row.currency_code ?? undefined,
    paymentVerifiedAt: row.payment_verified_at ?? undefined,
    status: normalizeStatus(row.status),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? undefined,
    courierName: row.courier_name ?? undefined,
    trackingId: row.tracking_id ?? undefined,
    deliveryStatus: normalizeDeliveryStatus(row.delivery_status),
    deliveryCharge: numberValue(row.delivery_charge),
    deliveryArea: row.delivery_area ?? row.city_area ?? undefined,
    deliveryZone: row.delivery_zone ?? undefined,
    deliveryNote: row.delivery_note ?? textValue(legacyCustomer.deliveryNote),
    customerConfirmationNote: row.customer_confirmation_note ?? undefined,
    paymentStatus: normalizePaymentStatus(row.payment_status),
    paymentVerificationStatus: normalizePaymentVerificationStatus(
      row.payment_verification_status
    ),
    paymentReference:
      row.payment_reference ??
      row.transaction_id ??
      textValue(legacyPayment.transactionReference),
    paymentNote: row.payment_note ?? undefined,
    refundExchangeRequest: row.refund_exchange_request ?? undefined,
    sizeIssueReport: row.size_issue_report ?? undefined,
    proofReceived: normalizeProofReceived(row.proof_received),
    adminInternalNote: row.admin_internal_note ?? undefined,
    orderSource: normalizeOrderSource(row.order_source),
    assignedStaff: row.assigned_staff ?? undefined,
    isTestOrder: booleanValue(row.is_test_order ?? row.test_order),
    archivedAt:
      row.archived_at ??
      (booleanValue(row.is_archived) ? row.updated_at ?? row.created_at ?? undefined : undefined),
    deletedAt: row.deleted_at ?? undefined,
    softDeletedAt: row.soft_deleted_at ?? undefined,
    cancelledReason: row.cancelled_reason ?? undefined,
  };

  warnAdminV2OrderAmountDiscrepancy(order);
  return order;
}

function maybeOrderStatus(value: unknown) {
  return orderStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : undefined;
}

function mapOrderNote(row: SupabaseOrderNoteRow): OrderNoteRecord {
  return {
    id: row.id ?? "",
    orderReference: row.order_ref ?? "",
    noteBody: row.note_body ?? "",
    noteType: (row.note_type ?? "internal") as OrderNoteType,
    createdByAdminId: row.created_by_admin_id ?? undefined,
    createdByName: row.created_by_name ?? "Owner",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? "",
    deletedAt: row.deleted_at ?? undefined,
  };
}

function mapOrderEvent(row: SupabaseOrderEventRow): OrderEventRecord {
  return {
    id: row.id ?? "",
    orderReference: row.order_ref ?? "",
    eventType: (row.event_type ?? "status_changed") as OrderEventType,
    fromStatus: maybeOrderStatus(row.from_status),
    toStatus: maybeOrderStatus(row.to_status),
    reason: row.reason ?? undefined,
    metadata: isRecord(row.metadata) ? row.metadata : {},
    actorAdminId: row.actor_admin_id ?? undefined,
    actorName: row.actor_name ?? "Owner",
    createdAt: row.created_at ?? "",
  };
}

function mapInvoice(row: SupabaseInvoiceRow): OrderInvoiceRecord {
  return {
    id: row.id ?? "",
    invoiceNumber: row.invoice_number ?? "",
    orderReference: row.order_ref ?? "",
    status: row.status === "void" ? "void" : "issued",
    issuedAt: row.issued_at ?? row.created_at ?? "",
    issuedBy: row.issued_by ?? undefined,
    subtotalAmount: numberValue(row.subtotal_amount) ?? 0,
    discountAmount: numberValue(row.discount_amount) ?? 0,
    deliveryAmount: numberValue(row.delivery_amount) ?? 0,
    totalAmount: numberValue(row.total_amount) ?? 0,
    currencyCode: row.currency_code ?? "BDT",
    snapshot: isRecord(row.snapshot) ? row.snapshot : {},
    createdAt: row.created_at ?? row.issued_at ?? "",
  };
}

export async function createOrder(
  input: OrderSubmissionInput
): Promise<OrderSaveResult> {
  const order = buildOrder(input);
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    return { order: await saveOrderToSupabase(order), storageMode };
  }

  // Safe demo fallback: used when Supabase env vars are absent. This keeps
  // local/Vercel builds working, but memory is per runtime instance and is not
  // a production order database. Add Supabase env vars to persist real orders.
  demoOrders.unshift(order);
  return { order, storageMode };
}

export const saveOrder = createOrder;

export async function listOrders() {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    return { orders: await listOrdersFromSupabase(), storageMode };
  }

  // See saveOrder fallback note: admin keeps browser localStorage as the
  // visible fallback until Supabase/Postgres is connected.
  return { orders: demoOrders, storageMode };
}

export async function queryOrders(query: AdminV2OrderQuery) {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    return { ...(await queryOrdersFromSupabase(query)), storageMode };
  }

  return {
    rows: [],
    totalCount: 0,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: 1,
    appliedFilters: query,
    storageMode,
  };
}

export async function getOrderByReference(orderRef: string) {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    return {
      order: await getOrderByReferenceFromSupabase(orderRef),
      storageMode,
    };
  }

  const order =
    demoOrders.find(
      (item) => item.orderReference === orderRef || item.orderId === orderRef
    ) ?? null;

  return { order, storageMode };
}

export async function updateOrderStatus(orderRef: string, status: OrderStatus) {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const order = await updateOrderStatusInSupabase(orderRef, status);
    return { order, storageMode };
  }

  // Safe demo fallback: updates the current runtime memory only. The admin
  // client also updates localStorage so local workflows keep working until
  // Supabase/Postgres becomes the production source of truth.
  const order = demoOrders.find(
    (item) => item.orderReference === orderRef || item.orderId === orderRef
  );

  if (!order) return { order: null, storageMode };

  order.status = status;
  return { order, storageMode };
}

export async function updateOrderOperations(
  orderRef: string,
  updates: OrderOperationsUpdate
) {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const order = await updateOrderOperationsInSupabase(orderRef, updates);
    return { order, storageMode };
  }

  const order = demoOrders.find(
    (item) => item.orderReference === orderRef || item.orderId === orderRef
  );

  if (!order) return { order: null, storageMode };

  Object.assign(order, updates);
  return { order, storageMode };
}

export async function updateOrderStatusWithEvent(input: {
  orderRef: string;
  status: OrderStatus;
  cancelledReason?: string;
  previousStatus?: OrderStatus;
  actor?: { staffId?: string; displayName?: string; username?: string } | null;
}) {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const order = await updateOrderStatusWithEventInSupabase(input);
    return { order, storageMode };
  }

  const result = await updateOrderOperations(input.orderRef, {
    status: input.status,
    cancelledReason: input.cancelledReason,
  });

  return result;
}

export async function listOrderNotes(orderRef: string) {
  if (getStorageMode() !== "supabase") throw storageUnavailableError("Order notes");

  const response = await fetch(
    supabaseEndpoint(
      `order_notes?order_ref=eq.${encodeURIComponent(orderRef)}&deleted_at=is.null&select=*&order=created_at.desc`
    ),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) throw await supabaseError(response, "order notes list");
  return ((await response.json()) as SupabaseOrderNoteRow[]).map(mapOrderNote);
}

export async function addOrderNote(input: {
  orderRef: string;
  noteBody: string;
  noteType: OrderNoteType;
  actor?: { staffId?: string; displayName?: string; username?: string } | null;
}) {
  if (getStorageMode() !== "supabase") throw storageUnavailableError("Order notes");

  const now = new Date().toISOString();
  const response = await fetch(supabaseEndpoint("order_notes?select=*"), {
    method: "POST",
    headers: { ...supabaseHeaders(), prefer: "return=representation" },
    body: JSON.stringify({
      order_ref: input.orderRef,
      note_body: input.noteBody,
      note_type: input.noteType,
      created_by_admin_id: input.actor?.staffId ?? null,
      created_by_name: safeActorName(input.actor),
      created_at: now,
      updated_at: now,
    }),
  });

  if (!response.ok) throw await supabaseError(response, "order note insert");
  const note = mapOrderNote(((await response.json()) as SupabaseOrderNoteRow[])[0] ?? {});

  await recordOrderEvent({
    orderRef: input.orderRef,
    eventType: "note_added",
    actor: input.actor,
    metadata: { noteType: input.noteType },
  }).catch(() => null);

  return note;
}

export async function recordOrderEvent(input: {
  orderRef: string;
  eventType: OrderEventType;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
  actor?: { staffId?: string; displayName?: string; username?: string } | null;
}) {
  if (getStorageMode() !== "supabase") return null;

  const response = await fetch(supabaseEndpoint("order_events?select=*"), {
    method: "POST",
    headers: { ...supabaseHeaders(), prefer: "return=representation" },
    body: JSON.stringify({
      order_ref: input.orderRef,
      event_type: input.eventType,
      from_status: input.fromStatus ?? null,
      to_status: input.toStatus ?? null,
      reason: nullableText(input.reason),
      metadata: sanitizeOrderEventMetadata(input.metadata),
      actor_admin_id: input.actor?.staffId ?? null,
      actor_name: safeActorName(input.actor),
    }),
  });

  if (!response.ok) throw await supabaseError(response, "order event insert");
  return mapOrderEvent(((await response.json()) as SupabaseOrderEventRow[])[0] ?? {});
}

export async function listOrderEvents(orderRef: string) {
  if (getStorageMode() !== "supabase") throw storageUnavailableError("Order events");

  const response = await fetch(
    supabaseEndpoint(`order_events?order_ref=eq.${encodeURIComponent(orderRef)}&select=*&order=created_at.asc`),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) throw await supabaseError(response, "order events list");
  return ((await response.json()) as SupabaseOrderEventRow[]).map(mapOrderEvent);
}

export async function listOrderInvoices(orderRef: string) {
  if (getStorageMode() !== "supabase") throw storageUnavailableError("Order invoices");

  const response = await fetch(
    supabaseEndpoint(`invoices?order_ref=eq.${encodeURIComponent(orderRef)}&select=*&order=issued_at.desc`),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) throw await supabaseError(response, "invoice list");
  return ((await response.json()) as SupabaseInvoiceRow[]).map(mapInvoice);
}

export async function issueOrderInvoice(input: {
  order: OrderRecord;
  actor?: { staffId?: string; displayName?: string; username?: string } | null;
}) {
  if (getStorageMode() !== "supabase") throw storageUnavailableError("Order invoices");

  const existing = await listOrderInvoices(input.order.orderReference);
  if (existing[0]) return existing[0];

  const issuedAt = new Date().toISOString();
  const amounts = getAdminV2OrderAmounts(input.order);
  const invoiceNumber = createDeterministicInvoiceNumber(input.order.orderReference, issuedAt);
  const response = await fetch(supabaseEndpoint("invoices?select=*"), {
    method: "POST",
    headers: { ...supabaseHeaders(), prefer: "return=representation" },
    body: JSON.stringify({
      invoice_number: invoiceNumber,
      order_ref: input.order.orderReference,
      status: "issued",
      issued_at: issuedAt,
      issued_by: safeActorName(input.actor),
      subtotal_amount: amounts.subtotal ?? 0,
      discount_amount: amounts.discount ?? 0,
      delivery_amount: amounts.deliveryCharge ?? 0,
      total_amount: amounts.total ?? 0,
      currency_code: amounts.currency,
      snapshot: createOrderInvoiceSnapshot(input.order),
    }),
  });

  if (response.status === 409) {
    const invoices = await listOrderInvoices(input.order.orderReference);
    if (invoices[0]) return invoices[0];
  }

  if (!response.ok) throw await supabaseError(response, "invoice insert");

  const invoice = mapInvoice(((await response.json()) as SupabaseInvoiceRow[])[0] ?? {});
  await recordOrderEvent({
    orderRef: input.order.orderReference,
    eventType: "invoice_issued",
    actor: input.actor,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  }).catch(() => null);

  return invoice;
}

export { eventTypeForStatusChange };
