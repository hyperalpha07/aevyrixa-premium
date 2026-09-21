export function formatAccountDate(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

export function readableAccountValue(value?: string) {
  return value ? value.replace(/_/g, " ") : "Not available";
}

export function normalizeAccountStatus(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

export function accountStatusChipClass(value?: string) {
  const status = normalizeAccountStatus(value);
  if (status.includes("cancel") || status.includes("failed") || status.includes("return")) {
    return "border-rose-300/35 bg-rose-300/[0.08] text-rose-100";
  }
  if (status.includes("deliver")) {
    return "border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100";
  }
  if (status.includes("confirm") || status.includes("paid") || status.includes("dispatch") || status.includes("transit")) {
    return "border-[#00D4C6]/35 bg-[#00D4C6]/[0.08] text-[#31E6D4]";
  }
  return "border-[#FFB84D]/35 bg-[#FFB84D]/[0.08] text-[#FFD18A]";
}
