"use client";

import Link from "next/link";
import { formatCurrency } from "@/app/lib/currency";
import { accountStatusChipClass as statusChipClass, formatAccountDate as formatDate, readableAccountValue as readable } from "@/app/account/_shared/account-format";
import type { AccountOrder } from "@/app/account/_shared/account-types";

function orderDetailHref(orderRef: string) {
  return `/account/orders/${encodeURIComponent(orderRef)}`;
}

function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}

export function RecentOrderRows({ orders }: { orders: AccountOrder[] }) {
  if (orders.length === 0) return <p className="text-sm leading-7 text-[#9C91AA]">No orders found for this account phone yet.</p>;
    return (
      <div className="space-y-2.5">
        {orders.map((order) => (
          <div
            key={order.orderRef}
            className="group relative grid min-w-0 gap-3 overflow-hidden rounded-2xl border border-[#FF4DB8]/12 bg-[#1B1230]/88 p-3.5 transition hover:border-[#FF4DB8]/28 hover:bg-[#211633]/90 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4"
          >
            <div className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 rounded-full bg-[#FF4DB8]/[0.06] blur-2xl" />
            <div className="relative min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
                  {order.items[0]?.name || order.orderRef}
                </p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusChipClass(order.status)}`}>
                  {readable(order.status)}
                </span>
              </div>
              <p className="mt-1 break-words text-xs text-[#9C91AA] [overflow-wrap:anywhere]">
                {order.orderRef} / {formatDate(order.createdAt)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#FFB3D1]">{formatCurrency(order.total)}</p>
            </div>
            <div className="relative flex flex-wrap gap-2 sm:justify-end">
              <Link className="mini-action min-h-9 flex-1 justify-center text-center sm:flex-none" href={orderDetailHref(order.orderRef)}>
                View details
              </Link>
              {order.customerPhone && (
                <Link className="mini-action min-h-9 flex-1 justify-center text-center sm:flex-none" href={trackOrderHref(order)}>
                  Track order
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
}
