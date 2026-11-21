import { hasPermission } from "@/app/lib/admin-permissions";
import { getStoreSettings } from "@/app/lib/settings-store";
import { AdminV2SettingsView, type AdminV2CoreSettings } from "@/components/admin-v2/views/settings/AdminV2SettingsView";
import { AdminV2ExtendedSettingsView, type EditableWebsiteSettings } from "@/components/admin-v2/views/settings/AdminV2ExtendedSettingsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2SettingsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "settings");
  const current = await getStoreSettings();
  const { storeProfile, checkoutSettings, deliverySettings } = current.settings;
  const initial: AdminV2CoreSettings = {
    storeName: storeProfile.storeName,
    businessLocation: storeProfile.businessLocation,
    supportEmail: storeProfile.supportEmail,
    supportPhone: storeProfile.supportPhone,
    minimumOrderAmount: checkoutSettings.minimumOrderAmount,
    freeDeliveryThreshold: checkoutSettings.freeDeliveryThreshold,
    requireCustomerAccountForCheckout: checkoutSettings.requireCustomerAccountForCheckout,
    deliveryCoverageText: deliverySettings.deliveryCoverageText,
    insideDhakaDeliveryCharge: deliverySettings.insideDhakaDeliveryCharge,
    outsideDhakaDeliveryCharge: deliverySettings.outsideDhakaDeliveryCharge,
  };
  const advancedInitial: EditableWebsiteSettings = {
    storeProfile: current.settings.storeProfile,
    checkoutSettings: current.settings.checkoutSettings,
    policySettings: current.settings.policySettings,
    seoSettings: current.settings.seoSettings,
    notificationSettings: current.settings.notificationSettings,
    appearanceSettings: current.settings.appearanceSettings,
  };
  return <>
    <AdminV2SettingsView initial={initial} storageMode={current.storageMode}
      canEditBasic={hasPermission(session, "settings.editBasic")}
      canEditSensitive={hasPermission(session, "settings.editSensitive")} />
    <AdminV2ExtendedSettingsView
      initial={advancedInitial} storageMode={current.storageMode}
      canEdit={{
        storeProfile: hasPermission(session, "settings.editBasic"),
        checkoutSettings: hasPermission(session, "settings.editBasic"),
        policySettings: hasPermission(session, "settings.editBasic"),
        seoSettings: hasPermission(session, "settings.editSeoAnalytics"),
        notificationSettings: hasPermission(session, "settings.editSensitive"),
        appearanceSettings: hasPermission(session, "settings.editBasic") && hasPermission(session, "announcement.manage"),
      }} />
  </>;
}
