import "server-only";

export type ReturnCase = {
  id: string;
  order_ref: string;
  requested_action: "exchange" | "refund_review" | "support";
  reason: string;
  status: "requested" | "reviewing" | "approved" | "rejected" | "closed";
  hygiene_review: "not_checked" | "eligible" | "ineligible" | "exception_review";
  review_note: string;
  actor_name: string;
  version: number;
  created_at: string;
  updated_at: string;
};

const select = "id,order_ref,requested_action,reason,status,hygiene_review,review_note,actor_name,version,created_at,updated_at";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function endpoint(path: string) {
  return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/rest/v1/${path}`;
}
function headers() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return { apikey: secret, authorization: `Bearer ${secret}`, "content-type": "application/json" };
}

async function checked(response: Response, action: string) {
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    console.error("[admin-v2:returns]", action, response.status, detail?.code ?? "unknown");
    throw new Error(`Return case ${action} failed.`);
  }
  return response;
}

export async function loadReturnCases(page = 1, status = "all") {
  if (!configured()) return { available: false, rows: [] as ReturnCase[], totalCount: 0, page: 1 };
  const safePage = Number.isSafeInteger(page) ? Math.max(1, Math.min(1000, page)) : 1;
  const params = new URLSearchParams({ select, order: "created_at.desc,id.desc" });
  if (["requested","reviewing","approved","rejected","closed"].includes(status)) params.set("status", `eq.${status}`);
  const response = await checked(await fetch(endpoint(`admin_return_cases?${params}`), {
    headers: { ...headers(), prefer: "count=exact", range: `${(safePage-1)*25}-${safePage*25-1}` }, cache: "no-store",
  }), "list");
  const rows = await response.json() as ReturnCase[];
  const totalCount = Number(response.headers.get("content-range")?.split("/").at(-1));
  if (!Number.isFinite(totalCount)) throw new Error("Return count unavailable.");
  return { available: true, rows, totalCount, page: safePage };
}

export async function createReturnCase(input: { orderRef: string; requestedAction: ReturnCase["requested_action"]; reason: string; actor: string }) {
  if (!configured()) throw new Error("Return backend unavailable.");
  const response = await checked(await fetch(endpoint("admin_return_cases?select="+select), {
    method: "POST", headers: { ...headers(), prefer: "return=representation" }, cache: "no-store",
    body: JSON.stringify({ order_ref: input.orderRef, requested_action: input.requestedAction, reason: input.reason, actor_name: input.actor }),
  }), "creation");
  const rows = await response.json() as ReturnCase[];
  if (!rows[0]) throw new Error("Return case creation was not confirmed.");
  return rows[0];
}

export async function transitionReturnCase(input: {
  id: string; version: number; fromStatus: ReturnCase["status"];
  toStatus: ReturnCase["status"]; hygiene: ReturnCase["hygiene_review"]; note: string; actor: string;
}) {
  if (!configured()) throw new Error("Return backend unavailable.");
  const params = new URLSearchParams({ id: `eq.${input.id}`, version: `eq.${input.version}`, status: `eq.${input.fromStatus}`, select });
  const response = await checked(await fetch(endpoint(`admin_return_cases?${params}`), {
    method: "PATCH", headers: { ...headers(), prefer: "return=representation" }, cache: "no-store",
    body: JSON.stringify({
      status: input.toStatus, version: input.version+1, hygiene_review: input.hygiene,
      review_note: input.note, actor_name: input.actor,
    }),
  }), "status change");
  const rows = await response.json() as ReturnCase[];
  if (!rows[0]) throw new Error("Return case changed since you opened it. Refresh and retry.");
  return rows[0];
}
