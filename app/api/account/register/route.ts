import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerAccount,
  createCustomerSession,
  customerSessionCookieOptions,
  safeAccount,
} from "@/app/lib/customer-account-store";
import { customerErrorResponse } from "@/app/api/account/_utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function passwordText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const accountInput = isRecord(payload)
    ? {
        fullName: text(payload.fullName),
        phone: text(payload.phone),
        email: text(payload.email) || undefined,
        password: passwordText(payload.password),
      }
    : { fullName: "", phone: "", password: "" };

  try {
    const customer = await createCustomerAccount(accountInput);
    const token = await createCustomerSession(
      customer.id,
      request.headers.get("user-agent")
    );
    const response = NextResponse.json({ customer: safeAccount(customer) }, { status: 201 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions());
    return response;
  } catch (error) {
    return customerErrorResponse(error);
  }
}
