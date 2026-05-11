"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/app/components/cart/site-header";
import { useCart } from "@/app/components/cart/cart-context";
import { startShopifyCheckout } from "@/app/lib/shopify";

export default function CheckoutPage() {
  const { items, totalItems, subtotal } = useCart();
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const handleContinueToPayment = async () => {
    setIsStartingCheckout(true);
    setCheckoutMessage("");

    try {
      const result = await startShopifyCheckout(items);

      if (!result.ok) {
        setCheckoutMessage(result.message);
        return;
      }

      setCheckoutMessage(result.message);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      setCheckoutMessage("Something went wrong while preparing checkout.");
    } finally {
      setIsStartingCheckout(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[8%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[30%] h-[280px] w-[280px] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <SiteHeader active="cart" />

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">
            Checkout Prep
          </p>

          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
            Secure checkout flow is being prepared
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-white/65">
            Your cart is ready. This checkout page is now set up as a premium
            placeholder so we can smoothly connect your Shopify backend and real
            payment flow in the next phase.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-300/70">
              Current Status
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-semibold text-white">
                  Frontend checkout page is ready
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Your cart, drawer, shop page, product page, and checkout entry
                  flow are now connected and working smoothly.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-semibold text-white">
                  Shopify integration comes next
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  In the next phase, this button flow will be connected to your
                  real Shopify checkout using actual products, handles, and
                  variant IDs.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-semibold text-white">
                  Payment handoff will be upgraded later
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Right now this page works as a polished placeholder so your
                  storefront flow feels complete while we prepare the backend
                  connection properly.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cart"
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Cart
              </Link>

              <Link
                href="/product"
                className="inline-flex rounded-full border border-fuchsia-400/25 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-fuchsia-400/40 hover:bg-white/10"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          <div className="h-fit rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">
              Order Summary
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              Ready for Shopify handoff
            </h2>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-white/65">
                  <span>Products</span>
                  <span>{items.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-white/65">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-white/65">
                  <span>Checkout Mode</span>
                  <span>Prep Stage</span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between text-lg font-semibold text-white">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={isStartingCheckout || items.length === 0}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingCheckout ? "Preparing Checkout..." : "Continue to Payment"}
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-white/50">
              This button is ready for the next step where we will connect your
              real Shopify checkout flow.
            </p>

            {checkoutMessage && (
              <p className="mt-3 text-center text-sm text-cyan-300/80">
                {checkoutMessage}
              </p>
            )}

            <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-white/45">
              Secure Payment • Fast Shipping • 7-Day Guarantee
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
