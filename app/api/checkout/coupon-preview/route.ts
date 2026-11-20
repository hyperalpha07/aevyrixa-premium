import { getStoreSettings } from "@/app/lib/settings-store";
import { listProducts } from "@/app/lib/product-store";
import { isPublicCatalogProduct } from "@/app/lib/product-types";
import type { OrderCartItem, OrderSubmissionInput } from "@/app/lib/order-types";
import { quoteCheckoutOrder } from "@/lib/checkout/trusted-quote";
import { previewDiscountCoupon } from "@/lib/admin-v2/discounts-store";

export const dynamic = "force-dynamic";

type RequestedItem = Record<string, unknown>;
const string = (value: unknown) => typeof value === "string" ? value : undefined;
const deliveryZones = new Set(["Inside Dhaka", "Outside Dhaka"]);

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 100_000) {
    return Response.json({ errors: ["Cart request is too large."] }, { status: 413 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || typeof body.code !== "string" ||
      !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50 ||
      !deliveryZones.has(String(body.deliveryZone))) {
    return Response.json({ errors: ["Select a delivery zone, enter a code and review your cart."] }, { status: 400 });
  }
  const inputCode = body.code.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(inputCode)) {
    return Response.json({ errors: ["Enter a valid discount code."] }, { status: 400 });
  }

  const [catalog, settingResult] = await Promise.all([
    listProducts({ scope: "public" }).catch(() => null),
    getStoreSettings().catch(() => null),
  ]);
  if (!catalog || catalog.storageMode !== "supabase" || !settingResult || settingResult.storageMode !== "supabase") {
    return Response.json({ errors: ["Live catalog or checkout settings are unavailable."] }, { status: 503 });
  }
  const productsBySlug = new Map(catalog.products.filter(isPublicCatalogProduct).map((p) => [p.slug, p]));
  const items: OrderCartItem[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return Response.json({ errors: ["Cart items are invalid."] }, { status: 400 });
    }
    const item = raw as RequestedItem;
    const product = productsBySlug.get(string(item.slug) ?? "");
    const quantity = item.quantity;
    if (!product || (item.productId && item.productId !== product.id) ||
        typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 50) {
      return Response.json({ errors: ["A cart item changed. Refresh your cart."] }, { status: 409 });
    }
    items.push({
      id: product.id, productId: product.id, slug: product.slug, name: product.name,
      quantity, price: product.price, lineTotal: Math.round(product.price * quantity * 100) / 100,
      ...(string(item.size) ? { size: string(item.size) } : {}),
      ...(string(item.color) ? { color: string(item.color) } : {}),
      ...(string(item.absorbency) ? { absorbency: string(item.absorbency) } : {}),
      ...(string(item.variant) ? { variant: string(item.variant) } : {}),
    });
  }
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const threshold = Number(settingResult.settings.checkoutSettings.freeDeliveryThreshold);
  const deliveryCharge = Number.isFinite(threshold) && threshold > 0 && subtotal >= threshold
    ? 0 : body.deliveryZone === "Inside Dhaka"
      ? Number.parseInt(settingResult.settings.deliverySettings.insideDhakaDeliveryCharge, 10) || 80
      : Number.parseInt(settingResult.settings.deliverySettings.outsideDhakaDeliveryCharge, 10) || 130;
  const requestQuote: OrderSubmissionInput = {
    customer: { fullName: "", phone: "", cityArea: "", address: "" },
    paymentDetails: {
      paymentMethod: String(body.paymentMethod) as OrderSubmissionInput["paymentDetails"]["paymentMethod"],
      paymentType: string(body.paymentType) as OrderSubmissionInput["paymentDetails"]["paymentType"],
      walletProvider: string(body.walletProvider) as OrderSubmissionInput["paymentDetails"]["walletProvider"],
    },
    items, totals: { totalItems: items.reduce((sum, item) => sum + item.quantity, 0), subtotal },
    deliveryCharge, deliveryZone: String(body.deliveryZone),
  };
  const trustedQuote = quoteCheckoutOrder(requestQuote, catalog.products, settingResult.settings);
  if (!trustedQuote.ok) return Response.json({ errors: trustedQuote.errors }, { status: 409 });

  try {
    const preview = await previewDiscountCoupon(inputCode, trustedQuote.quote.totals.subtotal);
    const totalPayable = Math.round((
      trustedQuote.quote.totals.subtotal - preview.discountAmount + trustedQuote.quote.deliveryCharge
    ) * 100) / 100;
    return Response.json({
      code: preview.code,
      subtotal: trustedQuote.quote.totals.subtotal,
      deliveryCharge: trustedQuote.quote.deliveryCharge,
      discountAmount: preview.discountAmount,
      totalPayable,
      disclaimer: "Estimated total. Discount availability is rechecked when placing the order.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discount validation is unavailable.";
    return Response.json({ errors: [message] }, { status: message.includes("unavailable.") && message.includes("temporarily") ? 503 : 422 });
  }
}
