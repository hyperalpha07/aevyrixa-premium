import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/lib/admin-auth";
import { safeAdminNextPath } from "@/app/lib/admin-login";
import AdminLoginForm from "./admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login | Aevyrixa",
  description: "Secure login for Aevyrixa Her Care admin.",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = safeAdminNextPath(rawNext);

  if (await hasAdminSession()) redirect(nextPath);

  return <AdminLoginForm nextPath={nextPath} />;
}
