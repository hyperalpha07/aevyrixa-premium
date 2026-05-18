import {
  CUSTOMER_SESSION_COOKIE,
  CustomerAccountError,
  getCustomerBySessionToken,
  safeAccount,
} from "@/app/lib/customer-account-store";

export function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function getCustomerFromRequest(request: Request) {
  const token = readCookie(request, CUSTOMER_SESSION_COOKIE);
  return getCustomerBySessionToken(token);
}

export async function requireCustomer(request: Request) {
  const customer = await getCustomerFromRequest(request);
  if (!customer) {
    return {
      customer: null,
      response: Response.json(
        { errors: ["Please log in to continue."] },
        { status: 401 }
      ),
    };
  }

  return { customer, response: null };
}

export function customerErrorResponse(error: unknown) {
  if (error instanceof CustomerAccountError) {
    return Response.json(
      { errors: [error.publicMessage], code: error.code },
      { status: error.status }
    );
  }

  console.error("Customer account API error:", error);
  return Response.json(
    { errors: ["Customer account is temporarily unavailable."] },
    { status: 500 }
  );
}

export function safeSessionPayload(customer: NonNullable<Awaited<ReturnType<typeof getCustomerFromRequest>>>) {
  return { customer: safeAccount(customer) };
}
