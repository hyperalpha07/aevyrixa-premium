"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Home,
  LogOut,
  MapPin,
  PackageSearch,
  Plus,
  ShoppingBag,
  UserRound,
  MessageSquare,
} from "lucide-react";
import SiteHeader from "@/app/components/cart/site-header";
import SiteFooter from "@/app/components/site-footer";
import { formatCurrency } from "@/app/lib/currency";
import {
  defaultStorefrontSettings,
  fetchStorefrontSettings,
  type StorefrontSettings,
} from "@/app/lib/storefront-settings";

type AccountView = "dashboard" | "orders" | "addresses" | "support";
type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
};
type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  cityArea: string;
  address: string;
  deliveryZone?: string;
  isDefault: boolean;
};
type AccountOrder = {
  orderRef: string;
  createdAt: string;
  status: string;
  total: number;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  deliveryCharge?: number;
  deliveryArea?: string;
  deliveryZone?: string;
  deliveryAddress: string;
  cityArea: string;
  courierName?: string;
  trackingId?: string;
  items: { name: string; quantity: number; price: number; variant?: string }[];
};
type SupportPayload = {
  conversations?: unknown[];
  linked?: boolean;
  message?: string;
};
type AddressForm = {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  cityArea: string;
  address: string;
  deliveryZone: string;
  isDefault: boolean;
};

const emptyAddress: AddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  cityArea: "",
  address: "",
  deliveryZone: "Inside Dhaka",
  isDefault: false,
};

