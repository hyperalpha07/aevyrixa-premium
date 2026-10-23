"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert, Box, Button, Checkbox, FormControlLabel, Grid, Stack, TextField, Typography,
} from "@mui/material";
import type { AdminSettings } from "@/app/lib/admin-settings";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

export type AdminV2CoreSettings = {
  storeName: string;
  businessLocation: string;
  supportEmail: string;
  supportPhone: string;
  minimumOrderAmount: string;
  freeDeliveryThreshold: string;
  requireCustomerAccountForCheckout: boolean;
  deliveryCoverageText: string;
  insideDhakaDeliveryCharge: string;
  outsideDhakaDeliveryCharge: string;
};

const basicKeys = [
  "storeName", "businessLocation", "supportEmail", "supportPhone",
  "minimumOrderAmount", "freeDeliveryThreshold", "requireCustomerAccountForCheckout",
] as const;
const deliveryKeys = ["deliveryCoverageText", "insideDhakaDeliveryCharge", "outsideDhakaDeliveryCharge"] as const;
type Group = "basic" | "delivery";

function extract(settings: AdminSettings): AdminV2CoreSettings {
  return {
    storeName: settings.storeProfile.storeName,
    businessLocation: settings.storeProfile.businessLocation,
    supportEmail: settings.storeProfile.supportEmail,
    supportPhone: settings.storeProfile.supportPhone,
    minimumOrderAmount: settings.checkoutSettings.minimumOrderAmount,
    freeDeliveryThreshold: settings.checkoutSettings.freeDeliveryThreshold,
    requireCustomerAccountForCheckout: settings.checkoutSettings.requireCustomerAccountForCheckout,
    deliveryCoverageText: settings.deliverySettings.deliveryCoverageText,
    insideDhakaDeliveryCharge: settings.deliverySettings.insideDhakaDeliveryCharge,
    outsideDhakaDeliveryCharge: settings.deliverySettings.outsideDhakaDeliveryCharge,
  };
}
function moneyAmount(value: string) {
  const parsed = Number(value.trim());
  return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1000000;
}
function valid(group: Group, draft: AdminV2CoreSettings) {
  if (group === "basic") {
    return draft.storeName.trim().length >= 2 && draft.storeName.length <= 120 &&
      draft.supportEmail.length <= 254 && (!draft.supportEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail)) &&
      draft.supportPhone.length <= 50 && draft.businessLocation.length <= 250 &&
      moneyAmount(draft.minimumOrderAmount) && moneyAmount(draft.freeDeliveryThreshold);
  }
  return draft.deliveryCoverageText.length <= 500 &&
    moneyAmount(draft.insideDhakaDeliveryCharge) && moneyAmount(draft.outsideDhakaDeliveryCharge);
}

