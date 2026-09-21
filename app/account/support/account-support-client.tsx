"use client";

import "@/app/account/support/account-support.css";

import { useEffect, useState } from "react";
import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import { readAccountJson } from "@/app/account/_shared/account-request";
import { Panel } from "@/app/account/_shared/account-ui";
import type { SupportPayload } from "@/app/account/_shared/account-types";
import SupportView from "@/app/account/support/account-support-view";

function SupportContent({ customer, settings, logout, openLiveChat }: AccountShellContext) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    readAccountJson<SupportPayload>("/api/account/support")
      .then((payload) => { if (active) setMessage(payload.message ?? ""); })
      .catch((cause) => { if (active) setMessage(cause instanceof Error ? cause.message : "Support history is unavailable."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  if (isLoading) return <Panel>Loading your account...</Panel>;
  return <SupportView message={message} settings={settings} customer={customer} onLogout={logout} onOpenLiveChat={openLiveChat} />;
}

export default function AccountSupportClient() {
  return <AccountShell view="support">{(context) => <SupportContent {...context} />}</AccountShell>;
}
