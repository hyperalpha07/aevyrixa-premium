import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { buildSupportInbox, canReplyToSupport, orderSupportMessages, parseSupportFilter, querySupportInbox, supportHref } from "../lib/admin-v2/support/support-query.ts";
import { supportMetrics } from "../lib/admin-v2/support/support-metrics.ts";
import { hasPermission, normalizePermissions, type AdminPermissionKey, type AdminSessionUser } from "../app/lib/admin-permissions.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const conversation = { id: "one", public_token: "private-token", status: "open" as const, source_page: "/product/example", created_at: "2026-01-01T00:00:00Z", updated_at: null };
const messages = [
  { id: "b", conversation_id: "one", body: "Latest preview", sender_type: "customer" as const, created_at: "2026-01-02T00:00:00Z", is_read: false },
  { id: "a", conversation_id: "one", body: "Admin first", sender_type: "admin" as const, created_at: "2026-01-01T00:00:00Z", is_read: false },
];

test("Support implemented; Chat and unrelated coming-soon flags stay false; server page guards access", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /module: "support"[^\n]+implemented: true/);
  for (const name of ["chat", "email", "notifications"]) assert.match(routes, new RegExp(`module: "${name}"[^\\n]+implemented: false`));
  const page = read("app/admin-v2/support/page.tsx");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "support"\)/);
  assert.match(page, /hasPermission\(session, "support.reply"\)/);
  assert.match(page, /hasPermission\(session, "support.close"\)/);
  assert.doesNotMatch(page, /use client/);
});

test("real previews, counts, status/search/unread filters and oldest-first message ordering", () => {
  const inbox = buildSupportInbox([conversation, { ...conversation, id: "two", status: "pending" }, { ...conversation, id: "three", status: "closed" }], messages);
  assert.equal(inbox[0].last_message?.body, "Latest preview");
  assert.equal(inbox[0].message_count, 2);
  assert.equal(inbox[0].unread_customer_count, 1);
  assert.ok(!("public_token" in inbox[0]));
  assert.deepEqual(supportMetrics(inbox), { open: 1, pending: 1, closed: 1, unread: 1 });
  for (const field of ["one", "/product", "latest PREVIEW"]) assert.ok(querySupportInbox(inbox, field, "all").some(x => x.id === "one"));
  for (const status of ["open", "pending", "closed"] as const) assert.equal(querySupportInbox(inbox, "", status).length, 1);
  assert.deepEqual(querySupportInbox(inbox, "", "unread").map(x => x.id), ["one"]);
  assert.equal(querySupportInbox(inbox, "not found", "all").length, 0);
  assert.equal(parseSupportFilter("invalid"), "all");
  assert.deepEqual(orderSupportMessages(messages).map(x => x.id), ["a", "b"]);
  assert.equal(messages[0].id, "b");
});

test("URL selection, search, status round-trip; closed and read-only reply guards", () => {
  const url = new URL(supportHref("hello & world", "pending", "id/one"), "http://localhost");
  assert.equal(url.searchParams.get("q"), "hello & world");
  assert.equal(url.searchParams.get("status"), "pending");
  assert.equal(url.searchParams.get("conversation"), "id/one");
  assert.equal(canReplyToSupport(true, "open"), true);
  assert.equal(canReplyToSupport(true, "pending"), true);
  assert.equal(canReplyToSupport(true, "closed"), false);
  assert.equal(canReplyToSupport(false, "open"), false);
});

