"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function apiErrorMessage(payload: unknown) {
  if (!isRecord(payload)) return "Login failed.";
  if (Array.isArray(payload.errors)) {
    const errors = payload.errors.filter((error): error is string => typeof error === "string");
    if (errors.length > 0) return errors.join(" ");
  }
  return "Login failed.";
}

export default function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, next: nextPath }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid username or password.");
        } else if (response.status === 404) {
          setError("Login service is unavailable. Please restart the server or contact support.");
        } else {
          setError(apiErrorMessage(payload));
        }
        return;
      }

      router.replace(isRecord(payload) && typeof payload.next === "string" ? payload.next : nextPath);
      router.refresh();
    } catch {
      setError("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center overflow-x-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-10%] h-[340px] w-[340px] rounded-full bg-cyan-400/16 blur-[130px]" />
        <div className="absolute right-[-18%] top-[22%] h-[360px] w-[360px] rounded-full bg-fuchsia-400/14 blur-[150px]" />
      </div>
      <form
        onSubmit={submitLogin}
        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_0_70px_rgba(34,211,238,0.10)] backdrop-blur-2xl sm:p-7"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Aevyrixa Admin
        </p>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">
          Admin login
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/56">
          Use the admin username and password configured in the server environment.
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
            Username
          </span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            autoComplete="username"
            className="w-full rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45"
            placeholder="Admin username"
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
            Password
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45"
            placeholder="Admin password"
            required
          />
        </label>

        {error && (
          <p className="mt-3 rounded-2xl border border-rose-200/20 bg-rose-200/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Checking..." : "Enter Admin"}
        </button>

        <Link
          href="/"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-cyan-200/35 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </form>
    </main>
  );
}
