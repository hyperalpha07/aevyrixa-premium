import { getStoreSettings } from "@/app/lib/settings-store";
import { normalizeStorefrontSettings } from "@/app/lib/storefront-settings";

export async function loadStorefrontSettings() {
  const result = await getStoreSettings();

  return {
    ...result,
    settings: normalizeStorefrontSettings(result.settings),
  };
}
