import { buildAdminV2MoneyAggregate, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

export const adminV2ExpenseCategories = ["inventory", "shipping", "packaging", "marketing", "salaries", "utilities", "software", "taxes_fees", "office", "other"] as const;
export type AdminV2ExpenseCategory = (typeof adminV2ExpenseCategories)[number];
export type AdminV2ExpenseCategoryFilter = AdminV2ExpenseCategory | "all";

export type AdminV2ExpenseQuery = {
  q: string;
  category: AdminV2ExpenseCategoryFilter;
  status: "all" | "active" | "void";
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2ExpenseRow = {
  id: string;
  reference: string;
  occurredAt: string;
  category: string;
  amount: number | null;
  currencyCode: string;
  payee: string;
  paymentMethod: string;
  description: string;
  orderReference: string;
  status: "active" | "void" | "";
};

export type AdminV2ExpenseMetrics = {
  activeExpenses: number;
  activeAmount: number;
  activeAmountSummary: AdminV2MoneyAggregate;
  voidExpenses: number;
  linkedOrders: number;
};

export type AdminV2ExpenseQueryResult = {
  rows: AdminV2ExpenseRow[];
  metrics: AdminV2ExpenseMetrics;
  query: AdminV2ExpenseQuery;
  totalCount: number;
  totalPages: number;
  storageAvailable: boolean;
  queryFailed: boolean;
  limitation: string | null;
};

const defaultPageSize = 20;
const maxPageSize = 50;

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : "";
}

function oneOf<T extends readonly string[]>(value: string | null, values: T) {
  if (!value || value === "all") return "all";
  return values.includes(value as T[number]) ? (value as T[number]) : "all";
}

export function parseAdminV2ExpenseQuery(searchParams: URLSearchParams): AdminV2ExpenseQuery {
  const status = searchParams.get("status");
  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    category: oneOf(searchParams.get("category"), adminV2ExpenseCategories) as AdminV2ExpenseCategoryFilter,
    status: status === "active" || status === "void" ? status : "all",
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: Math.min(maxPageSize, positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize)),
  };
}

export function adminV2ExpenseTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}

function safeAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildAdminV2ExpenseMetrics(rows: AdminV2ExpenseRow[]): AdminV2ExpenseMetrics {
  const metrics = rows.reduce(
    (metrics, row) => {
      if (row.status === "active") {
        metrics.activeExpenses += 1;
        metrics.activeAmount += safeAmount(row.amount);
      }
      if (row.status === "void") metrics.voidExpenses += 1;
      if (row.orderReference) metrics.linkedOrders += 1;
      return metrics;
    },
    { activeExpenses: 0, activeAmount: 0, voidExpenses: 0, linkedOrders: 0 }
  );
  return {
    ...metrics,
    activeAmountSummary: buildAdminV2MoneyAggregate(rows.filter((row) => row.status === "active").map((row) => ({ amount: row.amount, currencyCode: row.currencyCode }))),
  };
}
