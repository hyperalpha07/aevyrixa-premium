export const ADMIN_LOGIN_FALLBACK_PATH = "/admin-v2";

export function safeAdminNextPath(value: unknown) {
  if (typeof value !== "string") return ADMIN_LOGIN_FALLBACK_PATH;

  const next = value.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return ADMIN_LOGIN_FALLBACK_PATH;
  }

  if (
    next === "/admin" ||
    next.startsWith("/admin/") ||
    next === "/admin-v2" ||
    next.startsWith("/admin-v2/")
  ) {
    return next;
  }

  return ADMIN_LOGIN_FALLBACK_PATH;
}
