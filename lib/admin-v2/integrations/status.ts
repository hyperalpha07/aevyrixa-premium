import "server-only";
import { getStoreSettings } from "@/app/lib/settings-store";

export type IntegrationStatus = "responding" | "configured" | "manual" | "disabled" | "not_configured" | "unavailable";
export type IntegrationFact = {
  id: string;
  group: "Backend" | "Messaging" | "Payments" | "Delivery" | "Analytics";
  name: string;
  status: IntegrationStatus;
  detail: string;
  actionHref: string;
  actionLabel: string;
  canCheckIdentity?: boolean;
};

/**
 * Only report facts observable from a single persisted settings read and server-side
 * env *presence*. A configured key does not establish delivery, settlement, or API health.
 * No credential values, phone numbers or account identifiers are returned to the client.
 */
export async function collectIntegrationFacts(): Promise<IntegrationFact[]> {
  const source = await getStoreSettings();
  const persisted = source.storageMode === "supabase";
  const settings = source.settings;
  const tgToken = Boolean(process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN);
  const tgChat = Boolean(process.env.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID);
  const fromSettings = (enabled: boolean): IntegrationStatus =>
    !persisted ? "unavailable" : enabled ? "manual" : "disabled";
  const wallet = (
    id: string,
    name: string,
    enabled: boolean
  ): IntegrationFact => ({
    id, group: "Payments", name, status: fromSettings(enabled),
    detail: !persisted
      ? "Cannot confirm persisted wallet settings."
      : enabled
        ? "Manual wallet payment instructions enabled. This is not a merchant gateway, automatic reconciliation, or settlement connection."
        : "Manual wallet payment is disabled. No merchant gateway is connected.",
    actionHref: "/admin/settings",
    actionLabel: "Payment settings",
  });

  return [
    {
      id: "supabase", group: "Backend", name: "Supabase settings backend",
      status: persisted ? "responding" : "unavailable",
      detail: persisted
        ? "Store settings were read from the persisted backend. This is not a full database or Storage health check."
        : "Persisted store settings were not available. Fallback settings do not prove database connectivity.",
      actionHref: "/admin-v2/system-health", actionLabel: "System health",
    },
    {
      id: "telegram", group: "Messaging", name: "Telegram order alerts",
      status: !tgToken || !tgChat ? "not_configured"
        : !persisted ? "unavailable"
        : settings.notificationSettings.telegramNewOrderEnabled ? "configured" : "disabled",
      detail: !tgToken || !tgChat
        ? "Bot token and/or destination chat are missing. No notifications can be assumed to be delivered."
        : !persisted
          ? "Credentials exist but the persisted notification toggle could not be read. New-order notifications are blocked until settings return."
          : settings.notificationSettings.telegramNewOrderEnabled
            ? "New-order alerts are enabled, and bot/chat credentials are configured. Delivery and chat permissions are unverified; identity can be checked without sending."
            : "New-order alerts are disabled in persisted settings; the order notifier respects this toggle.",
      actionHref: "/admin/settings", actionLabel: "Notification settings",
      canCheckIdentity: tgToken,
    },
    {
      id: "whatsapp", group: "Messaging", name: "WhatsApp support contact",
      status: !persisted ? "unavailable" : settings.storeProfile.supportWhatsApp.trim() ? "configured" : "not_configured",
      detail: !persisted
        ? "Persisted contact settings are unavailable."
        : settings.storeProfile.supportWhatsApp.trim()
          ? "A WhatsApp contact number is configured, not a WhatsApp Business API account or messaging automation."
          : "No WhatsApp contact is configured; there is no Business API connection.",
      actionHref: "/admin/settings", actionLabel: "Support settings",
    },
    wallet("bkash", "bKash manual payments", settings.paymentSettings.bkashEnabled),
    wallet("nagad", "Nagad manual payments", settings.paymentSettings.nagadEnabled),
    wallet("rocket", "Rocket manual payments", settings.paymentSettings.rocketEnabled),
    wallet("upay", "Upay manual payments", settings.paymentSettings.upayEnabled),
    {
      id: "pathao", group: "Delivery", name: "Pathao",
      status: "manual",
      detail: "Courier assignment and tracking are manually recorded. Automatic booking and carrier API status are not implemented.",
      actionHref: "/admin-v2/couriers", actionLabel: "Courier operations",
    },
    {
      id: "steadfast", group: "Delivery", name: "Steadfast",
      status: "manual",
      detail: "Courier assignment and tracking are manually recorded. Automatic booking and carrier API status are not implemented.",
      actionHref: "/admin-v2/couriers", actionLabel: "Courier operations",
    },
    {
      id: "google-analytics", group: "Analytics", name: "Google Analytics",
      status: !persisted ? "unavailable" : settings.seoSettings.googleAnalyticsId.trim() ? "configured" : "not_configured",
      detail: !persisted ? "Persisted analytics settings are unavailable."
        : "This checks only whether a tracking ID is configured, not tag load, consent, incoming events, or provider access.",
      actionHref: "/admin/settings", actionLabel: "SEO & analytics settings",
    },
    {
      id: "meta-pixel", group: "Analytics", name: "Meta Pixel",
      status: !persisted ? "unavailable" : settings.seoSettings.facebookPixelId.trim() ? "configured" : "not_configured",
      detail: !persisted ? "Persisted analytics settings are unavailable."
        : "This checks only whether a pixel ID is configured, not event delivery, consent, or attribution.",
      actionHref: "/admin/settings", actionLabel: "SEO & analytics settings",
    },
  ];
}
