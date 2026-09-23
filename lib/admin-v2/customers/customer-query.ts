import type { AdminCustomerOverview } from "@/app/lib/customer-account-store";

export type CustomerFilter = "all" | "has-orders" | "no-orders" | "repeat";
export const CUSTOMER_PAGE_SIZE = 25;

export function parseCustomerFilter(value?: string): CustomerFilter {
  return value === "has-orders" || value === "no-orders" || value === "repeat" ? value : "all";
}

export function customerListHref(query: string, filter: CustomerFilter, page = 1) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/admin-v2/customers${suffix ? `?${suffix}` : ""}`;
}

export function queryCustomers(customers: AdminCustomerOverview[], query: string, filter: CustomerFilter, requestedPage: number) {
  const needle = query.trim().toLocaleLowerCase();
  const filtered = customers.filter((customer) => {
    const matchesQuery = !needle || [customer.fullName, customer.phone, customer.email ?? ""].some((value) => value.toLocaleLowerCase().includes(needle));
    const matchesFilter = filter === "all" ||
      (filter === "has-orders" && customer.orderCount > 0) ||
      (filter === "no-orders" && customer.orderCount === 0) ||
      (filter === "repeat" && customer.orderCount > 1);
    return matchesQuery && matchesFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / CUSTOMER_PAGE_SIZE));
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(1, Math.trunc(requestedPage)), totalPages) : 1;
  return { customers: filtered.slice((page - 1) * CUSTOMER_PAGE_SIZE, page * CUSTOMER_PAGE_SIZE), totalCount: filtered.length, totalPages, page };
}
