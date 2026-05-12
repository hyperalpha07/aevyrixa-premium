import type { Metadata } from "next";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Settings | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care admin settings placeholders.",
};

export default function AdminSettingsPage() {
  return <AdminPanel view="settings" />;
}
