import type { SupportInboxItem } from "./support-query";

export function supportMetrics(items: SupportInboxItem[]) {
  return items.reduce((counts, item) => {
    counts[item.status]++;
    counts.unread += item.unread_customer_count;
    return counts;
  }, { open: 0, pending: 0, closed: 0, unread: 0 });
}
