"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Copy, ShieldCheck, Truck } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import { useCart } from "@/app/components/cart/cart-context";
import {
  ADMIN_SETTINGS_KEY,
  defaultAdminSettings,
  normalizeAdminSettings,
  walletProviders,
  type AdminSettings,
  type WalletProvider,
} from "@/app/lib/admin-settings";

const DRAFT_ORDER_STORAGE_KEY = "aevyrixa-draft-order";
const DRAFT_ORDERS_STORAGE_KEY = "aevyrixa-draft-orders";
const BANGLADESH_MOBILE_ERROR = "Please enter a valid Bangladesh mobile number.";

const paymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const;

type PaymentMethod = (typeof paymentMethods)[number];

const paymentTypes = ["Send Money", "Merchant Payment", "Cash Out"] as const;

type PaymentType = (typeof paymentTypes)[number];

type CheckoutForm = {
  fullName: string;
  phone: string;
  email: string;
  cityArea: string;
  address: string;
  sizeFitNote: string;
  deliveryNote: string;
  paymentMethod: PaymentMethod;
  walletProvider: WalletProvider;
  paymentType: PaymentType;
  walletSenderNumber: string;
  transactionReference: string;
};

type CheckoutErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "cityArea"
    | "address"
    | "walletSenderNumber"
    | "transactionReference",
    string
  >
>;

type PreparedOrder = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  walletProvider?: WalletProvider;
  paymentType?: PaymentType;
  receiverNumber?: string;
  walletSenderNumber?: string;
  transactionReference?: string;
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
  walletProvider: "bKash",
  paymentType: "Send Money",
  walletSenderNumber: "",
  transactionReference: "",
};

const isBangladeshMobileNumber = (value: string) =>
  value.trim().match(/^01\d{9}$/) !== null;

function readAdminSettingsFromStorage() {
  try {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return stored
      ? normalizeAdminSettings(JSON.parse(stored) as unknown)
      : defaultAdminSettings;
  } catch (error) {
    console.error("Failed to load checkout settings:", error);
    return defaultAdminSettings;
  }
}

