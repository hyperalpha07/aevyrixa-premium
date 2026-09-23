export function supportLabel(id: string) {
  return `Conversation #${id.slice(0, 8)}`;
}

export function supportTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
  }).format(date);
}
