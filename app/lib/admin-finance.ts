import type { AdminSessionUser } from "@/app/lib/admin-permissions";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

export function adminFinanceActor(session: AdminSessionUser) {
  return {
    p_actor_type: session.userType === "owner" ? "owner" : "staff",
    p_actor_id: session.userType === "staff" ? session.staffId ?? session.username : session.username,
    p_actor_name: session.displayName || session.username,
  };
}

export async function callAdminFinanceRpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!hasSupabaseConfig()) throw new Error("Finance backend is not configured.");
  const response = await fetch(supabaseEndpoint(`rpc/${fn}`), {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Finance operation could not be completed.");
  }
  return (await response.json()) as T;
}
