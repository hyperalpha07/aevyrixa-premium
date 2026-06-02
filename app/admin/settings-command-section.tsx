"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ClipboardList,
  Copy,
  Gauge,
  Globe,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import {
  normalizeAdminSettings,
  type AdminSettings,
} from "@/app/lib/admin-settings";
import {
  blockedPermissionMessage,
  hasPermission,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";

type SettingsStorageMode =
  | "supabase"
  | "fallback-default"
  | "fallback-missing-table"
  | "fallback-error";

type SaveSettingsResult = {
  settings: AdminSettings | null;
  storageMode: SettingsStorageMode;
  backendConnected: boolean;
  message?: string;
};

type SettingsCommandSectionProps = {
  settings: AdminSettings;
  storageMode: SettingsStorageMode;
  backendMessage: string;
  onSaveSettings: (settings: AdminSettings) => Promise<SaveSettingsResult>;
  session: AdminSessionUser;
};

const glassPanel =
  "rounded-[1.1rem] border border-white/[0.08] bg-[#071025]/90 shadow-[0_18px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]";
const inputClass =
  "h-9 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[11px] font-medium text-white/78 outline-none transition placeholder:text-white/25 focus:border-fuchsia-300/40";
const selectClass =
  "h-9 w-full rounded-lg border border-white/[0.08] bg-[#080f20] px-3 text-[11px] font-medium text-white/78 outline-none focus:border-fuchsia-300/40";

export default function SettingsCommandSection({
  settings,
  storageMode,
  backendMessage,
  onSaveSettings,
  session,
}: SettingsCommandSectionProps) {
  const [draft, setDraft] = useState(settings);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canSaveAnySettings =
      hasPermission(session, "settings.editBasic") ||
      hasPermission(session, "settings.editSensitive") ||
      hasPermission(session, "settings.editSeoAnalytics") ||
      hasPermission(session, "homepage.manage") ||
      hasPermission(session, "categories.manage");

    if (!canSaveAnySettings) {
      setStatusMessage(blockedPermissionMessage);
      return;
    }

    setIsSaving(true);
    const result = await onSaveSettings(draft);
    setIsSaving(false);
    setStatusMessage(
      result.backendConnected
        ? "Settings saved. Public support details now use the Supabase settings row."
        : "Settings saved locally only. Settings backend is not connected."
    );
  };

  const updateStoreProfile = (updates: Partial<AdminSettings["storeProfile"]>) =>
    setDraft((current) =>
      normalizeAdminSettings({
        ...current,
        storeProfile: { ...current.storeProfile, ...updates },
      })
    );

  const updateOrderSettings = (updates: Partial<AdminSettings["orderSettings"]>) =>
    setDraft((current) =>
      normalizeAdminSettings({
        ...current,
        orderSettings: { ...current.orderSettings, ...updates },
      })
    );

  const updateNotificationSettings = (
    updates: Partial<AdminSettings["notificationSettings"]>
  ) =>
    setDraft((current) =>
      normalizeAdminSettings({
        ...current,
        notificationSettings: {
          ...current.notificationSettings,
          ...updates,
          telegramChatStatus: "Configured in environment",
        },
      })
    );

  const updateAppearanceSettings = (
    updates: Partial<AdminSettings["appearanceSettings"]>
  ) =>
    setDraft((current) =>
      normalizeAdminSettings({
        ...current,
        appearanceSettings: { ...current.appearanceSettings, ...updates },
      })
    );

  const updateAdvancedSettings = (
    updates: Partial<AdminSettings["advancedSettings"]>
  ) =>
    setDraft((current) =>
      normalizeAdminSettings({
        ...current,
        advancedSettings: { ...current.advancedSettings, ...updates },
      })
    );

  const lowStockAlertsEnabled =
    (Number(draft.orderSettings.lowStockAlertThreshold) || 0) > 0;
  const primaryColor = draft.appearanceSettings.brandAccentColor || "#ec4899";
  const statusChip = storageMode === "supabase" ? "Supabase linked" : "Local fallback";

  return (
    <form onSubmit={saveSettings} className="mt-3">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-fuchsia-300/[0.12] bg-[#030713] p-3 shadow-[0_0_80px_rgba(8,47,73,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_10%,rgba(236,72,153,0.16),transparent_24%),radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.12),transparent_24%)]" />
        <div className="relative space-y-3">
          <section className={`${glassPanel} p-3`}>
            <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_820px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-[-0.01em] text-white">
                    System Command Center
                  </h1>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-2.5 py-1 text-[10px] font-black text-emerald-200">
                    Live
                  </span>
                  <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-100">
                    SETTINGS COMMAND V1 ACTIVE
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-white/52">
                  Manage system settings, integrations, and billing across your store.
                </p>
                <div className="mt-4 grid h-9 max-w-[620px] grid-cols-3 rounded-lg border border-white/[0.07] bg-white/[0.035] p-1 text-[10px] font-black text-white/45">
                  {["Settings", "Integrations", "Billing"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`rounded-md transition ${
                        tab === "Settings"
                          ? "bg-fuchsia-500/16 text-fuchsia-100 shadow-[inset_0_-2px_0_rgba(236,72,153,0.95)]"
                          : "hover:bg-white/[0.04] hover:text-white/70"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <MetricHud label="System Uptime" value="99.98%" detail="All systems operational" icon={Gauge} variant="radar" />
                <MetricHud label="Active Integrations" value="12 / 20" detail="Connected services" icon={Globe} variant="link" />
                <MetricHud label="Total API Calls" value="1.24M" detail="Last 7 days" icon={Zap} variant="bars" />
                <MetricHud label="Security Score" value="92 / 100" detail="Excellent" icon={ShieldCheck} variant="shield" />
              </div>
            </div>
          </section>

          {(backendMessage || statusMessage) && (
            <div className="grid gap-2 xl:grid-cols-2">
              <div
                className={`${glassPanel} px-3 py-2 text-[11px] leading-5 ${
                  storageMode === "supabase" ? "text-emerald-100/75" : "text-amber-100/75"
                }`}
              >
                <span className="mr-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
                  {statusChip}
                </span>
                {backendMessage}
              </div>
              {statusMessage && (
                <div className={`${glassPanel} px-3 py-2 text-[11px] leading-5 text-emerald-100/75`}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 2xl:grid-cols-[1.18fr_1.08fr_0.74fr]">
            <StoreSettingsPanel
              draft={draft}
              isSaving={isSaving}
              lowStockAlertsEnabled={lowStockAlertsEnabled}
              updateStoreProfile={updateStoreProfile}
              updateOrderSettings={updateOrderSettings}
              updateAdvancedSettings={updateAdvancedSettings}
            />
            <ThemePanel
              draft={draft}
              primaryColor={primaryColor}
              updateAppearanceSettings={updateAppearanceSettings}
              updateAdvancedSettings={updateAdvancedSettings}
            />
            <NotificationsPanel
              draft={draft}
              lowStockAlertsEnabled={lowStockAlertsEnabled}
              updateOrderSettings={updateOrderSettings}
              updateNotificationSettings={updateNotificationSettings}
            />
          </div>

          <div className="grid gap-3 2xl:grid-cols-[1.18fr_0.82fr_1fr]">
            <SecurityPanel />
            <div className="space-y-3">
              <IntegrationsOverviewPanel />
              <ApiWebhooksPanel />
            </div>
            <div className="space-y-3">
              <BillingPanel />
              <SystemHealthPanel />
            </div>
          </div>

          <footer className="flex items-end justify-between border-t border-white/[0.06] px-2 py-3 text-[11px] text-white/36">
            <div />
            <div className="text-center">
              <p className="font-semibold text-white/52">Aevyrixa Her Care Admin Control Room</p>
              <p className="mt-1">&copy; 2026 Aevyrixa. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-3">
              <span>v2.1.0</span>
              <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                Auto-refresh ON
              </span>
            </div>
          </footer>
        </div>
      </div>
    </form>
  );
}

function StoreSettingsPanel({
  draft,
  isSaving,
  lowStockAlertsEnabled,
  updateStoreProfile,
  updateOrderSettings,
  updateAdvancedSettings,
}: {
  draft: AdminSettings;
  isSaving: boolean;
  lowStockAlertsEnabled: boolean;
  updateStoreProfile: (updates: Partial<AdminSettings["storeProfile"]>) => void;
  updateOrderSettings: (updates: Partial<AdminSettings["orderSettings"]>) => void;
  updateAdvancedSettings: (updates: Partial<AdminSettings["advancedSettings"]>) => void;
}) {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle
        title="Store Settings"
        subtitle="Manage your store information and preferences."
        action={
          <button
            type="submit"
            disabled={isSaving}
            className="h-8 rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 text-[10px] font-black text-white shadow-[0_0_20px_rgba(236,72,153,0.24)] disabled:opacity-55"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        }
      />
      <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="grid gap-2">
          <FormLabel label="Store Name">
            <input className={inputClass} value={draft.storeProfile.storeName} onChange={(event) => updateStoreProfile({ storeName: event.target.value })} />
          </FormLabel>
          <FormLabel label="Store Email">
            <input className={inputClass} value={draft.storeProfile.supportEmail} onChange={(event) => updateStoreProfile({ supportEmail: event.target.value })} inputMode="email" />
          </FormLabel>
          <FormLabel label="Store Phone">
            <input className={inputClass} value={draft.storeProfile.supportPhone} onChange={(event) => updateStoreProfile({ supportPhone: event.target.value })} inputMode="tel" />
          </FormLabel>
          <FormLabel label="Store Currency">
            <select className={selectClass} value="BDT (BDT) - Bangladeshi Taka" onChange={() => undefined}>
              <option>BDT (BDT) - Bangladeshi Taka</option>
            </select>
          </FormLabel>
          <FormLabel label="Store Timezone">
            <select className={selectClass} value="(GMT+06:00) Dhaka, Bangladesh" onChange={() => undefined}>
              <option>(GMT+06:00) Dhaka, Bangladesh</option>
            </select>
          </FormLabel>
          <FormLabel label="Store Address">
            <input className={inputClass} value={draft.storeProfile.businessLocation} onChange={(event) => updateStoreProfile({ businessLocation: event.target.value })} />
          </FormLabel>
        </div>
        <div className="border-l border-white/[0.07] pl-3">
          <p className="mb-3 text-[11px] font-black text-white">Store Preferences</p>
          <div className="space-y-3">
            <PreferenceToggle label="Enable low stock alerts" checked={lowStockAlertsEnabled} onChange={(value) => updateOrderSettings({ lowStockAlertThreshold: value ? "5" : "0" })} />
            <PreferenceToggle label="Allow product reviews" checked />
            <PreferenceToggle label="Auto publish new products" checked={false} />
            <PreferenceToggle label="Enable gift wrapping" checked />
            <PreferenceToggle label="Show stock quantities" checked />
            <PreferenceToggle label="Enable order tracking" checked />
            <PreferenceToggle label="Maintenance mode" checked={draft.advancedSettings.maintenanceMode} onChange={(value) => updateAdvancedSettings({ maintenanceMode: value })} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ThemePanel({
  draft,
  primaryColor,
  updateAppearanceSettings,
  updateAdvancedSettings,
}: {
  draft: AdminSettings;
  primaryColor: string;
  updateAppearanceSettings: (updates: Partial<AdminSettings["appearanceSettings"]>) => void;
  updateAdvancedSettings: (updates: Partial<AdminSettings["advancedSettings"]>) => void;
}) {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="Theme & Control Settings" />
      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_250px]">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">Theme Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {["Dark", "Light", "System"].map((mode) => (
                <button key={mode} type="button" className={`h-9 rounded-lg border text-[10px] font-bold ${mode === "Dark" ? "border-fuchsia-300/22 bg-fuchsia-500/18 text-fuchsia-100" : "border-white/[0.07] bg-white/[0.025] text-white/38"}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <SwatchRow primaryColor={primaryColor} updateAppearanceSettings={updateAppearanceSettings} />
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">Accent Color</p>
            <div className="flex flex-wrap gap-2">
              {["#ec4899", "#be185d", "#c026d3", "#22d3ee", "#fde047", "#4ade80"].map((color) => (
                <span key={color} className="h-7 w-7 rounded-full border-2 bg-transparent" style={{ borderColor: color }} />
              ))}
              <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-white/36">
                <Plus className="h-3 w-3" />
              </span>
            </div>
          </div>
          <FormLabel label="Sidebar Style">
            <select className={selectClass} value="Compact" onChange={() => undefined}><option>Compact</option></select>
          </FormLabel>
          <FormLabel label="Dashboard Layout">
            <select className={selectClass} value="Control Room" onChange={() => undefined}><option>Control Room</option></select>
          </FormLabel>
          <div className="flex items-center gap-3 text-[11px] text-white/58">
            <span>Animations</span>
            <MiniToggle checked={!draft.advancedSettings.debugMode} onChange={(value) => updateAdvancedSettings({ debugMode: !value })} />
            <span className="text-emerald-200/72">Enabled</span>
          </div>
        </div>
        <div className="space-y-2">
          <HudRadar />
          <button type="button" className="h-10 w-full rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">
            Customize Theme
          </button>
        </div>
      </div>
    </section>
  );
}

function NotificationsPanel({
  draft,
  lowStockAlertsEnabled,
  updateOrderSettings,
  updateNotificationSettings,
}: {
  draft: AdminSettings;
  lowStockAlertsEnabled: boolean;
  updateOrderSettings: (updates: Partial<AdminSettings["orderSettings"]>) => void;
  updateNotificationSettings: (updates: Partial<AdminSettings["notificationSettings"]>) => void;
}) {
  const rows = [
    { label: "New Order Notifications", channel: "Email, In-App", icon: Bell, checked: draft.notificationSettings.telegramNewOrderEnabled, onChange: (value: boolean) => updateNotificationSettings({ telegramNewOrderEnabled: value }) },
    { label: "Low Stock Alerts", channel: "Email, SMS", icon: ClipboardList, checked: lowStockAlertsEnabled, onChange: (value: boolean) => updateOrderSettings({ lowStockAlertThreshold: value ? "5" : "0" }) },
    { label: "Customer Messages", channel: "Email, In-App", icon: MessageSquare, checked: true },
    { label: "System Alerts", channel: "Email, SMS, In-App", icon: Bell, checked: draft.notificationSettings.telegramStatusUpdateEnabled, onChange: (value: boolean) => updateNotificationSettings({ telegramStatusUpdateEnabled: value }) },
    { label: "Marketing Updates", channel: "Email", icon: Tag, checked: false },
  ];

  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="Notification Settings" subtitle="Configure how and when you receive notifications." />
      <div className="mt-4 space-y-2">
        {rows.map(({ label, channel, icon: Icon, checked, onChange }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-white/[0.055] bg-white/[0.025] px-2.5 py-2">
            <Icon className="h-4 w-4 shrink-0 text-fuchsia-300" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-white/78">{label}</span>
              <span className="block text-[9px] text-white/38">{channel}</span>
            </span>
            <MiniToggle checked={checked} onChange={onChange} />
          </div>
        ))}
      </div>
      <button type="button" className="mt-3 h-9 w-full rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">
        Manage Templates
      </button>
    </section>
  );
}

function SecurityPanel() {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="Security & Permissions" subtitle="Manage access control and security settings." />
      <div className="mt-4 grid gap-3 xl:grid-cols-[170px_1fr_230px]">
        <div className="space-y-2">
          {[
            ["Owner", "Full Access", true],
            ["Admin", "Full Access", false],
            ["Manager", "Manage Access", false],
            ["Support", "Limited Access", false],
            ["Viewer", "View Only", false],
          ].map(([role, access, active]) => (
            <div key={role as string} className={`rounded-lg border px-3 py-2 ${active ? "border-fuchsia-300/25 bg-fuchsia-500/14" : "border-white/[0.06] bg-white/[0.025]"}`}>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-fuchsia-200/80" />
                <span className="text-[11px] font-black text-white/78">{role as string}</span>
              </div>
              <p className="mt-1 text-[9px] text-white/36">{access as string}</p>
            </div>
          ))}
          <button type="button" className="h-9 w-full rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">+ Add Role</button>
        </div>
        <PermissionMatrix />
        <div className="space-y-2">
          <SecurityToggle label="Two-Factor Authentication" state="Enabled" />
          <SecurityToggle label="Login Alerts" state="Enabled" />
          {[
            ["Session Timeout", "30 minutes"],
            ["Password Policy", "Strong"],
            ["IP Whitelist", "3 IPs configured"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[10px]">
              <span className="font-bold text-white/58">{label}</span>
              <span className="text-white/42">{value}</span>
            </div>
          ))}
          <button type="button" className="h-9 w-full rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">View Audit Log</button>
        </div>
      </div>
    </section>
  );
}

function IntegrationsOverviewPanel() {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="Integrations Overview" subtitle="Connected Services" action={<Link href="/admin/integrations" className="text-[10px] font-black text-fuchsia-200">View All -&gt;</Link>} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ["stripe", "Payment Gateway"],
          ["PayPal", "Payment Gateway"],
          ["Google Analytics 4", "Analytics"],
          ["Meta Pixel", "Marketing"],
          ["Tidio", "Live Chat"],
          ["SendGrid", "Email Service"],
        ].map(([name, type]) => (
          <div key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/18 text-[10px] font-black text-white">
              {name.slice(0, 2)}
            </div>
            <p className="truncate text-[12px] font-black text-white/78">{name}</p>
            <p className="mt-1 text-[9px] text-white/36">{type}</p>
            <span className="mt-2 inline-flex rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-black text-emerald-200">Connected</span>
          </div>
        ))}
        <button type="button" className="grid min-h-[82px] place-items-center rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/8 text-center text-[10px] font-black text-fuchsia-100">
          <span><Plus className="mx-auto mb-1 h-4 w-4" />Add Integration<br /><span className="font-medium text-white/35">Connect new service</span></span>
        </button>
      </div>
    </section>
  );
}

