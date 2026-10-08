import type { AdminV2ReportResult, ReportTableRow } from "@/lib/admin-v2/reports/reports-metrics";

const exportedColumns: Record<string, string[]> = {
  sales: ["metric", "value"],
  orders: ["orderReference", "createdAt", "status", "items", "payableTotal"],
  products: ["product", "quantity", "orderValue", "orderCount"],
  customers: ["customerId", "createdAt", "orderCount", "orderValue"],
  reviews: ["product", "rating", "status", "createdAt"],
  fees: ["orderReference", "createdAt", "discountAmount", "deliveryCharge", "payableTotal"],
};

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

function fullRows(report: AdminV2ReportResult): ReportTableRow[] {
  if (report.type !== "sales") return report.rows;
  return [
    { metric: "Orders", value: report.analytics.kpis.orders },
    { metric: "Payable Sales", value: report.analytics.kpis.payableSales },
    { metric: "Average Order Value", value: report.analytics.kpis.averageOrderValue },
    { metric: "Discounts", value: report.analytics.valueBreakdown.discounts },
    { metric: "Delivery Fees", value: report.analytics.valueBreakdown.deliveryFees },
  ];
}

export function adminV2ReportCsvFilename(report: AdminV2ReportResult) {
  return `noromi-${slug(report.label)}-${report.range.from}-to-${report.range.to}.csv`;
}

export function adminV2ReportToCsv(report: AdminV2ReportResult) {
  if (!report.exportable) {
    throw new Error(report.exportDisabledReason ?? "Export is not available for this report.");
  }
  const allowedKeys = exportedColumns[report.type] ?? report.columns.map((column) => column.key);
  const columnMap = new Map(report.columns.map((column) => [column.key, column.label]));
  const headers = allowedKeys.map((key) => columnMap.get(key) ?? key);
  const rows = fullRows(report).map((row) => allowedKeys.map((key) => row[key] ?? ""));
  const notes = [
    ["Report", report.label],
    ["Date Range", report.range.label],
    ["Generated From", "Existing operational data"],
    ["Definition", "Payable Sales excludes cancelled and archived orders and is not settled revenue."],
    [],
  ];
  return [...notes, headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