function loadModule(path: string, dependencies: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  const exports: Record<string, any> = {};
  const output = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "exports", ...Object.keys(overrides), output)((name: string) => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`); return dependencies[name];
  }, exports, ...Object.values(overrides));
  return exports;
}

function harness(allowed: AdminPermissionKey[] = ["support.view", "support.reply", "support.close"]) {
  let status: "open" | "pending" | "closed" = "open";
  let exists = true;
  const history = messages.map(m => ({ ...m })) as Array<{id:string; conversation_id:string; body:string; sender_type:"admin"|"customer";created_at:string;is_read:boolean}>;
  const calls: string[] = [];
  const store = {
    getAdminSupportInbox: async () => { calls.push("list"); return buildSupportInbox([{ ...conversation, status }], history); },
    getConversationById: async () => { calls.push("get"); return exists ? { ...conversation, status } : null; },
    getConversationByToken: async (_id: string, token: string) => token === conversation.public_token ? { ...conversation, status } : null,
    getAdminSupportMessages: async () => orderSupportMessages(history),
    getMessagesByConversation: async () => orderSupportMessages(history),
    markCustomerMessagesRead: async () => { await Promise.resolve(); calls.push("mark"); history.filter(m => m.sender_type === "customer").forEach(m => { m.is_read = true; }); },
    updateConversationStatus: async (_id: string, next: typeof status) => { calls.push("status"); status = next; },
    addMessage: async (_id: string, body: string, sender_type: "admin") => { const message = { id: "reply", conversation_id: "one", body, sender_type, created_at: "2026-01-03T00:00:00Z", is_read: false }; history.push(message); calls.push("reply"); return message; },
  };
  const dependencies = {
    "@/app/lib/support-store": store,
    "@/app/lib/admin-auth": {
      verifyFreshAdminRequestPermission: async (_request: Request, key: AdminPermissionKey) => allowed.includes(key) ? { role: "test" } : null,
      forbiddenAdminResponse: () => Response.json({}, { status: 403 }),
    },
    "@/app/lib/admin-staff": { logStaffActivity: async () => { calls.push("audit"); } },
  };
  const list = loadModule("app/api/admin/support/conversations/route.ts", dependencies);
  const detail = loadModule("app/api/admin/support/conversations/[id]/route.ts", dependencies);
  const reply = loadModule("app/api/admin/support/conversations/[id]/reply/route.ts", dependencies);
  const publicDetail = loadModule("app/api/support/conversations/[id]/route.ts", dependencies);
  const context = { params: Promise.resolve({ id: "one" }) };
  const request = (method = "GET", body?: unknown, suffix = "") => new Request(`http://localhost/api/admin/support/conversations/one${suffix}`, { method, ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {}) });
  return { store, calls, history, setMissing: () => { exists = false; },
    list: () => list.GET(request()), get: (mark = false) => detail.GET(request("GET", undefined, mark ? "?markRead=1" : ""), context),
    reply: (body: string) => reply.POST(request("POST", { body }), context),
    status: (status: string) => detail.PATCH(request("PATCH", { status }), context),
    customer: () => publicDetail.GET(request("GET", undefined, `?token=${conversation.public_token}`), context),
  };
}

test("support.view is required for list/history and viewer cannot reply or change status", async () => {
  const denied = harness([]);
  assert.equal((await denied.list()).status, 403);
  assert.equal((await denied.get(true)).status, 403);
  assert.deepEqual(denied.calls, []);
  const viewer: AdminSessionUser = { userType: "staff", username: "viewer", displayName: "Viewer", role: "viewer", permissions: normalizePermissions("viewer", {}) };
  assert.ok(hasPermission(viewer, "support.view"));
  assert.ok(!hasPermission(viewer, "support.reply"));
  assert.ok(!hasPermission(viewer, "support.close"));
  const readOnly = harness(["support.view"]);
  assert.equal((await readOnly.get()).status, 200);
  assert.equal((await readOnly.reply("Denied")).status, 403);
  assert.equal((await readOnly.status("closed")).status, 403);
  assert.ok(!readOnly.calls.includes("reply"));
  assert.ok(!readOnly.calls.includes("status"));
});

test("markRead is opt-in, awaited, and real unread customer counts refresh", async () => {
  const h = harness();
  await h.get(); assert.ok(!h.calls.includes("mark"));
  assert.equal((await (await h.list()).json()).conversations[0].unread_customer_count, 1);
  assert.equal((await h.get(true)).status, 200);
  assert.ok(h.calls.includes("mark"));
  assert.equal((await (await h.list()).json()).conversations[0].unread_customer_count, 0);
  assert.equal(h.history.find(m => m.sender_type === "admin")?.is_read, false);
});

test("real reply/status handlers: reply visible through public backend, closed guard, reopen, limits", async () => {
  const h = harness();
  assert.equal((await h.reply("  Helpful reply  ")).status, 200);
  assert.equal((await (await h.customer()).json()).messages.at(-1).body, "Helpful reply");
  assert.equal((await h.reply(" ")).status, 400);
  assert.equal((await h.reply("x".repeat(4001))).status, 400);
  assert.equal((await h.status("invalid")).status, 400);
  assert.equal((await h.status("closed")).status, 200);
  assert.equal((await h.reply("Must not send")).status, 409);
  assert.equal(h.calls.filter(c => c === "reply").length, 1);
  assert.equal((await h.status("pending")).status, 200);
  assert.equal((await h.reply("Reopened reply")).status, 200);
  assert.equal((await h.status("open")).status, 200);
  h.setMissing();
  assert.equal((await h.status("closed")).status, 404);
  assert.equal((await h.reply("Missing")).status, 404);
});

