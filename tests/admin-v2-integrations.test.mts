import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

test("integration facts distinguish persisted settings, manual providers, and credential presence", () => {
  const source = read("lib/admin-v2/integrations/status.ts");
  assert.match(source, /source\.storageMode === "supabase"/);
  assert.match(source, /Boolean\(process\.env\.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN\)/);
  assert.match(source, /Boolean\(process\.env\.ORDER_NOTIFICATION_TELEGRAM_CHAT_ID\)/);
  assert.match(source, /status: tgToken && tgChat \? "configured" : "not_configured"/);
  assert.match(source, /status: "manual"/);
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
  assert.match(view, /provider accounts, credentials and isolated integration tests/);
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
