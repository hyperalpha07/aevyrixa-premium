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
  const [returnTo, setReturnTo] = useState("/account");
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("returnTo");
    if (next?.startsWith("/") && !next.startsWith("//")) {
      setReturnTo(next);
    }
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
      router.replace(returnTo);
    } catch {
      setError("Account service is temporarily unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080611] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,77,184,0.09),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.07),transparent_32%),linear-gradient(180deg,#080611_0%,#0B0F1A_100%)]" />
      <SiteHeader settings={settings} active="account" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#FF4DB8]/75">
            Customer Account
          </p>
          <h1 className="mt-4 break-words text-3xl font-semibold leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-5xl">
            {isRegister ? "Create your account." : "Welcome back."}
          </h1>
          <p className="mt-5 text-sm leading-7 text-[#9C91AA]">
            Use your account for saved addresses, order history, and faster checkout.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="action-muted" href="/checkout">Back to checkout</Link>
            <Link className="action-muted" href="/track-order">Track order</Link>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="min-w-0 rounded-[1.75rem] border border-[#FF4DB8]/14 bg-[#151024] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.28)] sm:p-6"
        >
          <h2 className="text-2xl font-semibold text-white">
            {isRegister ? "Create Account" : "Login"}
          </h2>
          <p className="mt-1 text-sm text-[#9C91AA]">
            {isRegister ? "Join the Her Care community." : "Login to your Her Care account."}
          </p>
          {isRegister && (
            <>
              <Input label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
              <Input label="Email (optional)" type="email" value={email} onChange={setEmail} autoComplete="email" />
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
            <p className="mt-2 text-xs leading-5 text-[#9C91AA]">
              Password must be at least 8 characters.
            </p>
          )}
          {error && (
            <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm text-rose-100/80">
              {error}
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="action-primary mt-6 w-full disabled:opacity-60">
            {isSubmitting ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
          <p className="mt-5 text-center text-sm text-[#9C91AA]">
            {isRegister ? "Already have an account?" : "New customer?"}{" "}
            <Link
              href={isRegister ? "/account/login" : "/account/register"}
              className="font-semibold text-[#FFB3D1] transition hover:text-white"
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
      <span className="text-sm font-medium text-[#D8CBE8]">{label}</span>
      <input
        required={label !== "Email (optional)"}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-[#6B5F7A] focus:border-[#FF4DB8]/40 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.07)]"
      />
    </label>
  );
}
