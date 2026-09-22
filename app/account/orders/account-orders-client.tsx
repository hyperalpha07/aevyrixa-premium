"use client";

import "@/app/account/orders/account-orders.css";

import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import type { AccountOrder } from "@/app/account/_shared/account-types";
import OrdersView from "@/app/account/orders/account-orders-view";

function OrdersContent({ customer, logout, bootstrapData }: AccountShellContext) {
  const { orders } = bootstrapData as { orders: AccountOrder[] };
  return <OrdersView orders={orders} customer={customer} onLogout={logout} />;
}

export default function AccountOrdersClient() {
  return <AccountShell view="orders" bootstrapUrl="/api/account/bootstrap?view=orders">{(context) => <OrdersContent {...context} />}</AccountShell>;
}
