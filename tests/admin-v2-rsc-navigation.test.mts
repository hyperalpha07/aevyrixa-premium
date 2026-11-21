import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

// Next.js 16 does not permit passing the next/link function directly to
// client MUI component props from an RSC. Use the existing client V2Button.
function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return file.endsWith(".tsx") ? [file] : [];
  });
}

test("Admin V2 server components never pass Next Link to client MUI component props", () => {
  const offenders: string[] = [];
  for (const file of [...walk("app/admin-v2"), ...walk("components/admin-v2")]) {
    const source = readFileSync(file, "utf8");
    if (/^\s*["']use client["'];?/.test(source)) continue;
    const linkName = source.match(/import\s+(\w+)\s+from\s+["']next\/link["']/)?.[1];
    if (!linkName) continue;
    const forbidden = new RegExp(`component\\s*=\\s*\\{\\s*${linkName}\\s*\\}`, "g");
    if (forbidden.test(source)) offenders.push(relative(".", file));
  }
  assert.deepEqual(offenders, [], `Use V2Button or a client-side Link wrapper instead:\n${offenders.join("\n")}`);
});

test("the formerly broken Admin V2 routes use the client navigation wrapper", () => {
  const sources = [
    "components/admin-v2/views/discounts/AdminV2DiscountsView.tsx",
    "components/admin-v2/views/calendar/AdminV2CalendarView.tsx",
    "app/admin-v2/notifications/page.tsx",
  ];
  for (const path of sources) {
    const content = readFileSync(path, "utf8");
    assert.match(content, /V2Button/);
    assert.doesNotMatch(content, /component=\{Link\}/);
  }
});

test("Chat is an independently authorized workspace, not a Support redirect", () => {
  const chat = readFileSync("app/admin-v2/chat/page.tsx", "utf8");
  const support = readFileSync("app/admin-v2/support/page.tsx", "utf8");
  const shell = readFileSync("components/admin-v2/core/AdminV2Shell.tsx", "utf8");
  const view = readFileSync("components/admin-v2/views/support/AdminV2SupportView.tsx", "utf8");
  assert.match(chat, /requireAdminV2RouteAccess\\(session, "chat"\\)/);
  assert.match(chat, /workspace="chat"/);
  assert.match(chat, /hasPermission\\(session, "support.reply"\\)/);
  assert.doesNotMatch(chat, /redirect\\(/);
  assert.match(support, /requireAdminV2RouteAccess\\(session, "support"\\)/);
  assert.match(view, /workspace === "chat"/);
  assert.match(view, /Manage support case/);
  assert.match(view, /Open Live Chat/);
  assert.match(shell, /pathname === "\/admin-v2\/chat"/);
});
