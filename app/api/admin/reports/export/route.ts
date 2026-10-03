import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { adminV2ReportCsvFilename, adminV2ReportToCsv } from "@/lib/admin-v2/reports/reports-export";
import { getAdminV2Report } from "@/lib/admin-v2/reports/reports-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "analytics.view")) return forbiddenAdminResponse();

  const url = new URL(request.url);
  const report = await getAdminV2Report(url.searchParams, { previewLimit: Number.MAX_SAFE_INTEGER });
  if (!report.exportable) {
    return Response.json({ errors: [report.exportDisabledReason ?? "Export is not available for this report."] }, { status: 409 });
  }

  try {
    const csv = adminV2ReportToCsv(report);
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${adminV2ReportCsvFilename(report)}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({ errors: [error instanceof Error ? error.message : "Report export failed."] }, { status: 400 });
  }
}
