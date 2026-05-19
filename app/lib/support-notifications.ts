import { sendTelegramNotification } from "@/app/lib/order-notifications";
import type { SupportConversation, SupportMessage } from "@/app/lib/support-store";

type SupportNotificationEvent = "new_conversation" | "customer_message";

function optionalLine(label: string, value: string | null | undefined) {
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

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "No message text";
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

export async function notifySupportChat(
  event: SupportNotificationEvent,
  conversation: SupportConversation,
  message?: SupportMessage
) {
  const botToken =
    process.env.SUPPORT_NOTIFICATION_TELEGRAM_BOT_TOKEN ||
    process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN;
  const chatId =
    process.env.SUPPORT_NOTIFICATION_TELEGRAM_CHAT_ID ||
    process.env.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID;

  const lines = [
    event === "new_conversation"
      ? "New support chat"
      : "New unread customer support message",
    "",
    optionalLine("Source page", conversation.source_page || "homepage"),
    message ? `Latest message: ${preview(message.body)}` : undefined,
    `Conversation id: ${conversation.id}`,
    `Time: ${formatDate(message?.created_at || conversation.created_at)}`,
  ];

  return sendTelegramNotification(lines.filter(Boolean).join("\n"), {
    botToken,
    chatId,
  });
}
