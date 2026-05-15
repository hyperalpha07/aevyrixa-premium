"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";

type TimelineState = "complete" | "active" | "inactive";

type TrackedOrder = {
  orderRef: string;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  customerName?: string;
  cityArea: string;
  total: number;
  paymentMethod: string;
  courierName?: string;
  trackingId?: string;
  deliveryCharge?: number;
  items: {
    name: string;
    quantity: number;
    variant?: string;
  }[];
  timeline: {
    label: string;
    state: TimelineState;
  }[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: TrackedOrder["status"]) {
  return status === "Pending" ? "Order Received" : status;
}

function stepClasses(state: TimelineState) {
  if (state === "complete") {
    return "border-cyan-200/70 bg-cyan-200 text-[#03101a]";
  }

  if (state === "active") {
    return "border-fuchsia-200 bg-fuchsia-200 text-[#150316] shadow-[0_0_24px_rgba(217,70,239,0.25)]";
  }

  return "border-white/18 bg-white/[0.06] text-white/45";
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<TrackOrderFallback />}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderRef = searchParams.get("ref")?.trim() ?? "";
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [customerPhone, setCustomerPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isCancelled = order?.status === "Cancelled";
  const supportNote = useMemo(
    () => "Need help? Contact Aevyrixa support with your order reference.",
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderRef, customerPhone }),
      });
      const result = (await response.json()) as {
        order?: TrackedOrder;
        errors?: string[];
      };

      if (!response.ok || !result.order) {
        setError(
          result.errors?.[0] ||
            "We could not find an order matching those details."
        );
        return;
      }

      setOrder(result.order);
    } catch {
      setError("Order tracking is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_48%,#030612_100%)]" />
      <SiteHeader active="track" />

      <section className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-200/72">
            Track Order
          </p>
          <h1 className="mt-4 max-w-full break-words text-[2rem] font-semibold leading-tight [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl">
            Check your Aevyrixa order status.
          </h1>
          <p className="mt-5 break-words text-base leading-8 text-white/66 [overflow-wrap:anywhere]">
            Enter your order reference and the phone number used at checkout.
            We only show customer-safe order details after both match.
          </p>
          <Link
            href="/product"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white transition hover:border-cyan-200/40 sm:w-auto"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="min-w-0 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-100/72">
              Order Lookup
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/75">
                Order Reference
              </span>
              <input
                required
                value={orderRef}
                onChange={(event) => setOrderRef(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:normal-case placeholder:text-white/30 focus:border-cyan-200/50"
                placeholder="AEV-..."
                autoComplete="off"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-white/75">
                Phone Number
              </span>
              <input
                required
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-200/50"
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3.5 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Checking..." : "Track Order"}
            </button>
            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm leading-7 text-rose-50/82">
                {error}
              </div>
            )}
          </form>

          {order && (
            <section className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">
                    {order.orderRef}
                  </p>
                  <h2 className="mt-2 break-words text-2xl font-semibold [overflow-wrap:anywhere]">
                    {statusLabel(order.status)}
                  </h2>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                    isCancelled
                      ? "border-rose-200/40 bg-rose-300/10 text-rose-100"
                      : "border-cyan-200/30 bg-cyan-200/10 text-cyan-100"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {isCancelled ? (
                <div className="mt-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm leading-7 text-rose-50/82">
                  This order has been cancelled. Contact support with your order
                  reference if you need help.
                </div>
              ) : (
                <ol className="mt-6 grid gap-3 sm:grid-cols-4">
                  {order.timeline.map((step, index) => (
                    <li
                      key={step.label}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-col sm:items-start"
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${stepClasses(
                          step.state
                        )}`}
                      >
                        {step.state === "complete" ? index + 1 : ""}
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium text-white/78 [overflow-wrap:anywhere]">
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Created" value={formatDate(order.createdAt)} />
                <SummaryItem label="Total" value={formatCurrency(order.total)} />
                <SummaryItem label="Payment" value={order.paymentMethod} />
                <SummaryItem label="City/Area" value={order.cityArea} />
                {order.courierName && (
                  <SummaryItem label="Courier" value={order.courierName} />
                )}
                {order.trackingId && (
                  <SummaryItem label="Tracking ID" value={order.trackingId} />
                )}
                {typeof order.deliveryCharge === "number" && (
                  <SummaryItem
                    label="Delivery charge"
                    value={formatCurrency(order.deliveryCharge)}
                  />
                )}
                {order.customerName && (
                  <SummaryItem label="Customer" value={order.customerName} />
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                  Items
                </p>
                <ul className="mt-3 space-y-3">
                  {order.items.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex min-w-0 items-start justify-between gap-3 text-sm text-white/76"
                    >
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {item.name}
                        {item.variant ? (
                          <span className="block text-xs text-white/45">
                            {item.variant}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-white/58">
                        x{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/58">{supportNote}</p>
            </section>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function TrackOrderFallback() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <SiteHeader active="track" />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 text-white/65 backdrop-blur-2xl">
          Loading order tracking...
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-white/82 [overflow-wrap:anywhere]">
        {value || "Not available"}
      </p>
    </div>
  );
}
