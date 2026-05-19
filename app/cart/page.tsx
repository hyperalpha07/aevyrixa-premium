"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageCheck, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import { useCart } from "@/app/components/cart/cart-context";
import ProductVisual from "@/app/components/product-visual";
import { isPurchasableStock } from "@/app/lib/product-display";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const hasUnavailableItems = items.some(
    (item) => item.stockStatus && !isPurchasableStock(item.stockStatus)
  );
  const [settings, setSettings] = useState<StorefrontSettings>(
    defaultStorefrontSettings
  );

  useEffect(() => {
    let isActive = true;

    void fetchStorefrontSettings().then((nextSettings) => {
      if (isActive) setSettings(nextSettings);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const emptyCartTrustNotes = [
    { label: settings.privacyPackagingMessage, icon: PackageCheck },
    { label: settings.supportWindowMessage, icon: ShieldCheck },
    { label: "Comfort Fit", icon: Sparkles },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[8%] h-[320px] w-[320px] rounded-full bg-[#00D4C6]/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[360px] w-[360px] rounded-full bg-[#FF4DB8]/20 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[30%] h-[280px] w-[280px] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <SiteHeader active="cart" settings={settings} />

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#31E6D4]/70">
              {settings.brandShortName} Cart
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
              Your Shopping Cart
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Review your selected products, update quantities, and continue to
              checkout when you are ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="inline-flex rounded-full border border-red-400/25 bg-red-400/10 px-6 py-3 text-sm font-medium text-red-200 transition hover:bg-red-400/15"
              >
                Clear Cart
              </button>
            )}

            <Link
              href="/product"
              className="inline-flex rounded-full border border-[#FF4DB8]/30 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center shadow-[0_0_48px_rgba(255,77,184,0.10)] backdrop-blur-2xl sm:p-8 md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#00D4C6]/20 bg-[#00D4C6]/10 text-2xl text-[#31E6D4]">
              <ShoppingBag className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-2xl font-semibold md:text-3xl">
              Your cart is ready for Her Care essentials.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">
              Choose premium reusable period care essentials when you are ready.
              Your selections will appear here before checkout.
            </p>

            <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              {emptyCartTrustNotes.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/64"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#31E6D4]" />
                  <span className="break-words">{label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/product"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-7 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.02] sm:w-auto"
            >
              Shop Her Care
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:p-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-[#0B0F1A]">
                      <ProductVisual
                        visualTheme={item.visualTheme}
                        label={item.absorbency || "Her Care"}
                        compact
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold leading-7 text-white">
                            {item.name}
                          </h2>
                          <p className="mt-2 text-sm text-[#31E6D4]">
                            {formatCurrency(item.price)}
                          </p>
                          {(item.variant || item.size || item.color || item.absorbency) && (
                            <p className="mt-2 text-xs leading-5 text-white/45">
                              {item.variant ||
                                [item.size, item.color, item.absorbency]
                                  .filter(Boolean)
                                  .join(" / ")}
                            </p>
                          )}
                          {item.stockStatus === "out_of_stock" && (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200">
                              Out of stock
                            </p>
                          )}
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-lg font-semibold text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center rounded-full border border-white/10 bg-black/20">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-5 py-2 text-lg text-white/70 transition hover:text-white"
                          >
                            -
                          </button>

                          <span className="min-w-[44px] text-center text-sm font-medium text-white">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-5 py-2 text-lg text-white/70 transition hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-sm font-medium text-red-300/80 transition hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-[#31E6D4]/70">
                Order Summary
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                Ready to checkout
              </h2>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-white/65">
                    <span>Items</span>
                    <span>{totalItems}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/65">
                    <span>Delivery (Inside Dhaka)</span>
                    <span>
                      {formatCurrency(
                        parseInt(settings.deliverySettings.insideDhakaDeliveryCharge) || 80
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/65">
                    <span>Delivery (Outside Dhaka)</span>
                    <span>
                      {formatCurrency(
                        parseInt(settings.deliverySettings.outsideDhakaDeliveryCharge) || 130
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/65">
                    <span>Support</span>
              <span>{settings.supportWindowMessage}</span>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center justify-between text-lg font-semibold text-white">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {hasUnavailableItems ? (
                  <button
                    disabled
                    className="flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white/35"
                  >
                    Remove out-of-stock item
                  </button>
                ) : (
                  <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-6 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01]"
                  >
                    Proceed to Checkout
                  </Link>
                )}

                <Link
                  href="/product"
                  className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Add More Products
                </Link>
              </div>

              <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-white/45">
                Secure Order | {settings.privacyPackagingMessage} | {settings.supportWindowMessage}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
