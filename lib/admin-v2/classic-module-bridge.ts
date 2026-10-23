import { redirect } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import type { AdminV2ModuleKey } from "@/configs/admin-v2/routes";

const classicModules = {
  categories: "/admin/categories",
  discounts: "/admin/discounts",
  media: "/admin/media",
  settings: "/admin/settings",
  integrations: "/admin/integrations",
} as const satisfies Partial<Record<AdminV2ModuleKey, string>>;

/**
 * Retain a functional, separately authorized Classic Admin workflow while its
 * native Admin V2 replacement is unfinished. No unauthenticated redirect.
 * Classic pages independently enforce their own section permissions as well.
 */
export async function openClassicAdminV2Module(module: keyof typeof classicModules) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, module);
  redirect(classicModules[module]);
}
