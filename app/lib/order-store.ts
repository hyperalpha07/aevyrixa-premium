import {
  deliveryStatuses,
  orderSources,
  paymentStatuses,
  paymentVerificationStatuses,
  proofReceivedStatuses,
} from "@/app/lib/order-types";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { warnAdminV2OrderAmountDiscrepancy } from "@/lib/admin-v2/orders/order-amounts";
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

  return {
    orderId: orderReference,
    orderReference,
    customerId: input.customerId,
    customer: input.customer,
    paymentDetails: input.paymentDetails,
    items: input.items,
    totals: input.totals,
    totalAmount: input.totals.subtotal,
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
    payload.payment_status = order.paymentStatus ?? null;
    payload.payment_reference = nullableText(order.paymentReference);
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
      /customer_id|delivery_area|delivery_zone|payment_status|payment_reference|schema cache|column/i.test(
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
