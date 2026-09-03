import { ClipboardList } from "lucide-react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";

export function AdminV2OrdersEmptyState({ filtered }: { filtered?: boolean }) {
  return (
    <V2EmptyState
      icon={ClipboardList}
      title={filtered ? "No orders match the selected filters" : "No orders found"}
      description={
        filtered
          ? "Clear or adjust filters to see real orders from the current authorized result set."
          : "Admin V2 only displays real Supabase orders. Demo-memory fallback orders are hidden."
      }
      compact
    />
  );
}
