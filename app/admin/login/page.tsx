import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import AdminLoginForm from "./admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login | Aevyrixa",
  description: "Secure login for Aevyrixa Her Care admin.",
};

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");

  return <AdminLoginForm />;
}
