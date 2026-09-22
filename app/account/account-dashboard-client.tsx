"use client";

import "@/app/account/account-dashboard.css";

import { useEffect, useState } from "react";
import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import type { AccountOrder } from "@/app/account/_shared/account-types";
import Dashboard from "@/app/account/account-dashboard-view";
import { readWishlistItems, WISHLIST_UPDATED_EVENT, writeWishlistItems, type WishlistItem } from "@/app/lib/wishlist-storage";

function DashboardContent({ customer, settings, bootstrapData, logout, openLiveChat }: AccountShellContext) {
  const payload = bootstrapData as { orders: AccountOrder[]; addressCount: number };
  const orders = payload.orders;
  const addressCount = payload.addressCount;
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

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

  return <Dashboard orders={orders.slice(0, 3)} allOrders={orders} addressCount={addressCount} customer={customer} settings={settings} wishlistItems={wishlistItems} onRemoveWishlistItem={removeWishlistItem} onLogout={logout} onOpenLiveChat={openLiveChat} />;
}

export default function AccountDashboardClient() {
  return <AccountShell view="dashboard" bootstrapUrl="/api/account/bootstrap?view=dashboard">{(context) => <DashboardContent {...context} />}</AccountShell>;
}
