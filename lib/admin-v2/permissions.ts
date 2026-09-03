import { redirect } from "next/navigation";
import {
  canAccessSection,
  firstAccessibleAdminPath,
  hasPermission,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";
import { adminV2AccessRules } from "@/configs/admin-v2/permissions";
import type { AdminV2ModuleKey } from "@/configs/admin-v2/routes";

export function canAccessAdminV2Module(
  session: AdminSessionUser | null | undefined,
  module: AdminV2ModuleKey
) {
  const rule = adminV2AccessRules[module];
  if (!rule) return false;
  if (rule.permission && hasPermission(session, rule.permission)) return true;
  if (rule.section && canAccessSection(session, rule.section)) return true;
  return false;
}

export function firstAccessibleAdminV2Path(session: AdminSessionUser | null | undefined) {
  if (!session) return "/admin/login";
  const legacy = firstAccessibleAdminPath(session);
  if (!legacy) return "/admin/login";
  return legacy.replace(/^\/admin$/, "/admin-v2/dashboard").replace(/^\/admin\//, "/admin-v2/");
}

export function requireAdminV2RouteAccess(session: AdminSessionUser, module: AdminV2ModuleKey) {
  if (canAccessAdminV2Module(session, module)) return;
  redirect(firstAccessibleAdminV2Path(session));
}
