"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Home,
  LogOut,
  MapPin,
  PackageSearch,
  Plus,
  ShieldCheck,
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
  const [selectedOrderRef, setSelectedOrderRef] = useState("");
  const [addressDraft, setAddressDraft] = useState<AddressForm>(emptyAddress);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderRef === selectedOrderRef) ?? orders[0],
    [orders, selectedOrderRef]
  );
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
          readJson<{ message?: string }>("/api/account/support").catch((err) => ({
            message: err instanceof Error ? err.message : "Support history is unavailable.",
          })),
        ]);
        if (!isActive) return;
        setOrders(orderPayload.orders);
        setAddresses(addressPayload.addresses);
        setSupportMessage(supportPayload.message ?? "");
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
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#050816_0%,#07101f_52%,#030612_100%)]" />
      <SiteHeader settings={settings} active="account" />

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/72">
              Customer Account
            </p>
            <h1 className="mt-4 break-words text-3xl font-semibold leading-tight [overflow-wrap:anywhere] sm:text-5xl">
              {customer ? `Welcome, ${customer.fullName}` : "Your Aevyrixa account"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/64">
              Account access is optional. Guest checkout and order tracking remain available.
            </p>
          </div>
          {customer && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:border-fuchsia-200/40"
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
                <p className="text-sm font-semibold text-white">{customer.fullName}</p>
                <p className="mt-2 text-sm text-white/58">{customer.phone}</p>
                {customer.email && <p className="mt-1 text-sm text-white/58">{customer.email}</p>}
              </Panel>
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
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
                  address={defaultAddress}
                  supportMessage={supportMessage}
                />
              )}
              {view === "orders" && (
                <OrdersView
                  orders={orders}
                  selectedOrder={selectedOrder}
                  onSelect={setSelectedOrderRef}
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 transition ${
        active
          ? "border-cyan-200/40 bg-cyan-200/10 text-white"
          : "border-white/10 bg-white/[0.045] text-white/70 hover:border-white/25 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl sm:p-6">
      {children}
    </div>
  );
}

function Dashboard({
  orders,
  address,
  supportMessage,
}: {
  orders: AccountOrder[];
  address?: Address;
  supportMessage: string;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={PackageSearch} label="Recent orders" value={String(orders.length)} />
          <Metric icon={Home} label="Saved address" value={address ? "Ready" : "Not added"} />
          <Metric icon={ShieldCheck} label="Support" value="Available" />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Recent Orders" href="/account/orders" />
        <OrderRows orders={orders} />
      </Panel>
      <Panel>
        <SectionTitle title="Saved Address" href="/account/addresses" />
        {address ? <AddressSummary address={address} /> : <EmptyLine text="No saved address yet." />}
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

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <Icon className="h-5 w-5 text-cyan-100" />
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-cyan-100 hover:text-white">
        View
      </Link>
    </div>
  );
}

function OrdersView({
  orders,
  selectedOrder,
  onSelect,
}: {
  orders: AccountOrder[];
  selectedOrder?: AccountOrder;
  onSelect: (orderRef: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <h2 className="text-xl font-semibold text-white">Order History</h2>
        <OrderRows orders={orders} onSelect={onSelect} />
      </Panel>
      {selectedOrder && (
        <Panel>
          <h2 className="break-words text-xl font-semibold text-white [overflow-wrap:anywhere]">
            Order {selectedOrder.orderRef}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Summary label="Date" value={formatDate(selectedOrder.createdAt)} />
            <Summary label="Total" value={formatCurrency(selectedOrder.total)} />
            <Summary label="Order status" value={selectedOrder.status} />
            <Summary label="Delivery status" value={readable(selectedOrder.deliveryStatus)} />
            <Summary label="Payment" value={selectedOrder.paymentMethod} />
            <Summary label="Payment status" value={selectedOrder.paymentStatus || "Not available"} />
            <Summary label="Courier" value={selectedOrder.courierName || "Not assigned"} />
            <Summary label="Tracking" value={selectedOrder.trackingId || "Not available"} />
            <Summary label="Delivery zone" value={selectedOrder.deliveryZone || "Not available"} />
            <Summary label="Delivery area" value={selectedOrder.deliveryArea || selectedOrder.cityArea} />
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">Delivery Address</p>
            <p className="mt-2 text-sm leading-7 text-white/72">{selectedOrder.deliveryAddress}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">Items</p>
            <ul className="mt-3 space-y-3">
              {selectedOrder.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm text-white/74">
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {item.name}
                    {item.variant && <span className="block text-xs text-white/42">{item.variant}</span>}
                  </span>
                  <span className="shrink-0">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link className="action-primary" href={`/track-order?ref=${encodeURIComponent(selectedOrder.orderRef)}`}>
              Track order
            </Link>
            <Link className="action-muted" href="/support">Get support</Link>
          </div>
        </Panel>
      )}
    </div>
  );
}

function OrderRows({ orders, onSelect }: { orders: AccountOrder[]; onSelect?: (orderRef: string) => void }) {
  if (orders.length === 0) return <EmptyLine text="No orders found for this account phone yet." />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.orderRef}
          className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto]"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">{order.orderRef}</p>
            <p className="mt-1 text-xs text-white/48">{formatDate(order.createdAt)}</p>
            <p className="mt-2 text-sm text-white/66">
              {order.status} · {readable(order.deliveryStatus)}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-sm font-semibold text-white">{formatCurrency(order.total)}</p>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(order.orderRef)}
                className="rounded-full border border-cyan-100/25 bg-cyan-100/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-100/15"
              >
                View details
              </button>
            ) : (
              <Link className="text-sm font-semibold text-cyan-100 hover:text-white" href="/account/orders">
                View details
              </Link>
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
              <span className="text-sm font-medium text-white/72">Full address</span>
              <textarea
                value={draft.address}
                rows={3}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none focus:border-cyan-200/45"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-white/72">Delivery zone</span>
                <select
                  value={draft.deliveryZone}
                  onChange={(event) => setDraft({ ...draft, deliveryZone: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-200/45"
                >
                  <option>Inside Dhaka</option>
                  <option>Outside Dhaka</option>
                </select>
              </label>
              <label className="mt-8 flex items-center gap-3 text-sm text-white/72">
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                  className="h-4 w-4 accent-cyan-200"
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
              <div key={address.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
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
      <span className="text-sm font-medium text-white/72">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none focus:border-cyan-200/45"
      />
    </label>
  );
}

function AddressSummary({ address }: { address: Address }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-white">{address.label}</p>
        {address.isDefault && (
          <span className="rounded-full border border-cyan-100/25 bg-cyan-100/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-50">
            Default
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/66">{address.fullName} · {address.phone}</p>
      <p className="text-sm leading-6 text-white/58">{address.cityArea} · {address.deliveryZone || "Zone not set"}</p>
      <p className="mt-1 break-words text-sm leading-6 text-white/58 [overflow-wrap:anywhere]">{address.address}</p>
    </div>
  );
}

function SupportView({ message }: { message: string }) {
  return (
    <Panel>
      <h2 className="text-xl font-semibold text-white">Support History</h2>
      <p className="mt-3 text-sm leading-7 text-white/62">
        {message || "Support history is not available yet."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link className="action-primary" href="/support">Open support page</Link>
        <Link className="action-muted" href="/track-order">Track an order</Link>
      </div>
    </Panel>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/78 [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-white/58">{text}</p>;
}
