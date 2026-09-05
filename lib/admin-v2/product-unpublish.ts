export const UNPUBLISH_CONFIRMATION = "UNPUBLISH";

export function validateUnpublishConfirmation(value: unknown) {
  return value === UNPUBLISH_CONFIRMATION ? null : `Type ${UNPUBLISH_CONFIRMATION} exactly to confirm.`;
}

export function isUnpublishableActive(row: Record<string, unknown> | null) {
  return Boolean(row && row.status === "active" && row.deleted_at == null);
}

export function unpublishUpdateQuery(productId: string, updatedAt?: string) {
  const query = new URLSearchParams({ id: `eq.${productId}`, status: "eq.active", deleted_at: "is.null", select: "id" });
  if (updatedAt) query.set("updated_at", `eq.${updatedAt}`);
  return query;
}

export function unpublishPayload(now: string) {
  return { status: "draft", updated_at: now } as const;
}
