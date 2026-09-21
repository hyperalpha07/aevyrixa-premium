"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, MoreHorizontal, PackageSearch } from "lucide-react";
import { normalizeAccountStatus as normalizeStatus } from "@/app/account/_shared/account-format";
import { AccountMobileMenu, DashboardSidebar, Metric, Panel } from "@/app/account/_shared/account-ui";
import { DetailedOrderRows } from "@/app/account/orders/account-detailed-orders";
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
  const isPending = (order: AccountOrder) => normalizeStatus(order.status).includes("pending");
  const isDelivered = (order: AccountOrder) =>
    normalizeStatus(order.status).includes("deliver") ||
    normalizeStatus(order.deliveryStatus).includes("deliver");
  const pendingOrders = orders.filter(isPending).length;
  const deliveredOrders = orders.filter(isDelivered).length;
  const cancelledOrOtherOrders = orders.filter(
    (order) => !isPending(order) && !isDelivered(order)
  ).length;

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
          <Metric icon={PackageSearch} label="Total Orders" value={String(orders.length)} accent="pink" />
          <Metric icon={Clock3} label="Pending" value={String(pendingOrders)} accent="amber" />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders)} accent="green" />
          <Metric icon={MoreHorizontal} label="Cancelled / Other" value={String(cancelledOrOtherOrders)} accent="violet" />
        </section>

        <Panel className="aev-account-orders-list-panel">
          <div className="aev-account-orders-list-heading">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FFB3D1]/72">
                Order history
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">Your orders</h2>
            </div>
            <Link href="/track-order" className="mini-action min-h-10 justify-center">
              <PackageSearch className="h-4 w-4" />
              Track an order
            </Link>
          </div>
          <div className="mt-5">
            <DetailedOrderRows orders={orders} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

