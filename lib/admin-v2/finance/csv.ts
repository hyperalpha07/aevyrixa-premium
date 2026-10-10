export const adminV2FinanceExportRowLimit = 10000;

function neutralizeSpreadsheetFormula(value: string) {
  const first = value.match(/\S/u);
  if (!first) return value;
  return ["=", "+", "-", "@"].includes(first[0]) ? `'${value}` : value;
}

export function adminV2CsvCell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = neutralizeSpreadsheetFormula(raw);
  return /[",\r\n\t]/u.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function adminV2RowsToCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(adminV2CsvCell).join(",")).join("\r\n");
}

export function adminV2FinanceCsvResponse(csv: string, filename: string) {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
