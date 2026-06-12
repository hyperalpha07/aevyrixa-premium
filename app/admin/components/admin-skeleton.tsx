"use client";

type AdminSkeletonVariant = "line" | "card" | "table" | "metric" | "page";

type AdminSkeletonProps = {
  variant?: AdminSkeletonVariant;
  rows?: number;
  className?: string;
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`admin-shimmer rounded-xl bg-white/[0.06] ${className}`} />;
}

export function AdminSkeleton({ className = "", rows = 4, variant = "line" }: AdminSkeletonProps) {
  if (variant === "line") return <SkeletonBlock className={`h-4 w-full ${className}`} />;

  if (variant === "metric") {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-4 ${className}`}>
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-4 h-8 w-20" />
        <SkeletonBlock className="mt-3 h-3 w-32" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-[1.4fr_1fr_0.7fr] gap-3 border-b border-white/6 p-3 last:border-b-0">
            <SkeletonBlock className="h-4" />
            <SkeletonBlock className="h-4" />
            <SkeletonBlock className="h-4" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonBlock className="h-10 w-64" />
        <div className="grid gap-3 md:grid-cols-3">
          <AdminSkeleton variant="metric" />
          <AdminSkeleton variant="metric" />
          <AdminSkeleton variant="metric" />
        </div>
        <AdminSkeleton variant="table" rows={rows} />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-4 ${className}`}>
      <SkeletonBlock className="h-32" />
      <SkeletonBlock className="mt-4 h-4 w-3/4" />
      <SkeletonBlock className="mt-2 h-4 w-1/2" />
    </div>
  );
}

