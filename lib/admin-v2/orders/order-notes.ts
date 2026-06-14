import type { OrderRecord } from "@/app/lib/order-types";

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isZoneToken(value: string, zone?: string) {
  const normalized = normalizeToken(value);
  if (!normalized.startsWith("zone:")) return false;
  const tokenZone = normalizeToken(normalized.slice("zone:".length));
  return !zone || tokenZone === normalizeToken(zone);
}

export function getAdminV2DeliveryNote(order: OrderRecord) {
  const raw = cleanText(order.deliveryNote) ?? cleanText(order.customer.deliveryNote);
  if (!raw) return null;

  const parts = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !isZoneToken(part, order.deliveryZone));

  return parts.join(" | ") || null;
}
