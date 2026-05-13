import type { OrderRecord } from "@/app/lib/order-types";

export async function notifyNewOrder(order: OrderRecord) {
  const botToken = process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { skipped: true, reason: "Notification env vars are not configured." };
  }

  // Telegram/email delivery will be wired here after notification credentials
  // are added in Vercel Environment Variables. Keep this non-blocking so order
  // capture does not fail when optional notification delivery is unavailable.
  void order;
  return { skipped: true, reason: "Notification adapter is not connected yet." };
}

export const notifyOrderReceived = notifyNewOrder;