export default function CheckoutPage() {
  const { items, totalItems, subtotal, isLoaded, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null);
  const [copiedReceiver, setCopiedReceiver] = useState(false);
  const [adminSettings, setAdminSettings] =
    useState<AdminSettings>(defaultAdminSettings);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAdminSettings(readAdminSettingsFromStorage());
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

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

  const updatePaymentMethod = (paymentMethod: PaymentMethod) => {
    setForm((current) => ({ ...current, paymentMethod }));
  };

  const selectedReceiverNumber =
    adminSettings.walletReceiverNumbers[form.walletProvider] ||
    defaultAdminSettings.walletReceiverNumbers[form.walletProvider];
  const isWalletSendMoney =
    form.paymentMethod === "Mobile Wallet Payment" &&
    form.paymentType === "Send Money";
  const isSubmitDisabled =
    form.paymentMethod === "Mobile Wallet Payment" &&
    form.paymentType !== "Send Money";

  const copyReceiverNumber = async () => {
    try {
      await navigator.clipboard.writeText(selectedReceiverNumber);
      setCopiedReceiver(true);
      window.setTimeout(() => setCopiedReceiver(false), 1800);
    } catch {
      setCopiedReceiver(false);
    }
  };

  const validateForm = () => {
    const nextErrors: CheckoutErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phone.trim() || !isBangladeshMobileNumber(form.phone)) {
      nextErrors.phone = BANGLADESH_MOBILE_ERROR;
    }

    if (!form.cityArea.trim()) {
      nextErrors.cityArea = "City or area is required.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Full delivery address is required.";
    }

    if (isWalletSendMoney) {
      if (
        !form.walletSenderNumber.trim() ||
        !isBangladeshMobileNumber(form.walletSenderNumber)
      ) {
        nextErrors.walletSenderNumber = BANGLADESH_MOBILE_ERROR;
      }

      if (!form.transactionReference.trim()) {
        nextErrors.transactionReference =
          "Transaction ID / Reference is required.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDraftOrder = (draftOrder: unknown) => {
    try {
      localStorage.setItem(DRAFT_ORDER_STORAGE_KEY, JSON.stringify(draftOrder));

      try {
        const savedOrders = localStorage.getItem(DRAFT_ORDERS_STORAGE_KEY);
        const parsedOrders = savedOrders
          ? (JSON.parse(savedOrders) as unknown)
          : [];
        const existingOrders = Array.isArray(parsedOrders) ? parsedOrders : [];

        localStorage.setItem(
          DRAFT_ORDERS_STORAGE_KEY,
          JSON.stringify([...existingOrders, draftOrder])
        );
      } catch (error) {
        console.error("Failed to save order history:", error);
        localStorage.setItem(
          DRAFT_ORDERS_STORAGE_KEY,
          JSON.stringify([draftOrder])
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to save order:", error);
      return false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled || !validateForm() || items.length === 0) return;

    const orderId = `AEV-${Date.now().toString(36).toUpperCase()}`;
    const selectedWalletProvider =
      form.paymentMethod === "Mobile Wallet Payment"
        ? form.walletProvider
        : undefined;
    const selectedPaymentType =
      form.paymentMethod === "Mobile Wallet Payment" ? form.paymentType : undefined;
    const receiverNumber =
      form.paymentMethod === "Mobile Wallet Payment"
        ? selectedReceiverNumber
        : undefined;
    const walletSenderNumber = isWalletSendMoney
      ? form.walletSenderNumber.trim()
      : undefined;
    const transactionReference = isWalletSendMoney
      ? form.transactionReference.trim()
      : undefined;

    const draftOrder = {
      orderId,
      customer: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        cityArea: form.cityArea.trim(),
        address: form.address.trim(),
        sizeFitNote: form.sizeFitNote.trim(),
        deliveryNote: form.deliveryNote.trim(),
      },
      paymentDetails: {
        paymentMethod: form.paymentMethod,
        walletProvider: selectedWalletProvider,
        paymentType: selectedPaymentType,
        receiverNumber,
        walletSenderNumber,
        transactionReference,
      },
      items,
      totals: {
        totalItems,
        subtotal,
      },
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    if (!saveDraftOrder(draftOrder)) return;

    setPreparedOrder({
      orderId,
      customerName: form.fullName.trim(),
      customerPhone: form.phone.trim(),
      paymentMethod: form.paymentMethod,
      walletProvider: selectedWalletProvider,
      paymentType: selectedPaymentType,
      receiverNumber,
      walletSenderNumber,
      transactionReference,
      total: subtotal,
    });
    clearCart();
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
            Complete Your Order
          </h1>
          <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-white/64 [overflow-wrap:anywhere] md:text-base">
            Share your delivery details and choose your preferred payment method.
            Our team will confirm your order before dispatch.
          </p>
        </div>

        {!isLoaded ? (
          <div className="w-full min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 text-white/65 backdrop-blur-2xl">
            Loading checkout...
          </div>
        ) : preparedOrder ? (
          <ConfirmationPanel order={preparedOrder} />
        ) : items.length === 0 ? (
          <EmptyCheckoutState />
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
                        onChange={() => updatePaymentMethod(method)}
                        className="h-4 w-4 accent-cyan-200"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
                {form.paymentMethod === "Mobile Wallet Payment" && (
                  <div className="mt-4 space-y-4 rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.06] p-4">
                    <p className="text-sm font-medium text-white/80">
                      Select your mobile wallet
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {walletProviders.map((provider) => (
                        <label
                          key={provider}
                          className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            form.walletProvider === provider
                              ? "border-cyan-200/60 bg-cyan-200/14 text-white"
                              : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="walletProvider"
                            value={provider}
                            checked={form.walletProvider === provider}
                            onChange={() =>
                              updateField("walletProvider", provider)
                            }
                            className="h-4 w-4 accent-cyan-200"
                          />
                          <span>{provider}</span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Payment type
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
                        {paymentTypes.map((type) => (
                          <label
                            key={type}
                            className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2 text-center text-sm transition ${
                              form.paymentType === type
                                ? "border-fuchsia-200/60 bg-fuchsia-200/14 text-white"
                                : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentType"
                              value={type}
                              checked={form.paymentType === type}
                              onChange={() => updateField("paymentType", type)}
                              className="h-4 w-4 shrink-0 accent-fuchsia-200"
                            />
                            <span className="break-words leading-5">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {form.paymentType === "Merchant Payment" && (
                      <PremiumNotice>
                        Merchant Payment is not available yet. Please use Send
                        Money for now.
                      </PremiumNotice>
                    )}

                    {form.paymentType === "Cash Out" && (
                      <PremiumNotice>
                        Cash Out is not available yet. Please use Send Money for
                        now.
                      </PremiumNotice>
                    )}

                    {isWalletSendMoney && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-cyan-100/25 bg-black/25 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/65">
                            Verified Receiver Number
                          </p>
                          <div className="mt-3 flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center">
                            <p className="min-w-0 flex-1 break-all text-2xl font-semibold leading-tight text-white">
                              {selectedReceiverNumber}
                            </p>
                            <button
                              type="button"
                              onClick={copyReceiverNumber}
                              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-100/10 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-100/15 min-[390px]:w-auto"
                            >
                              <Copy className="h-4 w-4" />
                              {copiedReceiver ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-white/72">
                            Send Money to this verified Aevyrixa receiver number,
                            then enter your sender number and transaction ID
                            below.
                          </p>
                          <p className="mt-3 text-xs leading-5 text-amber-100/80">
                            Please send payment only to the selected wallet number
                            shown here.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            label="Wallet sender number *"
                            value={form.walletSenderNumber}
                            error={errors.walletSenderNumber}
                            onChange={(value) =>
                              updateField("walletSenderNumber", value)
                            }
                            autoComplete="tel"
                          />
                          <TextField
                            label="Transaction ID / Reference *"
                            value={form.transactionReference}
                            error={errors.transactionReference}
                            onChange={(value) =>
                              updateField("transactionReference", value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {form.paymentMethod === "Bank Transfer" && (
                  <PremiumNotice>{adminSettings.bankTransferInstruction}</PremiumNotice>
                )}
                {form.paymentMethod === "Cash on Delivery" && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68">
                    {adminSettings.codInstruction}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`mt-7 flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition ${
                  isSubmitDisabled
                    ? "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/35"
                    : "bg-gradient-to-r from-cyan-300 to-fuchsia-300 text-black hover:scale-[1.01]"
                }`}
              >
                Submit Order
              </button>
            </form>

            <OrderSummary
              storeName={adminSettings.storeName}
              deliveryNote={adminSettings.deliveryNote}
              guarantee={adminSettings.guaranteeText}
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
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/45 focus:bg-black/30"
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
        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-200/45 focus:bg-black/30"
      />
      {error && <span className="mt-2 block text-xs text-rose-200">{error}</span>}
    </label>
  );
}

function PremiumNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-fuchsia-100/20 bg-fuchsia-100/[0.07] p-4 text-sm leading-6 text-white/72">
      {children}
    </div>
  );
}

function OrderSummary({
  storeName,
  deliveryNote,
  guarantee,
}: {
  storeName: string;
  deliveryNote: string;
  guarantee: string;
}) {
  const { items, totalItems, subtotal } = useCart();

  return (
    <aside className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl sm:p-6 lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
        Order Summary
      </p>
      <h2 className="mt-2 break-words text-2xl font-semibold text-white [overflow-wrap:anywhere]">
        {storeName}
      </h2>

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
    <div className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 text-center shadow-[0_0_48px_rgba(34,211,238,0.08)] backdrop-blur-2xl sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10">
        <ShieldCheck className="h-6 w-6 text-cyan-100" />
      </div>
      <h2 className="mt-5 break-words text-2xl font-semibold text-white [overflow-wrap:anywhere]">
        Your checkout is ready when your Her Care essentials are selected.
      </h2>
      <p className="mx-auto mt-3 max-w-xl break-words text-sm leading-7 text-white/60 [overflow-wrap:anywhere]">
        Add a reusable period care product to your cart before sharing delivery
        and payment details. The checkout form will appear after your cart has
        items.
      </p>
      <Link
        href="/product"
        className="mt-7 inline-flex w-full min-w-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01] sm:w-auto"
      >
        Shop Her Care
      </Link>
    </div>
  );
}

function ConfirmationPanel({ order }: { order: PreparedOrder }) {
  const detailItems = (
    [
    ["Order Reference", order.orderId],
    ["Customer Name", order.customerName],
    ["Customer Phone", order.customerPhone],
    ["Order Total", `$${order.total.toFixed(2)}`],
    ["Selected Payment Method", order.paymentMethod],
    ["Wallet Provider", order.walletProvider],
    ["Payment Type", order.paymentType],
    ["Receiver Number", order.receiverNumber],
    ["Wallet Sender Number", order.walletSenderNumber],
    ["Transaction ID / Reference", order.transactionReference],
    ] as Array<[string, string | undefined]>
  ).filter((item): item is [string, string] => Boolean(item[1]));
  const nextSteps = [
    "Order received",
    "Team confirms details",
    "Dispatch preparation",
  ];

  return (
    <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-cyan-200/25 bg-cyan-200/[0.08] p-5 text-center shadow-[0_0_48px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/12">
        <CheckCircle2 className="h-8 w-8 text-cyan-100" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-100/75">
        Order Received
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Thank you, {order.customerName}. Your Her Care order is in review.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68">
        We have received your order request. Our team will confirm delivery and
        payment details directly before dispatch preparation begins.
      </p>
      <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
        {nextSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
              Step {index + 1}
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{step}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
        {detailItems.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="break-words text-xs uppercase tracking-[0.16em] text-white/45">
              {label}
            </p>
            <p className="mt-2 break-words text-base font-semibold leading-6 text-white [overflow-wrap:anywhere]">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/cart"
          className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.09] sm:w-auto"
        >
          Review Cart
        </Link>
        <Link
          href="/product"
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] sm:w-auto"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
