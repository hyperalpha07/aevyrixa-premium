"use client";

import { type FormEvent } from "react";
import { MapPin, Plus } from "lucide-react";
import { AccountMobileMenu, DashboardSidebar, Panel } from "@/app/account/_shared/account-ui";
import type { Address, AddressForm, Customer } from "@/app/account/_shared/account-types";

export default function AddressesView({
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
  customer,
  onLogout,
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
  customer: Customer;
  onLogout: () => void;
}) {
  return (
    <div className="aev-account-dashboard-workspace aev-account-addresses-workspace">
      <DashboardSidebar customer={customer} activeView="addresses" onLogout={onLogout} />

      <div className="aev-account-dashboard-main">
        <section className="aev-account-dashboard-welcome aev-account-addresses-welcome">
          <div className="aev-account-dashboard-welcome-art" aria-hidden="true" />
          <div className="relative z-10 min-w-0 pr-12 md:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#31E6D4]/78">
              Noromi Care Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">My Addresses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF0]/78 sm:text-base">
              Keep your delivery details accurate for a smooth and discreet Noromi Care order experience.
            </p>
          </div>
          <button type="button" onClick={onOpen} className="aev-account-addresses-add">
            <Plus className="h-4 w-4" />
            Add Address
          </button>
          <div className="absolute right-4 top-4 z-20 md:hidden">
            <AccountMobileMenu view="addresses" hero onLogout={onLogout} />
          </div>
        </section>

        <Panel className="aev-account-addresses-panel">
          {isOpen && (
            <form onSubmit={onSave} className="aev-account-address-form">
              <div className="aev-account-address-form-heading">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#31E6D4]/72">
                    Delivery details
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold text-white">
                    {draft.id ? "Edit address" : "Add an address"}
                  </h2>
                </div>
                <button className="mini-action" type="button" onClick={onCancel}>Cancel</button>
              </div>
              <div className="aev-account-address-form-grid">
                <Input label="Label" value={draft.label} onChange={(value) => setDraft({ ...draft, label: value })} />
                <Input label="Full name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
                <Input label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
                <Input label="City / area" value={draft.cityArea} onChange={(value) => setDraft({ ...draft, cityArea: value })} />
                <label className="aev-account-address-field sm:col-span-2">
                  <span>Full address</span>
                  <textarea
                    value={draft.address}
                    rows={3}
                    onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                  />
                </label>
                <label className="aev-account-address-field">
                  <span>Delivery zone</span>
                  <select
                    value={draft.deliveryZone}
                    onChange={(event) => setDraft({ ...draft, deliveryZone: event.target.value })}
                  >
                    <option>Inside Dhaka</option>
                    <option>Outside Dhaka</option>
                  </select>
                </label>
                <label className="aev-account-address-default-toggle">
                  <input
                    type="checkbox"
                    checked={draft.isDefault}
                    onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                  />
                  <span>Set as default</span>
                </label>
              </div>
              <button className="action-primary mt-5" type="submit">Save address</button>
            </form>
          )}

          <div className={isOpen ? "aev-account-address-list has-form" : "aev-account-address-list"}>
            {addresses.length === 0 ? (
              <div className="aev-account-addresses-empty">
                <span><MapPin className="h-6 w-6" /></span>
                <h2>No saved addresses yet</h2>
                <p>Add a delivery address to make future Noromi Care orders quicker and easier.</p>
                {!isOpen && (
                  <button type="button" onClick={onOpen} className="aev-account-care-cta">
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="aev-account-address-list-heading">
                  <h2>Saved addresses</h2>
                  <span>{addresses.length} {addresses.length === 1 ? "address" : "addresses"}</span>
                </div>
                {addresses.map((address) => (
                  <article key={address.id} className="aev-account-address-row">
                    <AddressSummary address={address} />
                    <div className="aev-account-address-actions">
                      <button className="mini-action" type="button" onClick={() => onEdit(address)}>Edit</button>
                      <button className="mini-action" type="button" onClick={() => onDelete(address.id)}>Delete</button>
                      {!address.isDefault && (
                        <button className="mini-action" type="button" onClick={() => onSetDefault(address.id)}>
                          Set default
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#D8CBE8]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#FF4DB8]/14 bg-[#0B0F1A] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6B5F7A] focus:border-[#FF4DB8]/35"
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
          <span className="rounded-full border border-[#FF4DB8]/30 bg-[#FF4DB8]/[0.08] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4DB8]">
            Default
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#D8CBE8]">{address.fullName} / {address.phone}</p>
      <p className="text-sm leading-6 text-[#9C91AA]">{address.cityArea} / {address.deliveryZone || "Zone not set"}</p>
      <p className="mt-1 break-words text-sm leading-6 text-[#9C91AA] [overflow-wrap:anywhere]">{address.address}</p>
    </div>
  );
}