function ApiWebhooksPanel() {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="API & Webhooks" action={<span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-200">Active</span>} />
      <div className="mt-3 space-y-2">
        <div>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">API Key</p>
          <div className="grid grid-cols-[1fr_32px_32px_92px] gap-2">
            <input className={inputClass} value="sk_live_xxxxxxxxxxxxxxxxxxxx" readOnly />
            <button type="button" className="grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/45"><Copy className="h-3.5 w-3.5" /></button>
            <button type="button" className="grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/45"><RefreshCw className="h-3.5 w-3.5" /></button>
            <button type="button" className="rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">Regenerate</button>
          </div>
        </div>
        <p className="pt-1 text-[10px] font-black text-white/70">Webhook Endpoints</p>
        {[
          ["Order Created", "https://aevyrixa.com/webhook/order"],
          ["Order Updated", "https://aevyrixa.com/webhook/update"],
          ["Customer Created", "https://aevyrixa.com/webhook/customer"],
        ].map(([event, url]) => (
          <div key={event} className="grid grid-cols-[120px_1fr_56px] items-center gap-2 rounded-lg border border-white/[0.055] bg-white/[0.025] px-2 py-2 text-[10px]">
            <span className="font-bold text-white/70">{event}</span>
            <span className="truncate text-white/34">{url}</span>
            <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-0.5 text-center text-[8px] font-black text-emerald-200">Active</span>
          </div>
        ))}
        <button type="button" className="h-8 w-full rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 text-[10px] font-black text-fuchsia-100">Manage Webhooks</button>
      </div>
    </section>
  );
}

