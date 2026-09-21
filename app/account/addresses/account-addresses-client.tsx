"use client";

import "@/app/account/addresses/account-addresses.css";

import { useEffect, useState, type FormEvent } from "react";
import AccountShell, { type AccountShellContext } from "@/app/account/_shared/account-shell";
import { readAccountJson } from "@/app/account/_shared/account-request";
import { Panel } from "@/app/account/_shared/account-ui";
import { emptyAddress, type Address, type AddressForm } from "@/app/account/_shared/account-types";
import AddressesView from "@/app/account/addresses/account-addresses-view";

function AddressesContent({ customer, logout }: AccountShellContext) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<AddressForm>(emptyAddress);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    readAccountJson<{ addresses: Address[] }>("/api/account/addresses")
      .then((payload) => { if (active) setAddresses(payload.addresses); })
      .catch(() => { if (active) setError("We couldn't load your account right now."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const url = draft.id ? `/api/account/addresses/${encodeURIComponent(draft.id)}` : "/api/account/addresses";
    try {
      await readAccountJson(url, { method: draft.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const payload = await readAccountJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
      setDraft(emptyAddress);
      setIsOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be saved.");
    }
  };

  const edit = (address: Address) => {
    setDraft({ id: address.id, label: address.label, fullName: address.fullName, phone: address.phone, cityArea: address.cityArea, address: address.address, deliveryZone: address.deliveryZone ?? "Inside Dhaka", isDefault: address.isDefault });
    setIsOpen(true);
  };

  const remove = async (addressId: string) => {
    setError("");
    try {
      await readAccountJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, { method: "DELETE" });
      setAddresses((current) => current.filter((item) => item.id !== addressId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be deleted.");
    }
  };

  const setDefault = async (addressId: string) => {
    setError("");
    try {
      await readAccountJson(`/api/account/addresses/${encodeURIComponent(addressId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "set_default" }) });
      const payload = await readAccountJson<{ addresses: Address[] }>("/api/account/addresses");
      setAddresses(payload.addresses);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Default address could not be updated.");
    }
  };

  if (isLoading) return <Panel>Loading your account...</Panel>;
  return <>
    {error && <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-300/[0.08] p-4 text-sm text-rose-50/82">{error}</div>}
    <AddressesView addresses={addresses} isOpen={isOpen} draft={draft} setDraft={setDraft} onOpen={() => { setDraft(emptyAddress); setIsOpen(true); }} onCancel={() => { setDraft(emptyAddress); setIsOpen(false); }} onSave={save} onEdit={edit} onDelete={remove} onSetDefault={setDefault} customer={customer} onLogout={logout} />
  </>;
}

export default function AccountAddressesClient() {
  return <AccountShell view="addresses">{(context) => <AddressesContent {...context} />}</AccountShell>;
}
