import {
  unauthorizedAdminResponse,
  verifyAdminRequest,
} from "@/app/lib/admin-auth";
import { normalizeAdminSettings } from "@/app/lib/admin-settings";
import {
  getStoreSettings,
  saveStoreSettings,
  settingsStoreErrorResponse,
} from "@/app/lib/settings-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}

export async function GET() {
  const result = await getStoreSettings();
  return json(result);
}

export async function PATCH(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  try {
    const result = await saveStoreSettings(normalizeAdminSettings(payload));
    return json(result);
  } catch (error) {
    console.error("Failed to save store settings:", error);
    const response = settingsStoreErrorResponse(error);
    return json(response.body, { status: response.status });
  }
}
