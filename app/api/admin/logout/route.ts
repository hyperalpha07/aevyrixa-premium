import { ADMIN_SESSION_COOKIE } from "@/app/lib/admin-auth";
import { getPersistentAdminSession, revokeAdminSession } from "@/app/lib/admin-identity-access";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  return cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export async function POST(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  const session = await getPersistentAdminSession(token).catch(() => null);
  if (session) await revokeAdminSession(session.id, "logout").catch(() => null);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
