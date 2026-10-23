import type { AdminSettings } from "@/app/lib/admin-settings";
import type { OrderCartItem, OrderSubmissionInput } from "@/app/lib/order-types";
import { productCartLineId, validateProductSelections } from "@/app/lib/product-options";
import { isPurchasableStock } from "@/app/lib/product-display";
import { isPublicCatalogProduct, type ProductCatalogItem } from "@/app/lib/product-types";

type CheckoutQuote = {
  items: OrderCartItem[];
  totals: { totalItems: number; subtotal: number };
  deliveryCharge: number;
};

type QuoteResult = { ok: true; quote: CheckoutQuote } | { ok: false; errors: string[] };

const money = (value: number) => Math.round(value * 100) / 100;
const sameMoney = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(money(a) - money(b)) < 0.001;

export function quoteCheckoutOrder(
  input: OrderSubmissionInput,
  catalog: ProductCatalogItem[],
  settings: AdminSettings
): QuoteResult {
  const errors: string[] = [];
  if (input.items.length < 1 || input.items.length > 50) {
    return { ok: false, errors: ["Cart must contain between 1 and 50 product lines."] };
  }
  const bySlug = new Map(catalog.filter(isPublicCatalogProduct).map((p) => [p.slug, p]));
  const confirmed: OrderCartItem[] = [];
  for (const item of input.items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      errors.push("An item is no longer available. Refresh your cart.");
      continue;
    }
    if (item.productId && item.productId !== product.id) {
      errors.push(`${product.name}: Product selection changed. Refresh your cart.`);
      continue;
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      errors.push(`${product.name}: Invalid quantity.`);
      continue;
    }
    if (!isPurchasableStock(product.stockStatus)) {
      errors.push(`${product.name} is no longer available.`);
      continue;
    }
    const selectionErrors = validateProductSelections(product, item);
    if (selectionErrors.length) {
      errors.push(...selectionErrors.map((error) => `${product.name}: ${error}`));
      continue;
    }
    if (!Number.isFinite(product.price) || product.price <= 0) {
      errors.push(`${product.name}: Current price is unavailable.`);
      continue;
    }
    if (!sameMoney(item.price, product.price) ||
        (item.lineTotal !== undefined && !sameMoney(item.lineTotal, money(product.price * item.quantity)))) {
      errors.push(`${product.name}: The price has changed. Refresh your cart before ordering.`);
      continue;
    }
    confirmed.push({
      id: productCartLineId(product.id, item),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.primaryImageUrl ?? product.imageUrl ?? null,
      visualTheme: product.visualTheme,
      visualVariant: product.visualVariant,
      stockStatus: product.stockStatus,
      size: item.size,
      color: item.color,
      absorbency: item.absorbency,
      variant: item.variant,
      quantity: item.quantity,
      lineTotal: money(product.price * item.quantity),
    });
  }
  if (errors.length) return { ok: false, errors };

  const totalItems = confirmed.reduce((n, item) => n + item.quantity, 0);
  const subtotal = money(confirmed.reduce((n, item) => n + item.price * item.quantity, 0));
  if (!sameMoney(input.totals.subtotal, subtotal) || input.totals.totalItems !== totalItems) {
    return { ok: false, errors: ["Cart totals changed. Refresh the cart and review your order."] };
  }

  const minimum = Number(settings.checkoutSettings.minimumOrderAmount);
  if (Number.isFinite(minimum) && minimum > 0 && subtotal < minimum) {
    return { ok: false, errors: ["Order does not meet the current minimum order amount."] };
  }

  const payment = settings.paymentSettings;
  const method = input.paymentDetails.paymentMethod;
  if ((method === "Cash on Delivery" && !payment.codEnabled) ||
      (method === "Bank Transfer" && !payment.bankTransferEnabled) ||
      (method === "Mobile Wallet Payment" &&
        (input.paymentDetails.paymentType !== "Send Money" ||
         !input.paymentDetails.walletProvider ||
         !({
           bKash: payment.bkashEnabled,
           Nagad: payment.nagadEnabled,
           Rocket: payment.rocketEnabled,
           Upay: payment.upayEnabled,
         } as Record<string, boolean>)[input.paymentDetails.walletProvider]))) {
    return { ok: false, errors: ["Selected payment method is currently unavailable."] };
  }

  const threshold = Number(settings.checkoutSettings.freeDeliveryThreshold);
  const free = Number.isFinite(threshold) && threshold > 0 && subtotal >= threshold;
  const zone = input.deliveryZone;
  if (zone !== "Inside Dhaka" && zone !== "Outside Dhaka") {
    return { ok: false, errors: ["Please select a valid delivery zone."] };
  }
  const configured = zone === "Inside Dhaka"
    ? Number.parseInt(settings.deliverySettings.insideDhakaDeliveryCharge, 10) || 80
    : Number.parseInt(settings.deliverySettings.outsideDhakaDeliveryCharge, 10) || 130;
  const deliveryCharge = free ? 0 : configured;
  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0 || !sameMoney(input.deliveryCharge ?? Number.NaN, deliveryCharge)) {
    return { ok: false, errors: ["Delivery charge changed. Refresh checkout and review your order."] };
  }
  return { ok: true, quote: { items: confirmed, totals: { totalItems, subtotal }, deliveryCharge } };
}
