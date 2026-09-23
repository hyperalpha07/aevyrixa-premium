export function formatCustomerMoney(value: number) {
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(value)}`;
}

export function formatCustomerDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}
