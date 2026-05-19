"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, PackageSearch } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type AccountOrder = {
  orderRef: string;
  createdAt: string;
  status: string;
  total: number;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryAddress: string;
  cityArea: string;
  courierName?: string;
  trackingId?: string;
  items: { name: string; quantity: number; price: number; variant?: string }[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readable(value?: string) {
  return value ? value.replace(/_/g, " ") : "Not available";
}

function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}

export default function AccountOrderDetailClient({ reference }: { reference: string }) {
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const decodedReference = useMemo(() => decodeURIComponent(reference), [reference]);
  const order = orders.find((item) => item.orderRef === decodedReference);

  useEffect(() => {
    let isActive = true;
    void fetchStorefrontSettings().then((next) => {
      if (isActive) setSettings(next);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/account/orders", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          orders?: AccountOrder[];
          errors?: string[];
        };
        if (!response.ok) {
          throw new Error(payload.errors?.[0] || "Please log in to view this order.");
        }
        if (isActive) setOrders(payload.orders ?? []);
      } catch (err) {
        if (isActive) setError(err instanceof Error ? err.message : "Order could not be loaded.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadOrder();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_52%,#030612_100%)]" />
      <SiteHeader settings={settings} active="account" />
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        {isLoading ? (
          <Panel>Loading order details...</Panel>
        ) : error ? (
          <Panel>
            <p className="text-lg font-semibold">Order unavailable</p>
            <p className="mt-2 text-sm leading-7 text-white/62">{error}</p>
            <Link className="action-primary mt-5" href="/account/login?returnTo=/account/orders">
              Login
            </Link>
          </Panel>
        ) : !order ? (
          <Panel>
            <p className="text-lg font-semibold">Order not found</p>
            <p className="mt-2 text-sm leading-7 text-white/62">
              This order is not linked to your customer account.
            </p>
          </Panel>
        ) : (
          <div className="mt-6 grid gap-5">
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Order detail</p>
              <h1 className="mt-3 break-words text-3xl font-semibold [overflow-wrap:anywhere]">{order.orderRef}</h1>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link className="action-primary" href={trackOrderHref(order)}>
                  <PackageSearch className="h-4 w-4" />
                  Track order
                </Link>
                <Link className="action-muted" href="/account/support">
                  <MessageSquare className="h-4 w-4" />
                  Get support
                </Link>
              </div>
            </Panel>
            <div className="grid gap-5 lg:grid-cols-[0.58fr_0.42fr]">
              <Panel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Summary label="Date" value={formatDate(order.createdAt)} />
                  <Summary label="Total" value={formatCurrency(order.total)} />
                  <Summary label="Order status" value={order.status} />
                  <Summary label="Delivery status" value={readable(order.deliveryStatus)} />
                  <Summary label="Payment method" value={order.paymentMethod} />
                  <Summary label="Payment status" value={order.paymentStatus || "Not available"} />
                  <Summary label="Courier" value={order.courierName || "Not assigned"} />
                  <Summary label="Tracking" value={order.trackingId || "Not available"} />
                  <Summary label="Delivery zone" value={order.deliveryZone || "Not available"} />
                  <Summary label="Delivery area" value={order.deliveryArea || order.cityArea} />
                  {typeof order.deliveryCharge === "number" && (
                    <Summary label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />
                  )}
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">Delivery Address</p>
                  <p className="mt-2 break-words text-sm leading-7 text-white/72 [overflow-wrap:anywhere]">
                    {order.deliveryAddress}
                  </p>
                </div>
              </Panel>
              <Panel>
                <h2 className="text-xl font-semibold text-white">Items</h2>
                <ul className="mt-4 space-y-3">
                  {order.items.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3 text-sm text-white/74">
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                          {item.name}
                          {item.variant && <span className="block text-xs text-white/42">{item.variant}</span>}
                        </span>
                        <span className="shrink-0">x{item.quantity}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/78 [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
