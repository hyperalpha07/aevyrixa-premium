import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

test("integration facts distinguish persisted settings, manual providers, and credential presence", () => {
  const source = read("lib/admin-v2/integrations/status.ts");
  assert.match(source, /source\.storageMode === "supabase"/);
  assert.match(source, /Boolean\(process\.env\.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN\)/);
  assert.match(source, /Boolean\(process\.env\.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID\)/);
  assert.match(source, /settings\.notificationSettings\.telegramNewOrderEnabled \? "configured" : "disabled"/);
  assert.match(source, /status: "manual"/);
  assert.match(read("app/lib/order-notifications.ts"), /!settings\.settings\.notificationSettings\.telegramNewOrderEnabled/);
  assert.match(source, /This is not a full database or Storage health check/);
  assert.doesNotMatch(source, /botToken:\s*process\.env|chatId:\s*process\.env/);
});

test("on-demand Telegram check is read-only, bounded, and least-privileged", () => {
  const route = read("app/api/admin-v2/integrations/verify/route.ts");
  assert.match(route, /getFreshAdminRequestSession\(request\)/);
  assert.match(route, /hasPermission\(session, "settings\.editSensitive"\)/);
  assert.match(route, /provider"\) !== "telegram"/);
  assert.match(route, /\/getMe/);
  assert.match(route, /AbortSignal\.timeout\(6000\)/);
  assert.match(route, /"Cache-Control": "private, no-store/);
  assert.match(route, /redirect: "error"/);
  assert.doesNotMatch(route, /sendMessage|sendTelegramNotification|method: "POST"/);
  assert.doesNotMatch(route, /JSON\.stringify\(.*token/);
});

test("integration UI never equates configured credentials with successful provider operations", () => {
  const view = read("components/admin-v2/views/integrations/AdminV2IntegrationsView.tsx");
  assert.match(view, /configured: "Configured — not verified"/);
  assert.match(view, /status === "responding"\) return "success"/);
  assert.match(view, /Verify bot identity/);
  assert.match(view, /No test message, payment or courier booking is sent/);
  assert.match(view, /<FutureProviderSlots \/>/);
  const slots = read("components/admin-v2/views/integrations/FutureProviderSlots.tsx");
  const registry = read("lib/admin-v2/integrations/future-providers.ts");
  assert.match(slots, /No integration is enabled here/);
  assert.match(slots, /Awaiting API onboarding/);
  assert.match(registry, /bkash-merchant/);
  assert.match(registry, /nagad-merchant/);
  assert.match(registry, /pathao-booking/);
  assert.match(registry, /steadfast-booking/);
  assert.match(registry, /whatsapp-business/);
  assert.match(registry, /awaiting_provider_onboarding/);
  assert.doesNotMatch(slots, /fetch\(|<input|setEnabled|type="password"/);
  assert.match(view, /\/admin-v2\/integrations\/verify\?provider=telegram/);
});

test("native integrations route stays protected and classic admin remains available", () => {
  const page = read("app/admin-v2/integrations/page.tsx");
  const routing = read("configs/admin-v2/permissions.ts");
  assert.match(page, /requireAdminV2RouteAccess\(session, "integrations"\)/);
  assert.match(page, /hasPermission\(session, "settings\.editSensitive"\)/);
  assert.match(routing, /integrations: \{ section: "integrations" \}/);
  assert.match(read("components/admin-v2/views/integrations/AdminV2IntegrationsView.tsx"), /href="\/admin\/integrations"/);
});
