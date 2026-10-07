import Link from "next/link";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AdminResetPage({ params }: Props) {
  const { token } = await params;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f2fb" }}>
      <section style={{ width: "min(100%, 440px)", borderRadius: 24, border: "1px solid rgba(124,58,237,0.18)", background: "rgba(255,255,255,0.92)", boxShadow: "0 24px 80px rgba(76,29,149,0.16)", padding: "2rem" }}>
        <p style={{ margin: 0, color: "#7c3aed", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Password reset</p>
        <h1 style={{ margin: "0.6rem 0 0.7rem", color: "#25113f" }}>Set a new admin password</h1>
        <p style={{ color: "#6b5f7a", lineHeight: 1.6 }}>Reset links are single-use, expiring security tokens. Active sessions are revoked after reset.</p>
        <form method="post" action="/api/admin/reset/accept" style={{ display: "grid", gap: "0.9rem", marginTop: "1.4rem" }}>
          <input type="hidden" name="token" value={token} />
          <input name="password" type="password" minLength={12} placeholder="New password" required style={fieldStyle} />
          <input name="confirmPassword" type="password" minLength={12} placeholder="Confirm new password" required style={fieldStyle} />
          <button type="submit" style={buttonStyle}>Reset password</button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: 13, color: "#7b7088" }}>
          If this link expired, ask an owner/admin to create a new reset link. <Link href="/admin/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

const fieldStyle = {
  border: "1px solid rgba(124,58,237,0.24)",
  borderRadius: 14,
  padding: "0.9rem 1rem",
  color: "#25113f",
  background: "rgba(255,255,255,0.96)",
} satisfies CSSProperties;

const buttonStyle = {
  border: 0,
  borderRadius: 14,
  padding: "0.95rem 1rem",
  color: "white",
  fontWeight: 800,
  background: "linear-gradient(135deg, #db2777, #8b5cf6)",
  cursor: "pointer",
} satisfies CSSProperties;
