"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, LayoutDashboard, LogOut, MapPin, MessageSquare, MoreHorizontal, PackageCheck, PackageSearch, ShieldCheck, ShoppingBag, Star, Truck, UserRound, WalletCards } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { formatCurrency } from "@/app/lib/currency";
import { defaultStorefrontSettings, fetchStorefrontSettings, type StorefrontSettings } from "@/app/lib/storefront-settings";

type Customer = { id: string; fullName: string; phone: string; email?: string };
type AccountOrder = {
  orderRef: string; createdAt: string; status: string; total: number; customerPhone: string;
  paymentMethod: string; paymentStatus?: string; deliveryStatus?: string; deliveryCharge?: number;
  deliveryArea?: string; deliveryZone?: string; deliveryAddress: string; cityArea: string;
  courierName?: string; trackingId?: string;
  items: { productId?: string; slug?: string; name: string; quantity: number; price: number; variant?: string }[];
};
type ReviewDraft = { itemKey: string; productId: string; productSlug: string; rating: number; title: string; body: string };

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function readable(value?: string) { return value ? value.replace(/_/g, " ") : "Not available"; }
function normalizeStatus(value?: string) { return (value || "").toLowerCase().replace(/\s+/g, "_"); }
function statusChipClass(value?: string) {
  const status = normalizeStatus(value);
  if (status.includes("cancel") || status.includes("failed") || status.includes("return")) return "border-rose-300/35 bg-rose-300/[0.08] text-rose-100";
  if (status.includes("deliver")) return "border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100";
  if (status.includes("confirm") || status.includes("paid") || status.includes("dispatch") || status.includes("transit")) return "border-[#00D4C6]/35 bg-[#00D4C6]/[0.08] text-[#31E6D4]";
  return "border-[#FFB84D]/35 bg-[#FFB84D]/[0.08] text-[#FFD18A]";
}
function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}
async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as T & { errors?: string[] };
  if (!response.ok) throw new Error(payload.errors?.[0] || "Please log in to view this order.");
  return payload;
}

