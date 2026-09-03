"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, LockKeyhole, PackageSearch, SearchCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";
import { brandName } from "@/configs/brand/noromi";

type TimelineState = "complete" | "active" | "inactive";

type TrackedOrder = {
  orderRef: string;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  cityArea: string;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  courierName?: string;
  trackingId?: string;
  deliveryStatus?:
    | "pending"
    | "processing"
    | "packed"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "failed"
    | "returned";
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryAddress?: string;
  deliveryNote?: string;
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

function readableStatus(value?: string) {
  return value ? value.replace(/_/g, " ") : "";
}

function stepClasses(state: TimelineState) {
  if (state === "complete") {
    return "border-[#00D4C6]/60 bg-[#00D4C6] text-[#080611] shadow-[0_0_16px_rgba(0,212,198,0.35)]";
  }

  if (state === "active") {
    return "border-[#FF4DB8]/60 bg-[#FF4DB8] text-white shadow-[0_0_20px_rgba(255,77,184,0.40)]";
  }

  return "border-[#FF4DB8]/12 bg-[#1B1230] text-[#6B5F7A]";
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
  const initialPhone = searchParams.get("phone")?.trim() ?? "";
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<StorefrontSettings>(
    defaultStorefrontSettings
  );

  const isCancelled = order?.status === "Cancelled";
  const supportContact = settings.supportWhatsApp || settings.supportPhone;
  const supportNote = useMemo(() => {
    const contact = supportContact ? ` at ${supportContact}` : "";
    const configured = settings.deliverySettings.trackingSupportMessage.trim();
    return configured
      ? `${configured}${contact ? ` Support: ${supportContact}.` : ""}`
      : `Need help? Contact Noromi Care support${contact} with your order reference.`;
  }, [settings.deliverySettings.trackingSupportMessage, supportContact]);

  useEffect(() => {
    let isActive = true;

    void fetchStorefrontSettings()
      .then((nextSettings) => {
        if (isActive) setSettings(nextSettings);
      })
      .catch(() => null);

    return () => {
      isActive = false;
    };
  }, []);

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
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(255,77,184,0.09),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.07),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(0,212,198,0.04),transparent_30%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />
      <SiteHeader active="track" settings={settings} />

      <section className="mx-auto grid w-full min-w-0 max-w-7xl gap-5 px-4 pb-28 pt-6 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="min-w-0 lg:order-first">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#FF4DB8]/72">
            Privacy-safe tracking
          </p>
          <h1 className="mt-4 max-w-full break-words text-[2rem] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] min-[390px]:text-4xl sm:text-5xl">
            Track your Noromi Care order
          </h1>
          <p className="aev-mobile-secondary-copy mt-5 break-words text-base leading-8 text-[#D8CBE8]/70 [overflow-wrap:anywhere]">
            Enter your order reference and the phone number used at checkout.
            We only show customer-safe order details after both match.
          </p>

          <div className="aev-track-signals mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: SearchCheck, label: "Instant lookup", desc: "Results appear without page reload" },
              { icon: LockKeyhole, label: "Privacy safe", desc: "Only matched details are revealed" },
              { icon: ListChecks, label: "Full timeline", desc: "See every step from order to delivery" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#FF4DB8]/12 bg-[#151024] px-4 py-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF4DB8]/18 bg-[#FF4DB8]/[0.07] text-[#FF4DB8]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#9C91AA]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/product"
            className="mt-8 hidden min-h-12 w-full items-center justify-center rounded-full border border-[#FF4DB8]/25 bg-[#151024] px-7 text-sm font-semibold text-[#FFB3D1] transition hover:border-[#FF4DB8]/45 hover:bg-[#211633] hover:text-white sm:w-auto lg:inline-flex"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="order-first min-w-0 space-y-5 lg:order-none">
          <form
            onSubmit={handleSubmit}
            className="aev-track-card aev-intent-card aev-intent-orders min-w-0 rounded-[1.75rem] p-5 sm:p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF4DB8]/20 bg-[#FF4DB8]/[0.08] text-[#FF4DB8]">
                <PackageSearch className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF4DB8]/80">
                  Order Lookup
                </p>
                <p className="mt-0.5 text-xs text-[#9C91AA]">Reference + phone required</p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-[#D8CBE8]">
                Order Reference
              </span>
              <input
                required
                value={orderRef}
                onChange={(event) => setOrderRef(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3.5 text-sm uppercase text-white outline-none transition placeholder:normal-case placeholder:text-[#6B5F7A] focus:border-[#FF4DB8]/40 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.08)]"
                placeholder="AEV-..."
                autoComplete="off"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-[#D8CBE8]">
                Phone Number
              </span>
              <input
                required
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-[#6B5F7A] focus:border-[#FF4DB8]/40 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.08)]"
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_28px_rgba(255,77,184,0.40)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_36px_rgba(255,77,184,0.52)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Checking...
                </>
              ) : (
                "Track Order"
              )}
            </button>
            {error && (
              <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm leading-7 text-rose-100/80">
                {error}
              </div>
            )}
          </form>

          {order && (
            <section className="aev-track-card aev-intent-card aev-intent-delivery min-w-0 rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF4DB8]/70">
                    {order.orderRef}
                  </p>
                  <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
                    {statusLabel(order.status)}
                  </h2>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                    isCancelled
                      ? "border-rose-300/35 bg-rose-300/[0.08] text-rose-100"
                      : "border-[#00D4C6]/30 bg-[#00D4C6]/[0.08] text-[#31E6D4]"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {isCancelled ? (
                <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm leading-7 text-rose-100/80">
                  This order has been cancelled. Contact support with your order
                  reference if you need help.
                </div>
              ) : (
                <ol className="mt-6 grid gap-2.5 sm:grid-cols-4">
                  {order.timeline.map((step, index) => (
                    <li
                      key={step.label}
                      className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-[#FF4DB8]/10 bg-[#1B1230] p-3 sm:flex-col sm:items-start"
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${stepClasses(
                          step.state
                        )}`}
                      >
                        {step.state === "complete" ? index + 1 : ""}
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium text-white/82 [overflow-wrap:anywhere]">
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <SummaryItem label="Created" value={formatDate(order.createdAt)} />
                <SummaryItem label="Total" value={formatCurrency(order.total)} />
                <SummaryItem label="Payment" value={order.paymentMethod} />
                {order.paymentStatus && (
                  <SummaryItem label="Payment status" value={readableStatus(order.paymentStatus)} />
                )}
                <SummaryItem label="City/Area" value={order.cityArea} />
                {order.deliveryStatus && (
                  <SummaryItem
                    label="Delivery status"
                    value={readableStatus(order.deliveryStatus)}
                  />
                )}
                {order.deliveryZone && (
                  <SummaryItem label="Delivery zone" value={order.deliveryZone} />
                )}
                {order.deliveryArea && order.deliveryArea !== order.cityArea && (
                  <SummaryItem label="Delivery area" value={order.deliveryArea} />
                )}
                {order.courierName && (
                  <SummaryItem label="Courier" value={order.courierName} />
                )}
                {order.trackingId && (
                  <SummaryItem label="Tracking ID" value={order.trackingId} />
                )}
                {order.deliveryAddress && (
                  <SummaryItem label="Delivery address" value={order.deliveryAddress} />
                )}
                {typeof order.deliveryCharge === "number" && (
                  <SummaryItem
                    label="Delivery charge"
                    value={formatCurrency(order.deliveryCharge)}
                  />
                )}
                {order.deliveryNote && (
                  <SummaryItem label="Delivery note" value={order.deliveryNote} />
                )}
              </div>

              <div className="mt-5 rounded-[1.1rem] border border-[#FF4DB8]/10 bg-[#1B1230] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF4DB8]/60">
                  Items
                </p>
                <ul className="mt-3 space-y-3">
                  {order.items.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex min-w-0 items-start justify-between gap-3 text-sm text-[#D8CBE8]/80"
                    >
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {item.name}
                        {item.variant ? (
                          <span className="block text-xs text-[#9C91AA]">
                            {item.variant}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[#9C91AA]">
                        x{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-[1.1rem] border border-[#00D4C6]/12 bg-[#0F1E2A]/60 p-4 text-sm leading-7 text-[#D8CBE8]/70">
                <p>{supportNote}</p>
                {settings.whatsappUrl && (
                  <a
                    href={settings.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex font-semibold text-[#31E6D4] transition hover:text-white"
                  >
                    Chat with {brandName} Support
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}

function TrackOrderFallback() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <SiteHeader active="track" />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[1.75rem] border border-[#FF4DB8]/12 bg-[#151024] p-6 text-[#9C91AA]">
          Loading order tracking...
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border border-[#FF4DB8]/10 bg-[#1B1230] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9C91AA]/70">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
        {value || "Not available"}
      </p>
    </div>
  );
}
