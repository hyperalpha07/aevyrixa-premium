"use client";

import { Children, cloneElement, isValidElement } from "react";
import { AdminV2Reveal } from "@/components/admin-v2/motion/AdminV2Reveal";

type AdminV2StaggerProps = {
  children: React.ReactNode;
  step?: number;
  start?: number;
};

export function AdminV2Stagger({ children, step = 55, start = 0 }: AdminV2StaggerProps) {
  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    return <AdminV2Reveal delay={start + index * step}>{cloneElement(child)}</AdminV2Reveal>;
  });
}