function formatDate(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

function readable(value?: string) {
  return value ? value.replace(/_/g, " ") : "Not available";
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = (await response.json().catch(() => ({}))) as T & { errors?: string[] };
  if (!response.ok) {
    throw new Error(payload.errors?.[0] || "Request failed.");
  }
  return payload;
}

export default function AccountClient({ view }: { view: AccountView }) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressDraft, setAddressDraft] = useState<AddressForm>(emptyAddress);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportCount, setSupportCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const recentOrders = orders.slice(0, 3);

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
    let isActive = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const session = await readJson<{ customer: Customer }>("/api/account/session");
        if (!isActive) return;
        setCustomer(session.customer);
        const [orderPayload, addressPayload, supportPayload] = await Promise.all([
          readJson<{ orders: AccountOrder[] }>("/api/account/orders"),
          readJson<{ addresses: Address[] }>("/api/account/addresses"),
          readJson<SupportPayload>("/api/account/support").catch((err) => ({
            message: err instanceof Error ? err.message : "Support history is unavailable.",
            conversations: [],
          })),
        ]);
        if (!isActive) return;
        setOrders(orderPayload.orders);
        setAddresses(addressPayload.addresses);
        setSupportMessage(supportPayload.message ?? "");
        setSupportCount(supportPayload.conversations?.length ?? 0);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Please log in to continue.");
        setCustomer(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    router.replace("/account/login");
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const url = addressDraft.id
      ? `/api/account/addresses/${encodeURIComponent(addressDraft.id)}`
      : "/api/account/addresses";
    const method = addressDraft.id ? "PATCH" : "POST";
    try {
      await readJson(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addressDraft),
      });
      const payload = await readJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
      setAddressDraft(emptyAddress);
      setIsAddressOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Address could not be saved.");
    }
  };

  const editAddress = (address: Address) => {
    setAddressDraft({
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      cityArea: address.cityArea,
      address: address.address,
      deliveryZone: address.deliveryZone ?? "Inside Dhaka",
      isDefault: address.isDefault,
    });
    setIsAddressOpen(true);
  };

  const deleteAddress = async (addressId: string) => {
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
        method: "DELETE",
      });
      setAddresses((current) => current.filter((item) => item.id !== addressId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Address could not be deleted.");
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "set_default" }),
      });
      const payload = await readJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Default address could not be updated.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf7f4] text-[#2c1a14]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(184,129,74,0.05),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(74,139,126,0.04),transparent_30%),linear-gradient(180deg,#faf7f4_0%,#f5eeea_100%)]" />
      <SiteHeader settings={settings} active="account" />

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b8814a]/80">
              Customer Account
            </p>
            <h1 className="mt-4 break-words text-3xl font-semibold leading-tight text-[#2c1a14] [overflow-wrap:anywhere] sm:text-5xl">
              {customer ? `Welcome, ${customer.fullName}` : "Your Aevyrixa account"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5c3d30]/80">
              Manage orders, addresses, support, and checkout details from one secure profile.
            </p>
          </div>
          {customer && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#b8814a]/22 bg-[#f5eeea] px-5 text-sm font-semibold text-[#5c3d30] transition hover:border-[#b8814a]/40 hover:bg-[#f0e4d6]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 text-sm">
          <AccountTab href="/account" active={view === "dashboard"} icon={UserRound} label="Account" />
          <AccountTab href="/account/orders" active={view === "orders"} icon={PackageSearch} label="Orders" />
          <AccountTab href="/account/addresses" active={view === "addresses"} icon={MapPin} label="Addresses" />
          <AccountTab href="/account/support" active={view === "support"} icon={MessageSquare} label="Support" />
        </nav>

        {isLoading ? (
          <Panel>Loading your account...</Panel>
        ) : !customer ? (
          <Panel>
            <p className="text-lg font-semibold text-white">Login required</p>
            <p className="mt-2 text-sm leading-7 text-white/62">{error}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className="action-primary" href="/account/login">Login</Link>
              <Link className="action-muted" href="/account/register">Create Account</Link>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-4">
              <Panel>
                <p className="text-sm font-semibold text-[#2c1a14]">{customer.fullName}</p>
                <p className="mt-2 text-sm text-[#5c3d30]/80">{customer.phone}</p>
                {customer.email && <p className="mt-1 text-sm text-[#8a6a5e]">{customer.email}</p>}
              </Panel>
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a5e]/70">
                  Shortcuts
                </p>
                <div className="mt-4 grid gap-2">
                  <Link className="shortcut-link" href="/track-order">Track an order</Link>
                  <Link className="shortcut-link" href="/support">Support & policies</Link>
                  <Link className="shortcut-link" href="/checkout">Checkout</Link>
                </div>
              </Panel>
            </aside>

            <section className="min-w-0">
              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">
                  {error}
                </div>
              )}
              {view === "dashboard" && (
                <Dashboard
                  orders={recentOrders}
                  allOrders={orders}
                  address={defaultAddress}
                  addressCount={addresses.length}
                  supportMessage={supportMessage}
                  supportCount={supportCount}
                />
              )}
              {view === "orders" && (
                <OrdersView
                  orders={orders}
                />
              )}
              {view === "addresses" && (
                <AddressesView
                  addresses={addresses}
                  isOpen={isAddressOpen}
                  draft={addressDraft}
                  setDraft={setAddressDraft}
                  onOpen={() => {
                    setAddressDraft(emptyAddress);
                    setIsAddressOpen(true);
                  }}
                  onCancel={() => {
                    setAddressDraft(emptyAddress);
                    setIsAddressOpen(false);
                  }}
                  onSave={saveAddress}
                  onEdit={editAddress}
                  onDelete={deleteAddress}
                  onSetDefault={setDefaultAddress}
                />
              )}
              {view === "support" && <SupportView message={supportMessage} />}
            </section>
          </div>
        )}
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}

