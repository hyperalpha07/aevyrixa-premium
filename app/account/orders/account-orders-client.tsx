"use client";

import "@/app/account/orders/account-orders.css";

import { useEffect, useState } from "react";
import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import { readAccountJson } from "@/app/account/_shared/account-request";
import { Panel } from "@/app/account/_shared/account-ui";
import type { AccountOrder } from "@/app/account/_shared/account-types";
import OrdersView from "@/app/account/orders/account-orders-view";

function OrdersContent({ customer, logout }: AccountShellContext) {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    readAccountJson<{ orders: AccountOrder[] }>("/api/account/orders")
      .then((payload) => { if (active) setOrders(payload.orders); })
      .catch(() => { if (active) setError("We couldn't load your account right now."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  if (isLoading) return <Panel>Loading your account...</Panel>;
  return <>
    {error && <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">{error}</div>}
    <OrdersView orders={orders} customer={customer} onLogout={logout} />
  </>;
}

export default function AccountOrdersClient() {
  return <AccountShell view="orders">{(context) => <OrdersContent {...context} />}</AccountShell>;
}
