import { timingSafeEqual } from "node:crypto";
import { listScheduledTaskAutomationRules, runTaskAutomationRule } from "@/lib/admin-v2/operations-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };

function authorized(header: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(secret, "utf8");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Vercel's daily cron: no external effects, only pre-enabled internal task rules. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ errors: ["Internal automation scheduler is not configured."] },
      { status: 503, headers: noStore });
  }
  if (!authorized(request.headers.get("authorization"), secret)) {
    return Response.json({ errors: ["Unauthorized."] }, { status: 401, headers: noStore });
  }
  let rules: Awaited<ReturnType<typeof listScheduledTaskAutomationRules>>;
  try {
    rules = await listScheduledTaskAutomationRules();
    if (rules.length > 25) {
      return Response.json({ errors: ["Too many enabled daily rules; no execution attempted."] },
        { status: 503, headers: noStore });
    }
  } catch {
    return Response.json({ errors: ["Automation rules backend unavailable; no execution attempted."] },
      { status: 503, headers: noStore });
  }

  let created = 0, reused = 0, failed = 0;
  for (const rule of rules) {
    try {
      const result = await runTaskAutomationRule(rule.id, "system-daily-automation", "scheduled");
      if (result.reused) reused++; else created++;
    } catch {
      failed++;
      // No credentials, rule payloads or customer data in logs.
      console.error("[admin-v2-automation] Scheduled internal task creation failed.");
    }
  }
  return Response.json({
    status: failed ? "partial_failure" : "completed",
    scheduledRules: rules.length,
    created, reused, failed,
  }, { status: failed ? 503 : 200, headers: noStore });
}
