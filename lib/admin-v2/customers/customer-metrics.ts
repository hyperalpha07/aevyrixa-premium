export type LinkedCustomerOrder = { customer_id?: string | null; total?: number | string | null; status?: string | null; created_at?: string | null };

export function customerOrderMetrics(customerId: string, rows: LinkedCustomerOrder[]) {
  const linked = rows.filter((row) => row.customer_id === customerId);
  const totalSpent = linked.filter((row) => row.status !== "Cancelled").reduce((sum, row) => {
    const amount = typeof row.total === "number" ? row.total : Number(row.total ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const latestOrderAt = linked.map((row) => row.created_at).filter((value): value is string => Boolean(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  return { orderCount: linked.length, totalSpent, latestOrderAt };
}