export function AdminV2SettingsView({
  initial, storageMode, canEditBasic, canEditSensitive,
}: {
  initial: AdminV2CoreSettings; storageMode: string;
  canEditBasic: boolean; canEditSensitive: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [saving, setSaving] = useState<Group | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const available = storageMode === "supabase";
  const patch = <K extends keyof AdminV2CoreSettings>(key: K, value: AdminV2CoreSettings[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function save(group: Group) {
    if (saving || !available || !(group === "basic" ? canEditBasic : canEditSensitive)) return;
    if (!valid(group, draft)) {
      setNotice({ kind: "error", text: "Review required fields and numeric amounts before saving." });
      return;
    }
    setSaving(group);
    setNotice(null);
    try {
      // Fetch the current complete configuration immediately before PATCH.
      // Never send a stale full-settings snapshot from initial server rendering.
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load the latest settings.");
      const data = await response.json() as { settings?: AdminSettings; storageMode?: string };
      if (!data.settings || data.storageMode !== "supabase") throw new Error("Persisted settings are unavailable.");
      const live = extract(data.settings);
      const keys: readonly (keyof AdminV2CoreSettings)[] = group === "basic" ? basicKeys : deliveryKeys;
      if (keys.some((key) => live[key] !== baseline[key])) {
        throw new Error("Settings were changed in another session. Refresh the page before saving.");
      }
      const next: AdminSettings = group === "basic"
        ? {
            ...data.settings,
            storeProfile: {
              ...data.settings.storeProfile,
              storeName: draft.storeName.trim(),
              businessLocation: draft.businessLocation.trim(),
              supportEmail: draft.supportEmail.trim(),
              supportPhone: draft.supportPhone.trim(),
            },
            checkoutSettings: {
              ...data.settings.checkoutSettings,
              minimumOrderAmount: draft.minimumOrderAmount.trim(),
              freeDeliveryThreshold: draft.freeDeliveryThreshold.trim(),
              requireCustomerAccountForCheckout: draft.requireCustomerAccountForCheckout,
            },
          }
        : {
            ...data.settings,
            deliverySettings: {
              ...data.settings.deliverySettings,
              deliveryCoverageText: draft.deliveryCoverageText.trim(),
              insideDhakaDeliveryCharge: draft.insideDhakaDeliveryCharge.trim(),
              outsideDhakaDeliveryCharge: draft.outsideDhakaDeliveryCharge.trim(),
            },
          };
      const saved = await fetch("/api/settings", {
        method: "PATCH", headers: { "content-type": "application/json" },
        cache: "no-store", body: JSON.stringify(next),
      });
      const result = await saved.json().catch(() => ({}));
      if (!saved.ok) throw new Error(Array.isArray(result.errors) ? result.errors.join(" ") : "Settings save failed.");
      if (result.storageMode !== "supabase") throw new Error("The settings write was not persisted.");
      const updated = extract(result.settings as AdminSettings);
      setBaseline(updated);
      setDraft(updated);
      setNotice({ kind: "success", text: "Store settings saved to the live configuration. Checkout reflects the latest saved values." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Settings save failed." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <V2PageHeader title="Store Settings"
        description="Persisted store identity, checkout rules and delivery charges. Advanced configurations remain available in Classic Admin."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Settings" }]}
        actions={<Button component={Link} href="/admin/settings" variant="outlined">Advanced Classic Settings</Button>} />
      <Stack spacing={3}>
        {!available ? <Alert severity="error">Settings storage is {storageMode}; changes are disabled until the persistent source is available.</Alert> : null}
        <Alert severity="info">Edit only verified business details. Payment wallet credentials, SEO, categories, policy text and integrations remain managed through Advanced Classic Settings. No default credentials or fees are added automatically.</Alert>
        {notice ? <Alert severity={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Alert> : null}
        <V2Card>
          <Stack spacing={2}>
            <Typography variant="h6">Store identity & checkout</Typography>
            <Grid container spacing={2}>
              {([
                ["storeName", "Store name"], ["businessLocation","Business location"],
                ["supportEmail","Support email"], ["supportPhone","Support phone"],
                ["minimumOrderAmount","Minimum order (BDT)"], ["freeDeliveryThreshold","Free delivery threshold (BDT)"],
              ] as const).map(([key,label]) =>
                <Grid key={key} size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size="small" label={label} value={draft[key]} disabled={!available || !canEditBasic || !!saving}
                    onChange={(event) => patch(key, event.target.value)} />
                </Grid>
              )}
            </Grid>
            <FormControlLabel control={<Checkbox checked={draft.requireCustomerAccountForCheckout}
              disabled={!available || !canEditBasic || !!saving}
              onChange={(event) => patch("requireCustomerAccountForCheckout", event.target.checked)} />}
              label="Require customer account before checkout" />
            <Box sx={{ textAlign: "right" }}>
              <Button variant="contained" disabled={!available || !canEditBasic || !!saving || !valid("basic",draft)}
                onClick={() => void save("basic")}>{saving === "basic" ? "Saving…" : "Save basic settings"}</Button>
            </Box>
          </Stack>
        </V2Card>
        <V2Card>
          <Stack spacing={2}>
            <Typography variant="h6">Delivery coverage & charges</Typography>
            <Grid container spacing={2}>
              {([
                ["deliveryCoverageText", "Delivery coverage"], ["insideDhakaDeliveryCharge","Inside Dhaka (BDT)"],
                ["outsideDhakaDeliveryCharge","Outside Dhaka (BDT)"],
              ] as const).map(([key,label]) =>
                <Grid key={key} size={{ xs: 12, md: key === "deliveryCoverageText" ? 12 : 6 }}>
                  <TextField fullWidth size="small" label={label} value={draft[key]} disabled={!available || !canEditSensitive || !!saving}
                    onChange={(event) => patch(key, event.target.value)} />
                </Grid>
              )}
            </Grid>
            <Alert severity="warning">Changes to delivery charges affect future checkout quotes. They do not modify historical customer orders or accounting entries.</Alert>
            <Box sx={{ textAlign: "right" }}>
              <Button variant="contained" disabled={!available || !canEditSensitive || !!saving || !valid("delivery",draft)}
                onClick={() => void save("delivery")}>{saving === "delivery" ? "Saving…" : "Save delivery settings"}</Button>
            </Box>
          </Stack>
        </V2Card>
      </Stack>
    </>
  );
}
