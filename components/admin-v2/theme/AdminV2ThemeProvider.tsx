"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import {
  CssBaseline,
  ScopedCssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  adminV2Brand,
  adminV2DefaultThemeSettings,
  adminV2ThemeStorageKey,
  type AdminV2ContentWidth,
  type AdminV2NavigationStyle,
  type AdminV2ThemeMode,
} from "@/configs/admin-v2/theme";

type AdminV2ThemeSettings = {
  mode: AdminV2ThemeMode;
  resolvedMode: PaletteMode;
  borderRadius: number;
  contentWidth: AdminV2ContentWidth;
  navigationStyle: AdminV2NavigationStyle;
};

type AdminV2StoredThemeSettings = Omit<AdminV2ThemeSettings, "resolvedMode">;

type AdminV2ThemeContextValue = AdminV2ThemeSettings & {
  setMode: (mode: AdminV2ThemeMode) => void;
  setBorderRadius: (radius: number) => void;
  setContentWidth: (width: AdminV2ContentWidth) => void;
  setNavigationStyle: (style: AdminV2NavigationStyle) => void;
};

const AdminV2ThemeContext = createContext<AdminV2ThemeContextValue | null>(null);

export function useAdminV2Theme() {
  const context = useContext(AdminV2ThemeContext);
  if (!context) throw new Error("useAdminV2Theme must be used inside AdminV2ThemeProvider");
  return context;
}

function readStoredSettings(): AdminV2StoredThemeSettings {
  if (typeof window === "undefined") return adminV2DefaultThemeSettings;
  try {
    const raw = window.localStorage.getItem(adminV2ThemeStorageKey);
    if (!raw) return adminV2DefaultThemeSettings;
    return { ...adminV2DefaultThemeSettings, ...JSON.parse(raw) };
  } catch {
    return adminV2DefaultThemeSettings;
  }
}

export function AdminV2ThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true });
  const [settings, setSettings] = useState<AdminV2StoredThemeSettings>(readStoredSettings);

  useEffect(() => {
    window.localStorage.setItem(adminV2ThemeStorageKey, JSON.stringify(settings));
  }, [settings]);

  const resolvedMode: PaletteMode = settings.mode === "system" ? (prefersDark ? "dark" : "light") : settings.mode;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          primary: { main: adminV2Brand.primary },
          secondary: { main: adminV2Brand.secondary },
          success: { main: adminV2Brand.success },
          warning: { main: adminV2Brand.warning },
          error: { main: adminV2Brand.error },
          info: { main: adminV2Brand.info },
          background:
            resolvedMode === "dark"
              ? { default: adminV2Brand.darkBackground, paper: adminV2Brand.darkSurface }
              : { default: adminV2Brand.lightBackground, paper: adminV2Brand.lightSurface },
        },
        shape: { borderRadius: settings.borderRadius },
        typography: {
          fontFamily: "var(--font-geist-sans), Inter, Arial, sans-serif",
          h4: { fontWeight: 700, letterSpacing: 0 },
          h5: { fontWeight: 700, letterSpacing: 0 },
          h6: { fontWeight: 700, letterSpacing: 0 },
          button: { textTransform: "none", fontWeight: 700 },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: settings.borderRadius,
                boxShadow:
                  resolvedMode === "dark"
                    ? "0 18px 50px rgba(0,0,0,0.24)"
                    : "0 10px 30px rgba(28,20,54,0.08)",
              },
            },
          },
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { borderRadius: Math.max(8, settings.borderRadius - 2) } },
          },
          MuiPaper: {
            styleOverrides: { root: { backgroundImage: "none" } },
          },
        },
      }),
    [resolvedMode, settings.borderRadius]
  );

  const value = useMemo<AdminV2ThemeContextValue>(
    () => ({
      ...settings,
      resolvedMode,
      setMode: (mode) => setSettings((current) => ({ ...current, mode })),
      setBorderRadius: (borderRadius) => setSettings((current) => ({ ...current, borderRadius })),
      setContentWidth: (contentWidth) => setSettings((current) => ({ ...current, contentWidth })),
      setNavigationStyle: (navigationStyle) => setSettings((current) => ({ ...current, navigationStyle })),
    }),
    [resolvedMode, settings]
  );

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <AdminV2ThemeContext.Provider value={value}>
          <ScopedCssBaseline enableColorScheme sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <CssBaseline />
            {children}
          </ScopedCssBaseline>
        </AdminV2ThemeContext.Provider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
