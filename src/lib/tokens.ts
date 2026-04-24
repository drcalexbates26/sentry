// Static colors for non-component code (report generators, etc.)
export const colors = {
  teal: "#00B4A6",
  tealDark: "#009A8E",
  tealLight: "#33C4B8",
  obsidian: "#0A0E14",
  obsidianL: "#0F1520",
  obsidianM: "#151C28",
  panel: "#111827",
  panelLight: "#1A2332",
  panelBorder: "#1E293B",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  white: "#FFFFFF",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
} as const;

export const typography = {
  display: "'Figtree', sans-serif",
  body: "'Source Sans 3', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export type ColorKey = keyof typeof colors;
