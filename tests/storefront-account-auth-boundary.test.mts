import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const accountClientSource = readFileSync(
  new URL("../app/account/account-client.tsx", import.meta.url),
  "utf8",
);
const authFormSource = readFileSync(
  new URL("../app/account/auth-form.tsx", import.meta.url),
  "utf8",
);

test("account session 401 is classified as authentication-required, not a generic failure", () => {
  assert.match(accountClientSource, /class AccountRequestError extends Error/);
  assert.match(accountClientSource, /readonly status: number/);
  assert.match(accountClientSource, /err instanceof AccountRequestError && err\.status === 401/);
  assert.match(accountClientSource, /setIsAuthRequired\(true\)/);
  assert.doesNotMatch(accountClientSource, />\{error\}<\/p>/);
});

test("protected account data is requested only after a successful session request", () => {
  const sessionIndex = accountClientSource.indexOf('readJson<{ customer: Customer }>("/api/account/session")');
  const protectedDataIndex = accountClientSource.indexOf("await Promise.all([");
  assert.ok(sessionIndex >= 0);
  assert.ok(protectedDataIndex > sessionIndex);
  assert.match(accountClientSource, /setError\("We couldn't load your account right now\."\)/);
  assert.match(accountClientSource, /setLoadAttempt\(\(attempt\) => attempt \+ 1\)/);
});

test("every protected view maps to a local returnTo destination", () => {
  for (const [view, path] of [
    ["dashboard", "/account"],
    ["orders", "/account/orders"],
    ["addresses", "/account/addresses"],
    ["support", "/account/support"],
  ]) {
    assert.match(accountClientSource, new RegExp(`${view}: "${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(accountClientSource, /new URLSearchParams\(\{ returnTo: protectedPath \}\)/);
  assert.match(accountClientSource, /`\/account\/login\?\$\{returnToQuery\}`/);
  assert.match(accountClientSource, /`\/account\/register\?\$\{returnToQuery\}`/);
});

test("the existing auth form remains the single safe return-path owner", () => {
  assert.match(authFormSource, /next\?\.startsWith\("\/"\) && !next\.startsWith\("\/\/"\)/);
  assert.match(authFormSource, /router\.replace\(returnTo\)/);
  assert.match(authFormSource, /new URLSearchParams\(\{ returnTo \}\)/);
});
