"use client";

import "@/app/account/account-dashboard.css";

import { useEffect, useState } from "react";
import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import { readAccountJson } from "@/app/account/_shared/account-request";
import { Panel } from "@/app/account/_shared/account-ui";
import type { AccountOrder, Address } from "@/app/account/_shared/account-types";
import Dashboard from "@/app/account/account-dashboard-view";
import { readWishlistItems, WISHLIST_UPDATED_EVENT, writeWishlistItems, type WishlistItem } from "@/app/lib/wishlist-storage";

function DashboardContent({ customer, settings, logout, openLiveChat }: AccountShellContext) {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      readAccountJson<{ orders: AccountOrder[] }>("/api/account/orders"),
      readAccountJson<{ addresses: Address[] }>("/api/account/addresses"),
    ]).then(([orderPayload, addressPayload]) => {
      if (!active) return;
      setOrders(orderPayload.orders);
      setAddressCount(addressPayload.addresses.length);
    }).catch(() => {
      if (active) setError("We couldn't load your account right now.");
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncWishlist = () => setWishlistItems(readWishlistItems());
    syncWishlist();
    window.addEventListener("storage", syncWishlist);
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    return () => {
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    };
  }, []);

  const removeWishlistItem = (item: WishlistItem) => {
    const next = wishlistItems.filter((entry) => entry.productId !== item.productId && entry.slug !== item.slug);
    setWishlistItems(next);
    writeWishlistItems(next);
  };

  if (isLoading) return <Panel>Loading your account...</Panel>;
  return <>
    {error && <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">{error}</div>}
    <Dashboard orders={orders.slice(0, 3)} allOrders={orders} addressCount={addressCount} customer={customer} settings={settings} wishlistItems={wishlistItems} onRemoveWishlistItem={removeWishlistItem} onLogout={logout} onOpenLiveChat={openLiveChat} />
  </>;
}

export default function AccountDashboardClient() {
  return <AccountShell view="dashboard">{(context) => <DashboardContent {...context} />}</AccountShell>;
}
