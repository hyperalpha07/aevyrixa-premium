import type { Metadata } from "next";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "Products | Aevyrixa Admin",
  description: "Manage local Aevyrixa Her Care test products.",
};

export default function AdminProductsPage() {
  return <AdminPanel view="products" />;
}
