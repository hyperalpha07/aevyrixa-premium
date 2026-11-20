"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import type { IntegrationFact, IntegrationStatus } from "@/lib/admin-v2/integrations/status";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

type ProbeResult = {
  state: "verified_identity" | "not_configured" | "unverified" | "unavailable";
  message: string;
  username?: string;
  checkedAt?: string;
};

const groups = ["Backend", "Messaging", "Payments", "Delivery", "Analytics"] as const;
const labels: Record<IntegrationStatus, string> = {
  responding: "Backend read succeeded",
  configured: "Configured — not verified",
  manual: "Manual workflow",
  disabled: "Disabled",
  not_configured: "Not configured",
  unavailable: "Source unavailable",
};

function statusColor(status: IntegrationStatus): "success" | "default" | "error" {
  if (status === "responding") return "success";
  if (status === "unavailable") return "error";
  return "default";
}

export function AdminV2IntegrationsView({
  facts,
  canVerifyProvider,
}: {
  facts: IntegrationFact[];
  canVerifyProvider: boolean;
}) {
  const router = useRouter();
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [checking, setChecking] = useState(false);

  async function verifyTelegram() {
    setChecking(true);
    setProbe(null);
    try {
      const response = await fetch("/api/admin-v2/integrations/verify?provider=telegram", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as ProbeResult | null;
      if (!response.ok || !payload || typeof payload.message !== "string") {
        setProbe({ state: "unavailable", message: response.status === 403
          ? "Your account cannot verify provider credentials."
          : "Telegram identity check could not be completed." });
        return;
      }
      setProbe(payload);
    } catch {
      setProbe({ state: "unavailable", message: "Telegram identity check could not be completed." });
    } finally {
      setChecking(false);
    }
  }

  return <>
    <V2PageHeader
      title="Integrations"
      description="Operational connections, settings and safely verified capabilities — without simulated API connections or invented delivery history."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Integrations" }]}
      actions={<Stack direction="row" spacing={1}>
        <Button variant="outlined" component={Link} href="/admin/integrations">Classic settings</Button>
        <Button variant="outlined" onClick={() => { setProbe(null); router.refresh(); }}>Refresh facts</Button>
      </Stack>}
    />
    <Stack spacing={2}>
      <Alert severity="info">
        Configuration is not proof of API access, transaction settlement, successful notifications, courier bookings, or live analytics.
        Provider keys and contact numbers are never returned to this page. No test message, payment or courier booking is sent.
      </Alert>
      {groups.map((group) => {
        const entries = facts.filter((fact) => fact.group === group);
        if (!entries.length) return null;
        return <Stack key={group} spacing={1.25}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{group}</Typography>
          {entries.map((fact) => <V2Card key={fact.id}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
              <Stack spacing={0.65} sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fact.name}</Typography>
                <Typography variant="body2" color="text.secondary">{fact.detail}</Typography>
              </Stack>
              <Stack direction={{ xs: "row", md: "column" }} spacing={1} sx={{ alignItems: { xs: "center", md: "flex-end" }, flexShrink: 0, flexWrap: "wrap" }}>
                <Chip variant="outlined" size="small" color={statusColor(fact.status)} label={labels[fact.status]} />
                <Stack direction="row" spacing={1}>
                  <Button component={Link} href={fact.actionHref} size="small" variant="outlined">{fact.actionLabel}</Button>
                  {fact.id === "telegram" && fact.canCheckIdentity && canVerifyProvider
                    ? <Button size="small" variant="contained" disabled={checking} onClick={() => void verifyTelegram()}>
                        {checking ? "Checking..." : "Verify bot identity"}
                      </Button>
                    : null}
                </Stack>
              </Stack>
            </Stack>
            {fact.id === "telegram" && probe
              ? <Alert severity={probe.state === "verified_identity" ? "success" : "warning"} sx={{ mt: 1.5 }}>
                  {probe.message}
                  {probe.username ? ` (@${probe.username})` : ""}
                  {probe.checkedAt ? ` Checked ${new Date(probe.checkedAt).toLocaleString()}.` : ""}
                </Alert>
              : null}
          </V2Card>)}
        </Stack>;
      })}
      <Alert severity="info">
        Merchant gateways, automated courier booking, WhatsApp Business API messaging and provider webhooks need
        verified provider accounts, credentials and isolated integration tests before they can be enabled.
      </Alert>
    </Stack>
  </>;
}
