export class AccountRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AccountRequestError";
    this.status = status;
  }
}

export async function readAccountJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = (await response.json().catch(() => ({}))) as T & { errors?: string[] };
  if (!response.ok) {
    throw new AccountRequestError(response.status, payload.errors?.[0] || "Request failed.");
  }
  return payload;
}
