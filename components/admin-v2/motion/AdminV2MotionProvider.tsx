"use client";

import { GlobalStyles, useMediaQuery } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

type AdminV2MotionContextValue = {
  reducedMotion: boolean;
  routeProgressActive: boolean;
  startRouteProgress: () => void;
  finishRouteProgress: () => void;
};

const AdminV2MotionContext = createContext<AdminV2MotionContextValue | null>(null);

export function useAdminV2Motion() {
  const context = useContext(AdminV2MotionContext);
  if (!context) throw new Error("useAdminV2Motion must be used inside AdminV2MotionProvider");
  return context;
}

export function AdminV2MotionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [routeProgressActive, setRouteProgressActive] = useState(false);

  const startRouteProgress = useCallback(() => {
    setRouteProgressActive(true);
  }, []);

  const finishRouteProgress = useCallback(() => {
    window.setTimeout(() => setRouteProgressActive(false), reducedMotion ? 40 : 180);
  }, [reducedMotion]);

  const value = useMemo(
    () => ({ reducedMotion, routeProgressActive, startRouteProgress, finishRouteProgress }),
    [finishRouteProgress, reducedMotion, routeProgressActive, startRouteProgress]
  );

  return (
    <AdminV2MotionContext.Provider value={value}>
      <GlobalStyles
        styles={{
          "@keyframes admin-v2-page-enter": {
            from: { opacity: 0, transform: `translate3d(0, ${adminV2Motion.distance.page}px, 0)` },
            to: { opacity: 1, transform: "translate3d(0, 0, 0)" },
          },
          "@keyframes admin-v2-reveal": {
            from: { opacity: 0, transform: `translate3d(0, ${adminV2Motion.distance.reveal}px, 0)` },
            to: { opacity: 1, transform: "translate3d(0, 0, 0)" },
          },
          "@keyframes admin-v2-ambient-drift": {
            from: { transform: "translate3d(-1.5%, -1%, 0) scale(1)" },
            to: { transform: "translate3d(1.5%, 1%, 0) scale(1.04)" },
          },
          "@keyframes admin-v2-shimmer": {
            from: { backgroundPosition: "160% 0" },
            to: { backgroundPosition: "-160% 0" },
          },
          "@keyframes admin-v2-badge-pulse": {
            "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(234, 76, 137, 0)" },
            "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 5px rgba(234, 76, 137, 0.18)" },
          },
          ".admin-v2-theme-transition, .admin-v2-theme-transition *": {
            transition:
              "background-color 160ms cubic-bezier(0.2, 0, 0, 1), border-color 160ms cubic-bezier(0.2, 0, 0, 1), color 160ms cubic-bezier(0.2, 0, 0, 1)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "1ms !important",
              animationIterationCount: "1 !important",
              scrollBehavior: "auto !important",
              transitionDuration: "1ms !important",
            },
          },
        }}
      />
      {children}
    </AdminV2MotionContext.Provider>
  );
}
