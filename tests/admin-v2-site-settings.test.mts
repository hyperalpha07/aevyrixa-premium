import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Admin V2 native site controls use the persisted, guarded settings endpoint", () => {
  const page = read("app/admin-v2/settings/page.tsx");
  const view = read("components/admin-v2/views/settings/AdminV2ExtendedSettingsView.tsx");
  const settingsApi = read("app/api/settings/route.ts");
  for (const group of [
    "storeProfile", "checkoutSettings", "policySettings",
    "seoSettings", "notificationSettings", "appearanceSettings",
  ]) {
    assert.ok(page.includes(group), "Missing page settings group " + group);
    assert.ok(view.includes('group:"' + group + '"'), "Missing native UI group " + group);
  }
  assert.match(page, /requireAdminV2RouteAccess\(session, "settings"\)/);
  assert.match(page, /settings\.editSeoAnalytics/);
  assert.match(page, /announcement\.manage/);
  assert.match(view, /credentials:"same-origin"/);
  assert.match(view, /method:"PATCH"/);
  assert.match(view, /latest\.storageMode!=="supabase"/);
  assert.match(view, /saved\?\.storageMode!=="supabase"/);
  assert.match(view, /another session/);
  assert.match(view, /disabled=\{!editable/);
  assert.match(settingsApi, /requiredSettingsPermissions/);
  assert.match(settingsApi, /await logStaffActivity/);
  assert.doesNotMatch(view, /SUPABASE_SERVICE_ROLE_KEY|process\.env/);
});

test("Admin V2 configuration controls preserve appearance and protect providers", () => {
  const view = read("components/admin-v2/views/settings/AdminV2ExtendedSettingsView.tsx");
  assert.match(view, /The Admin V2 font, background and theme are untouched/);
  assert.match(view, /Saving switches and templates does not verify Telegram connectivity/);
  assert.doesNotMatch(view, /bkashReceiverNumber|bankAccountNumber|service_role|apiKey/);
});