function BillingPanel() {
  return (
    <section className={`${glassPanel} p-3`}>
      <PanelTitle title="Billing & Subscription" />
      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-white/[0.06] bg-fuchsia-500/[0.045] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">Current Plan</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span><span className="block text-sm font-black text-fuchsia-100">Aevyrixa Pro</span><span className="text-[10px] text-white/45">Premium Plan</span></span>
            <button type="button" className="h-8 rounded-lg border border-fuchsia-300/14 bg-fuchsia-500/10 px-3 text-[9px] font-black text-fuchsia-100">Manage Plan</button>
          </div>
          <p className="mt-4 text-xl font-black text-white">BDT 12,990 <span className="text-[10px] font-medium text-white/38">/ month</span></p>
          <p className="mt-1 text-[10px] text-white/42">Renews on May 20, 2026</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-black text-white">Invoices</p>
            <button type="button" className="text-[9px] font-black text-fuchsia-200">View All -&gt;</button>
          </div>
          {["#INV-2026-05", "#INV-2026-04", "#INV-2026-03", "#INV-2026-02", "#INV-2026-01"].map((invoice, index) => (
            <div key={invoice} className="grid grid-cols-[1fr_62px_64px_36px] gap-1 py-1 text-[9px] text-white/42">
              <span className="text-white/58">{invoice}</span>
              <span>{["May", "Apr", "Mar", "Feb", "Jan"][index]} 20, 2026</span>
              <span>BDT 12,990</span>
              <span className="rounded-full bg-emerald-400/10 text-center text-emerald-200">Paid</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <UsageBars />
        <div className="grid gap-2">
          <SmallBillingCard label="Payment Method" value="**** 4242" badge="VISA" />
          <SmallBillingCard label="Billing Email" value="billing@aevyrixa.her.care" />
        </div>
      </div>
    </section>
  );
}

function SystemHealthPanel() {
  return (
    <section className={`${glassPanel} p-3`}>
      <div className="grid gap-3 xl:grid-cols-[1fr_160px]">
        <div>
          <PanelTitle title="System Health" subtitle="All systems operational" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              ["Uptime", "99.98%"],
              ["Response Time", "124ms"],
              ["Database", "Healthy"],
              ["Backup", "Secure"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
                <p className="text-[9px] text-white/38">{label}</p>
                <p className="mt-2 text-[12px] font-black text-emerald-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <HudRadar tone="fuchsia" />
      </div>
    </section>
  );
}

function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-black leading-none text-white">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[10px] leading-4 text-white/45">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function FormLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
        checked
          ? "border-emerald-300/30 bg-emerald-400/70 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
          : "border-white/10 bg-white/10"
      }`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition ${checked ? "left-[1.15rem]" : "left-0.5"}`} />
    </button>
  );
}

function PreferenceToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] text-white/62">
      <span>{label}</span>
      <MiniToggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SwatchRow({
  primaryColor,
  updateAppearanceSettings,
}: {
  primaryColor: string;
  updateAppearanceSettings: (updates: Partial<AdminSettings["appearanceSettings"]>) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">Primary Color</p>
      <div className="flex flex-wrap gap-2">
        {["#8b5cf6", "#ec4899", "#a855f7", "#3b82f6", "#14b8a6", "#fb923c"].map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => updateAppearanceSettings({ brandAccentColor: color })}
            className="h-8 w-8 rounded-lg border border-white/12 shadow-[0_0_16px_rgba(255,255,255,0.08)]"
            style={{
              backgroundColor: color,
              outline: primaryColor === color ? "2px solid rgba(255,255,255,0.75)" : "none",
            }}
            aria-label={`Set primary color ${color}`}
          />
        ))}
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-white/36">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function HudRadar({ tone = "fuchsia" }: { tone?: "fuchsia" | "cyan" | "emerald" }) {
  const color =
    tone === "cyan"
      ? "rgba(34,211,238,0.55)"
      : tone === "emerald"
        ? "rgba(52,211,153,0.55)"
        : "rgba(236,72,153,0.58)";
  return (
    <div className="relative h-full min-h-[96px] overflow-hidden rounded-xl border border-white/[0.06] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),transparent_52%),linear-gradient(135deg,rgba(34,211,238,0.08),transparent)]">
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/25" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25" />
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
      <div className="absolute left-1/2 top-1/2 h-px w-24 origin-left -translate-y-1/2 rotate-[-18deg]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-300 shadow-[0_0_22px_rgba(236,72,153,0.9)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:22px_22px]" />
    </div>
  );
}

