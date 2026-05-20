import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission, type AdminPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { normalizeAdminSettings, type AdminSettings } from "@/app/lib/admin-settings";
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

function sameValue(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function changedHomepagePermissions(
  current: AdminSettings,
  next: AdminSettings
): AdminPermission[] {
  const currentMedia = current.homepageMediaSettings as unknown as Record<string, unknown>;
  const nextMedia = next.homepageMediaSettings as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(currentMedia), ...Object.keys(nextMedia)]);
  const permissions = new Set<AdminPermission>();

  keys.forEach((key) => {
    if (sameValue(currentMedia[key], nextMedia[key])) return;
    permissions.add(key.startsWith("category") ? "categories.manage" : "homepage.manage");
  });

  return [...permissions];
}

function requiredSettingsPermissions(
  currentSettings: AdminSettings,
  nextSettings: AdminSettings
) {
  const current = normalizeAdminSettings(currentSettings);
  const next = normalizeAdminSettings(nextSettings);
  const required = new Set<AdminPermission>();

  if (!sameValue(current.storeProfile, next.storeProfile)) required.add("settings.editBasic");
  if (!sameValue(current.checkoutSettings, next.checkoutSettings)) required.add("settings.editBasic");
  if (!sameValue(current.policySettings, next.policySettings)) required.add("settings.editBasic");
  if (!sameValue(current.appearanceSettings, next.appearanceSettings)) required.add("settings.editBasic");
  if (
    !sameValue(current.appearanceSettings, next.appearanceSettings) &&
    !sameValue(
      {
        enableAnnouncement: current.appearanceSettings.enableAnnouncement,
        announcementText: current.appearanceSettings.announcementText,
        announcementLinkLabel: current.appearanceSettings.announcementLinkLabel,
        announcementLinkUrl: current.appearanceSettings.announcementLinkUrl,
        announcementStyle: current.appearanceSettings.announcementStyle,
        showOnHomepage: current.appearanceSettings.showOnHomepage,
        showOnShop: current.appearanceSettings.showOnShop,
        showOnProductPages: current.appearanceSettings.showOnProductPages,
        showOnCheckout: current.appearanceSettings.showOnCheckout,
      },
      {
        enableAnnouncement: next.appearanceSettings.enableAnnouncement,
        announcementText: next.appearanceSettings.announcementText,
        announcementLinkLabel: next.appearanceSettings.announcementLinkLabel,
        announcementLinkUrl: next.appearanceSettings.announcementLinkUrl,
        announcementStyle: next.appearanceSettings.announcementStyle,
        showOnHomepage: next.appearanceSettings.showOnHomepage,
        showOnShop: next.appearanceSettings.showOnShop,
        showOnProductPages: next.appearanceSettings.showOnProductPages,
        showOnCheckout: next.appearanceSettings.showOnCheckout,
      }
    )
  ) {
    required.add("announcement.manage");
  }

  if (!sameValue(current.paymentSettings, next.paymentSettings)) required.add("settings.editSensitive");
  if (!sameValue(current.deliverySettings, next.deliverySettings)) required.add("settings.editSensitive");
  if (!sameValue(current.orderSettings, next.orderSettings)) required.add("settings.editSensitive");
  if (!sameValue(current.notificationSettings, next.notificationSettings)) required.add("settings.editSensitive");
  if (!sameValue(current.advancedSettings, next.advancedSettings)) required.add("settings.editSensitive");

  if (!sameValue(current.seoSettings, next.seoSettings)) required.add("settings.editSeoAnalytics");
  changedHomepagePermissions(current, next).forEach((permission) => required.add(permission));

  return [...required];
}

export async function GET(request: Request) {
  const result = await getStoreSettings();
  const session = await getFreshAdminRequestSession(request);
  if (
    hasPermission(session, "settings.view") ||
    hasPermission(session, "settings.editBasic") ||
    hasPermission(session, "settings.editSensitive") ||
    hasPermission(session, "settings.editSeoAnalytics") ||
    hasPermission(session, "homepage.manage") ||
    hasPermission(session, "categories.manage")
  ) {
    return json(result);
  }

  return json({
    ...result,
    settings: toPublicSettingsPayload(result.settings),
  });
}

export async function PATCH(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  try {
    const current = await getStoreSettings();
    const nextSettings = normalizeAdminSettings(payload);
    const requiredPermissions = requiredSettingsPermissions(
      current.settings,
      nextSettings
    );
    const missingPermission = requiredPermissions.find(
      (permission) => !hasPermission(session, permission)
    );

    if (missingPermission) {
      await logStaffActivity({
        actor: session,
        action: "permission.denied",
        targetType: "settings",
        targetId: missingPermission,
        metadata: { reason: "missing_permission" },
      });
      return forbiddenAdminResponse();
    }

    const result = await saveStoreSettings(nextSettings);
    await logStaffActivity({
      actor: session,
      action: "settings.saved",
      targetType: "settings",
      targetId: "public",
      metadata: { permissions: requiredPermissions },
    });
    return json(result);
  } catch (error) {
    console.error("Failed to save store settings:", error);
    const response = settingsStoreErrorResponse(error);
    return json(response.body, { status: response.status });
  }
}
