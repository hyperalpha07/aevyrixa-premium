import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { getStoreSettings, saveStoreSettings } from "@/app/lib/settings-store";
import {
 getNativeCategory, mergeNativeCategory, nativeCategoryDefinitions,
 validateNativeCategoryUpdate, type CategoryId, type CategoryUpdate,
} from "@/lib/admin-v2/categories/category-fields";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "categories.manage")) return forbiddenAdminResponse();
  const { id } = await context.params;
  if (!nativeCategoryDefinitions.some(x => x.id === id))
    return Response.json({ errors: ["Unsupported storefront category."] }, { status: 404 });
  const body = await request.json().catch(() => null) as { expected?: CategoryUpdate; update?: CategoryUpdate } | null;
  const expected = validateNativeCategoryUpdate(body?.expected);
  const update = validateNativeCategoryUpdate(body?.update);
  if (!expected || !update) return Response.json({ errors: ["Invalid category fields or URL."] }, { status: 400 });

  try {
    const current = await getStoreSettings();
    if (current.storageMode !== "supabase") return Response.json({ errors: ["Persisted store settings unavailable."] }, { status: 503 });
    const categoryId = id as CategoryId;
    const actual = getNativeCategory(current.settings, categoryId);
    for (const field of ["state", "title", "description", "link", "sortOrder"] as const) {
      if (actual[field] !== expected[field]) return Response.json({
        errors: ["Category changed in another session. Refresh before saving."],
      }, { status: 409 });
    }
    if (JSON.stringify(expected) === JSON.stringify(update)) return Response.json({ category: actual, unchanged: true });
    const next = mergeNativeCategory(current.settings, categoryId, update);
    const saved = await saveStoreSettings(next);
    if (saved.storageMode !== "supabase") return Response.json({ errors: ["Category save was not persisted."] }, { status: 503 });
    await logStaffActivity({
      actor: session, action: "settings.saved", targetType: "settings", targetId: "public",
      metadata: { operation: "native-category", categoryId, changedFields: Object.keys(update).filter(k =>
        update[k as keyof CategoryUpdate] !== expected[k as keyof CategoryUpdate]) },
    });
    return Response.json({ category: getNativeCategory(saved.settings, categoryId) }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("[admin-v2:categories] Save failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ errors: ["Unable to persist the category update."] }, { status: 503 });
  }
}
