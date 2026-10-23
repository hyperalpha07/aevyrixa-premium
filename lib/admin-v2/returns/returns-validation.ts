export const returnActions = ["exchange","refund_review","support"] as const;
export const returnStates = ["requested","reviewing","approved","rejected","closed"] as const;
export const returnHygieneStates = ["not_checked","eligible","ineligible","exception_review"] as const;
export type ReturnState = (typeof returnStates)[number];
export type HygieneState = (typeof returnHygieneStates)[number];

export function validateReturnCreation(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const orderRef = typeof value.orderRef === "string" ? value.orderRef.trim() : "";
  const requestedAction = value.requestedAction;
  const reason = typeof value.reason === "string" ? value.reason.trim() : "";
  if (!/^[\w-]{4,128}$/.test(orderRef) ||
      !returnActions.some((x) => x === requestedAction) ||
      reason.length < 10 || reason.length > 1500) return null;
  return { orderRef, requestedAction: requestedAction as (typeof returnActions)[number], reason };
}

export function validateReturnTransition(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const version = value.version;
  const fromStatus = value.fromStatus;
  const toStatus = value.toStatus;
  const hygiene = value.hygiene;
  const note = typeof value.note === "string" ? value.note.trim() : "";
  if (!Number.isSafeInteger(version) || typeof version !== "number" || version < 1 ||
      !returnStates.some((x) => x === fromStatus) ||
      !returnStates.some((x) => x === toStatus) ||
      !returnHygieneStates.some((x) => x === hygiene) ||
      note.length < 8 || note.length > 2000) return null;
  const valid = (fromStatus === "requested" && toStatus === "reviewing") ||
    (fromStatus === "reviewing" && (toStatus === "approved" || toStatus === "rejected")) ||
    ((fromStatus === "approved" || fromStatus === "rejected") && toStatus === "closed");
  if (!valid || (toStatus === "approved" && hygiene !== "eligible" && hygiene !== "exception_review")) return null;
  return { version, fromStatus: fromStatus as ReturnState, toStatus: toStatus as ReturnState,
    hygiene: hygiene as HygieneState, note };
}
