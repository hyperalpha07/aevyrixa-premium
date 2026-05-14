import type { OrderRecord } from "@/app/lib/order-types";

type NotificationResult =
  | { status: "skipped"; reason: string }
  | { status: "sent" }
  | { status: "failed"; reason: string };

function optionalLine(label: string, value: string | undefined) {
  return value ? `${label}: ${value}` : undefined;
}

function formatDate(value: string) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildTelegramMessage(order: OrderRecord) {
  const lines = [
    "New Aevyrixa order received",
    "",
    `Order reference: ${order.orderReference || order.orderId}`,
    `Customer name: ${order.customer.fullName}`,
    `Customer phone: ${order.customer.phone}`,
    `City/Area: ${order.customer.cityArea}`,
    `Total: ${formatCurrency(order.totalAmount || order.totals.subtotal || 0)}`,
    `Payment method: ${order.paymentDetails.paymentMethod}`,
    optionalLine("Wallet provider", order.paymentDetails.walletProvider),
    optionalLine("Payment type", order.paymentDetails.paymentType),
    optionalLine("Sender number", order.paymentDetails.walletSenderNumber),
    optionalLine(
      "Transaction/reference ID",
      order.paymentDetails.transactionReference
    ),
    `Delivery address: ${order.customer.address}`,
    `Order status: ${order.status}`,
    `Created date: ${formatDate(order.createdAt)}`,
  ];

  return lines.filter(Boolean).join("\n");
}

export async function notifyNewOrder(order: OrderRecord) {
  const botToken = process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      status: "skipped",
      reason: "Telegram notification env vars are not configured.",
    } satisfies NotificationResult;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildTelegramMessage(order),
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      return {
        status: "failed",
        reason: `Telegram API returned ${response.status}.`,
      } satisfies NotificationResult;
    }

    return { status: "sent" } satisfies NotificationResult;
  } catch (error) {
    return {
      status: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "Telegram notification request failed.",
    } satisfies NotificationResult;
  }
}

export const notifyOrderReceived = notifyNewOrder;
