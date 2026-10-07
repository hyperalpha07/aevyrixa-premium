import { acceptAdminInvite } from "@/app/lib/admin-identity-access";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readBody(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      token: form.get("token"),
      name: form.get("name"),
      username: form.get("username"),
      password: form.get("password"),
    } as Record<string, unknown>;
  }
  return await request.json().catch(() => null) as Record<string, unknown> | null;
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const token = text(body?.token);
  const name = text(body?.name);
  const username = text(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!token || !name || !username || password.length < 12) {
    return Response.json({ errors: ["Invite token, name, username, and a 12+ character password are required."] }, { status: 400 });
  }
  try {
    const staff = await acceptAdminInvite({ token, name, username, password });
    await logStaffActivity({ action: "staff.invite_accepted", targetType: "staff", targetId: typeof staff?.id === "string" ? staff.id : undefined, metadata: { username } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ errors: ["Invite is invalid or expired."] }, { status: 400 });
  }
}
