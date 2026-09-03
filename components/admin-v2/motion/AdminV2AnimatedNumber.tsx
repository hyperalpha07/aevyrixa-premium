"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminV2Motion } from "@/components/admin-v2/motion/AdminV2MotionProvider";

type AdminV2AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
  duration?: number;
};

function formatNumber(value: number, decimals: number, compact?: boolean) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

export function AdminV2AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  compact,
  duration = 720,
}: AdminV2AnimatedNumberProps) {
  const { reducedMotion } = useAdminV2Motion();
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (reducedMotion || hasRun.current) {
      setDisplayValue(value);
      return;
    }

    hasRun.current = true;
    let frame = 0;
    const started = performance.now();

    const tick = (time: number) => {
      const elapsed = Math.min(1, (time - started) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplayValue(value * eased);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reducedMotion, value]);

  return useMemo(
    () => <>{`${prefix}${formatNumber(displayValue, decimals, compact)}${suffix}`}</>,
    [compact, decimals, displayValue, prefix, suffix]
  );
}
