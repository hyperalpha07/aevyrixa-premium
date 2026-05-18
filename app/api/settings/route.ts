import {
  forbiddenAdminResponse,
  unauthorizedAdminResponse,
  verifyAdminRequest,
  verifyAdminRequestPermission,
} from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { normalizeAdminSettings } from "@/app/lib/admin-settings";
import {
  getStoreSettings,
  saveStoreSettings,
  settingsStoreErrorResponse,
  toPublicSettingsPayload,
} from "@/app/lib/settings-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}

export async function GET(request: Request) {
  const result = await getStoreSettings();
  if (verifyAdminRequest(request)) return json(result);

  return json({
    ...result,
    settings: toPublicSettingsPayload(result.settings),
  });
}

export async function PATCH(request: Request) {
  const session =
    verifyAdminRequestPermission(request, "settings.editBasic") ||
    verifyAdminRequestPermission(request, "homepage.manage") ||
    verifyAdminRequestPermission(request, "categories.manage");
  if (!session) return forbiddenAdminResponse();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  try {
    const result = await saveStoreSettings(normalizeAdminSettings(payload));
    await logStaffActivity({
      actor: session,
      action: "settings.saved",
      targetType: "settings",
      targetId: "public",
    });
    return json(result);
  } catch (error) {
    console.error("Failed to save store settings:", error);
    const response = settingsStoreErrorResponse(error);
    return json(response.body, { status: response.status });
  }
}
