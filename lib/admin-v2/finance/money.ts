export type AdminV2MoneyAggregate =
  | { kind: "none"; amount: 0; currencyCode: null; currencies: [] }
  | { kind: "single"; amount: number; currencyCode: string; currencies: [string] }
  | { kind: "mixed"; amount: null; currencyCode: null; currencies: string[] };

export function buildAdminV2MoneyAggregate(
  rows: Array<{ amount: number | null | undefined; currencyCode: string | null | undefined }>,
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const amount = typeof row.amount === "number" && Number.isFinite(row.amount) ? Math.max(0, row.amount) : 0;
    if (amount <= 0) continue;
    const currency = typeof row.currencyCode === "string" && /^[A-Z]{3}$/.test(row.currencyCode) ? row.currencyCode : "BDT";
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }

  const currencies = [...totals.keys()].sort();
  if (currencies.length === 0) return { kind: "none", amount: 0, currencyCode: null, currencies: [] } satisfies AdminV2MoneyAggregate;
  if (currencies.length === 1) {
    const currency = currencies[0]!;
    return { kind: "single", amount: totals.get(currency) ?? 0, currencyCode: currency, currencies: [currency] } satisfies AdminV2MoneyAggregate;
  }
  return { kind: "mixed", amount: null, currencyCode: null, currencies } satisfies AdminV2MoneyAggregate;
}

export function adminV2MoneyAggregateValue(aggregate: AdminV2MoneyAggregate | undefined): number | null {
  if (!aggregate) return null;
  if (aggregate.kind === "single" || aggregate.kind === "none") return aggregate.amount;
  return null;
}

export function adminV2MoneyAggregateUnavailable(aggregate: AdminV2MoneyAggregate | undefined) {
  if (!aggregate) return false;
  return aggregate.kind === "mixed";
}
