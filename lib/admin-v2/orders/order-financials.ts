export type AdminV2PayableInput = {
  subtotal?: number | null;
  discount?: number | null;
  deliveryCharge?: number | null;
};

function cleanAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : null;
}

export function calculateAdminV2PayableTotal(input: AdminV2PayableInput) {
  const subtotal = cleanAmount(input.subtotal);
  if (subtotal === null) return null;

  const discount = cleanAmount(input.discount) ?? 0;
  const deliveryCharge = cleanAmount(input.deliveryCharge) ?? 0;

  return Math.max(0, subtotal - discount + deliveryCharge);
}

export function hasAdminV2TotalMismatch(storedTotal: number | null, payableTotal: number | null) {
  if (storedTotal === null || payableTotal === null) return false;
  return Math.abs(storedTotal - payableTotal) > 1;
}
