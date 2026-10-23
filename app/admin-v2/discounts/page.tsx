import { openClassicAdminV2Module } from "@/lib/admin-v2/classic-module-bridge";

export default async function AdminV2ClassicDiscountsPage() {
  return openClassicAdminV2Module("discounts");
}
