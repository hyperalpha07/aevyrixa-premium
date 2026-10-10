import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { adminV2FinanceCsvResponse, adminV2RowsToCsv } from "@/lib/admin-v2/finance/csv";
import { getAdminV2ExpenseExportRows } from "@/lib/admin-v2/expenses/expenses-query";

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
  if (!hasPermission(session, "finance.expenses.view") || !hasPermission(session, "finance.export")) return forbiddenAdminResponse();

  const url = new URL(request.url);
  if (hasInvalidDateFilter(url.searchParams)) return Response.json({ errors: ["Invalid date filter."] }, { status: 400 });
  const result = await getAdminV2ExpenseExportRows(url.searchParams);
  if (!result.ok) return Response.json({ errors: result.errors }, { status: result.status });

  const rows = result.rows.map((row) => [
    row.reference,
    row.occurredAt,
    row.category,
    row.description,
    row.payee,
    row.orderReference,
    row.amount ?? "",
    row.currencyCode,
    row.paymentMethod,
    row.status,
  ]);
  const csv = adminV2RowsToCsv(["Expense Reference", "Date", "Category", "Description", "Payee", "Order Reference", "Amount", "Currency", "Payment Method", "Status"], rows);
  try {
    await logStaffActivity({
      actor: session,
      action: "finance.expenses.exported",
      targetType: "finance_expenses",
      targetId: "csv",
      metadata: { type: "expenses", from: result.query.from, to: result.query.to, row_count: result.rows.length, filters: { q: Boolean(result.query.q), category: result.query.category, status: result.query.status } },
      requireRecorded: true,
    });
  } catch {
    return Response.json({ errors: ["Expense export audit could not be recorded."] }, { status: 500 });
  }

  return adminV2FinanceCsvResponse(csv, "admin-v2-finance-expenses.csv");
}
