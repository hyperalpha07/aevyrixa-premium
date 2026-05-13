import { notifyNewOrder } from "@/app/lib/order-notifications";
import { createOrder, listOrders } from "@/app/lib/order-store";
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
      slug: text(item.slug),
      name: text(item.name),
      price: numberValue(item.price),
      image: text(item.image),
      size: optionalText(item.size),
      color: optionalText(item.color),
      absorbency: optionalText(item.absorbency),
      quantity: numberValue(item.quantity),
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
    },
  };
}

export async function GET() {
  try {
    const result = await listOrders();
    return Response.json(result);
  } catch (error) {
    console.error("Failed to list orders:", error);
    return Response.json(
      { orders: [], error: "Unable to load backend orders." },
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
    const result = await createOrder(input);
    await notifyNewOrder(result.order);

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to save order:", error);
    return Response.json(
      { errors: ["Order could not be saved. Please try again."] },
      { status: 500 }
    );
  }
}