export default function AccountOrderDetailClient({ reference }: { reference: string }) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [customer, setCustomer] = useState<Customer | null>(null);
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
    void fetchStorefrontSettings().then((next) => { if (isActive) setSettings(next); });
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function loadOrder() {
      setIsLoading(true); setError("");
      try {
        const session = await readJson<{ customer: Customer }>("/api/account/session");
        if (!isActive) return;
        setCustomer(session.customer);
        const payload = await readJson<{ orders: AccountOrder[] }>("/api/account/orders");
        if (isActive) setOrders(payload.orders ?? []);
      } catch (err) {
        if (isActive) { setCustomer(null); setError(err instanceof Error ? err.message : "Order could not be loaded."); }
      } finally { if (isActive) setIsLoading(false); }
    }
    void loadOrder();
    return () => { isActive = false; };
  }, []);

  const canReviewOrder = order?.status === "Confirmed" || order?.status === "Delivered" || order?.deliveryStatus === "delivered";
  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    router.replace("/account/login");
  };
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || !reviewDraft) return;
    setIsSubmittingReview(true); setReviewMessage("");
    try {
      const response = await fetch("/api/account/reviews", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderReference: order.orderRef, productId: reviewDraft.productId, productSlug: reviewDraft.productSlug, rating: reviewDraft.rating, title: reviewDraft.title, body: reviewDraft.body }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; errors?: string[] };
      if (!response.ok) throw new Error(payload.errors?.[0] || "Review could not be submitted.");
      setReviewMessage(payload.message || "Review submitted for moderation."); setReviewDraft(null);
    } catch (err) { setReviewMessage(err instanceof Error ? err.message : "Review could not be submitted."); }
    finally { setIsSubmittingReview(false); }
  };

  return (
    <main className="aev-account-page-background aev-account-dashboard-page aev-account-order-detail-page min-h-screen overflow-x-hidden text-white">
      <SiteHeader settings={settings} active="account" />
      <section className="aev-account-shell mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14">
        {isLoading ? <AccountState title="Loading order details..." /> : error ? <AccountState title="Order unavailable" message={error} login returnTo={`/account/orders/${encodeURIComponent(reference)}`} /> : !customer ? <AccountState title="Login required" message="Please log in to view this order." login returnTo={`/account/orders/${encodeURIComponent(reference)}`} /> : !order ? (
          <div className="aev-account-dashboard-workspace aev-account-order-detail-workspace"><AccountSidebar customer={customer} onLogout={logout} /><div className="aev-account-dashboard-main"><AccountState title="Order not found" message="This order is not linked to your customer account." compact /></div></div>
        ) : (
          <div className="aev-account-dashboard-workspace aev-account-order-detail-workspace">
            <AccountSidebar customer={customer} onLogout={logout} />
            <div className="aev-account-dashboard-main">
              <section className="aev-account-dashboard-welcome aev-account-order-detail-hero">
                <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
                <div className="relative z-10 min-w-0 pr-12 md:pr-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">Noromi Care Account</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">Order Details</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#E8DDF0]/76">
                    <span className="break-all font-semibold text-[#FFB3D1]">{order.orderRef}</span><span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/30" /><span>{formatDate(order.createdAt)}</span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusChipClass(order.status)}`}>{readable(order.status)}</span>
                  </div>
                  <div className="aev-account-order-detail-actions">
                    <Link href="/account/orders" className="aev-account-order-detail-action is-secondary"><ArrowLeft className="h-4 w-4" />Back to My Orders</Link>
                    <Link href={trackOrderHref(order)} className="aev-account-order-detail-action is-primary"><PackageSearch className="h-4 w-4" />Track Order</Link>
                    <Link href="/account/support" className="aev-account-order-detail-action is-secondary"><MessageSquare className="h-4 w-4" />Get Support</Link>
                  </div>
                </div>
                <div className="absolute right-4 top-4 z-20 md:hidden"><AccountOrderMobileMenu onLogout={logout} /></div>
              </section>

              <section className="aev-account-order-summary" aria-label="Order summary">
                <OrderFact icon={WalletCards} label="Order Total" value={formatCurrency(order.total)} />
                <OrderFact icon={PackageCheck} label="Order Status" value={readable(order.status)} />
                <OrderFact icon={Truck} label="Delivery Status" value={readable(order.deliveryStatus)} />
                <OrderFact icon={CreditCard} label="Payment Method" value={readable(order.paymentMethod)} />
                <OrderFact icon={ShieldCheck} label="Payment Status" value={readable(order.paymentStatus)} />
                <div className="aev-account-order-summary-meta">
                  <Summary label="Courier" value={order.courierName || "Not assigned"} /><Summary label="Tracking" value={order.trackingId || "Not available"} /><Summary label="Delivery zone" value={order.deliveryZone || "Not available"} /><Summary label="Delivery area" value={order.deliveryArea || order.cityArea} />
                  {typeof order.deliveryCharge === "number" && <Summary label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />}
                </div>
                <div className="aev-account-order-delivery">
                  <OrderSectionHeading icon={MapPin} eyebrow="Delivery" title="Delivery details" />
                  <div className="aev-account-order-delivery-grid">
                    <Summary label="Address" value={order.deliveryAddress} /><Summary label="City / area" value={order.cityArea} /><Summary label="Zone" value={order.deliveryZone || "Not available"} /><Summary label="Courier" value={order.courierName || "Not assigned"} /><Summary label="Tracking ID" value={order.trackingId || "Not available"} /><Summary label="Delivery status" value={readable(order.deliveryStatus)} />
                  </div>
                </div>
              </section>

              <section className="aev-account-order-detail-surface aev-account-order-items">
                <OrderSectionHeading icon={ShoppingBag} eyebrow="Your order" title="Items & reviews" />
                <ul className="aev-account-order-item-list">
                  {order.items.map((item, index) => {
                    const itemKey = `${item.slug || item.productId || item.name}-${index}`;
                    const productSlug = item.slug || "";
                    const productId = item.productId || productSlug || item.name;
                    const canReviewItem = canReviewOrder && Boolean(productSlug || productId);
                    return (
                      <li key={`${item.name}-${index}`} className="aev-account-order-item">
                        <div className="aev-account-order-item-main"><div className="min-w-0"><p className="break-words font-semibold text-white [overflow-wrap:anywhere]">{item.name}</p>{item.variant && <p className="mt-1 text-xs text-[#D8CBE8]/62">{item.variant}</p>}<p className="mt-2 text-xs text-[#D8CBE8]/58">Quantity {item.quantity}</p></div><p className="shrink-0 font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p></div>
                        {canReviewItem && <button type="button" onClick={() => setReviewDraft({ itemKey, productId, productSlug, rating: 5, title: "", body: "" })} className="aev-account-order-review-trigger"><Star className="h-4 w-4" />Write Review</button>}
                        {reviewDraft?.itemKey === itemKey && (
                          <form onSubmit={submitReview} className="aev-account-order-review-form">
                            <div><p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">Rating</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setReviewDraft((current) => current ? { ...current, rating } : current)} className="p-1 text-[#FFB84D]" aria-label={`${rating} star rating`}><Star className={`h-5 w-5 ${rating <= reviewDraft.rating ? "fill-current" : "fill-transparent opacity-45"}`} /></button>)}</div></div>
                            <input value={reviewDraft.title} onChange={(event) => setReviewDraft((current) => current ? { ...current, title: event.target.value } : current)} placeholder="Review title optional" className="aev-account-order-review-input" />
                            <textarea value={reviewDraft.body} onChange={(event) => setReviewDraft((current) => current ? { ...current, body: event.target.value } : current)} required rows={4} placeholder="Share your real experience after purchase" className="aev-account-order-review-input resize-none py-3" />
                            <div className="flex flex-col gap-2 sm:flex-row"><button type="submit" disabled={isSubmittingReview} className="action-primary disabled:opacity-55">{isSubmittingReview ? "Submitting..." : "Submit for moderation"}</button><button type="button" className="action-muted" onClick={() => setReviewDraft(null)}>Cancel</button></div>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {reviewMessage && <p className="mt-4 rounded-2xl border border-[#00D4C6]/20 bg-[#00D4C6]/[0.07] px-4 py-3 text-sm leading-6 text-cyan-50/82">{reviewMessage}</p>}
              </section>
            </div>
          </div>
        )}
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}

function AccountState({ title, message, login = false, returnTo = "/account/orders", compact = false }: { title: string; message?: string; login?: boolean; returnTo?: string; compact?: boolean }) {
  return <div className={`aev-account-order-state ${compact ? "is-compact" : ""}`}><PackageSearch className="h-7 w-7 text-[#FFB3D1]" /><h1>{title}</h1>{message && <p>{message}</p>}<div className="mt-5 flex flex-wrap gap-3">{login && <Link className="action-primary" href={`/account/login?returnTo=${encodeURIComponent(returnTo)}`}>Login</Link>}<Link className="action-muted" href="/account/orders">Back to My Orders</Link></div></div>;
}

function AccountSidebar({ customer, onLogout }: { customer: Customer; onLogout: () => void }) {
  const items = [{ href: "/account", label: "Dashboard", icon: LayoutDashboard }, { href: "/account/orders", label: "My Orders", icon: PackageSearch, active: true }, { href: "/account/addresses", label: "My Addresses", icon: MapPin }, { href: "/account/support", label: "Support Requests", icon: MessageSquare }];
  return <aside className="aev-account-dashboard-sidebar"><div className="relative z-10"><div className="aev-account-dashboard-avatar">{customer.fullName.trim().charAt(0) || <UserRound className="h-6 w-6" />}</div><p className="mt-4 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">{customer.fullName}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.23em] text-[#FFB3D1]/72">Noromi Care Account</p><p className="mt-3 break-all text-xs leading-5 text-[#D8CBE8]/65">{customer.phone}</p></div><nav className="relative z-10 mt-8 grid gap-2" aria-label="Account dashboard">{items.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={`aev-account-dashboard-nav-item ${item.active ? "is-active" : ""}`}><Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span></Link>; })}<button type="button" onClick={onLogout} className="aev-account-dashboard-nav-item aev-account-dashboard-logout"><LogOut className="h-4 w-4 shrink-0" /><span>Logout</span></button></nav><div className="aev-account-dashboard-sidebar-note"><ShieldCheck className="h-4 w-4 shrink-0 text-[#31E6D4]" /><p>Private account access for your Noromi Care orders and support.</p></div></aside>;
}

function AccountOrderMobileMenu({ onLogout }: { onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const links = [{ href: "/account", label: "Dashboard", icon: LayoutDashboard }, { href: "/account/orders", label: "My Orders", icon: PackageSearch, active: true }, { href: "/account/addresses", label: "My Addresses", icon: MapPin }, { href: "/account/support", label: "Support Requests", icon: MessageSquare }];
  return <details className="group relative z-30 md:hidden" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}><summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-[#080611]/94 text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4DB8] [&::-webkit-details-marker]:hidden"><span className="sr-only">Open account menu</span><MoreHorizontal className="h-4 w-4 text-[#FFB3D1]" /></summary><nav className="absolute right-0 top-[calc(100%+0.55rem)] grid w-60 gap-1.5 rounded-[1.3rem] border border-[#FF4DB8]/18 bg-[#100B1C]/[0.98] p-2 shadow-[0_22px_68px_rgba(0,0,0,0.58)] backdrop-blur-2xl">{links.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} onClick={() => setIsOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${item.active ? "border-[#FF4DB8]/35 bg-[#FF4DB8]/[0.13] text-white" : "border-transparent text-[#D8CBE8] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"}`}><Icon className="h-4 w-4 text-[#FFB3D1]" />{item.label}</Link>; })}<button type="button" onClick={() => { setIsOpen(false); onLogout(); }} className="flex min-h-11 items-center gap-3 rounded-2xl border border-rose-200/12 bg-rose-300/[0.045] px-3 py-2.5 text-left text-sm font-semibold text-rose-100/86"><LogOut className="h-4 w-4" />Logout</button></nav></details>;
}

function OrderFact({ icon: Icon, label, value }: { icon: typeof PackageSearch; label: string; value: string }) { return <div className="aev-account-order-fact"><span><Icon className="h-4 w-4" /></span><div><p>{label}</p><strong>{value}</strong></div></div>; }
function OrderSectionHeading({ icon: Icon, eyebrow, title }: { icon: typeof MapPin; eyebrow: string; title: string }) { return <div className="aev-account-order-section-heading"><span className="aev-account-order-section-icon"><Icon className="h-5 w-5" /></span><div><p className="aev-account-order-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="aev-account-order-summary-field"><p>{label}</p><strong>{value}</strong></div>; }
