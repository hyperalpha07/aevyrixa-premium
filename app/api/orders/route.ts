import {
  forbiddenAdminResponse,
  verifyFreshAdminRequestPermission,
} from "@/app/lib/admin-auth";
import { notifyNewOrder } from "@/app/lib/order-notifications";
import { getCustomerFromRequest } from "@/app/api/account/_utils";
import { normalizeCustomerPhone } from "@/app/lib/customer-account-store";
import { createOrder, OrderStoreError, queryOrders, recordOrderEvent } from "@/app/lib/order-store";
import { parseAdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";
import { getStoreSettings } from "@/app/lib/settings-store";
import { getProductBySlug } from "@/app/lib/product-store";
import { isPurchasableStock } from "@/app/lib/product-display";
import { validateProductSelections } from "@/app/lib/product-options";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import {
  paymentMethods,
  paymentTypes,
  type OrderCartItem,
  type OrderSubmissionInput,
} from "@/app/lib/order-types";
import { walletProviders } from "@/app/lib/admin-settings";

export const dynamic = "force-dynamic";

const bdMobilePattern = /^01[3-9]\d{8}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const next = text(value);
  return next || undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function validateOrderPayload(payload: unknown): {
  input?: OrderSubmissionInput;
  errors: string[];
} {
  if (!isRecord(payload)) return { errors: ["Invalid order payload."] };

  const customer = isRecord(payload.customer) ? payload.customer : {};
  const paymentDetails = isRecord(payload.paymentDetails)
    ? payload.paymentDetails
    : {};
  const totals = isRecord(payload.totals) ? payload.totals : {};
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const errors: string[] = [];

  const orderReference = optionalText(payload.orderReference);
  const fullName = text(customer.fullName);
  const phone = text(customer.phone);
  const cityArea = text(customer.cityArea);
  const address = text(customer.address);
  const paymentMethod = text(paymentDetails.paymentMethod);
  const walletProvider = optionalText(paymentDetails.walletProvider);
  const paymentType = optionalText(paymentDetails.paymentType);
  const walletSenderNumber = optionalText(paymentDetails.walletSenderNumber);
  const transactionReference = optionalText(paymentDetails.transactionReference);
  const deliveryCharge = optionalNumber(payload.deliveryCharge);

  if (!fullName) errors.push("Full name is required.");
  if (!phone || !bdMobilePattern.test(phone)) {
    errors.push("A valid Bangladesh customer phone number is required.");
  }
  if (!cityArea) errors.push("City or area is required.");
  if (!address) errors.push("Full delivery address is required.");
  if (!paymentMethods.includes(paymentMethod as never)) {
    errors.push("Valid payment method is required.");
  }
  if (rawItems.length === 0) errors.push("Order must include at least one item.");

  if (paymentMethod === "Mobile Wallet Payment") {
    if (!walletProvider || !walletProviders.includes(walletProvider as never)) {
      errors.push("Valid wallet provider is required.");
    }
    if (!paymentType || !paymentTypes.includes(paymentType as never)) {
      errors.push("Valid payment type is required.");
    }
    if (paymentType === "Send Money") {
      if (!walletSenderNumber || !bdMobilePattern.test(walletSenderNumber)) {
        errors.push("A valid wallet sender number is required.");
      }
      if (!transactionReference) {
        errors.push("Transaction ID / reference is required.");
      }
    }
  }

  const items: OrderCartItem[] = rawItems
    .filter(isRecord)
    .map((item) => ({
      id: text(item.id),
      productId: optionalText(item.productId),
      sku: optionalText(item.sku),
      slug: text(item.slug),
      name: text(item.name),
      price: numberValue(item.price),
      image: normalizeAdminV2ImageSrc(text(item.image)),
      visualTheme: optionalText(item.visualTheme) as OrderCartItem["visualTheme"],
      visualVariant: optionalText(item.visualVariant),
      stockStatus: optionalText(item.stockStatus) as OrderCartItem["stockStatus"],
      size: optionalText(item.size),
      color: optionalText(item.color),
      absorbency: optionalText(item.absorbency),
      variant: optionalText(item.variant),
      quantity: numberValue(item.quantity),
      lineTotal: optionalNumber(item.lineTotal),
    }))
    .filter((item) => item.id && item.name && item.quantity > 0);

  if (items.length === 0) errors.push("Order items are invalid.");

  const totalItems = numberValue(totals.totalItems);
  const subtotal = numberValue(totals.subtotal);
  if (totalItems <= 0 || subtotal <= 0) {
    errors.push("Order total is invalid.");
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    input: {
      customer: {
        fullName,
        phone,
        email: optionalText(customer.email),
        cityArea,
        address,
        sizeFitNote: optionalText(customer.sizeFitNote),
        deliveryNote: optionalText(customer.deliveryNote),
      },
      orderReference,
      paymentDetails: {
        paymentMethod: paymentMethod as OrderSubmissionInput["paymentDetails"]["paymentMethod"],
        walletProvider: walletProvider as OrderSubmissionInput["paymentDetails"]["walletProvider"],
        paymentType: paymentType as OrderSubmissionInput["paymentDetails"]["paymentType"],
        receiverNumber: optionalText(paymentDetails.receiverNumber),
        walletSenderNumber,
        transactionReference,
      },
      items,
      totals: {
        totalItems,
        subtotal,
      },
      deliveryCharge,
      deliveryArea: optionalText(payload.deliveryArea) || cityArea,
      deliveryZone: optionalText(payload.deliveryZone),
      deliveryNote: optionalText(payload.deliveryNote),
      paymentReference: transactionReference,
      paymentStatus: "pending",
    },
  };
}

async function unavailableOrderItems(items: OrderCartItem[]) {
  const unavailable: string[] = [];

  for (const item of items) {
    if (!item.slug) continue;

    const { product } = await getProductBySlug(item.slug);
    if (!product) {
      unavailable.push(`${item.name} is no longer available.`);
      continue;
    }

    if (!isPurchasableStock(product.stockStatus)) {
      unavailable.push(`${item.name} is currently out of stock.`);
    }
    const optionErrors = validateProductSelections(product, item);
    unavailable.push(...optionErrors.map((error) => `${item.name}: ${error}`));
  }

  return unavailable;
}

export async function GET(request: Request) {
  if (!(await verifyFreshAdminRequestPermission(request, "orders.view"))) {
    return forbiddenAdminResponse();
  }

  try {
    const result = await queryOrders(parseAdminV2OrderQuery(new URL(request.url).searchParams));
    return Response.json(result);
  } catch (error) {
    if (error instanceof OrderStoreError) {
      console.error("[api:orders] failed to list orders", {
        operation: error.operation,
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.error("[api:orders] failed to list orders", {
        operation: "order query",
        code: "ORDER_BACKEND_UNKNOWN",
        message: error instanceof Error ? error.message : "Unknown order backend error.",
      });
    }

    return Response.json(
      {
        error: "Unable to load backend orders.",
        code: error instanceof OrderStoreError ? error.code : "ORDER_BACKEND_UNKNOWN",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const { input, errors } = validateOrderPayload(payload);
  if (!input) return Response.json({ errors }, { status: 400 });

  try {
    const itemAvailabilityErrors = await unavailableOrderItems(input.items);
    if (itemAvailabilityErrors.length > 0) {
      return Response.json({ errors: itemAvailabilityErrors }, { status: 409 });
    }

    const customer = await getCustomerFromRequest(request).catch(() => null);
    const settings = await getStoreSettings().catch(() => null);
    const requiresCustomerAccount =
      settings?.settings.checkoutSettings.requireCustomerAccountForCheckout ?? true;

    if (requiresCustomerAccount && !customer) {
      return Response.json(
        { errors: ["Please log in to your account before submitting checkout."] },
        { status: 401 }
      );
    }

    if (
      requiresCustomerAccount &&
      customer &&
      normalizeCustomerPhone(customer.phone) !== normalizeCustomerPhone(input.customer.phone)
    ) {
      return Response.json(
        { errors: ["Checkout phone must match the logged in customer account."] },
        { status: 403 }
      );
    }

    const orderInput =
      customer &&
      normalizeCustomerPhone(customer.phone) === normalizeCustomerPhone(input.customer.phone)
        ? { ...input, customerId: customer.id }
        : input;

    const result = await createOrder(orderInput);

    await recordOrderEvent({
      orderRef: result.order.orderReference,
      eventType: "order_created",
      toStatus: result.order.status,
      actor: null,
      metadata: { source: "checkout" },
    }).catch(() => null);

    try {
      const notificationResult = await notifyNewOrder(result.order);
      if (notificationResult.status === "failed") {
        console.error("Order notification failed:", notificationResult.reason);
      }
    } catch (notificationError) {
      console.error("Order notification failed:", notificationError);
    }

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to save order:", error);
    return Response.json(
      { errors: ["Order could not be saved. Please try again."] },
      { status: 500 }
    );
  }
}