test("reply and close permissions remain independent", async () => {
  const replyOnly = harness(["support.reply"]);
  assert.equal((await replyOnly.reply("Allowed")).status, 200);
  assert.equal((await replyOnly.status("closed")).status, 403);
  const closeOnly = harness(["support.close"]);
  assert.equal((await closeOnly.reply("Denied")).status, 403);
  assert.equal((await closeOnly.status("closed")).status, 200);
});

test("batched inbox reads page through row caps without per-conversation queries or token exposure", async () => {
  const urls: string[] = [];
  const store = loadModule("app/lib/support-store.ts", { "@/lib/admin-v2/support/support-query": { buildSupportInbox } }, {
    process: { env: { SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test" } },
    fetch: async (input: string) => {
      urls.push(input); const url = new URL(input); const offset = Number(url.searchParams.get("offset"));
      const rows = url.pathname.endsWith("support_conversations") ? [conversation] : messages;
      // Simulate a backend cap smaller than the requested 500 rows.
      return Response.json(rows.slice(offset, offset + 1));
    },
  });
  const result = await store.getAdminSupportInbox();
  assert.equal(result[0].message_count, 2);
  assert.equal(result[0].unread_customer_count, 1);
  assert.ok(!JSON.stringify(result).includes("private-token"));
  assert.ok(urls.every(url => !url.includes("conversation_id=eq.")));
  assert.equal(urls.length, 5);
});

test("workspace uses shared search, URL state, closed composer guard, manual refresh, safe RSC props", () => {
  const view = read("components/admin-v2/views/support/AdminV2SupportView.tsx");
  assert.match(view, /V2SearchField/);
  assert.match(view, /params.get\("conversation"\)/);
  assert.match(view, /markRead=1/);
  assert.match(view, /controller.abort\(\)/);
  assert.match(view, /Refresh/);
  assert.doesNotMatch(view, /setInterval/);
  assert.match(read("components/admin-v2/views/support/AdminV2SupportConversation.tsx"), /canReplyToSupport\(canReply, conversation.status\)/);
  assert.match(read("components/admin-v2/views/support/AdminV2SupportComposer.tsx"), /maxLength: 4000/);
  for (const file of ["app/admin-v2/support/page.tsx", ...["View", "Inbox", "Conversation", "Composer"].map(name => `components/admin-v2/views/support/AdminV2Support${name}.tsx`)]) {
    assert.doesNotMatch(read(file), /divider=\{<Divider|component=\{Link\}/);
  }
});

test("composer keyboard behavior sends Enter, preserves Shift+Enter and protects duplicates", () => {
  const composer = read("components/admin-v2/views/support/AdminV2SupportComposer.tsx");
  assert.match(composer, /event\.key === "Enter"/);
  assert.match(composer, /!event\.shiftKey/);
  assert.match(composer, /!event\.nativeEvent\.isComposing/);
  assert.match(composer, /event\.preventDefault\(\)/);
  assert.match(composer, /requestSubmit\(\)/);
  assert.match(composer, /submitting\.current/);
  assert.match(composer, /busy \|\| submitting\.current \|\| !value/);
  assert.match(composer, /type="submit"/);
  assert.match(composer, /if \(await onReply\(value\)\) setBody\(""\)/);
  assert.match(composer, /maxLength: 4000/);
});

test("support console layout uses connected workspace, flexible history and compact feedback", () => {
  const view = read("components/admin-v2/views/support/AdminV2SupportView.tsx");
  const conversation = read("components/admin-v2/views/support/AdminV2SupportConversation.tsx");
  const inbox = read("components/admin-v2/views/support/AdminV2SupportInbox.tsx");
  assert.match(view, /gridTemplateColumns: "minmax\(320px, 370px\) minmax\(0, 1fr\)"/);
  assert.match(view, /minHeight: "clamp\(620px, calc\(100vh - 310px\), 780px\)"/);
  assert.doesNotMatch(conversation, /height:\s*340/);
  assert.match(conversation, /flex: 1/);
  assert.match(conversation, /dateLabel/);
  assert.match(conversation, /maxWidth: "68%"/);
  assert.match(view, /role="status"/);
  assert.match(inbox, /borderLeft: "3px solid"/);
  assert.match(inbox, /unread_customer_count/);
});
