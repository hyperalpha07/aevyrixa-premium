"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import ProductVisual from "@/app/components/product-visual";
import { isPurchasableStock } from "@/app/lib/product-display";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
    totalItems,
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

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform border-l border-white/10 bg-[#0D0918] shadow-2xl transition duration-300 ease-out ${
          isOpen
            ? "visible translate-x-0 opacity-100"
            : "invisible translate-x-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#31E6D4]/70">
                  {settings.brandShortName} Cart
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Your Cart
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={closeCart}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 rounded-full border border-[#00D4C6]/20 bg-[#00D4C6]/10 p-4">
                  <ShoppingBag className="text-[#31E6D4]" size={30} />
                </div>

                <h3 className="text-xl font-semibold text-white">
                  Your cart is empty
                </h3>

                <p className="mt-3 max-w-xs text-sm leading-7 text-white/60">
                  Add premium Her Care products to your cart and build a more
                  comfortable reusable routine with {settings.brandShortName}.
                </p>

                <Link
                  href="/product"
                  onClick={closeCart}
                  className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 sm:p-4"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] border border-white/10 bg-[#0B0F1A]">
                        <ProductVisual
                          visualTheme={item.visualTheme}
                          label={item.absorbency || "Her Care"}
                          compact
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-[#31E6D4]">
                              {formatCurrency(item.price)}
                            </p>
                            {(item.variant || item.size || item.color || item.absorbency) && (
                              <p className="mt-1 text-xs leading-5 text-white/45">
                                {item.variant ||
                                  [item.size, item.color, item.absorbency]
                                    .filter(Boolean)
                                    .join(" / ")}
                              </p>
                            )}
                            {item.stockStatus === "out_of_stock" && (
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                                Out of stock
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="shrink-0 text-xs font-medium text-white/45 transition hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-full border border-white/10 bg-black/20">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="px-3 py-2 text-white/70 transition hover:text-white"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="min-w-[36px] text-center text-sm font-medium text-white">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="px-3 py-2 text-white/70 transition hover:text-white"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#0D0918] px-4 py-4 sm:px-5">
            <div className="mb-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span className="text-lg font-semibold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-6 text-white/45">
                Shipping and taxes are calculated at checkout.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View Cart
              </Link>

              {hasUnavailableItems ? (
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/35"
                >
                  Remove out-of-stock item
                </button>
              ) : (
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] via-[#FF3FA4] to-[#A855F7] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                >
                  Checkout
                </Link>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
              Secure Payment | {settings.privacyPackagingMessage} | {settings.supportWindowMessage}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
