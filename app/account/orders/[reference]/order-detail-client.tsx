"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, PackageSearch, Star } from "lucide-react";
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
  items: { productId?: string; slug?: string; name: string; quantity: number; price: number; variant?: string }[];
};

type ReviewDraft = {
  itemKey: string;
  productId: string;
  productSlug: string;
  rating: number;
  title: string;
  body: string;
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
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const canReviewOrder =
    order?.status === "Confirmed" ||
    order?.status === "Delivered" ||
    order?.deliveryStatus === "delivered";

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || !reviewDraft) return;
    setIsSubmittingReview(true);
    setReviewMessage("");
    try {
      const response = await fetch("/api/account/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderReference: order.orderRef,
          productId: reviewDraft.productId,
          productSlug: reviewDraft.productSlug,
          rating: reviewDraft.rating,
          title: reviewDraft.title,
          body: reviewDraft.body,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; errors?: string[] };
      if (!response.ok) throw new Error(payload.errors?.[0] || "Review could not be submitted.");
      setReviewMessage(payload.message || "Review submitted for moderation.");
      setReviewDraft(null);
    } catch (err) {
      setReviewMessage(err instanceof Error ? err.message : "Review could not be submitted.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
                  {order.items.map((item, index) => {
                    const itemKey = `${item.slug || item.productId || item.name}-${index}`;
                    const productSlug = item.slug || "";
                    const productId = item.productId || productSlug || item.name;
                    const canReviewItem = canReviewOrder && Boolean(productSlug || productId);
                    return (
                    <li key={`${item.name}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3 text-sm text-white/74">
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                          {item.name}
                          {item.variant && <span className="block text-xs text-white/42">{item.variant}</span>}
                        </span>
                        <span className="shrink-0">x{item.quantity}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p>
                      {canReviewItem && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewDraft({
                              itemKey,
                              productId,
                              productSlug,
                              rating: 5,
                              title: "",
                              body: "",
                            })
                          }
                          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#FF4DB8]/25 bg-[#211633] px-4 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:text-white"
                        >
                          <Star className="h-4 w-4" />
                          Write Review
                        </button>
                      )}
                      {reviewDraft?.itemKey === itemKey && (
                        <form onSubmit={submitReview} className="mt-4 grid gap-3 rounded-2xl border border-[#FF4DB8]/14 bg-[#151024] p-4">
                          <div>
                            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Rating</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => setReviewDraft((current) => current ? { ...current, rating } : current)}
                                  className="p-1 text-[#FFB84D]"
                                  aria-label={`${rating} star rating`}
                                >
                                  <Star className={`h-5 w-5 ${rating <= reviewDraft.rating ? "fill-current" : "fill-transparent opacity-45"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            value={reviewDraft.title}
                            onChange={(event) => setReviewDraft((current) => current ? { ...current, title: event.target.value } : current)}
                            placeholder="Review title optional"
                            className="min-h-11 rounded-2xl border border-white/10 bg-[#0B0F1A] px-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-[#FF4DB8]/35"
                          />
                          <textarea
                            value={reviewDraft.body}
                            onChange={(event) => setReviewDraft((current) => current ? { ...current, body: event.target.value } : current)}
                            required
                            rows={4}
                            placeholder="Share your real experience after purchase"
                            className="resize-none rounded-2xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-[#FF4DB8]/35"
                          />
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="submit"
                              disabled={isSubmittingReview}
                              className="action-primary disabled:opacity-55"
                            >
                              {isSubmittingReview ? "Submitting..." : "Submit for moderation"}
                            </button>
                            <button type="button" className="action-muted" onClick={() => setReviewDraft(null)}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </li>
                    );
                  })}
                </ul>
                {reviewMessage && (
                  <p className="mt-4 rounded-2xl border border-[#00D4C6]/20 bg-[#00D4C6]/[0.07] px-4 py-3 text-sm leading-6 text-cyan-50/82">
                    {reviewMessage}
                  </p>
                )}
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
