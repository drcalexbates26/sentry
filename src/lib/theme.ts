"use client";

import { createContext, useContext } from "react";

export type ThemeMode = "dark" | "light";

export const darkColors = {
  teal: "#00B4A6", tealDark: "#009A8E", tealLight: "#33C4B8",
  bg: "#0A0E14", bgL: "#0F1520", bgM: "#151C28",
  // Aliases for backward compat with component code
  obsidian: "#0A0E14", obsidianL: "#0F1520", obsidianM: "#151C28",
  panel: "#111827", panelLight: "#1A2332", panelBorder: "#1E293B",
  text: "#E2E8F0", textMuted: "#94A3B8", textDim: "#64748B",
  white: "#FFFFFF",
  red: "#EF4444", orange: "#F97316", yellow: "#EAB308",
  green: "#22C55E", blue: "#3B82F6", purple: "#8B5CF6", cyan: "#06B6D4",
};

export const lightColors = {
  teal: "#009A8E", tealDark: "#00796B", tealLight: "#00B4A6",
  bg: "#F8FAFC", bgL: "#F1F5F9", bgM: "#E2E8F0",
  obsidian: "#F8FAFC", obsidianL: "#F1F5F9", obsidianM: "#E2E8F0",
  panel: "#FFFFFF", panelLight: "#F8FAFC", panelBorder: "#CBD5E1",
  text: "#1E293B", textMuted: "#475569", textDim: "#94A3B8",
  white: "#0F172A",
  red: "#DC2626", orange: "#EA580C", yellow: "#CA8A04",
  green: "#16A34A", blue: "#2563EB", purple: "#7C3AED", cyan: "#0891B2",
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

/** Shorthand: returns the themed colors object */
export function useColors() {
  return useContext(ThemeContext).colors;
}
