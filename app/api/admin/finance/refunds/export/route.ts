import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { adminV2FinanceCsvResponse, adminV2RowsToCsv } from "@/lib/admin-v2/finance/csv";
import { getAdminV2RefundExportRows } from "@/lib/admin-v2/refunds/refunds-query";

export const dynamic = "force-dynamic";

function hasInvalidDateFilter(params: URLSearchParams) {
  return ["from", "to"].some((key) => {
    const value = params.get(key);
    if (!value) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value;
  });
}

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "finance.refunds.view") || !hasPermission(session, "finance.export")) return forbiddenAdminResponse();

  const url = new URL(request.url);
  if (hasInvalidDateFilter(url.searchParams)) return Response.json({ errors: ["Invalid date filter."] }, { status: 400 });
  const result = await getAdminV2RefundExportRows(url.searchParams);
  if (!result.ok) return Response.json({ errors: result.errors }, { status: result.status });

  const rows = result.rows.map((row) => [
    row.reference,
    row.orderReference,
    row.amount ?? "",
    row.currencyCode,
    row.refundMethod,
    row.externalReference,
    row.reason,
    row.status,
    row.occurredAt,
  ]);
  const csv = adminV2RowsToCsv(["Refund Reference", "Order Reference", "Amount", "Currency", "Refund Method", "External Reference", "Reason", "Status", "Occurred At"], rows);
  try {
    await logStaffActivity({
      actor: session,
      action: "finance.refunds.exported",
      targetType: "finance_refunds",
      targetId: "csv",
      metadata: { type: "refunds", from: result.query.from, to: result.query.to, row_count: result.rows.length, filters: { q: Boolean(result.query.q), method: result.query.method, status: result.query.status } },
      requireRecorded: true,
    });
  } catch {
    return Response.json({ errors: ["Refund export audit could not be recorded."] }, { status: 500 });
  }

  return adminV2FinanceCsvResponse(csv, "admin-v2-finance-refunds.csv");
}
