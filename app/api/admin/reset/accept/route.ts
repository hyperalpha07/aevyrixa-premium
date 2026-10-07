import { acceptPasswordReset } from "@/app/lib/admin-identity-access";
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
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
    } as Record<string, unknown>;
  }
  return await request.json().catch(() => null) as Record<string, unknown> | null;
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const token = text(body?.token);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!token || !password) {
    return Response.json({ errors: ["Reset token and password are required."] }, { status: 400 });
  }
  if (password.length < 12) {
    return Response.json({ errors: ["Password must be at least 12 characters."] }, { status: 400 });
  }
  if (confirmPassword && confirmPassword !== password) {
    return Response.json({ errors: ["Password confirmation does not match."] }, { status: 400 });
  }

  try {
    const result = await acceptPasswordReset({ token, password });
    await logStaffActivity({
      actor: null,
      action: "staff.password_reset_used",
      targetType: "staff",
      targetId: result.staffId,
      metadata: { resetId: result.resetId },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { errors: ["Reset link is invalid or expired."] },
      { status: 400 }
    );
  }
}
