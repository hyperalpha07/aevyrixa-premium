import "server-only";

import { buildAdminV2MoneyAggregate, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";
import {
  calculateAdminV2PayableTotal,
  hasAdminV2TotalMismatch,
} from "@/lib/admin-v2/orders/order-financials";

const orderDueRowLimit = 10000;
const orderDueSelect = "subtotal,discount_amount,delivery_charge,total,due_amount,currency_code,status,archived_at,id";

type OrderDueRow = {
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  delivery_charge?: number | string | null;
  due_amount?: number | string | null;
  total?: number | string | null;
  currency_code?: string | null;
  status?: string | null;
  archived_at?: string | null;
};

export type AdminV2OrderDueSnapshotResult = {
  available: boolean;
  complete: boolean;
  knownCount: number;
  eligibleOrderCount: number;
  summary: AdminV2MoneyAggregate;
  orderValueKnownCount: number;
  orderValueSummary: AdminV2MoneyAggregate;
  calculatedPayableKnownCount: number;
  calculatedPayableSummary: AdminV2MoneyAggregate;
  arithmeticMismatchCount: number;
  arithmeticMismatchDifferenceSummary: AdminV2MoneyAggregate;
  limitation: string | null;
};

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

function contentRangeTotal(value: string | null) {
  if (!value) return null;
  const match = value.match(/\/(\d+|\*)$/);
  if (!match || match[1] === "*") return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseAdminV2OrderDueAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export async function getAdminV2OrderDueSnapshots(): Promise<AdminV2OrderDueSnapshotResult> {
  if (!hasSupabaseConfig()) {
    return {
      available: false,
      complete: false,
      knownCount: 0,
      eligibleOrderCount: 0,
      summary: buildAdminV2MoneyAggregate([]),
      orderValueKnownCount: 0,
      orderValueSummary: buildAdminV2MoneyAggregate([]),
      calculatedPayableKnownCount: 0,
      calculatedPayableSummary: buildAdminV2MoneyAggregate([]),
      arithmeticMismatchCount: 0,
      arithmeticMismatchDifferenceSummary: buildAdminV2MoneyAggregate([]),
      limitation: "Supabase is not configured. Recorded due snapshots are unavailable.",
    };
  }

  try {
    const rows: OrderDueRow[] = [];
    let totalCount: number | null = null;
    const params = new URLSearchParams({
      select: orderDueSelect,
      status: "neq.Cancelled",
      archived_at: "is.null",
      order: "id.asc",
    });

    for (let from = 0; from < orderDueRowLimit; from += 1000) {
      const to = Math.min(from + 999, orderDueRowLimit - 1);
      const response = await fetch(supabaseEndpoint(`orders?${params.toString()}`), {
        headers: supabaseHeaders({ prefer: "count=exact", range: `${from}-${to}` }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Order due source unavailable.");
      totalCount ??= contentRangeTotal(response.headers.get("content-range"));
      const batch = (await response.json()) as OrderDueRow[];
      rows.push(...batch);
      if (batch.length < 1000) break;
    }

    const complete = totalCount === null ? rows.length < orderDueRowLimit : totalCount <= rows.length;
    const knownRows = rows
      .map((row) => ({ amount: parseAdminV2OrderDueAmount(row.due_amount), currencyCode: row.currency_code || "BDT" }))
      .filter((row) => row.amount !== null);
    const orderValueRows = rows
      .map((row) => ({ amount: parseAdminV2OrderDueAmount(row.total), currencyCode: row.currency_code || "BDT" }))
      .filter((row) => row.amount !== null);
    const calculatedRows = rows
      .map((row) => ({
        amount: calculateAdminV2PayableTotal({
          subtotal: parseAdminV2OrderDueAmount(row.subtotal),
          discount: parseAdminV2OrderDueAmount(row.discount_amount) ?? 0,
          deliveryCharge: parseAdminV2OrderDueAmount(row.delivery_charge),
        }),
        currencyCode: row.currency_code || "BDT",
      }))
      .filter((row) => row.amount !== null);
    const mismatchRows = rows
      .map((row) => {
        const storedTotal = parseAdminV2OrderDueAmount(row.total);
        const calculatedPayable = calculateAdminV2PayableTotal({
          subtotal: parseAdminV2OrderDueAmount(row.subtotal),
          discount: parseAdminV2OrderDueAmount(row.discount_amount) ?? 0,
          deliveryCharge: parseAdminV2OrderDueAmount(row.delivery_charge),
        });
        if (storedTotal === null || calculatedPayable === null || !hasAdminV2TotalMismatch(storedTotal, calculatedPayable)) {
          return null;
        }
        return { amount: Math.abs(calculatedPayable - storedTotal), currencyCode: row.currency_code || "BDT" };
      })
      .filter((row): row is { amount: number; currencyCode: string } => row !== null);
    const eligibleOrderCount = Number.isFinite(totalCount) ? Number(totalCount) : rows.length;
    const missingCount = Math.max(0, eligibleOrderCount - knownRows.length);
    const missingOrderValueCount = Math.max(0, eligibleOrderCount - orderValueRows.length);
    const capLimitation = complete ? null : `Recorded due source reached the ${orderDueRowLimit.toLocaleString("en")} row extraction cap.`;
    const coverageLimitation = missingCount > 0
      ? `Recorded due from ${knownRows.length.toLocaleString("en")} orders with persisted due snapshots; ${missingCount.toLocaleString("en")} eligible older orders without a due snapshot are excluded.`
      : null;
    const orderValueLimitation = missingOrderValueCount > 0
      ? `Order value totals are available for ${orderValueRows.length.toLocaleString("en")} of ${eligibleOrderCount.toLocaleString("en")} eligible orders.`
      : null;

    return {
      available: true,
      complete: complete && missingCount === 0,
      knownCount: knownRows.length,
      eligibleOrderCount,
      summary: buildAdminV2MoneyAggregate(knownRows),
      orderValueKnownCount: orderValueRows.length,
      orderValueSummary: buildAdminV2MoneyAggregate(orderValueRows),
      calculatedPayableKnownCount: calculatedRows.length,
      calculatedPayableSummary: buildAdminV2MoneyAggregate(calculatedRows),
      arithmeticMismatchCount: mismatchRows.length,
      arithmeticMismatchDifferenceSummary: buildAdminV2MoneyAggregate(mismatchRows),
      limitation: coverageLimitation ?? orderValueLimitation ?? capLimitation,
    };
  } catch {
    return {
      available: false,
      complete: false,
      knownCount: 0,
      eligibleOrderCount: 0,
      summary: buildAdminV2MoneyAggregate([]),
      orderValueKnownCount: 0,
      orderValueSummary: buildAdminV2MoneyAggregate([]),
      calculatedPayableKnownCount: 0,
      calculatedPayableSummary: buildAdminV2MoneyAggregate([]),
      arithmeticMismatchCount: 0,
      arithmeticMismatchDifferenceSummary: buildAdminV2MoneyAggregate([]),
      limitation: "Recorded due snapshots could not be loaded.",
    };
  }
}
