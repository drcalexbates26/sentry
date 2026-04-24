"use client";

import { createContext, useContext } from "react";

export type ThemeMode = "dark" | "light";

export const darkColors = {
  // Brand
  teal: "#00D4C8", tealDark: "#00B4A6", tealLight: "#4DEDE4",
  // Backgrounds
  bg: "#080C12", bgL: "#0D1219", bgM: "#131A24",
  obsidian: "#080C12", obsidianL: "#0D1219", obsidianM: "#131A24",
  // Panels
  panel: "#0F1623", panelLight: "#162032", panelBorder: "#1C2A3E",
  // Text
  text: "#EDF2F7", textMuted: "#A0AEC0", textDim: "#718096",
  white: "#FFFFFF",
  // Status
  red: "#F56565", orange: "#ED8936", yellow: "#ECC94B",
  green: "#48BB78", blue: "#4299E1", purple: "#9F7AEA", cyan: "#0BC5EA",
};

export const lightColors = {
  // Brand
  teal: "#0D9488", tealDark: "#0F766E", tealLight: "#14B8A6",
  // Backgrounds
  bg: "#F7F8FA", bgL: "#EEF1F5", bgM: "#E2E7EE",
  obsidian: "#F7F8FA", obsidianL: "#EEF1F5", obsidianM: "#E2E7EE",
  // Panels
  panel: "#FFFFFF", panelLight: "#F7F8FA", panelBorder: "#D1D9E6",
  // Text
  text: "#1A202C", textMuted: "#4A5568", textDim: "#A0AEC0",
  white: "#111827",
  // Status
  red: "#E53E3E", orange: "#DD6B20", yellow: "#D69E2E",
  green: "#38A169", blue: "#3182CE", purple: "#805AD5", cyan: "#00A3C4",
};

export type ThemeColors = typeof darkColors;

export interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  colors: darkColors,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}
