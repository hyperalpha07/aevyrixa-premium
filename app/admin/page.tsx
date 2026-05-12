import type { Metadata } from "next";
import AdminPanel from "./admin-panel";

export const metadata: Metadata = {
  title: "Aevyrixa Admin",
  description: "Local admin dashboard for Aevyrixa Her Care test orders.",
};

export default function AdminPage() {
  return <AdminPanel view="dashboard" />;
}
