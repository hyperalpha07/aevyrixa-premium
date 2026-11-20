import "server-only";

const TABLE = "admin_email_drafts";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i;

export type AdminEmailDraft = {
  id: string;
  toAddress: string;
  subject: string;
  bodyText: string;
  revision: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminEmailDraftInput = Pick<AdminEmailDraft, "toAddress" | "subject" | "bodyText">;

export function validDraftId(id: string) { return uuidPattern.test(id); }

export function validateEmailDraft(value: unknown): { input: AdminEmailDraftInput | null; errors: string[] } {
  const data = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const errors: string[] = [];
  const toAddress = typeof data.toAddress === "string" ? data.toAddress.trim() : "";
  const subject = typeof data.subject === "string" ? data.subject : "";
  const bodyText = typeof data.bodyText === "string" ? data.bodyText : "";
  if (toAddress.length > 254 || (toAddress && !emailPattern.test(toAddress))) errors.push("Enter one valid recipient email address or leave it blank.");
  if (subject.length > 200 || /[\r\n]/.test(subject)) errors.push("Subject must fit 200 characters and one line.");
  if (bodyText.length > 20000) errors.push("Message must fit 20,000 characters.");
  return { input: errors.length ? null : { toAddress, subject, bodyText }, errors };
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Email draft backend unavailable.");
  return { url, key };
}
function headers() {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}
function url(path: string) {
  return `${config().url}/rest/v1/${path}`;
}
type DraftRow = {
  id: string; to_address: string; subject: string; body_text: string;
  revision: number; created_by: string; updated_by: string;
  created_at: string; updated_at: string;
};
function map(row: DraftRow): AdminEmailDraft {
  return {
    id: row.id, toAddress: row.to_address, subject: row.subject,
    bodyText: row.body_text, revision: row.revision,
    createdBy: row.created_by, updatedBy: row.updated_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function listEmailDrafts(): Promise<AdminEmailDraft[]> {
  const response = await fetch(url(`${TABLE}?select=id,to_address,subject,body_text,revision,created_by,updated_by,created_at,updated_at&archived_at=is.null&order=updated_at.desc&limit=100`),
    { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Email drafts are unavailable.");
  return ((await response.json()) as DraftRow[]).map(map);
}

export async function createEmailDraft(input: AdminEmailDraftInput, actor: string): Promise<AdminEmailDraft> {
  const response = await fetch(url(`${TABLE}?select=*`), {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      to_address: input.toAddress, subject: input.subject, body_text: input.bodyText,
      created_by: actor.slice(0, 120), updated_by: actor.slice(0, 120),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Draft could not be saved.");
  const rows = (await response.json()) as DraftRow[];
  if (!rows[0]?.id) throw new Error("Draft was not persisted.");
  return map(rows[0]);
}

async function updateDraft(
  id: string, revision: number,
  patch: Record<string, unknown>,
  actor: string
): Promise<AdminEmailDraft | null> {
  if (!validDraftId(id) || !Number.isSafeInteger(revision) || revision < 1) throw new Error("Invalid draft update.");
  const filter = `${TABLE}?id=eq.${encodeURIComponent(id)}&revision=eq.${revision}&archived_at=is.null&select=*`;
  const response = await fetch(url(filter), {
    method: "PATCH", headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({ ...patch, updated_by: actor.slice(0, 120), revision: revision + 1, updated_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Draft update failed.");
  const rows = (await response.json()) as DraftRow[];
  return rows[0] ? map(rows[0]) : null;
}

export async function editEmailDraft(id: string, revision: number, input: AdminEmailDraftInput, actor: string) {
  return updateDraft(id, revision, {
    to_address: input.toAddress, subject: input.subject, body_text: input.bodyText,
  }, actor);
}

export async function archiveEmailDraft(id: string, revision: number, actor: string) {
  return updateDraft(id, revision, { archived_at: new Date().toISOString() }, actor);
}
