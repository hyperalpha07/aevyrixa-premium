import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateReturnCreation, validateReturnTransition } from "../lib/admin-v2/returns/returns-validation.ts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("A return case requires exact reference, action and a meaningful reason", () => {
  const valid = { orderRef: "AEV-TEST-001", requestedAction: "exchange", reason: "Wrong size received; unopened packaging." };
  assert.deepEqual(validateReturnCreation(valid), valid);
  for (const data of [
    { ...valid, reason: "short" },
    { ...valid, orderRef: "../../admin" },
    { ...valid, requestedAction: "auto_refund" },
    { ...valid, reason: "x".repeat(1600) },
    null, [],
  ]) assert.equal(validateReturnCreation(data), null);
});

test("Review cases permit only documented sequential transitions", () => {
  const base = { version: 1, fromStatus: "requested", toStatus: "reviewing", hygiene: "not_checked", note: "Inspection requested" };
  assert.deepEqual(validateReturnTransition(base), base);
  for (const [fromStatus,toStatus] of [
    ["requested", "approved"], ["reviewing","closed"], ["rejected","approved"],
    ["closed","reviewing"], ["requested","requested"],
  ]) assert.equal(validateReturnTransition({ ...base, fromStatus, toStatus }), null);
  assert.equal(validateReturnTransition({ ...base, fromStatus: "reviewing", toStatus: "approved" }), null);
  assert.ok(validateReturnTransition({ ...base, fromStatus: "reviewing", toStatus: "approved", hygiene: "eligible" }));
  assert.ok(validateReturnTransition({ ...base, fromStatus: "reviewing", toStatus: "rejected", hygiene: "ineligible" }));
  assert.equal(validateReturnTransition({ ...base, note: "bad" }), null);
  assert.equal(validateReturnTransition({ ...base, version: -1 }), null);
});

test("Database schema isolates LIVE delivered orders and persists append-only audit events", () => {
  const sql = read("supabase/migrations/20261024090000_admin_return_cases_workflow.sql");
  assert.match(sql, /references public\.orders\(order_ref\)/);
  assert.match(sql, /check \(record_scope = 'live'\)/);
  assert.match(sql, /v_order\.record_scope <> 'live'/);
  assert.match(sql, /v_order\.status <> 'Delivered'/);
  assert.match(sql, /admin_return_case_event_trigger after insert or update/);
  assert.match(sql, /version <> old\.version \+ 1/);
  assert.match(sql, /alter table public\.admin_return_cases enable row level security/);
  assert.match(sql, /alter table public\.admin_return_case_events enable row level security/);
  assert.match(sql, /revoke all on public\.admin_return_cases from public, anon, authenticated/);
  assert.match(sql, /grant select,insert,update on public\.admin_return_cases to service_role/);
  assert.doesNotMatch(sql, /update public\.orders|update public\.finance_refunds/);
});

test("Return API action never posts refunds, checks fresh identity and edit permission", () => {
  const create = read("app/api/admin-v2/returns/route.ts");
  const edit = read("app/api/admin-v2/returns/[id]/route.ts");
  const page = read("app/admin-v2/returns/page.tsx");
  const view = read("components/admin-v2/views/returns/AdminV2ReturnsView.tsx");
  const store = read("lib/admin-v2/returns/returns-store.ts");
  for (const source of [create, edit]) {
    assert.match(source, /getFreshAdminRequestSession\(request\)/);
    assert.match(source, /hasPermission\(session, "orders\.view"\)/);
    assert.match(source, /hasPermission\(session, "orders\.editStatus"\)/);
    assert.doesNotMatch(source, /finance\/refunds|admin_v2_record_refund/);
  }
  assert.match(page, /requireAdminV2RouteAccess\(session, "returns"\)/);
  assert.match(view, /hygiene eligibility/);
  assert.match(store, /version: `eq\.\$\{input\.version\}`/);
  assert.match(store, /if \(!rows\[0\]\) throw new Error\("Return case changed/);
  assert.match(read("configs/admin-v2/routes.ts"), /module: "returns"[^\n]+implemented: true/);
});
