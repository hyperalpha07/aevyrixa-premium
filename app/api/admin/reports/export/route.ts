import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { adminV2ReportCsvFilename, adminV2ReportToCsv } from "@/lib/admin-v2/reports/reports-export";
import { canAccessAdminV2ReportType, getAdminV2Report, reportExportRowLimit } from "@/lib/admin-v2/reports/reports-query";
import { isAdminV2ReportType, parseAdminV2ReportType } from "@/lib/admin-v2/reports/reports-metrics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "analytics.view")) return forbiddenAdminResponse();
  if (!hasPermission(session, "reports.export")) return forbiddenAdminResponse();

  const url = new URL(request.url);
  const rawType = url.searchParams.get("type");
  if (rawType && !isAdminV2ReportType(rawType)) {
    return Response.json({ errors: ["Invalid report type."] }, { status: 400 });
  }
  const type = parseAdminV2ReportType(rawType);
  if (!canAccessAdminV2ReportType(session, type)) return forbiddenAdminResponse();

  const report = await getAdminV2Report(url.searchParams, { previewLimit: reportExportRowLimit, session });
  if (!report.complete && Object.values(report.sources).some((source) => !source.available)) {
    return Response.json({ errors: [report.limitation] }, { status: 503 });
  }
  if (!report.exportable) {
    return Response.json({ errors: [report.exportDisabledReason ?? "Export is not available for this report."] }, { status: 409 });
  }

  let csv = "";
  try {
    csv = adminV2ReportToCsv(report);
  } catch {
    return Response.json({ errors: ["Report export failed."] }, { status: 400 });
  }

  try {
    await logStaffActivity({
      actor: session,
      action: "report.exported",
      targetType: "report",
      targetId: report.type,
      metadata: {
        report_type: report.type,
        range_preset: report.range.preset,
        from: report.range.from,
        to: report.range.to,
        row_count: report.rows.length,
      },
      requireRecorded: true,
    });
  } catch {
    return Response.json({ errors: ["Report export audit could not be recorded."] }, { status: 500 });
  }

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${adminV2ReportCsvFilename(report)}"`,
      "cache-control": "no-store",
    },
  });
}
