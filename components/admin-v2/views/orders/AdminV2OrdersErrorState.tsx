"use client";

import { AlertTriangle } from "lucide-react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";

export function AdminV2OrdersErrorState({ message }: { message: string }) {
  return <V2EmptyState icon={AlertTriangle} title="Unable to load orders" description={message} compact />;
}
