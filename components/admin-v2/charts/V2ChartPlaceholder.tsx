import { BarChart3 } from "lucide-react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";

export function V2ChartPlaceholder() {
  return (
    <V2EmptyState
      icon={BarChart3}
      title="Chart module pending"
      description="Phase 1 uses real metrics only. Chart rendering will be connected after the chart dependency is reviewed for Next 16 and React 19."
    />
  );
}
