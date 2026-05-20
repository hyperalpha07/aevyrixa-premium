import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "aevyrixa_customer_session";

const ACCOUNTS_TABLE = "customer_accounts";
const ADDRESSES_TABLE = "customer_addresses";
const SESSIONS_TABLE = "customer_sessions";
const ACTIVITY_TABLE = "customer_activity_logs";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 210000;
const bdMobilePattern = /^01[3-9]\d{8}$/;

export type CustomerAccount = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type CustomerAddress = {
  id: string;
  customerId: string;
  label: string;
  fullName: string;
  phone: string;
  cityArea: string;
  address: string;
  deliveryZone?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AccountRow = {
  id?: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  password_hash?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type AddressRow = {
  id?: string;
  customer_id?: string | null;
  label?: string | null;
  full_name?: string | null;
  phone?: string | null;
  city_area?: string | null;
  address?: string | null;
  delivery_zone?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SessionRow = {
  id?: string;
  customer_id?: string | null;
  token_hash?: string | null;
  expires_at?: string | null;
};

export class CustomerAccountError extends Error {
  status: number;
  publicMessage: string;
  code: string;

  constructor(
    message: string,
    options: { status?: number; publicMessage?: string; code?: string } = {}
  ) {
    super(message);
    this.name = "CustomerAccountError";
    this.status = options.status ?? 500;
    this.publicMessage = options.publicMessage ?? "Customer account is temporarily unavailable.";
    this.code = options.code ?? "CUSTOMER_ACCOUNT_ERROR";
  }
}

export function customerSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function customerSessionClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function normalizeCustomerPhone(value: string) {
  return value.trim().replace(/[^\d+]/g, "").replace(/^\+?88/, "");
}

export function isBangladeshCustomerPhone(value: string) {
  return bdMobilePattern.test(normalizeCustomerPhone(value));
}

function hasSupabaseConfig() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");
  return `${supabaseUrl}/rest/v1/${pathAndQuery}`;
}

async function supabaseError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  let publicMessage = "Customer account is temporarily unavailable.";
  let code = "CUSTOMER_ACCOUNT_ERROR";

  if (/customer_accounts|customer_addresses|customer_sessions|schema cache|does not exist/i.test(detail)) {
    publicMessage = "Customer accounts are not configured yet.";
    code = "CUSTOMER_SCHEMA_MISSING";
  } else if (/23505|duplicate key|unique/i.test(detail)) {
    publicMessage = "An account with this phone number already exists.";
    code = "CUSTOMER_DUPLICATE_PHONE";
  }

  return new CustomerAccountError(`Supabase customer ${action} failed with ${response.status}. ${detail.slice(0, 240)}`, {
    status: response.status,
    publicMessage,
    code,
  });
}

async function dbGet<T>(path: string): Promise<T> {
  if (!hasSupabaseConfig()) {
    throw new CustomerAccountError("Missing Supabase customer config.", {
      status: 503,
      publicMessage: "Customer accounts are not configured yet.",
      code: "CUSTOMER_SCHEMA_MISSING",
    });
  }

  const response = await fetch(supabaseEndpoint(path), {
    headers: supabaseHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw await supabaseError(response, "lookup");
  return response.json() as Promise<T>;
}

async function dbPost<T>(path: string, body: unknown): Promise<T> {
  if (!hasSupabaseConfig()) {
    throw new CustomerAccountError("Missing Supabase customer config.", {
      status: 503,
      publicMessage: "Customer accounts are not configured yet.",
      code: "CUSTOMER_SCHEMA_MISSING",
    });
  }

  const response = await fetch(supabaseEndpoint(path), {
    method: "POST",
    headers: supabaseHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await supabaseError(response, "insert");
  return response.json() as Promise<T>;
}

async function dbPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(supabaseEndpoint(path), {
    method: "PATCH",
    headers: supabaseHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await supabaseError(response, "update");
  return response.json() as Promise<T>;
}

async function dbDelete(path: string): Promise<void> {
  const response = await fetch(supabaseEndpoint(path), {
    method: "DELETE",
    headers: supabaseHeaders({ prefer: "return=minimal" }),
    cache: "no-store",
  });
  if (!response.ok) throw await supabaseError(response, "delete");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsText, salt, expected] = storedHash.split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2_sha256" || !Number.isFinite(iterations) || !salt || !expected) return false;

  const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function sessionTokenHash(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function mapAccount(row: AccountRow): CustomerAccount {
  return {
    id: row.id ?? "",
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? undefined,
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
  };
}

function mapAddress(row: AddressRow): CustomerAddress {
  return {
    id: row.id ?? "",
    customerId: row.customer_id ?? "",
    label: row.label ?? "Home",
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    cityArea: row.city_area ?? "",
    address: row.address ?? "",
    deliveryZone: row.delivery_zone ?? undefined,
    isDefault: row.is_default === true,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function safeAccount(account: CustomerAccount) {
  return {
    id: account.id,
    fullName: account.fullName,
    phone: account.phone,
    email: account.email,
    isActive: account.isActive,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
  };
}

export async function createCustomerAccount(input: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}) {
  const phone = normalizeCustomerPhone(input.phone);
  if (!input.fullName.trim()) {
    throw new CustomerAccountError("Missing full name.", { status: 400, publicMessage: "Full name is required." });
  }
  if (!isBangladeshCustomerPhone(phone)) {
    throw new CustomerAccountError("Invalid phone.", { status: 400, publicMessage: "Please enter a valid Bangladesh mobile number." });
  }
  if (input.password.length < 8) {
    throw new CustomerAccountError("Weak password.", { status: 400, publicMessage: "Password must be at least 8 characters." });
  }

  const now = new Date().toISOString();
  const rows = await dbPost<AccountRow[]>(`${ACCOUNTS_TABLE}?select=id,full_name,phone,email,is_active,created_at,updated_at,last_login_at`, {
    full_name: input.fullName.trim(),
    phone,
    email: input.email?.trim() || null,
    password_hash: hashPassword(input.password),
    is_active: true,
    created_at: now,
    updated_at: now,
  });
  if (!rows[0]) throw new CustomerAccountError("Account insert returned no row.");
  await logCustomerActivity(rows[0].id ?? "", "account.registered").catch(() => null);
  return mapAccount(rows[0]);
}

export async function authenticateCustomer(phoneInput: string, password: string) {
  const phone = normalizeCustomerPhone(phoneInput);
  const rows = await dbGet<AccountRow[]>(
    `${ACCOUNTS_TABLE}?phone=eq.${encodeURIComponent(phone)}&select=id,full_name,phone,email,password_hash,is_active,created_at,updated_at,last_login_at&limit=1`
  );
  const row = rows[0];
  if (!row?.password_hash || row.is_active === false || !verifyPassword(password, row.password_hash)) {
    throw new CustomerAccountError("Invalid customer login.", {
      status: 401,
      publicMessage: "Phone or password is incorrect.",
      code: "CUSTOMER_INVALID_LOGIN",
    });
  }

  const now = new Date().toISOString();
  await dbPatch<AccountRow[]>(`${ACCOUNTS_TABLE}?id=eq.${encodeURIComponent(row.id ?? "")}&select=id`, {
    last_login_at: now,
    updated_at: now,
  }).catch(() => []);
  await logCustomerActivity(row.id ?? "", "account.login").catch(() => null);
  return mapAccount({ ...row, last_login_at: now });
}

export async function createCustomerSession(customerId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  await dbPost<SessionRow[]>(`${SESSIONS_TABLE}?select=id`, {
    customer_id: customerId,
    token_hash: sessionTokenHash(token),
    user_agent: userAgent?.slice(0, 240) || null,
    created_at: now.toISOString(),
    expires_at: expiresAt,
  });
  return token;
}

export async function getCustomerBySessionToken(token?: string | null) {
  if (!token) return null;
  const hash = sessionTokenHash(token);
  const sessions = await dbGet<SessionRow[]>(
    `${SESSIONS_TABLE}?token_hash=eq.${encodeURIComponent(hash)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,customer_id,expires_at&limit=1`
  );
  const customerId = sessions[0]?.customer_id;
  if (!customerId) return null;
  const accounts = await dbGet<AccountRow[]>(
    `${ACCOUNTS_TABLE}?id=eq.${encodeURIComponent(customerId)}&is_active=eq.true&select=id,full_name,phone,email,is_active,created_at,updated_at,last_login_at&limit=1`
  );
  return accounts[0] ? mapAccount(accounts[0]) : null;
}

export async function deleteCustomerSession(token?: string | null) {
  if (!token) return;
  await dbDelete(`${SESSIONS_TABLE}?token_hash=eq.${encodeURIComponent(sessionTokenHash(token))}`);
}

export async function listCustomerAddresses(customerId: string) {
  const rows = await dbGet<AddressRow[]>(
    `${ADDRESSES_TABLE}?customer_id=eq.${encodeURIComponent(customerId)}&select=*&order=is_default.desc,created_at.desc`
  );
  return rows.map(mapAddress);
}

export type AdminCustomerOverview = CustomerAccount & {
  orderCount: number;
  totalSpent: number;
  latestOrderAt?: string;
  savedAddressesCount: number;
};

export async function listAdminCustomerOverviews(): Promise<AdminCustomerOverview[]> {
  const accounts = await dbGet<AccountRow[]>(
    `${ACCOUNTS_TABLE}?select=id,full_name,phone,email,is_active,created_at,updated_at,last_login_at&order=created_at.desc&limit=500`
  );
  const mapped = accounts.map(mapAccount);
  const orderRows = await dbGet<Array<{
    customer_id?: string | null;
    total?: number | string | null;
    status?: string | null;
    created_at?: string | null;
  }>>(
    "orders?select=customer_id,total,status,created_at&customer_id=not.is.null&limit=2000"
  ).catch(() => []);
  const addressRows = await dbGet<Array<{ customer_id?: string | null }>>(
    `${ADDRESSES_TABLE}?select=customer_id&limit=2000`
  ).catch(() => []);

  return mapped.map((customer) => {
    const customerOrders = orderRows.filter((order) => order.customer_id === customer.id);
    const activeOrders = customerOrders.filter((order) => order.status !== "Cancelled");
    const totalSpent = activeOrders.reduce((sum, order) => {
      const total = typeof order.total === "number" ? order.total : Number(order.total ?? 0);
      return sum + (Number.isFinite(total) ? total : 0);
    }, 0);
    const latestOrderAt = customerOrders
      .map((order) => order.created_at)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent,
      latestOrderAt,
      savedAddressesCount: addressRows.filter((address) => address.customer_id === customer.id).length,
    };
  });
}

export async function createCustomerAddress(customerId: string, input: Partial<CustomerAddress>) {
  const payload = addressPayload(customerId, input);
  const rows = await dbPost<AddressRow[]>(`${ADDRESSES_TABLE}?select=*`, payload);
  const address = rows[0] ? mapAddress(rows[0]) : null;
  if (!address) throw new CustomerAccountError("Address insert returned no row.");
  if (address.isDefault) await clearOtherDefaultAddresses(customerId, address.id);
  return address;
}

export async function updateCustomerAddress(customerId: string, addressId: string, input: Partial<CustomerAddress>) {
  const payload = addressPayload(customerId, input, true);
  const rows = await dbPatch<AddressRow[]>(
    `${ADDRESSES_TABLE}?id=eq.${encodeURIComponent(addressId)}&customer_id=eq.${encodeURIComponent(customerId)}&select=*`,
    payload
  );
  const address = rows[0] ? mapAddress(rows[0]) : null;
  if (!address) {
    throw new CustomerAccountError("Address not found.", { status: 404, publicMessage: "Address was not found." });
  }
  if (address.isDefault) await clearOtherDefaultAddresses(customerId, address.id);
  return address;
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
  await dbDelete(`${ADDRESSES_TABLE}?id=eq.${encodeURIComponent(addressId)}&customer_id=eq.${encodeURIComponent(customerId)}`);
}

export async function setDefaultCustomerAddress(customerId: string, addressId: string) {
  const address = await updateCustomerAddress(customerId, addressId, { isDefault: true });
  return address;
}

function addressPayload(customerId: string, input: Partial<CustomerAddress>, partial = false) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (!partial) {
    payload.customer_id = customerId;
    payload.created_at = payload.updated_at;
  }
  if (!partial || input.label !== undefined) payload.label = input.label?.trim() || "Home";
  if (!partial || input.fullName !== undefined) payload.full_name = input.fullName?.trim() || "";
  if (!partial || input.phone !== undefined) payload.phone = normalizeCustomerPhone(input.phone ?? "");
  if (!partial || input.cityArea !== undefined) payload.city_area = input.cityArea?.trim() || "";
  if (!partial || input.address !== undefined) payload.address = input.address?.trim() || "";
  if (!partial || input.deliveryZone !== undefined) payload.delivery_zone = input.deliveryZone?.trim() || null;
  if (input.isDefault !== undefined) payload.is_default = Boolean(input.isDefault);

  if (!partial) validateAddressPayload(payload);
  if (payload.phone && !isBangladeshCustomerPhone(String(payload.phone))) {
    throw new CustomerAccountError("Invalid address phone.", { status: 400, publicMessage: "Please enter a valid Bangladesh mobile number." });
  }
  return payload;
}

function validateAddressPayload(payload: Record<string, unknown>) {
  if (!payload.full_name || !payload.phone || !payload.city_area || !payload.address) {
    throw new CustomerAccountError("Missing address fields.", { status: 400, publicMessage: "Full name, phone, city/area, and address are required." });
  }
}

async function clearOtherDefaultAddresses(customerId: string, currentAddressId: string) {
  await dbPatch<AddressRow[]>(
    `${ADDRESSES_TABLE}?customer_id=eq.${encodeURIComponent(customerId)}&id=neq.${encodeURIComponent(currentAddressId)}&select=id`,
    { is_default: false, updated_at: new Date().toISOString() }
  ).catch(() => []);
}

export async function logCustomerActivity(customerId: string, action: string, metadata: Record<string, unknown> = {}) {
  if (!customerId) return;
  await dbPost(`${ACTIVITY_TABLE}?select=id`, {
    customer_id: customerId,
    action,
    metadata,
    created_at: new Date().toISOString(),
  }).catch(() => null);
}
