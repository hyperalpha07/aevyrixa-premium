import "server-only";
import type { DraftEditRequest } from "./product-edit";

export const draftProductRequest: DraftEditRequest = async (query, init) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Product database is not configured.");
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${url.replace(/\/$/, "")}/rest/v1/products?${query}`, {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20000),
  });
};
