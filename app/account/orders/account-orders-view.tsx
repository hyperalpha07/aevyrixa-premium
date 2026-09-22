"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, MoreHorizontal, PackageSearch } from "lucide-react";
import { AccountMobileMenu, DashboardSidebar, Panel } from "@/app/account/_shared/account-ui";
import { DetailedOrderRows } from "@/app/account/orders/account-detailed-orders";
import { filterOrders, orderGroup, paginateOrders, paginationNumbers, type OrderFilter } from "@/app/account/orders/account-orders-model";
import type { AccountOrder, Customer } from "@/app/account/_shared/account-types";

export default function OrdersView({
  orders,
  customer,
  onLogout,
}: {
  orders: AccountOrder[];
  customer: Customer;
  onLogout: () => void;
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [page, setPage] = useState(1);
  const counts = {
    all: orders.length,
    pending: orders.filter((order) => orderGroup(order) === "pending").length,
    delivered: orders.filter((order) => orderGroup(order) === "delivered").length,
    other: orders.filter((order) => orderGroup(order) === "other").length,
  };
  const filtered = filterOrders(orders, filter);
  const { items: visibleOrders, currentPage, pageCount } = paginateOrders(filtered, page);
  const metrics = [
    { key: "all", label: "Total Orders", icon: PackageSearch },
    { key: "pending", label: "Pending", icon: Clock3 },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
    { key: "other", label: "Cancelled / Other", icon: MoreHorizontal },
  ] as const;
  function selectFilter(next: OrderFilter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <div className="aev-account-dashboard-workspace aev-account-orders-workspace">
      <DashboardSidebar customer={customer} activeView="orders" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-orders-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Review your Noromi Care orders, delivery progress, and available support actions.
            </p>
          </div>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="orders" hero onLogout={onLogout} />
          </div>
        </section>

        <section className="aev-account-dashboard-stats aev-account-orders-overview" aria-label="Order overview">
          {metrics.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" className={`aev-account-orders-metric ${filter === key ? "is-active" : ""}`}
              aria-pressed={filter === key} onClick={() => selectFilter(key)}>
              <span className="aev-account-orders-metric-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="aev-account-orders-metric-copy"><span>{label}</span><strong>{counts[key]}</strong></span>
            </button>
          ))}
        </section>

        <Panel className="aev-account-orders-list-panel">
          <div className="aev-account-orders-list-heading">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FFB3D1]/72">
                Order history
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">{filter === "all" ? "Your orders" : `${metrics.find((metric) => metric.key === filter)?.label} orders`}</h2>
            </div>
            <Link href="/track-order" className="mini-action min-h-10 justify-center">
              <PackageSearch className="h-4 w-4" />
              Track an order
            </Link>
          </div>
          <div className="aev-account-orders-results">
            <DetailedOrderRows orders={visibleOrders} emptyMessage={orders.length && !filtered.length ? "No orders match this status yet." : undefined} />
          </div>
          {pageCount > 1 && <nav className="aev-account-orders-pagination" aria-label="Order history pages">
            <p>Showing {(currentPage - 1) * 5 + 1}–{Math.min(currentPage * 5, filtered.length)} of {filtered.length}</p>
            <div>
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button>
              {paginationNumbers(currentPage, pageCount).map((number, index, numbers) => <span key={number} className="aev-account-orders-page-number">
                {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
                <button type="button" aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
              </span>)}
              <button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button>
            </div>
          </nav>}
        </Panel>
      </div>
    </div>
  );
}

