"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import {
  CssBaseline,
  ScopedCssBaseline,
  useMediaQuery,
} from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider, createTheme, useColorScheme } from "@mui/material/styles";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ComponentProps, ComponentType, Dispatch, SetStateAction } from "react";
import {
  adminV2Brand,
  adminV2ColorSchemeSelector,
  adminV2ColorSchemeStorageKey,
  adminV2DefaultThemeSettings,
  adminV2ModeStorageKey,
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
type AdminV2StoredThemePreferences = Omit<AdminV2StoredThemeSettings, "mode">;

type AdminV2ThemeContextValue = AdminV2ThemeSettings & {
  setMode: (mode: AdminV2ThemeMode) => void;
  setBorderRadius: (radius: number) => void;
  setContentWidth: (width: AdminV2ContentWidth) => void;
  setNavigationStyle: (style: AdminV2NavigationStyle) => void;
};

const AdminV2ThemeContext = createContext<AdminV2ThemeContextValue | null>(null);
const AdminV2MuiThemeProvider = ThemeProvider as ComponentType<
  ComponentProps<typeof ThemeProvider> & { forceThemeRerender?: boolean }
>;

export function useAdminV2Theme() {
  const context = useContext(AdminV2ThemeContext);
  if (!context) throw new Error("useAdminV2Theme must be used inside AdminV2ThemeProvider");
  return context;
}

function isAdminV2ThemeMode(value: unknown): value is AdminV2ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredPreferences(): AdminV2StoredThemePreferences {
  try {
    const raw = window.localStorage.getItem(adminV2ThemeStorageKey);
    if (!raw) return adminV2DefaultThemeSettings;
    const parsed = JSON.parse(raw) as Partial<AdminV2StoredThemeSettings>;
    return {
      borderRadius: typeof parsed.borderRadius === "number" ? parsed.borderRadius : adminV2DefaultThemeSettings.borderRadius,
      contentWidth: parsed.contentWidth === "compact" || parsed.contentWidth === "wide"
        ? parsed.contentWidth
        : adminV2DefaultThemeSettings.contentWidth,
      navigationStyle: parsed.navigationStyle === "bordered" || parsed.navigationStyle === "default"
        ? parsed.navigationStyle
        : adminV2DefaultThemeSettings.navigationStyle,
    };
  } catch {
    return adminV2DefaultThemeSettings;
  }
}

function readLegacyStoredMode(): AdminV2ThemeMode | null {
  try {
    const mode = window.localStorage.getItem(adminV2ModeStorageKey);
    if (isAdminV2ThemeMode(mode)) return null;

    const raw = window.localStorage.getItem(adminV2ThemeStorageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AdminV2StoredThemeSettings>;
    return isAdminV2ThemeMode(parsed.mode) ? parsed.mode : null;
  } catch {
    return null;
  }
}

type AdminV2ThemeControllerProps = {
  children: React.ReactNode;
  hasLoadedStoredSettings: boolean;
  settings: AdminV2StoredThemePreferences;
  setSettings: Dispatch<SetStateAction<AdminV2StoredThemePreferences>>;
};

function AdminV2ThemeController({
  children,
  hasLoadedStoredSettings,
  settings,
  setSettings,
}: AdminV2ThemeControllerProps) {
  const { mode: muiMode, setMode: setMuiMode, systemMode } = useColorScheme();

  useEffect(() => {
    if (!hasLoadedStoredSettings) return;
    const legacyMode = readLegacyStoredMode();
    if (legacyMode) setMuiMode(legacyMode);
  }, [hasLoadedStoredSettings, setMuiMode]);

  const mode = (muiMode ?? adminV2DefaultThemeSettings.mode) as AdminV2ThemeMode;
  const resolvedMode: PaletteMode = mode === "system" ? systemMode ?? "light" : mode;

  const value = useMemo<AdminV2ThemeContextValue>(
    () => ({
      ...settings,
      mode,
      resolvedMode,
      setMode: (nextMode) => setMuiMode(nextMode),
      setBorderRadius: (borderRadius) => setSettings((current) => ({ ...current, borderRadius })),
      setContentWidth: (contentWidth) => setSettings((current) => ({ ...current, contentWidth })),
      setNavigationStyle: (navigationStyle) => setSettings((current) => ({ ...current, navigationStyle })),
    }),
    [mode, resolvedMode, setMuiMode, settings]
  );

  useEffect(() => {
    window.localStorage.setItem(`${adminV2ColorSchemeStorageKey}-light`, "light");
    window.localStorage.setItem(`${adminV2ColorSchemeStorageKey}-dark`, "dark");
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSettings || isAdminV2ThemeMode(muiMode)) return;
    setMuiMode(adminV2DefaultThemeSettings.mode);
  }, [hasLoadedStoredSettings, muiMode, setMuiMode]);

  return (
    <AdminV2ThemeContext.Provider value={value}>
      <ScopedCssBaseline
        enableColorScheme
        className="admin-v2-theme-transition"
        sx={{ minHeight: "100vh", bgcolor: "background.default" }}
      >
        <CssBaseline />
        {children}
      </ScopedCssBaseline>
    </AdminV2ThemeContext.Provider>
  );
}

export function AdminV2ThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [settings, setSettings] = useState<AdminV2StoredThemePreferences>(adminV2DefaultThemeSettings);
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);

  useEffect(() => {
    setSettings(readStoredPreferences());
    setHasLoadedStoredSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSettings) return;
    window.localStorage.setItem(adminV2ThemeStorageKey, JSON.stringify(settings));
  }, [hasLoadedStoredSettings, settings]);

  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: adminV2ColorSchemeSelector,
        },
        colorSchemes: {
          light: {
            palette: {
              mode: "light",
              primary: { main: adminV2Brand.primary },
              secondary: { main: adminV2Brand.secondary },
              success: { main: adminV2Brand.success },
              warning: { main: adminV2Brand.warning },
              error: { main: adminV2Brand.error },
              info: { main: adminV2Brand.info },
              background: { default: adminV2Brand.lightBackground, paper: adminV2Brand.lightSurface },
            },
          },
          dark: {
            palette: {
              mode: "dark",
              primary: { main: adminV2Brand.primary },
              secondary: { main: adminV2Brand.secondary },
              success: { main: adminV2Brand.success },
              warning: { main: adminV2Brand.warning },
              error: { main: adminV2Brand.error },
              info: { main: adminV2Brand.info },
              background: { default: adminV2Brand.darkBackground, paper: adminV2Brand.darkSurface },
            },
          },
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
              root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 18px 50px rgba(0,0,0,0.24)"
                    : "0 10px 30px rgba(28,20,54,0.08)",
              }),
            },
          },
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: ({ theme }) => ({ borderRadius: Math.max(8, Number(theme.shape.borderRadius) - 2) }) },
          },
          MuiPaper: {
            styleOverrides: { root: { backgroundImage: "none" } },
          },
          MuiSkeleton: {
            defaultProps: { animation: prefersReducedMotion ? false : "wave" },
          },
        },
      }),
    [prefersReducedMotion, settings.borderRadius]
  );

  return (
    <AppRouterCacheProvider>
      <AdminV2MuiThemeProvider
        theme={theme}
        defaultMode={adminV2DefaultThemeSettings.mode}
        modeStorageKey={adminV2ModeStorageKey}
        colorSchemeStorageKey={adminV2ColorSchemeStorageKey}
        disableTransitionOnChange
        forceThemeRerender
        noSsr
      >
        <AdminV2ThemeController
          hasLoadedStoredSettings={hasLoadedStoredSettings}
          settings={settings}
          setSettings={setSettings}
        >
          {children}
        </AdminV2ThemeController>
      </AdminV2MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
