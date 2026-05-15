export const SITE_CURRENCY = "BDT";

const bdtNumberFormat = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value?: number | null) {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${SITE_CURRENCY} ${bdtNumberFormat.format(amount)}`;
}
