import type { Metadata } from "next";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Orders | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test orders.",
};

export default function AdminOrdersPage() {
  return <AdminPanel view="orders" />;
}
