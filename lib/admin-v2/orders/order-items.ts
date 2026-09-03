import type { OrderCartItem } from "@/app/lib/order-types";
import { normalizeAdminV2ImageSrc } from "@/lib/admin-v2/image-src";
import { normalizeAdminV2ItemVariant } from "@/lib/admin-v2/orders/order-variant";

export type AdminV2OrderItem = {
  key: string;
  productName: string;
  productSlug: string | null;
  productId: string | null;
  image: string | null;
  sku: string | null;
  size: string | null;
  color: string | null;
  variant: string | null;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeAdminV2OrderItem(item: OrderCartItem, index = 0): AdminV2OrderItem {
  const quantity = Math.max(0, cleanNumber(item.quantity) ?? 0);
  const unitPrice = cleanNumber(item.price);
  const lineTotal =
    typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal)
      ? Math.max(0, item.lineTotal)
      : unitPrice === null
        ? null
        : Math.max(0, unitPrice * quantity);
  const sku = cleanText(item.sku) ?? cleanText(item.productId) ?? cleanText(item.id);
  const size = cleanText(item.size);
  const color = cleanText(item.color);
  const variant = normalizeAdminV2ItemVariant(
    cleanText(item.variant) ?? cleanText(item.absorbency),
    size,
    color
  );

  return {
    key: `${cleanText(item.id) ?? "item"}-${cleanText(item.slug) ?? index}-${index}`,
    productName: cleanText(item.name) ?? "Product",
    productSlug: cleanText(item.slug),
    productId: cleanText(item.productId) ?? cleanText(item.id),
    image: normalizeAdminV2ImageSrc(item.image),
    sku,
    size,
    color,
    variant,
    quantity,
    unitPrice,
    lineTotal,
  };
}

export function normalizeAdminV2OrderItems(items: OrderCartItem[]) {
  return items.map((item, index) => normalizeAdminV2OrderItem(item, index));
}
