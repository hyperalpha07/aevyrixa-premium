import type { PaletteMode } from "@mui/material";

export type AdminV2ThemeMode = PaletteMode | "system";
export type AdminV2ContentWidth = "compact" | "wide";
export type AdminV2NavigationStyle = "default" | "bordered";

export const adminV2ThemeStorageKey = "aevyrixa.adminV2.theme";
export const adminV2ModeStorageKey = "aevyrixa.adminV2.theme.mode";
export const adminV2ColorSchemeStorageKey = "aevyrixa.adminV2.theme.colorScheme";
export const adminV2ColorSchemeAttribute = "data-admin-v2-color-scheme";
export const adminV2ColorSchemeSelector = `[${adminV2ColorSchemeAttribute}="%s"]`;
export const adminV2DefaultColorScheme = "light";

export const adminV2Brand = {
  name: "Aevyrixa",
  fullName: "Aevyrixa Her Care",
  primary: "#9d2fff",
  secondary: "#b68cff",
  accent: "#ff4fb8",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#f43f5e",
  info: "#06b6d4",
  darkBackground: "#0b1020",
  darkSurface: "#131a2e",
  lightBackground: "#f7f4fb",
  lightSurface: "#ffffff",
} as const;

export const adminV2DefaultThemeSettings = {
  mode: "system" as AdminV2ThemeMode,
  borderRadius: 10,
  contentWidth: "wide" as AdminV2ContentWidth,
  navigationStyle: "default" as AdminV2NavigationStyle,
};
