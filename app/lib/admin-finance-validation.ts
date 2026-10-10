const stringLimits = {
  orderRef: 128,
  externalReference: 256,
  paymentMethod: 128,
  refundMethod: 128,
  note: 2000,
  reason: 1000,
  description: 2000,
  payee: 256,
  voidReason: 1000,
  category: 64,
} as const;

export type FinanceValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function readString(input: Record<string, unknown>, key: string, label: string, max: number, required = false) {
  const value = typeof input[key] === "string" ? input[key].trim() : "";
  if (required && !value) return { error: `${label} is required.` };
  if (value.length > max) return { error: `${label} must be ${max} characters or fewer.` };
  return { value: value || null };
}

function readAmount(input: Record<string, unknown>) {
  const amount = typeof input.amount === "number" ? input.amount : Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a positive number." };
  return { value: amount };
}

function readTimestamp(input: Record<string, unknown>) {
  const value = typeof input.occurredAt === "string" ? input.occurredAt.trim() : "";
  const parsed = new Date(value);
  if (!value || !Number.isFinite(parsed.getTime())) return { error: "Occurred at must be a valid timestamp." };
  return { value };
}

function readCurrency(input: Record<string, unknown>) {
  const value = typeof input.currencyCode === "string" ? input.currencyCode.trim().toUpperCase() : "";
  if (!/^[A-Z]{3}$/.test(value)) return { error: "Currency code must be exactly 3 uppercase letters." };
  return { value };
}

function readUuid(input: Record<string, unknown>) {
  const value = typeof input.requestKey === "string" ? input.requestKey.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return { error: "Request key must be a valid UUID." };
  }
  return { value };
}

function result<T>(errors: string[], value: T): FinanceValidationResult<T> {
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

function collectErrors(errors: string[], items: Array<{ error: string } | { value: unknown }>) {
  for (const item of items) {
    if ("error" in item) errors.push(item.error);
  }
}

export function validateFinancePaymentPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const orderRef = readString(input, "orderRef", "Order reference", stringLimits.orderRef, true);
  const paymentMethod = readString(input, "paymentMethod", "Payment method", stringLimits.paymentMethod, true);
  const externalReference = readString(input, "externalReference", "External reference", stringLimits.externalReference);
  const note = readString(input, "note", "Note", stringLimits.note);
  const amount = readAmount(input);
  const currencyCode = readCurrency(input);
  const occurredAt = readTimestamp(input);
  const requestKey = readUuid(input);
  collectErrors(errors, [orderRef, paymentMethod, externalReference, note, amount, currencyCode, occurredAt, requestKey]);
  return result(errors, {
    orderRef: "value" in orderRef ? orderRef.value : "",
    amount: "value" in amount ? amount.value : 0,
    currencyCode: "value" in currencyCode ? currencyCode.value : "",
    paymentMethod: "value" in paymentMethod ? paymentMethod.value : "",
    externalReference: "value" in externalReference ? externalReference.value : null,
    note: "value" in note ? note.value : null,
    occurredAt: "value" in occurredAt ? occurredAt.value : "",
    requestKey: "value" in requestKey ? requestKey.value : "",
  });
}

export function validateFinanceRefundPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const orderRef = readString(input, "orderRef", "Order reference", stringLimits.orderRef, true);
  const paymentTransactionId = readString(input, "paymentTransactionId", "Payment transaction ID", 64);
  const refundMethod = readString(input, "refundMethod", "Refund method", stringLimits.refundMethod);
  const externalReference = readString(input, "externalReference", "External reference", stringLimits.externalReference);
  const reason = readString(input, "reason", "Reason", stringLimits.reason, true);
  const note = readString(input, "note", "Note", stringLimits.note);
  const amount = readAmount(input);
  const currencyCode = readCurrency(input);
  const occurredAt = readTimestamp(input);
  const requestKey = readUuid(input);
  collectErrors(errors, [orderRef, paymentTransactionId, refundMethod, externalReference, reason, note, amount, currencyCode, occurredAt, requestKey]);
  return result(errors, {
    orderRef: "value" in orderRef ? orderRef.value : "",
    paymentTransactionId: "value" in paymentTransactionId ? paymentTransactionId.value : null,
    amount: "value" in amount ? amount.value : 0,
    currencyCode: "value" in currencyCode ? currencyCode.value : "",
    refundMethod: "value" in refundMethod ? refundMethod.value : null,
    externalReference: "value" in externalReference ? externalReference.value : null,
    reason: "value" in reason ? reason.value : "",
    note: "value" in note ? note.value : null,
    occurredAt: "value" in occurredAt ? occurredAt.value : "",
    requestKey: "value" in requestKey ? requestKey.value : "",
  });
}

export function validateFinanceExpensePayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const category = readString(input, "category", "Category", stringLimits.category, true);
  const payee = readString(input, "payee", "Payee", stringLimits.payee);
  const paymentMethod = readString(input, "paymentMethod", "Payment method", stringLimits.paymentMethod);
  const externalReference = readString(input, "externalReference", "External reference", stringLimits.externalReference);
  const description = readString(input, "description", "Description", stringLimits.description, true);
  const note = readString(input, "note", "Note", stringLimits.note);
  const orderRef = readString(input, "orderRef", "Order reference", stringLimits.orderRef);
  const amount = readAmount(input);
  const currencyCode = readCurrency(input);
  const occurredAt = readTimestamp(input);
  const requestKey = readUuid(input);
  collectErrors(errors, [category, payee, paymentMethod, externalReference, description, note, orderRef, amount, currencyCode, occurredAt, requestKey]);
  return result(errors, {
    category: "value" in category ? category.value : "",
    amount: "value" in amount ? amount.value : 0,
    currencyCode: "value" in currencyCode ? currencyCode.value : "",
    payee: "value" in payee ? payee.value : null,
    paymentMethod: "value" in paymentMethod ? paymentMethod.value : null,
    externalReference: "value" in externalReference ? externalReference.value : null,
    description: "value" in description ? description.value : "",
    note: "value" in note ? note.value : null,
    orderRef: "value" in orderRef ? orderRef.value : null,
    occurredAt: "value" in occurredAt ? occurredAt.value : "",
    requestKey: "value" in requestKey ? requestKey.value : "",
  });
}

export function validateFinanceVoidPayload(input: Record<string, unknown>) {
  const reason = readString(input, "reason", "Void reason", stringLimits.voidReason, true);
  return "error" in reason ? { ok: false, errors: [reason.error] } as const : { ok: true, value: { reason: reason.value } } as const;
}
