import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionClearCookieOptions,
  deleteCustomerSession,
} from "@/app/lib/customer-account-store";
import { readCookie } from "@/app/api/account/_utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = readCookie(request, CUSTOMER_SESSION_COOKIE);
  await deleteCustomerSession(token).catch(() => null);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", customerSessionClearCookieOptions());
  return response;
}
