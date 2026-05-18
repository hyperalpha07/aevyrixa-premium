"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type Mode = "login" | "register";

export default function AccountAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  useEffect(() => {
    let isActive = true;
    void fetchStorefrontSettings().then((next) => {
      if (isActive) setSettings(next);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { errors?: string[] };
      if (!response.ok) {
        setError(payload.errors?.[0] || "Account request failed.");
        return;
      }
      router.replace("/account");
    } catch {
      setError("Account service is temporarily unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_52%,#030612_100%)]" />
      <SiteHeader settings={settings} active="account" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/72">
            Customer Account
          </p>
          <h1 className="mt-4 break-words text-3xl font-semibold leading-tight [overflow-wrap:anywhere] sm:text-5xl">
            {isRegister ? "Create an optional account." : "Login to your account."}
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/64">
            Guest checkout remains available. Accounts only help you view order history and saved addresses faster.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="action-muted" href="/checkout">Continue as guest</Link>
            <Link className="action-muted" href="/track-order">Track order</Link>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6"
        >
          <h2 className="text-2xl font-semibold text-white">
            {isRegister ? "Register" : "Login"}
          </h2>
          {isRegister && (
            <>
              <Input label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
              <Input label="Email optional" type="email" value={email} onChange={setEmail} autoComplete="email" />
            </>
          )}
          <Input label="Phone number" value={phone} onChange={setPhone} autoComplete="tel" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          {isRegister && (
            <p className="mt-2 text-xs leading-5 text-white/48">
              Password must be at least 8 characters.
            </p>
          )}
          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">
              {error}
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="action-primary mt-6 w-full disabled:opacity-60">
            {isSubmitting ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
          <p className="mt-5 text-center text-sm text-white/58">
            {isRegister ? "Already have an account?" : "New customer?"}{" "}
            <Link
              href={isRegister ? "/account/login" : "/account/register"}
              className="font-semibold text-cyan-100 hover:text-white"
            >
              {isRegister ? "Login" : "Create account"}
            </Link>
          </p>
        </form>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-medium text-white/72">{label}</span>
      <input
        required={label !== "Email optional"}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/45"
      />
    </label>
  );
}
