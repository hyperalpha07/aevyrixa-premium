import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const accountShellSource = readFileSync(
  new URL("../app/account/_shared/account-shell.tsx", import.meta.url),
  "utf8",
);
const accountRequestSource = readFileSync(new URL("../app/account/_shared/account-request.ts", import.meta.url), "utf8");
const authFormSource = readFileSync(
  new URL("../app/account/auth-form.tsx", import.meta.url),
  "utf8",
);

test("account session 401 is classified as authentication-required, not a generic failure", () => {
  assert.match(accountRequestSource, /class AccountRequestError extends Error/);
  assert.match(accountRequestSource, /readonly status: number/);
  assert.match(accountShellSource, /error instanceof AccountRequestError && error\.status === 401/);
  assert.match(accountShellSource, /setIsAuthRequired\(error instanceof AccountRequestError && error\.status === 401\)/);
  assert.doesNotMatch(accountShellSource, />\{error\}<\/p>/);
});

test("protected views use one authenticated bootstrap while other views retain the session boundary", () => {
  assert.match(accountShellSource, /readAccountJson<\{ customer: Customer \}>\(bootstrapUrl \?\? "\/api\/account\/session"\)/);
  assert.match(accountShellSource, /children\(\{ customer, settings, bootstrapData, logout, openLiveChat \}\)/);
  assert.match(accountShellSource, /setLoadAttempt\(\(attempt\) => attempt \+ 1\)/);
  const bootstrap = readFileSync(new URL("../app/api/account/bootstrap/route.ts", import.meta.url), "utf8");
  assert.match(bootstrap, /if \(!customer\) return response/);
});

test("every protected view maps to a local returnTo destination", () => {
  for (const [view, path] of [
    ["dashboard", "/account"],
    ["orders", "/account/orders"],
    ["addresses", "/account/addresses"],
    ["support", "/account/support"],
  ]) {
    assert.match(accountShellSource, new RegExp(`${view}: "${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(accountShellSource, /new URLSearchParams\(\{ returnTo: protectedAccountPaths\[view\] \}\)/);
  assert.match(accountShellSource, /`\/account\/login\?\$\{returnToQuery\}`/);
  assert.match(accountShellSource, /`\/account\/register\?\$\{returnToQuery\}`/);
});

test("the existing auth form remains the single safe return-path owner", () => {
  assert.match(authFormSource, /next\?\.startsWith\("\/"\) && !next\.startsWith\("\/\/"\)/);
  assert.match(authFormSource, /router\.replace\(returnTo\)/);
  assert.match(authFormSource, /new URLSearchParams\(\{ returnTo \}\)/);
});