function AccountTab({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-[#b8814a]/40 bg-[#b8814a] text-[#faf7f4] shadow-sm"
          : "border-[#b8814a]/14 bg-white text-[#5c3d30] hover:border-[#b8814a]/30 hover:bg-[#f5eeea]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-[#b8814a]/12 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </div>
  );
}

function Dashboard({
  orders,
  allOrders,
  address,
  addressCount,
  supportMessage,
  supportCount,
}: {
  orders: AccountOrder[];
  allOrders: AccountOrder[];
  address?: Address;
  addressCount: number;
  supportMessage: string;
  supportCount: number;
}) {
  const pendingOrders = allOrders.filter((order) => order.status === "Pending").length;
  const deliveredOrders = allOrders.filter(
    (order) => order.status === "Delivered" || order.deliveryStatus === "delivered"
  ).length;

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={PackageSearch} label="Total orders" value={String(allOrders.length)} />
          <Metric icon={Clock3} label="Pending" value={String(pendingOrders)} />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders)} />
          <Metric icon={MessageSquare} label="Support" value={String(supportCount)} />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Quick Actions" href="/product" label="Shop" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <QuickAction href="/track-order" icon={PackageSearch} label="Track order" />
          <QuickAction href="/account/orders" icon={ShoppingBag} label="View orders" />
          <QuickAction href="/account/addresses" icon={MapPin} label="Saved addresses" />
          <QuickAction href="/account/support" icon={MessageSquare} label="Support" />
          <QuickAction href="/product" icon={Home} label="Continue shopping" />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Recent Orders" href="/account/orders" />
        <OrderRows orders={orders} />
      </Panel>
      <Panel>
        <SectionTitle title="Saved Address" href="/account/addresses" />
        {address ? (
          <>
            <AddressSummary address={address} />
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/38">
              {addressCount} saved {addressCount === 1 ? "address" : "addresses"}
            </p>
          </>
        ) : (
          <EmptyLine text="No saved address yet." />
        )}
      </Panel>
      <Panel>
        <SectionTitle title="Support History" href="/account/support" />
        <p className="text-sm leading-7 text-white/62">
          {supportMessage || "Use support shortcuts when you need help with an order."}
        </p>
      </Panel>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 min-w-0 flex-col justify-between rounded-2xl border border-[#b8814a]/12 bg-[#faf7f4] p-4 transition hover:border-[#b8814a]/30 hover:bg-[#f5eeea] hover:shadow-sm"
    >
      <Icon className="h-5 w-5 text-[#b8814a]" />
      <span className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-[#2c1a14]">
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{label}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#8a6a5e] transition group-hover:text-[#b8814a]" />
      </span>
    </Link>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#b8814a]/12 bg-[#faf7f4] p-4">
      <Icon className="h-5 w-5 text-[#b8814a]" />
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8a6a5e]/70">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#2c1a14]">{value}</p>
    </div>
  );
}

function SectionTitle({ title, href, label = "View" }: { title: string; href: string; label?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-[#2c1a14]">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-[#b8814a] hover:text-[#5c3d30]">
        {label}
      </Link>
    </div>
  );
}

function OrdersView({ orders }: { orders: AccountOrder[] }) {
  return (
    <div className="grid gap-5">
      <Panel>
        <h2 className="text-xl font-semibold text-[#2c1a14]">Order History</h2>
        <p className="mt-2 text-sm leading-7 text-[#5c3d30]/80">
          Open an order for a focused detail view with tracking and support actions.
        </p>
        <div className="mt-5">
          <OrderRows orders={orders} detailed />
        </div>
      </Panel>
    </div>
  );
}

function orderDetailHref(orderRef: string) {
  return `/account/orders/${encodeURIComponent(orderRef)}`;
}

function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}

