import { openClassicAdminV2Module } from "@/lib/admin-v2/classic-module-bridge";

export default async function AdminV2ClassicSettingsPage() {
  return openClassicAdminV2Module("settings");
}
