import { openClassicAdminV2Module } from "@/lib/admin-v2/classic-module-bridge";

export default async function AdminV2ClassicCategoriesPage() {
  return openClassicAdminV2Module("categories");
}