function OrderRows({
  orders,
  onSelect,
  detailed = false,
}: {
  orders: AccountOrder[];
  onSelect?: (orderRef: string) => void;
  detailed?: boolean;
}) {
  if (orders.length === 0) return <EmptyLine text="No orders found for this account phone yet." />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.orderRef}
          className="grid gap-3 rounded-2xl border border-[#b8814a]/12 bg-[#faf7f4] p-4 md:grid-cols-[1fr_auto]"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-[#2c1a14] [overflow-wrap:anywhere]">{order.orderRef}</p>
            <p className="mt-1 text-xs text-[#8a6a5e]">{formatDate(order.createdAt)}</p>
            <p className="mt-2 text-sm text-[#5c3d30]/80">
              {order.status} · {readable(order.deliveryStatus)}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-sm font-semibold text-[#2c1a14]">{formatCurrency(order.total)}</p>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(order.orderRef)}
                className="rounded-full border border-[#b8814a]/28 bg-[#f5eeea] px-4 py-2 text-sm font-semibold text-[#5c3d30] transition hover:border-[#b8814a]/45 hover:bg-[#f0e4d6]"
              >
                View details
              </button>
            ) : (
              <Link className="text-sm font-semibold text-[#b8814a] hover:text-[#5c3d30]" href={orderDetailHref(order.orderRef)}>
                View details
              </Link>
            )}
            {detailed && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link className="mini-action text-center" href={trackOrderHref(order)}>
                  Track order
                </Link>
                <Link className="mini-action text-center" href="/account/support">
                  Get support
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressesView({
  addresses,
  isOpen,
  draft,
  setDraft,
  onOpen,
  onCancel,
  onSave,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addresses: Address[];
  isOpen: boolean;
  draft: AddressForm;
  setDraft: (draft: AddressForm) => void;
  onOpen: () => void;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Saved Addresses</h2>
          <button type="button" onClick={onOpen} className="icon-action">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {isOpen && (
          <form onSubmit={onSave} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Label" value={draft.label} onChange={(value) => setDraft({ ...draft, label: value })} />
              <Input label="Full name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
              <Input label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
              <Input label="City / area" value={draft.cityArea} onChange={(value) => setDraft({ ...draft, cityArea: value })} />
            </div>
            <label className="block">
              <span className="text-sm font-medium text-[#5c3d30]">Full address</span>
              <textarea
                value={draft.address}
                rows={3}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                className="mt-2 w-full resize-none rounded-2xl border border-[#b8814a]/14 bg-[#f5eeea] px-4 py-3 text-sm text-[#2c1a14] outline-none focus:border-[#b8814a]/40"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#5c3d30]">Delivery zone</span>
                <select
                  value={draft.deliveryZone}
                  onChange={(event) => setDraft({ ...draft, deliveryZone: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-[#b8814a]/14 bg-[#f5eeea] px-4 py-3 text-sm text-[#2c1a14] outline-none focus:border-[#b8814a]/40"
                >
                  <option>Inside Dhaka</option>
                  <option>Outside Dhaka</option>
                </select>
              </label>
              <label className="mt-8 flex items-center gap-3 text-sm text-[#5c3d30]">
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                  className="h-4 w-4 accent-[#b8814a]"
                />
                Set as default
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="action-primary" type="submit">Save address</button>
              <button className="action-muted" type="button" onClick={onCancel}>Cancel</button>
            </div>
          </form>
        )}
      </Panel>
      <Panel>
        {addresses.length === 0 ? (
          <EmptyLine text="No saved addresses yet." />
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-2xl border border-[#b8814a]/12 bg-[#faf7f4] p-4">
                <AddressSummary address={address} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="mini-action" type="button" onClick={() => onEdit(address)}>Edit</button>
                  <button className="mini-action" type="button" onClick={() => onDelete(address.id)}>Delete</button>
                  {!address.isDefault && (
                    <button className="mini-action" type="button" onClick={() => onSetDefault(address.id)}>
                      Set default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#5c3d30]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#b8814a]/14 bg-[#f5eeea] px-4 py-3 text-sm text-[#2c1a14] outline-none placeholder:text-[#8a6a5e]/60 focus:border-[#b8814a]/40"
      />
    </label>
  );
}

function AddressSummary({ address }: { address: Address }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-[#2c1a14]">{address.label}</p>
        {address.isDefault && (
          <span className="rounded-full border border-[#b8814a]/28 bg-[#f5eeea] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b8814a]">
            Default
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#5c3d30]">{address.fullName} · {address.phone}</p>
      <p className="text-sm leading-6 text-[#8a6a5e]">{address.cityArea} · {address.deliveryZone || "Zone not set"}</p>
      <p className="mt-1 break-words text-sm leading-6 text-[#8a6a5e] [overflow-wrap:anywhere]">{address.address}</p>
    </div>
  );
}

function SupportView({ message }: { message: string }) {
  return (
    <Panel>
      <h2 className="text-xl font-semibold text-[#2c1a14]">Support History</h2>
      <p className="mt-3 text-sm leading-7 text-[#5c3d30]/80">
        {message || "Support history is not available yet."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link className="action-primary" href="/support">Open support page</Link>
        <Link className="action-muted" href="/track-order">Track an order</Link>
      </div>
    </Panel>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-[#8a6a5e]">{text}</p>;
}
