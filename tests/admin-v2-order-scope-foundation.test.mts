import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20261016090000_order_record_scope_foundation.sql", import.meta.url), "utf8");
const runbook = readFileSync(new URL("../docs/finance/test-live-data-separation.md", import.meta.url), "utf8");

test("Staged order record_scope schema is distinct from prohibited legacy fallback fields", () => {
  assert.match(migration, /add column record_scope text not null default 'live'/);
  assert.match(migration, /check \(record_scope in \('live','test'\)\)/);
  assert.match(migration, /orders_record_scope_created_idx/);
  assert.doesNotMatch(migration, /add column (?:is_test_order|test_order)\b/i);
});

test("Historical test reclassification is an exact and fail-closed 21-order contract", () => {
  const predicates = [...migration.matchAll(/where order_ref in \(([\s\S]*?)\)/gim)];
  assert.equal(predicates.length, 2, "Both preflight and update use the exact reference list");
  const groups = predicates.map((match) => [...match[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  assert.equal(groups[0].length, 21);
  assert.equal(new Set(groups[0]).size, 21);
  assert.deepEqual(groups[0], groups[1]);
  assert.match(migration, /v_total <> 21 or v_expected <> 21/);
  assert.match(migration, /lock table public\.orders in share row exclusive mode/);
  assert.match(migration, /raise exception[\s\S]*preflight failed/);
  assert.doesNotMatch(migration, /where\s+(?:created_at|status|order_source)\s*[<>=]/i);
});

test("Classification is immutable through ordinary application writes", () => {
  assert.match(migration, /before update of record_scope on public\.orders/);
  assert.match(migration, /alter table public\.orders disable trigger orders_set_updated_at/);
  assert.match(migration, /alter table public\.orders enable trigger orders_set_updated_at/);
  assert.match(migration, /v_history_timestamp_digest is distinct from/);
  assert.match(migration, /Historical order updated_at changed during scope backfill/);
  assert.match(migration, /new\.record_scope is distinct from old\.record_scope/);
  assert.match(migration, /reviewed data migration/);
  assert.match(migration, /Monetary amounts, ledger status, invoice snapshots/);
  assert.match(migration, /new\.record_scope := v_order_scope/);
  assert.match(migration, /finance_expenses_record_scope_valid/);
});

test("Data-scope runbook prevents unilateral deployment and cash-history modification", () => {
  assert.match(runbook, /phase A/);
  assert.match(runbook, /database BEFORE pagination/);
  assert.match(runbook, /identical scope as the UI/);
  assert.match(runbook, /No production migration/);
  assert.match(runbook, /expenses with nullable/);
});
