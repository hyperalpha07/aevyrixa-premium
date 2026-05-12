"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import { useCart } from "@/app/components/cart/cart-context";

const DRAFT_ORDER_STORAGE_KEY = "aevyrixa-draft-order";

const paymentMethods = [
  "Cash on Delivery",
  "Manual Mobile Payment",
  "Bank Transfer",
] as const;

type PaymentMethod = (typeof paymentMethods)[number];

type CheckoutForm = {
  fullName: string;
  phone: string;
  email: string;
  cityArea: string;
  address: string;
  sizeFitNote: string;
  deliveryNote: string;
  paymentMethod: PaymentMethod;
};

type CheckoutErrors = Partial<
  Record<"fullName" | "phone" | "cityArea" | "address", string>
>;

type PreparedOrder = {
  orderId: string;
  customerName: string;
  total: number;
};

const initialForm: CheckoutForm = {
  fullName: "",
  phone: "",
  email: "",
  cityArea: "",
  address: "",
  sizeFitNote: "",
  deliveryNote: "",
  paymentMethod: "Cash on Delivery",
};

export default function CheckoutPage() {
  const { items, totalItems, subtotal, isLoaded } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null);

  const orderMeta = useMemo(
    () => ({
      deliveryNote:
        "Estimated delivery will be confirmed by our team after order review.",
      guarantee: "7-Day Money Back Guarantee",
    }),
    []
  );

  const updateField = <Field extends keyof CheckoutForm>(
    field: Field,
    value: CheckoutForm[Field]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field as keyof CheckoutErrors]) return current;
      const next = { ...current };
      delete next[field as keyof CheckoutErrors];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: CheckoutErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    if (!form.cityArea.trim()) {
      nextErrors.cityArea = "City or area is required.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Full delivery address is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm() || items.length === 0) return;

    const orderId = `AEV-${Date.now().toString(36).toUpperCase()}`;
    const draftOrder = {
      orderId,
      customer: form,
      items,
      totals: {
        totalItems,
        subtotal,
      },
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_ORDER_STORAGE_KEY, JSON.stringify(draftOrder));
    setPreparedOrder({
      orderId,
      customerName: form.fullName.trim(),
      total: subtotal,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-14%] top-[8%] h-[300px] w-[300px] rounded-full bg-cyan-500/16 blur-[120px]" />
        <div className="absolute right-[-18%] top-[18%] h-[340px] w-[340px] rounded-full bg-fuchsia-500/16 blur-[140px]" />
        <div className="absolute bottom-[-12%] left-[24%] h-[260px] w-[260px] rounded-full bg-rose-300/10 blur-[120px]" />
      </div>

      <SiteHeader active="cart" />

      <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-24 pt-10 sm:px-6 md:pt-16">
        <div className="mb-8 w-full max-w-3xl min-w-0 md:mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70 sm:text-sm sm:tracking-[0.42em]">
            Aevyrixa Checkout
          </p>
          <h1 className="mt-4 max-w-full break-words text-2xl font-semibold leading-tight text-white [overflow-wrap:anywhere] min-[390px]:text-3xl sm:text-4xl md:text-5xl">
            Manual order request
          </h1>
          <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-white/64 [overflow-wrap:anywhere] md:text-base">
            Share your delivery details and preferred payment method. Our team
            will review your order request and contact you to confirm details.
          </p>
        </div>

        {!isLoaded ? (
          <div className="w-full min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 text-white/65 backdrop-blur-2xl">
            Loading checkout...
          </div>
        ) : items.length === 0 ? (
          <EmptyCheckoutState />
        ) : preparedOrder ? (
          <ConfirmationPanel order={preparedOrder} />
        ) : (
          <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-start">
            <form
              onSubmit={handleSubmit}
              className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl sm:p-6"
            >
              <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200/70">
                    Delivery Details
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Customer information
                  </h2>
                </div>
                <p className="text-sm text-white/50">Required fields marked *</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Full Name *"
                  value={form.fullName}
                  error={errors.fullName}
                  onChange={(value) => updateField("fullName", value)}
                  autoComplete="name"
                />
                <TextField
                  label="Phone Number *"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(value) => updateField("phone", value)}
                  autoComplete="tel"
                />
                <TextField
                  label="Email optional"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  autoComplete="email"
                />
                <TextField
                  label="City / Area *"
                  value={form.cityArea}
                  error={errors.cityArea}
                  onChange={(value) => updateField("cityArea", value)}
                  autoComplete="address-level2"
                />
              </div>

              <div className="mt-4 grid gap-4">
                <TextAreaField
                  label="Full Delivery Address *"
                  value={form.address}
                  error={errors.address}
                  onChange={(value) => updateField("address", value)}
                  autoComplete="street-address"
                />
                <TextAreaField
                  label="Size/Fit Note optional"
                  value={form.sizeFitNote}
                  onChange={(value) => updateField("sizeFitNote", value)}
                />
                <TextAreaField
                  label="Delivery Note optional"
                  value={form.deliveryNote}
                  onChange={(value) => updateField("deliveryNote", value)}
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-white">Payment Method</p>
                <div className="mt-3 grid gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        form.paymentMethod === method
                          ? "border-cyan-200/45 bg-cyan-200/10 text-white"
                          : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={form.paymentMethod === method}
                        onChange={() => updateField("paymentMethod", method)}
                        className="h-4 w-4 accent-cyan-200"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="mt-7 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01]"
              >
                Submit Order
              </button>
            </form>

            <OrderSummary
              deliveryNote={orderMeta.deliveryNote}
              guarantee={orderMeta.guarantee}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-white/75">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45 focus:bg-black/30"
      />
      {error && <span className="mt-2 block text-xs text-rose-200">{error}</span>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-white/75">{label}</span>
      <textarea
        value={value}
        rows={3}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45 focus:bg-black/30"
      />
      {error && <span className="mt-2 block text-xs text-rose-200">{error}</span>}
    </label>
  );
}

function OrderSummary({
  deliveryNote,
  guarantee,
}: {
  deliveryNote: string;
  guarantee: string;
}) {
  const { items, totalItems, subtotal } = useCart();

  return (
    <aside className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl sm:p-6 lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
        Order Summary
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Aevyrixa Her Care</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="break-words text-sm font-semibold leading-6 text-white [overflow-wrap:anywhere]">
                  {item.name}
                </h3>
                {(item.size || item.color || item.absorbency) && (
                  <p className="mt-1 break-words text-xs leading-5 text-white/45 [overflow-wrap:anywhere]">
                    {[item.size, item.color, item.absorbency]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-white/55">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-white">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="space-y-3 text-sm text-white/65">
          <div className="flex items-center justify-between gap-4">
            <span>Items</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
            <span className="leading-6">{deliveryNote}</span>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-200" />
            <span className="leading-6">{guarantee}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between text-lg font-semibold text-white">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function EmptyCheckoutState() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 text-center backdrop-blur-2xl sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10">
        <ShieldCheck className="h-6 w-6 text-cyan-100" />
      </div>
      <h2 className="mt-5 break-words text-2xl font-semibold text-white [overflow-wrap:anywhere]">
        Your checkout is empty
      </h2>
      <p className="mx-auto mt-3 max-w-xl break-words text-sm leading-7 text-white/60 [overflow-wrap:anywhere]">
        Add an Aevyrixa Her Care product before preparing a manual order request.
      </p>
      <Link
        href="/product"
        className="mt-7 inline-flex w-full min-w-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01] sm:w-auto"
      >
        Back to Products
      </Link>
    </div>
  );
}

function ConfirmationPanel({ order }: { order: PreparedOrder }) {
  return (
    <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-cyan-200/25 bg-cyan-200/[0.08] p-6 text-center shadow-[0_0_48px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/12">
        <CheckCircle2 className="h-8 w-8 text-cyan-100" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-100/75">
        Order Request Prepared
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Thank you, {order.customerName}
      </h2>
      <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Temporary Order ID
          </p>
          <p className="mt-2 break-words text-lg font-semibold text-white">
            {order.orderId}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Order Total
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            ${order.total.toFixed(2)}
          </p>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/68">
        Your order request has been prepared. Our team will contact you to
        confirm details.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/cart"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.09]"
        >
          Review Cart
        </Link>
        <Link
          href="/product"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
