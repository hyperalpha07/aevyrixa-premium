import { forbiddenAdminResponse, getFreshAdminRequestSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const reply = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: noStore });

/** Read-only Telegram getMe. Never sends a message or changes an integration. */
export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  // Checking credential validity is more sensitive than viewing config presence.
  if (!hasPermission(session, "settings.editSensitive")) return forbiddenAdminResponse();

  const { searchParams } = new URL(request.url);
  if (searchParams.get("provider") !== "telegram") {
    return reply({ errors: ["Unsupported verification provider."] }, 400);
  }

  const token = process.env.ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN;
  if (!token || !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    return reply({ state: "not_configured", message: "Telegram bot token is not configured correctly." });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      return reply({
        state: "unverified",
        message: response.status === 401 || response.status === 404
          ? "Telegram did not accept this bot token."
          : "Telegram identity check did not succeed. Try again later.",
      });
    }
    const result = await response.json() as {
      ok?: boolean;
      result?: { is_bot?: boolean; username?: string };
    };
    if (!result.ok || result.result?.is_bot !== true) {
      return reply({ state: "unverified", message: "Telegram bot identity could not be verified." });
    }
    const username = result.result.username;
    return reply({
      state: "verified_identity",
      message: "Telegram bot identity verified. Destination chat permissions and message delivery are not verified.",
      ...(typeof username === "string" && /^[A-Za-z0-9_]{5,32}$/.test(username) ? { username } : {}),
      checkedAt: new Date().toISOString(),
    });
  } catch {
    // Do not include provider URLs, tokens, response bodies, or exception text in output or logs.
    return reply({ state: "unavailable", message: "Telegram identity check could not reach the provider." });
  }
}
