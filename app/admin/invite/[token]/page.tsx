import Link from "next/link";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AdminInvitePage({ params }: Props) {
  const { token } = await params;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f2fb" }}>
      <section style={{ width: "min(100%, 480px)", borderRadius: 24, border: "1px solid rgba(124,58,237,0.18)", background: "rgba(255,255,255,0.92)", boxShadow: "0 24px 80px rgba(76,29,149,0.16)", padding: "2rem" }}>
        <p style={{ margin: 0, color: "#7c3aed", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin invite</p>
        <h1 style={{ margin: "0.6rem 0 0.7rem", color: "#25113f" }}>Create your admin access</h1>
        <p style={{ color: "#6b5f7a", lineHeight: 1.6 }}>
          This invite is single-use and expires automatically. Choose a username and a 12+ character password.
        </p>
        <form method="post" action="/api/admin/invites/accept" style={{ display: "grid", gap: "0.9rem", marginTop: "1.4rem" }}>
          <input type="hidden" name="token" value={token} />
          <input name="name" placeholder="Full name" required style={fieldStyle} />
          <input name="username" placeholder="Username" required style={fieldStyle} />
          <input name="password" type="password" minLength={12} placeholder="Password" required style={fieldStyle} />
          <button type="submit" style={buttonStyle}>Accept invite</button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: 13, color: "#7b7088" }}>
          If this link was already used or revoked, ask an owner/admin for a new invite. <Link href="/admin/login">Back to login</Link>
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