function MetricHud({
  label,
  value,
  detail,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Gauge;
  variant: "radar" | "link" | "bars" | "shield";
}) {
  return (
    <div className={`${glassPanel} grid min-h-[76px] grid-cols-[1fr_74px] gap-3 p-3`}>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/38">{label}</p>
        <p className="mt-2 text-lg font-black text-white">{value}</p>
        <p className="mt-1 text-[9px] text-white/42">{detail}</p>
      </div>
      <div className="relative grid place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
        {variant === "bars" ? (
          <div className="flex h-10 items-end gap-1">
            {[18, 34, 25, 44, 30, 52, 38, 58].map((height, index) => (
              <span key={index} className="w-1.5 rounded-full bg-gradient-to-t from-fuchsia-600 to-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.45)]" style={{ height }} />
            ))}
          </div>
        ) : variant === "radar" ? (
          <HudRadar tone="cyan" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

function PermissionMatrix() {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-black/15 p-2">
      <p className="mb-2 text-[11px] font-black text-white">Permission Matrix</p>
      <div className="grid grid-cols-[1fr_repeat(5,42px)] gap-1 text-center text-[9px] text-white/38">
        <span className="text-left">Module</span>
        {["View", "Create", "Edit", "Delete", "Export"].map((item) => <span key={item}>{item}</span>)}
        {["Dashboard", "Orders", "Products", "Customers", "Analytics", "Settings"].map((module, rowIndex) => (
          <div key={module} className="contents">
            <span className="rounded-md bg-white/[0.025] px-2 py-2 text-left text-[10px] font-bold text-white/58">{module}</span>
            {[0, 1, 2, 3, 4].map((cell) => {
              const allowed = cell < 3 || (rowIndex % 2 === 0 && cell === 3);
              const purple = cell === 4 && rowIndex !== 0;
              return (
                <span key={`${module}-${cell}`} className={`grid place-items-center rounded-md py-2 ${allowed ? "bg-emerald-400/10 text-emerald-200" : purple ? "bg-fuchsia-500/12 text-fuchsia-200" : "bg-white/[0.035] text-white/24"}`}>
                  {allowed ? <Check className="h-3 w-3" /> : purple ? "o" : "-"}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityToggle({ label, state }: { label: string; state: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
      <span>
        <span className="block text-[10px] font-bold text-white/70">{label}</span>
        <span className="block text-[9px] text-emerald-200/70">{state}</span>
      </span>
      <MiniToggle checked />
    </div>
  );
}

function UsageBars() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-black text-white">Plan Usage</p>
        <button type="button" className="text-[9px] font-black text-fuchsia-200">View Usage -&gt;</button>
      </div>
      {[
        ["Orders", "1,247 / 5,000", 62],
        ["Products", "872 / 2,000", 44],
        ["Storage", "48.6 GB / 100 GB", 49],
        ["API Calls", "1.24M / 5M", 25],
      ].map(([label, value, width]) => (
        <div key={label as string} className="mb-2 last:mb-0">
          <div className="mb-1 flex justify-between text-[9px]"><span className="text-white/46">{label as string}</span><span className="text-white/38">{value as string}</span></div>
          <div className="h-1.5 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-400" style={{ width: `${width}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function SmallBillingCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] font-black text-white/55">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {badge && <span className="rounded bg-white px-2 py-1 text-[10px] font-black text-blue-700">{badge}</span>}
        <span className="truncate text-[11px] font-black text-white">{value}</span>
      </div>
      <button type="button" className="mt-2 text-[9px] font-black text-fuchsia-200">Update</button>
    </div>
  );
}
