import { PackageX } from "lucide-react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";

export default function NotFound() {
  return (
    <V2EmptyState
      icon={PackageX}
      title="Order not found"
      description="No real Supabase order matched this reference, or the order is archived or deleted."
      actionHref="/admin-v2/orders"
      actionLabel="Back to orders"
    />
  );
}
