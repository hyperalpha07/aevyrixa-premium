import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { buildSupportInbox, canReplyToSupport, orderSupportMessages, parseSupportFilter, querySupportInbox, supportHref } from "../lib/admin-v2/support/support-query.ts";
import { supportMetrics } from "../lib/admin-v2/support/support-metrics.ts";
import { adminPermissionKeys, hasPermission, normalizePermissions, type AdminPermissionKey, type AdminSessionUser } from "../app/lib/admin-permissions.ts";
import { SUPPORT_ATTACHMENT_LIMIT, SUPPORT_ATTACHMENT_MAX_BYTES, validateSupportAttachmentFiles } from "../app/lib/support-attachment-rules.ts";

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
  assert.match(page, /hasPermission\(session, "support.manage"\)/);
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

function harness(allowed: AdminPermissionKey[] = ["support.view", "support.reply", "support.close", "support.manage"]) {
  let status: "open" | "pending" | "closed" = "open";
  let exists = true;
  const history = messages.map(m => ({ ...m })) as Array<{id:string; conversation_id:string; body:string; sender_type:"admin"|"customer";created_at:string;is_read:boolean}>;
  const calls: string[] = [];
  const permissionMap = Object.fromEntries(adminPermissionKeys.map(key => [key, allowed.includes(key)]));
  const store = {
    getAdminSupportInbox: async () => { calls.push("list"); return buildSupportInbox([{ ...conversation, status }], history); },
    getConversationById: async () => { calls.push("get"); return exists ? { ...conversation, status } : null; },
    getConversationByToken: async (_id: string, token: string) => token === conversation.public_token ? { ...conversation, status } : null,
    getAdminSupportMessages: async () => orderSupportMessages(history),
    getSupportConversationLabels: async () => [],
    getSupportInternalNotes: async () => [],
    listSupportLabels: async () => [],
    updateConversationAssignment: async () => { calls.push("assign"); },
    attachSupportLabel: async () => { calls.push("label"); },
    removeSupportLabel: async () => { calls.push("label"); },
    createSupportLabel: async (name: string, color: string | null) => ({ id: "label-id", name, color }),
    updateConversationPriority: async () => { calls.push("priority"); },
    escalateSupportConversation: async () => { calls.push("escalate"); },
    clearSupportEscalation: async () => { calls.push("clearEscalation"); },
    updateSupportLabel: async (labelId: string, input: { name: string; color: string | null }) => ({ id: labelId, name: input.name, color: input.color }),
    deleteSupportLabel: async () => { calls.push("label"); },
    getMessagesByConversation: async () => orderSupportMessages(history),
    markCustomerMessagesRead: async () => { await Promise.resolve(); calls.push("mark"); history.filter(m => m.sender_type === "customer").forEach(m => { m.is_read = true; }); },
    markCustomerMessagesUnread: async () => { await Promise.resolve(); calls.push("unread"); history.filter(m => m.sender_type === "customer").forEach(m => { m.is_read = false; }); },
    updateConversationStatus: async (_id: string, next: typeof status) => { calls.push("status"); status = next; },
    addMessage: async (_id: string, body: string, sender_type: "admin", options?: { id?: string }) => { const message = { id: options?.id ?? "reply", conversation_id: "one", body, sender_type, created_at: "2026-01-03T00:00:00Z", is_read: false }; history.push(message); calls.push("reply"); return message; },
    addMessageAttachments: async (message_id: string) => { calls.push("attachments"); return [{ id: "att", message_id, conversation_id: "one", storage_path: "support/one/reply/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 1000, created_at: "2026-01-03T00:00:00Z", signed_url: "https://signed.invalid/file.pdf" }]; },
  };
  const dependencies = {
    "@/app/lib/support-store": store,
    "@/app/lib/support-message-input": {
      readSupportMessageInput: async (request: Request) => {
        const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
        return { input: { body: typeof payload.body === "string" ? payload.body.trim() : "", token: typeof payload.token === "string" ? payload.token : "", sourcePage: typeof payload.sourcePage === "string" ? payload.sourcePage : "", files: [] } };
      },
    },
    "@/app/lib/support-attachments": {
      cleanupSupportAttachmentFiles: async () => undefined,
      supportAttachmentIndicator: (files: File[], sender: "admin" | "customer") => `[${sender} sent ${files.length} attachments]`,
    },
    "@/app/lib/admin-auth": {
      verifyFreshAdminRequestPermission: async (_request: Request, key: AdminPermissionKey) => allowed.includes(key) ? { role: "test" } : null,
      getFreshAdminRequestSession: async () => ({ userType: "staff", username: "test", displayName: "Test Admin", role: "viewer", permissions: normalizePermissions("viewer", permissionMap) }),
      forbiddenAdminResponse: () => Response.json({}, { status: 403 }),
    },
    "@/app/lib/admin-permissions": { hasPermission },
    "@/app/lib/admin-staff": { logStaffActivity: async () => { calls.push("audit"); }, listStaff: async () => [] },
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
    markUnread: () => detail.PATCH(request("PATCH", { action: "mark_unread" }), context),
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
  assert.ok(!hasPermission(viewer, "support.manage"));
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
  assert.equal((await h.markUnread()).status, 200);
  assert.ok(h.calls.includes("unread"));
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

test("support.manage gates assignment, labels, priority, escalation and unread management", () => {
  const route = read("app/api/admin/support/conversations/[id]/route.ts");
  assert.match(route, /hasPermission\(session, "support\.manage"\)/);
  for (const action of ["mark_unread", "assign", "attach_label", "create_label", "update_label", "delete_label", "priority", "escalate", "clear_escalation"]) {
    assert.match(route, new RegExp(`action === "${action}"`));
  }
  assert.match(route, /duplicateLabelExists/);
  assert.match(route, /createSupportLabel\(cleanLabelName, labelColor\)/);
});

test("support AI route is server-side, bounded, unavailable without a key and timeout protected", () => {
  const route = read("app/api/admin/support/ai/route.ts");
  assert.match(route, /verifyFreshAdminRequestPermission\(request, "support\.reply"\)/);
  assert.match(route, /OPENAI_API_KEY/);
  assert.match(route, /OPENAI_SUPPORT_MODEL \|\| "gpt-6-luna"/);
  assert.match(route, /new OpenAI\(\{ apiKey: process\.env\.OPENAI_API_KEY \}\)/);
  assert.match(route, /client\.responses\.create/);
  assert.match(route, /AbortController/);
  assert.match(route, /20_000/);
  assert.match(route, /"English", "Bangla", "Sinhala"/);
  assert.match(route, /slice\(-12\)/);
  assert.match(route, /slice\(0, 6000\)/);
  assert.match(route, /AI is not configured/);
  assert.match(route, /AI request failed/);
  assert.doesNotMatch(route, /public_token|service[_-]?role|attachment binary|dbPost|dbPatch|addMessage/);
});

test("batched inbox reads page through row caps without per-conversation queries or token exposure", async () => {
  const urls: string[] = [];
  const store = loadModule("app/lib/support-store.ts", { "@/lib/admin-v2/support/support-query": { buildSupportInbox }, "@/app/lib/support-attachments": { signedSupportAttachmentUrl: async () => "" } }, {
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

test("addMessage writes required message and legacy body columns while reads normalize body fallback", async () => {
  const posts: unknown[] = [];
  const store = loadModule("app/lib/support-store.ts", { "@/lib/admin-v2/support/support-query": { buildSupportInbox }, "@/app/lib/support-attachments": { signedSupportAttachmentUrl: async () => "" } }, {
    process: { env: { SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test" } },
    crypto: { randomUUID: () => "message-id" },
    fetch: async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      if (init?.method === "POST" && url.pathname.endsWith("support_messages")) {
        const payload = JSON.parse(String(init.body));
        posts.push(payload);
        return Response.json([{ ...payload, created_at: payload.created_at, is_read: false }]);
      }
      if (init?.method === "PATCH") return new Response(null, { status: 204 });
      if (url.pathname.endsWith("support_messages")) {
        if (Number(url.searchParams.get("offset") ?? 0) > 0) return Response.json([]);
        return Response.json([{ id: "legacy", conversation_id: "one", message: "Legacy text", body: null, sender_type: "customer", created_at: "2026-01-01T00:00:00Z", is_read: false }]);
      }
      return Response.json([]);
    },
  });
  const inserted = await store.addMessage("conversation-id", "  Support test reply  ", "admin");
  assert.equal(posts.length, 1);
  assert.equal((posts[0] as Record<string, unknown>).message, "Support test reply");
  assert.equal((posts[0] as Record<string, unknown>).body, "Support test reply");
  assert.equal(inserted.body, "Support test reply");
  const legacy = await store.getAdminSupportMessages("one");
  assert.equal(legacy[0].body, "Legacy text");
});

test("workspace uses shared search, URL state, closed composer guard, manual refresh, safe RSC props", () => {
  const view = read("components/admin-v2/views/support/AdminV2SupportView.tsx");
  assert.match(view, /V2SearchField/);
  assert.match(view, /params.get\("conversation"\)/);
  assert.match(view, /markRead=1/);
  assert.match(view, /controller.abort\(\)/);
  assert.match(view, /Refresh/);
  assert.match(view, /mark_unread/);
  assert.match(view, /manifestToken: prepared\.manifestToken/);
  assert.doesNotMatch(view, /attachments: prepared\.attachments/);
  assert.doesNotMatch(view, /setInterval/);
  const conversation = read("components/admin-v2/views/support/AdminV2SupportConversation.tsx");
  assert.match(conversation, /canReplyToSupport\(canReply, conversation.status\)/);
  assert.match(conversation, /Copy conversation ID/);
  assert.match(conversation, /Mark as unread/);
  assert.match(conversation, /MessageAttachments/);
  assert.match(read("components/admin-v2/views/support/AdminV2SupportComposer.tsx"), /maxLength: 4000/);
  assert.doesNotMatch(conversation, /localStorage/);
  assert.doesNotMatch(read("components/admin-v2/views/support/AdminV2SupportComposer.tsx"), /localStorage/);
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
  assert.match(composer, /busy \|\| submitting\.current \|\| \(!value && !files\.length\)/);
  assert.match(composer, /type="submit"/);
  assert.match(composer, /onReply\(value, files\)/);
  assert.match(composer, /type="file"/);
  assert.match(composer, /maxLength: 4000/);
});

function fileFromBytes(bytes: number[] | Uint8Array, name: string, type: string) {
  return new File([bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)], name, { type });
}

function supportAttachmentModule() {
  return loadModule("app/lib/support-attachments.ts", {
    "server-only": {},
    "@/app/lib/support-attachment-rules": awaitableRules,
    "@/app/lib/support-store": {},
  });
}

const awaitableRules = {
  SUPPORT_ATTACHMENT_LIMIT,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  supportAttachmentExtension: (name: string) => name.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "",
  validateSupportAttachmentFile: (file: { name: string; type: string; size: number }) => validateSupportAttachmentFiles([file]),
  validateSupportAttachmentFiles,
};

test("attachment storage module is server-only and shared rules reject zero-byte, max count and max size", () => {
  assert.match(read("app/lib/support-attachments.ts"), /^import "server-only";/);
  assert.equal(validateSupportAttachmentFiles([fileFromBytes([], "empty.pdf", "application/pdf")]), "empty.pdf is empty.");
  assert.equal(validateSupportAttachmentFiles(Array.from({ length: SUPPORT_ATTACHMENT_LIMIT + 1 }, (_, index) => ({ name: `f${index}.pdf`, type: "application/pdf", size: 1 }))).startsWith("Attach up to"), true);
  assert.equal(validateSupportAttachmentFiles([{ name: "huge.pdf", type: "application/pdf", size: SUPPORT_ATTACHMENT_MAX_BYTES + 1 }]), "huge.pdf is larger than 10 MB.");
});

test("server attachment validation rejects MIME spoofing, extension mismatch and bad signatures", async () => {
  const mod = supportAttachmentModule();
  const validate = mod.validateSupportAttachmentUpload as (file: File) => Promise<{ error?: string; displayName?: string }>;
  assert.match((await validate(fileFromBytes([0xff, 0xd8, 0xff], "photo.png", "image/jpeg"))).error ?? "", /extension/);
  assert.match((await validate(fileFromBytes([0x00, 0xd8, 0xff], "photo.jpg", "image/jpeg"))).error ?? "", /content/);
  assert.match((await validate(fileFromBytes([0x89, 0x50, 0x4e, 0x00], "photo.png", "image/png"))).error ?? "", /content/);
  assert.match((await validate(fileFromBytes(new TextEncoder().encode("RIFFxxxxNOPE"), "photo.webp", "image/webp"))).error ?? "", /content/);
  assert.match((await validate(fileFromBytes(new TextEncoder().encode("%PDX-"), "file.pdf", "application/pdf"))).error ?? "", /content/);
  assert.match((await validate(fileFromBytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0x00], "file.doc", "application/msword"))).error ?? "", /content/);
  assert.match((await validate(fileFromBytes([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("not-office")], "file.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).error ?? "", /content/);
});

test("valid signatures are accepted and display filenames are sanitized", async () => {
  const mod = supportAttachmentModule();
  const validate = mod.validateSupportAttachmentUpload as (file: File) => Promise<{ error?: string; displayName?: string }>;
  const sanitize = mod.safeSupportAttachmentDisplayName as (name: string) => string;
  assert.equal((await validate(fileFromBytes([0xff, 0xd8, 0xff, 0x00], "photo.jpeg", "image/jpeg"))).error, undefined);
  assert.equal((await validate(fileFromBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "photo.png", "image/png"))).error, undefined);
  assert.equal((await validate(fileFromBytes(new TextEncoder().encode("RIFF0000WEBP"), "photo.webp", "image/webp"))).error, undefined);
  assert.equal((await validate(fileFromBytes(new TextEncoder().encode("%PDF-1.7"), "file.pdf", "application/pdf"))).error, undefined);
  assert.equal((await validate(fileFromBytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], "file.doc", "application/msword"))).error, undefined);
  assert.equal((await validate(fileFromBytes([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("[Content_Types].xml word/document.xml")], "file.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).error, undefined);
  assert.equal(sanitize("../\u0000 private/name.pdf "), ".. private name.pdf");
  assert.equal(sanitize("x".repeat(220)).length, 180);
});

test("signed URLs stay server generated and expire in ten minutes", async () => {
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  const mod = loadModule("app/lib/support-attachments.ts", {
    "server-only": {},
    "@/app/lib/support-attachment-rules": awaitableRules,
    "@/app/lib/support-store": {},
  }, {
    process: { env: { SUPABASE_URL: "https://test.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role" } },
    fetch: async (input: string, init?: RequestInit) => {
      calls.push({ input, init });
      return Response.json({ signedURL: "/object/sign/support-attachments/support/one/file.pdf?token=signed" });
    },
  });
  const signed = await mod.signedSupportAttachmentUrl("support/one/file.pdf");
  assert.equal(signed, "https://test.supabase.co/storage/v1/object/sign/support-attachments/support/one/file.pdf?token=signed");
  assert.equal(JSON.parse(String(calls[0].init?.body)).expiresIn, 600);
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Bearer service-role");
});

test("signed upload prepare sends an explicit empty JSON body and accepts Supabase raw url response", async () => {
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  const mod = loadModule("app/lib/support-attachments.ts", {
    "server-only": {},
    "@/app/lib/support-attachment-rules": awaitableRules,
    "@/app/lib/support-store": {},
  }, {
    process: { env: { SUPABASE_URL: "https://test.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role" } },
    fetch: async (input: string, init?: RequestInit) => {
      calls.push({ input, init });
      return Response.json({ url: "/object/upload/sign/support-attachments/support/one/message-id/file.pdf?token=upload-token", token: "upload-token" });
    },
  });

  const prepared = await mod.prepareSupportAttachmentUploads("one", "message-id", [{
    file_name: "file.pdf",
    mime_type: "application/pdf",
    size_bytes: 100,
  }]);

  assert.equal(prepared.length, 1);
  assert.match(calls[0].input, /object\/upload\/sign\/support-attachments\/support\/one\/message-id\//);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal((calls[0].init?.headers as Record<string, string>)["content-type"], "application/json");
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Bearer service-role");
  assert.equal(String(calls[0].init?.body), "{}");
  assert.equal(prepared[0].upload_url, "https://test.supabase.co/storage/v1/object/upload/sign/support-attachments/support/one/message-id/file.pdf?token=upload-token");
  assert.equal(prepared[0].token, "upload-token");
});

test("routes use signed direct uploads instead of multipart file bytes through Next APIs", () => {
  for (const file of [
    "app/api/admin/support/conversations/[id]/reply/route.ts",
    "app/api/support/conversations/[id]/messages/route.ts",
    "app/api/support/conversations/route.ts",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /uploadSupportAttachments/);
    assert.doesNotMatch(source, /request\.formData\(/);
    assert.doesNotMatch(source, /attachments"\)/);
  }
  assert.match(read("components/admin-v2/views/support/AdminV2SupportView.tsx"), /attachments\/prepare/);
  assert.match(read("components/admin-v2/views/support/AdminV2SupportView.tsx"), /attachment\.upload_url/);
  assert.match(read("components/admin-v2/views/support/AdminV2SupportView.tsx"), /attachments\/finalize/);
  assert.match(read("app/components/live-chat-widget.tsx"), /attachments\/prepare/);
  assert.match(read("app/components/live-chat-widget.tsx"), /attachments\/finalize/);
  assert.doesNotMatch(read("app/lib/support-attachments.ts"), /function uploadSupportAttachments|export async function uploadSupportAttachments/);
});

test("prepare endpoints authorize, use metadata only, and return server-controlled paths without service credentials", async () => {
  const prepared = [{
    storage_path: "support/one/message-id/generated-file.pdf",
    file_name: "file.pdf",
    mime_type: "application/pdf",
    size_bytes: SUPPORT_ATTACHMENT_MAX_BYTES,
    upload_url: "https://test.supabase.co/storage/v1/object/upload/sign/support-attachments/support/one/message-id/generated-file.pdf?token=upload-token",
  }];
  const deps = {
    "node:crypto": await import("node:crypto"),
    "@/app/lib/admin-auth": {
      verifyFreshAdminRequestPermission: async (_request: Request, key: AdminPermissionKey) => key === "support.reply" ? { role: "test" } : null,
      forbiddenAdminResponse: () => Response.json({}, { status: 403 }),
    },
    "@/app/lib/support-store": {
      getConversationById: async () => ({ ...conversation, status: "open" }),
      getConversationByToken: async (_id: string, token: string) => token === conversation.public_token ? { ...conversation, status: "open" } : null,
    },
    "@/app/lib/support-attachments": {
      prepareSupportAttachmentUploads: async (conversationId: string, messageId: string, files: unknown[]) => {
        assert.equal(conversationId, "one");
        assert.equal(typeof messageId, "string");
        assert.equal(files.length, 1);
        return prepared;
      },
    },
    "@/app/lib/support-attachment-finalize": {
      createSupportAttachmentManifest: ({ conversationId, messageId, senderType, attachments }: { conversationId: string; messageId: string; senderType: string; attachments: unknown[] }) => `manifest:${conversationId}:${messageId}:${senderType}:${attachments.length}`,
    },
  };
  const adminPrepare = loadModule("app/api/admin/support/conversations/[id]/attachments/prepare/route.ts", deps);
  const publicPrepare = loadModule("app/api/support/conversations/[id]/attachments/prepare/route.ts", deps);
  const context = { params: Promise.resolve({ id: "one" }) };
  const request = (body: unknown) => new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const adminPayload = await (await adminPrepare.POST(request({ files: [{ file_name: "file.pdf", mime_type: "application/pdf", size_bytes: SUPPORT_ATTACHMENT_MAX_BYTES }] }), context)).json();
  assert.equal(adminPayload.messageId.length > 0, true);
  assert.match(adminPayload.manifestToken, /^manifest:one:/);
  assert.equal(adminPayload.attachments[0].storage_path.startsWith("support/one/message-id/"), true);
  assert.equal(JSON.stringify(adminPayload).includes("service-role"), false);
  const publicDenied = await publicPrepare.POST(request({ token: "bad", files: [{ file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 10 }] }), context);
  assert.equal(publicDenied.status, 404);
  const publicPayload = await (await publicPrepare.POST(request({ token: conversation.public_token, files: [{ file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 10 }] }), context)).json();
  assert.match(publicPayload.manifestToken, /^manifest:one:/);
  assert.equal(publicPayload.attachments[0].upload_url.includes("upload-token"), true);
});

function finalizeModule(storeOverrides: Record<string, unknown>, attachmentOverrides: Record<string, unknown> = {}, env: Record<string, string> = { SUPPORT_ATTACHMENT_SIGNING_SECRET: "secret" }) {
  const finalize = loadModule("app/lib/support-attachment-finalize.ts", {
    "server-only": {},
    "node:crypto": awaitableCrypto,
    "@/app/lib/support-attachments": {
      SUPPORT_ATTACHMENT_LIMIT,
      SUPPORT_ATTACHMENT_MAX_BYTES,
      cleanupSupportAttachmentFiles: async (paths: string[]) => { cleanupCalls.push(paths); },
      supportAttachmentIndicator: (files: { length: number }) => `[Admin sent ${files.length} attachments]`,
      validateUploadedSupportAttachments: async (attachments: unknown[]) => {
        validateCalls++;
        if (validationFails) throw new Error("bad object");
        return attachments;
      },
      ...attachmentOverrides,
    },
    "@/app/lib/support-store": {
      getSupportMessageWithAttachments: async () => existingMessage,
      addMessage: async () => {
        addCalls++;
        return { id: "message-id", conversation_id: "one", body: "[Admin sent 1 attachment]", sender_type: "admin", created_at: "now", is_read: false };
      },
      addMessageAttachments: async () => {
        if (metadataFails) throw new Error("metadata failed");
        return [{ id: "att" }];
      },
      deleteSupportMessage: async () => { deleteCalls++; },
      ...storeOverrides,
    },
  }, { process: { env } });
  return finalize;
}

const awaitableCrypto = await import("node:crypto");

let cleanupCalls: string[][] = [];
let validateCalls = 0;
let addCalls = 0;
let deleteCalls = 0;
let validationFails = false;
let metadataFails = false;
let existingMessage: unknown = null;

function resetFinalizeState() {
  cleanupCalls = [];
  validateCalls = 0;
  addCalls = 0;
  deleteCalls = 0;
  validationFails = false;
  metadataFails = false;
  existingMessage = null;
}

test("manifest signing rejects altered fields, expiry, wrong conversation and wrong sender", () => {
  resetFinalizeState();
  const finalize = finalizeModule({});
  const attachment = { storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 };
  const token = finalize.createSupportAttachmentManifest({ conversationId: "one", messageId: "message-id", senderType: "admin", attachments: [attachment], now: 1000 });
  assert.equal(finalize.verifySupportAttachmentManifest(token, { conversationId: "one", senderType: "admin", now: 2000 }).messageId, "message-id");
  assert.throws(() => finalize.verifySupportAttachmentManifest(`${token}x`, { conversationId: "one", senderType: "admin", now: 2000 }), /Invalid/);
  for (const field of ["storage_path", "file_name", "mime_type", "size_bytes"] as const) {
    const [payload, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (field === "storage_path") decoded.attachments[0][field] = "support/one/message-id/evil.pdf";
    if (field === "file_name") decoded.attachments[0][field] = "evil.pdf";
    if (field === "mime_type") decoded.attachments[0][field] = "image/png";
    if (field === "size_bytes") decoded.attachments[0][field] = 101;
    const altered = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${signature}`;
    assert.throws(() => finalize.verifySupportAttachmentManifest(altered, { conversationId: "one", senderType: "admin", now: 2000 }), /Invalid/);
  }
  assert.throws(() => finalize.verifySupportAttachmentManifest(token, { conversationId: "two", senderType: "admin", now: 2000 }), /conversation/);
  assert.throws(() => finalize.verifySupportAttachmentManifest(token, { conversationId: "one", senderType: "customer", now: 2000 }), /sender/);
  assert.throws(() => finalize.verifySupportAttachmentManifest(token, { conversationId: "one", senderType: "admin", messageId: "different", now: 2000 }), /message/);
  assert.throws(() => finalize.verifySupportAttachmentManifest(token, { conversationId: "one", senderType: "admin", now: 1000 + 16 * 60 * 1000 }), /expired/);
});

test("manifest verification requires a dedicated production signing secret and rejects malformed shapes", () => {
  resetFinalizeState();
  const finalize = finalizeModule({}, {}, { NODE_ENV: "production", SUPABASE_SERVICE_ROLE_KEY: "service-role" });
  assert.throws(() => finalize.createSupportAttachmentManifest({
    conversationId: "one",
    messageId: "message-id",
    senderType: "admin",
    attachments: [{ storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  }), /SUPPORT_ATTACHMENT_SIGNING_SECRET/);

  const signed = finalizeModule({}, {}, { SUPPORT_ATTACHMENT_SIGNING_SECRET: "shape-secret" });
  const sign = (manifest: unknown) => {
    const payload = Buffer.from(JSON.stringify(manifest)).toString("base64url");
    const signature = awaitableCrypto.createHmac("sha256", "shape-secret").update(payload).digest("base64url");
    return `${payload}.${signature}`;
  };
  const validAttachment = { storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 };
  const base = { v: 1, conversationId: "one", messageId: "message-id", senderType: "admin", expiresAt: Date.now() + 60000, attachments: [validAttachment] };
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, v: 2 }), { conversationId: "one", senderType: "admin" }), /Unsupported/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, conversationId: "" }), { conversationId: "one", senderType: "admin" }), /conversation/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, messageId: "../bad" }), { conversationId: "one", senderType: "admin" }), /message/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, senderType: "staff" }), { conversationId: "one", senderType: "admin" }), /sender/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, expiresAt: Number.NaN }), { conversationId: "one", senderType: "admin" }), /expiry/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: [] }), { conversationId: "one", senderType: "admin" }), /count/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: Array.from({ length: 6 }, (_, index) => ({ ...validAttachment, storage_path: `support/one/message-id/file-${index}.pdf` })) }), { conversationId: "one", senderType: "admin" }), /count/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: [{ ...validAttachment, storage_path: "support/one/message-id/../file.pdf" }] }), { conversationId: "one", senderType: "admin" }), /path/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: [{ ...validAttachment, file_name: "" }] }), { conversationId: "one", senderType: "admin" }), /filename/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: [{ ...validAttachment, mime_type: "" }] }), { conversationId: "one", senderType: "admin" }), /MIME/);
  assert.throws(() => signed.verifySupportAttachmentManifest(sign({ ...base, attachments: [{ ...validAttachment, size_bytes: 0 }] }), { conversationId: "one", senderType: "admin" }), /size/);
});

test("finalize uses manifest attachments only, rejects partial/altered paths and rolls back storage/message", async () => {
  resetFinalizeState();
  const finalize = finalizeModule({});
  const attachment = { storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 };
  const token = finalize.createSupportAttachmentManifest({ conversationId: "one", messageId: "message-id", senderType: "admin", attachments: [attachment] });
  validationFails = true;
  await assert.rejects(() => finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token }), /bad object/);
  assert.equal(addCalls, 0);
  assert.equal(cleanupCalls.length, 1);

  validationFails = false;
  metadataFails = true;
  cleanupCalls = [];
  await assert.rejects(() => finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token }), /metadata/);
  assert.equal(deleteCalls, 1);
  assert.equal(cleanupCalls.length, 1);

  const badPathToken = finalize.createSupportAttachmentManifest({ conversationId: "one", messageId: "message-id", senderType: "admin", attachments: [{ ...attachment, storage_path: "support/two/message-id/file.pdf" }] });
  await assert.rejects(() => finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: badPathToken }), /uploaded size|authorized|bad object|mismatch|path/i);
});

test("finalize replay returns existing message without deleting committed attachments or creating duplicates", async () => {
  resetFinalizeState();
  existingMessage = {
    id: "message-id",
    body: "Already sent",
    sender_type: "admin",
    created_at: "now",
    attachments: [{ id: "att", storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  };
  const finalize = finalizeModule({});
  const token = finalize.createSupportAttachmentManifest({
    conversationId: "one",
    messageId: "message-id",
    senderType: "admin",
    attachments: [{ storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  });
  const replay = await finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token });
  assert.equal(replay.body, "Already sent");
  assert.equal(validateCalls, 0);
  assert.equal(addCalls, 0);
  assert.equal(deleteCalls, 0);
  assert.equal(cleanupCalls.length, 0);
});

test("concurrent finalize race returns committed message before destructive cleanup", async () => {
  resetFinalizeState();
  const committed = {
    id: "message-id",
    body: "Already sent",
    sender_type: "admin",
    created_at: "now",
    attachments: [{ id: "att", storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  };
  let lookupCount = 0;
  const finalize = finalizeModule({
    getSupportMessageWithAttachments: async () => {
      lookupCount++;
      return lookupCount === 1 ? null : committed;
    },
    addMessage: async () => {
      addCalls++;
      throw new Error("duplicate key value violates unique constraint");
    },
  });
  const token = finalize.createSupportAttachmentManifest({
    conversationId: "one",
    messageId: "message-id",
    senderType: "admin",
    attachments: [{ storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  });
  const replay = await finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token });
  assert.equal(replay.body, "Already sent");
  assert.equal(addCalls, 1);
  assert.equal(deleteCalls, 0);
  assert.equal(cleanupCalls.length, 0);
});

test("metadata failure does not delete another concurrent finalized message", async () => {
  resetFinalizeState();
  const committed = {
    id: "message-id",
    body: "Already sent",
    sender_type: "admin",
    created_at: "now",
    attachments: [{ id: "att", storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  };
  let lookupCount = 0;
  const finalize = finalizeModule({
    getSupportMessageWithAttachments: async () => {
      lookupCount++;
      return lookupCount === 1 ? null : committed;
    },
  });
  metadataFails = true;
  const token = finalize.createSupportAttachmentManifest({
    conversationId: "one",
    messageId: "message-id",
    senderType: "admin",
    attachments: [{ storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  });
  const replay = await finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token });
  assert.equal(replay.body, "Already sent");
  assert.equal(addCalls, 1);
  assert.equal(deleteCalls, 0);
  assert.equal(cleanupCalls.length, 0);
});

test("normal attachment finalize validates upload and persists metadata from the manifest", async () => {
  resetFinalizeState();
  const finalize = finalizeModule({});
  const token = finalize.createSupportAttachmentManifest({
    conversationId: "one",
    messageId: "message-id",
    senderType: "admin",
    attachments: [{ storage_path: "support/one/message-id/file.pdf", file_name: "file.pdf", mime_type: "application/pdf", size_bytes: 100 }],
  });
  const message = await finalize.finalizeSupportAttachmentMessage({ conversationId: "one", body: "", senderType: "admin", manifestToken: token });
  assert.equal(message.id, "message-id");
  assert.equal(validateCalls, 1);
  assert.equal(addCalls, 1);
  assert.equal(deleteCalls, 0);
  assert.equal(cleanupCalls.length, 0);
});

test("finalize routes accept manifest token only and do not trust client attachment metadata", () => {
  for (const file of [
    "app/api/admin/support/conversations/[id]/attachments/finalize/route.ts",
    "app/api/support/conversations/[id]/attachments/finalize/route.ts",
  ]) {
    const source = read(file);
    assert.match(source, /manifestToken/);
    assert.doesNotMatch(source, /body\.attachments/);
    assert.doesNotMatch(source, /request\.formData\(/);
    assert.doesNotMatch(source, /uploadSupportAttachments/);
  }
});

test("attachment metadata rejects cross-conversation message mismatch before insert", async () => {
  const posts: string[] = [];
  const store = loadModule("app/lib/support-store.ts", { "@/lib/admin-v2/support/support-query": { buildSupportInbox }, "@/app/lib/support-attachments": { signedSupportAttachmentUrl: async () => "" } }, {
    process: { env: { SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test" } },
    fetch: async (input: string, init?: RequestInit) => {
      if (init?.method === "POST") posts.push(input);
      const url = new URL(input);
      if (url.pathname.endsWith("support_messages")) return Response.json([]);
      return Response.json([]);
    },
  });
  await assert.rejects(() => store.addMessageAttachments("message-one", "wrong-conversation", [{
    storage_path: "support/one/message-one/file.pdf",
    file_name: "file.pdf",
    mime_type: "application/pdf",
    size_bytes: 100,
  }]), /mismatch/);
  assert.equal(posts.length, 0);
});

test("support console layout uses connected workspace, flexible history and compact feedback", () => {
  const view = read("components/admin-v2/views/support/AdminV2SupportView.tsx");
  const conversation = read("components/admin-v2/views/support/AdminV2SupportConversation.tsx");
  const inbox = read("components/admin-v2/views/support/AdminV2SupportInbox.tsx");
  const composer = read("components/admin-v2/views/support/AdminV2SupportComposer.tsx");
  assert.match(view, /gridTemplateColumns: "325px minmax\(0, 1fr\) 390px"/);
  assert.match(view, /Snackbar/);
  assert.match(view, /action: "assign"/);
  assert.match(view, /action: "attach_label"/);
  assert.match(view, /flex: 1/);
  assert.doesNotMatch(view, /calc\(100dvh -/);
  assert.match(view, /Active conversations/);
  assert.match(view, /Awaiting response/);
  assert.doesNotMatch(conversation, /height:\s*340/);
  assert.match(conversation, /flex: 1/);
  assert.match(conversation, /maxWidth: 820/);
  assert.match(conversation, /dateLabel/);
  assert.match(conversation, /maxWidth: "62%"/);
  assert.match(conversation, /AdminV2SupportContextPanel/);
  assert.match(conversation, /Guest Customer/);
  assert.match(conversation, /Recent orders/);
  assert.match(conversation, /Conversation info/);
  assert.match(conversation, /Customer identity is not captured/);
  assert.match(conversation, /Internal note/);
  assert.match(conversation, /noromi-support:add-note/);
  assert.doesNotMatch(conversation, /scrollTop = history\.current\.scrollHeight/);
  assert.match(view, /role="status"/);
  assert.match(inbox, /borderLeft: "4px solid"/);
  assert.match(inbox, /initials/);
  assert.match(inbox, /unread_customer_count/);
  assert.match(inbox, /supportSourceLabel/);
  assert.match(composer, /Paperclip/);
  assert.match(composer, /Saved Replies/);
  assert.match(composer, /\/api\/admin\/support\/saved-replies/);
  assert.match(composer, /AI Suggest/);
  assert.match(composer, /Translate to Bangla/);
  assert.match(composer, /Insert emoji/);
  assert.match(composer, /Share product card/);
  assert.match(composer, /onProductShare/);
  assert.match(composer, /minHeight: 72/);
  assert.match(composer, /product\.status === "active"/);
  assert.match(conversation, /MessageProductShares/);
});
