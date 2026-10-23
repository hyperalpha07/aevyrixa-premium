import { openClassicAdminV2Module } from "@/lib/admin-v2/classic-module-bridge";

export default async function AdminV2ClassicIntegrationsPage() {
  return openClassicAdminV2Module("integrations");
}
