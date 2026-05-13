import type {
  OrderRecord,
  OrderSaveResult,
  OrderStorageMode,
  OrderSubmissionInput,
} from "@/app/lib/order-types";

const demoOrders: OrderRecord[] = [];

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
  const orderReference = createOrderReference();
  const createdAt = new Date().toISOString();

  return {
    ...input,
    orderId: orderReference,
    orderReference,
    totalAmount: input.totals.subtotal,
    status: "Pending",
    createdAt,
  };
}

function supabaseHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

async function saveOrderToSupabase(order: OrderRecord) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");

  const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=representation",
    },
    body: JSON.stringify({
      order_id: order.orderId,
      order_reference: order.orderReference,
      customer: order.customer,
      payment_details: order.paymentDetails,
      items: order.items,
      totals: order.totals,
      total_amount: order.totalAmount,
      status: order.status,
      created_at: order.createdAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase order insert failed with ${response.status}.`);
  }

  return order;
}

async function listOrdersFromSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");

  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase order list failed with ${response.status}.`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    orderId: String(row.order_id ?? row.orderReference ?? ""),
    orderReference: String(row.order_reference ?? row.order_id ?? ""),
    customer: row.customer as OrderRecord["customer"],
    paymentDetails: row.payment_details as OrderRecord["paymentDetails"],
    items: row.items as OrderRecord["items"],
    totals: row.totals as OrderRecord["totals"],
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status as OrderRecord["status"],
    createdAt: String(row.created_at ?? ""),
  }));
}

export async function saveOrder(
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

export async function listOrders() {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    return { orders: await listOrdersFromSupabase(), storageMode };
  }

  // See saveOrder fallback note: admin keeps browser localStorage as the
  // visible fallback until Supabase/Postgres is connected.
  return { orders: demoOrders, storageMode };
}
