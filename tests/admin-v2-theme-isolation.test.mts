import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rootLayoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const adminLayoutSource = readFileSync(new URL("../app/admin-v2/layout.tsx", import.meta.url), "utf8");
const adminShellSource = readFileSync(
  new URL("../components/admin-v2/core/AdminV2Shell.tsx", import.meta.url),
  "utf8",
);
const adminThemeProviderSource = readFileSync(
  new URL("../components/admin-v2/theme/AdminV2ThemeProvider.tsx", import.meta.url),
  "utf8",
);
const adminThemeConfigSource = readFileSync(
  new URL("../configs/admin-v2/theme.ts", import.meta.url),
  "utf8",
);

test("public root layout does not own the Admin V2 color-scheme bootstrap", () => {
  assert.doesNotMatch(rootLayoutSource, /InitColorSchemeScript/);
  assert.doesNotMatch(rootLayoutSource, /adminV2(?:ColorScheme|Mode|DefaultTheme)/);
  assert.match(rootLayoutSource, /<CartProvider>/);
  assert.match(rootLayoutSource, /<CartDrawer \/>/);
  assert.match(rootLayoutSource, /<WhatsAppWidget \/>/);
  assert.match(rootLayoutSource, /<AnalyticsScripts/);
});

test("Admin V2 route boundary retains its dedicated theme provider", () => {
  assert.match(adminLayoutSource, /<AdminV2Shell/);
  assert.match(adminShellSource, /<AdminV2ThemeProvider>/);
  assert.match(adminThemeProviderSource, /<AppRouterCacheProvider>/);
  assert.match(adminThemeProviderSource, /<AdminV2MuiThemeProvider/);
  assert.match(adminThemeProviderSource, /useColorScheme\(\)/);
});

test("Admin V2 compatibility selectors and storage keys remain wired unchanged", () => {
  for (const identifier of [
    "adminV2ColorSchemeSelector",
    "adminV2ColorSchemeStorageKey",
    "adminV2ModeStorageKey",
    "adminV2ThemeStorageKey",
  ]) {
    assert.match(adminThemeProviderSource, new RegExp(identifier));
    assert.match(adminThemeConfigSource, new RegExp(`export const ${identifier}`));
  }

  assert.match(adminThemeProviderSource, /modeStorageKey=\{adminV2ModeStorageKey\}/);
  assert.match(adminThemeProviderSource, /colorSchemeStorageKey=\{adminV2ColorSchemeStorageKey\}/);
  assert.match(adminThemeProviderSource, /colorSchemeSelector: adminV2ColorSchemeSelector/);
});
