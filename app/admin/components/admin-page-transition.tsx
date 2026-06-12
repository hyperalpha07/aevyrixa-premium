"use client";

import type { ReactNode } from "react";

export function AdminPageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`animate-[admin-page-in_220ms_ease-out_both] motion-reduce:animate-none ${className}`}>
      {children}
    </div>
  );
}

