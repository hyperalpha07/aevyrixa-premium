import {
  defaultAdminSettings,
  normalizeAdminSettings,
  publicAdminSettings,
  type AdminSettings,
} from "@/app/lib/admin-settings";

const SUPABASE_SETTINGS_TABLE = "store_settings";
const SETTINGS_ROW_ID = "public";

export type SettingsStorageMode =
  | "supabase"
  | "fallback-default"
  | "fallback-missing-table"
  | "fallback-error";

export type SettingsResult = {
  settings: AdminSettings;
  storageMode: SettingsStorageMode;
  backendConnected: boolean;
  message?: string;
};

type SupabaseSettingsRow = {
  id?: string;
  store_profile?: unknown;
  payment_settings?: unknown;
  checkout_settings?: unknown;
  delivery_settings?: unknown;
  policy_settings?: unknown;
  order_settings?: unknown;
  notification_settings?: unknown;
  seo_settings?: unknown;
  appearance_settings?: unknown;
  advanced_settings?: unknown;
  store_name?: string | null;
  support_phone?: string | null;
  support_whatsapp?: string | null;
  support_email?: string | null;
  facebook_page_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  business_location?: string | null;
  delivery_coverage_text?: string | null;
  cod_message?: string | null;
  privacy_packaging_message?: string | null;
  support_window_message?: string | null;
  hygiene_return_message?: string | null;
  order_confirmation_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

class SettingsStoreError extends Error {
  status: number;
  code: string;
  publicMessage: string;

  constructor(
    message: string,
    options: { status?: number; code?: string; publicMessage?: string } = {}
  ) {
    super(message);
    this.name = "SettingsStoreError";
    this.status = options.status ?? 500;
    this.code = options.code ?? "SETTINGS_STORE_ERROR";
    this.publicMessage =
      options.publicMessage ?? "Store settings backend is not connected.";
  }
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function supabaseHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");

  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

async function supabaseError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  const lowerDetail = detail.toLowerCase();
  const isMissingTable =
    response.status === 404 ||
    lowerDetail.includes("store_settings") ||
    lowerDetail.includes("could not find the table") ||
    lowerDetail.includes("schema cache");

  return new SettingsStoreError(
    `Supabase settings ${action} failed with ${response.status}. ${detail.slice(
      0,
      240
    )}`,
    {
      status: isMissingTable ? 503 : response.status,
      code: isMissingTable ? "SETTINGS_TABLE_MISSING" : "SETTINGS_SUPABASE_ERROR",
      publicMessage: isMissingTable
        ? "Settings backend not connected. Create public.store_settings in Supabase to persist admin settings."
        : "Store settings could not be saved right now.",
    }
  );
}

function mapSupabaseRow(row: SupabaseSettingsRow) {
  return normalizeAdminSettings({
    storeProfile: row.store_profile,
    paymentSettings: row.payment_settings,
    checkoutSettings: row.checkout_settings,
    deliverySettings: row.delivery_settings,
    policySettings: row.policy_settings,
    orderSettings: row.order_settings,
    notificationSettings: row.notification_settings,
    seoSettings: row.seo_settings,
    appearanceSettings: row.appearance_settings,
    advancedSettings: row.advanced_settings,
    storeName: row.store_name,
    supportPhone: row.support_phone,
    supportWhatsApp: row.support_whatsapp,
    supportEmail: row.support_email,
    facebookPageUrl: row.facebook_page_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    businessLocation: row.business_location,
    deliveryCoverageText: row.delivery_coverage_text,
    codMessage: row.cod_message,
    privacyPackagingMessage: row.privacy_packaging_message,
    supportWindowMessage: row.support_window_message,
    hygieneReturnMessage: row.hygiene_return_message,
    orderConfirmationMessage: row.order_confirmation_message,
  });
}

function toLegacySupabasePayload(settings: AdminSettings) {
  const normalized = normalizeAdminSettings(settings);

  return {
    id: SETTINGS_ROW_ID,
    store_name: normalized.storeName,
    support_phone: normalized.supportPhone,
    support_whatsapp: normalized.supportWhatsApp,
    support_email: normalized.supportEmail,
    facebook_page_url: normalized.facebookPageUrl || null,
    instagram_url: normalized.instagramUrl || null,
    tiktok_url: normalized.tiktokUrl || null,
    business_location: normalized.businessLocation,
    delivery_coverage_text: normalized.deliveryCoverageText,
    cod_message: normalized.codMessage,
    privacy_packaging_message: normalized.privacyPackagingMessage,
    support_window_message: normalized.supportWindowMessage,
    hygiene_return_message: normalized.hygieneReturnMessage,
    order_confirmation_message: normalized.orderConfirmationMessage,
    updated_at: new Date().toISOString(),
  };
}

function toSupabasePayload(settings: AdminSettings) {
  const normalized = normalizeAdminSettings(settings);

  return {
    ...toLegacySupabasePayload(normalized),
    store_profile: normalized.storeProfile,
    payment_settings: normalized.paymentSettings,
    checkout_settings: normalized.checkoutSettings,
    delivery_settings: normalized.deliverySettings,
    policy_settings: normalized.policySettings,
    order_settings: normalized.orderSettings,
    notification_settings: normalized.notificationSettings,
    seo_settings: normalized.seoSettings,
    appearance_settings: normalized.appearanceSettings,
    advanced_settings: normalized.advancedSettings,
  };
}

async function readSettingsFromSupabase(): Promise<AdminSettings | null> {
  const response = await fetch(
    supabaseEndpoint(
      `${SUPABASE_SETTINGS_TABLE}?id=eq.${SETTINGS_ROW_ID}&select=*&limit=1`
    ),
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw await supabaseError(response, "lookup");

  const rows = (await response.json()) as SupabaseSettingsRow[];
  return rows[0] ? mapSupabaseRow(rows[0]) : null;
}

async function upsertSettingsInSupabase(settings: AdminSettings) {
  const response = await fetch(
    supabaseEndpoint(`${SUPABASE_SETTINGS_TABLE}?on_conflict=id&select=*`),
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(toSupabasePayload(settings)),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const isMissingGroupedColumn =
      response.status === 400 &&
      /store_profile|payment_settings|checkout_settings|delivery_settings|policy_settings|order_settings|notification_settings|seo_settings|appearance_settings|advanced_settings|schema cache|column/i.test(
        detail
      );

    if (!isMissingGroupedColumn) {
      throw await supabaseError(
        new Response(detail, { status: response.status }),
        "upsert"
      );
    }

    const legacyResponse = await fetch(
      supabaseEndpoint(`${SUPABASE_SETTINGS_TABLE}?on_conflict=id&select=*`),
      {
        method: "POST",
        headers: {
          ...supabaseHeaders(),
          prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(toLegacySupabasePayload(settings)),
      }
    );

    if (!legacyResponse.ok) throw await supabaseError(legacyResponse, "legacy upsert");

    const legacyRows = (await legacyResponse.json()) as SupabaseSettingsRow[];
    return legacyRows[0]
      ? normalizeAdminSettings({ ...settings, ...mapSupabaseRow(legacyRows[0]) })
      : normalizeAdminSettings(settings);
  }

  const rows = (await response.json()) as SupabaseSettingsRow[];
  return rows[0] ? mapSupabaseRow(rows[0]) : normalizeAdminSettings(settings);
}

function fallbackResult(
  storageMode: SettingsStorageMode,
  message = "Settings backend not connected. Using safe Bangladesh launch defaults."
): SettingsResult {
  return {
    settings: defaultAdminSettings,
    storageMode,
    backendConnected: false,
    message,
  };
}

export async function getStoreSettings(): Promise<SettingsResult> {
  if (!hasSupabaseConfig()) return fallbackResult("fallback-default");

  try {
    const settings = await readSettingsFromSupabase();
    if (settings) {
      return { settings, storageMode: "supabase", backendConnected: true };
    }

    return fallbackResult(
      "fallback-default",
      "Settings table is connected but no public row exists yet. Save admin settings once to persist them."
    );
  } catch (error) {
    console.error("Store settings adapter fell back to defaults:", error);

    if (
      error instanceof SettingsStoreError &&
      error.code === "SETTINGS_TABLE_MISSING"
    ) {
      return fallbackResult("fallback-missing-table", error.publicMessage);
    }

    return fallbackResult(
      "fallback-error",
      "Settings backend not connected. Using safe Bangladesh launch defaults."
    );
  }
}

export async function saveStoreSettings(settings: AdminSettings) {
  if (!hasSupabaseConfig()) {
    throw new SettingsStoreError("Missing Supabase settings config.", {
      status: 503,
      code: "SETTINGS_BACKEND_NOT_CONFIGURED",
      publicMessage:
        "Settings backend not connected. Add Supabase env vars and public.store_settings to persist settings.",
    });
  }

  const savedSettings = await upsertSettingsInSupabase(settings);

  return {
    settings: savedSettings,
    storageMode: "supabase" as const,
    backendConnected: true,
  };
}

export function settingsStoreErrorResponse(error: unknown) {
  if (error instanceof SettingsStoreError) {
    return {
      status: error.status,
      body: { errors: [error.publicMessage], code: error.code },
    };
  }

  return {
    status: 500,
    body: {
      errors: ["Store settings could not be saved right now."],
      code: "SETTINGS_STORE_ERROR",
    },
  };
}

export function toPublicSettingsPayload(settings: AdminSettings) {
  const normalized = publicAdminSettings(settings);

  return {
    storeProfile: normalized.storeProfile,
    paymentSettings: normalized.paymentSettings,
    checkoutSettings: normalized.checkoutSettings,
    deliverySettings: normalized.deliverySettings,
    policySettings: normalized.policySettings,
    seoSettings: normalized.seoSettings,
    appearanceSettings: normalized.appearanceSettings,
    storeName: normalized.storeName,
    supportPhone: normalized.supportPhone,
    supportWhatsApp: normalized.supportWhatsApp,
    supportEmail: normalized.supportEmail,
    facebookPageUrl: normalized.facebookPageUrl,
    instagramUrl: normalized.instagramUrl,
    tiktokUrl: normalized.tiktokUrl,
    businessLocation: normalized.businessLocation,
    deliveryCoverageText: normalized.deliveryCoverageText,
    codMessage: normalized.codMessage,
    privacyPackagingMessage: normalized.privacyPackagingMessage,
    supportWindowMessage: normalized.supportWindowMessage,
    hygieneReturnMessage: normalized.hygieneReturnMessage,
    orderConfirmationMessage: normalized.orderConfirmationMessage,
    guaranteeText: normalized.guaranteeText,
    deliveryNote: normalized.deliveryNote,
    walletReceiverNumbers: normalized.walletReceiverNumbers,
    bankTransferInstruction: normalized.bankTransferInstruction,
    codInstruction: normalized.codInstruction,
  };
}
