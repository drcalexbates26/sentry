"use client";

import { useMemo } from "react";
import { useStore } from "@/store";
import { ThemeContext, darkColors, lightColors } from "@/lib/theme";
import { Sidebar } from "./Sidebar";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const themeMode = useStore((s) => s.themeMode);

  const themeValue = useMemo(() => ({
    mode: themeMode,
    colors: themeMode === "dark" ? darkColors : lightColors,
    toggle: () => {},
  }), [themeMode]);

  const { colors } = themeValue;

  // Apply theme CSS variables to the root
  const cssVars: Record<string, string> = {};
  Object.entries(colors).forEach(([key, val]) => {
    cssVars[`--c-${key}`] = val;
  });

  return (
    <ThemeContext.Provider value={themeValue}>
      <div
        style={{
          ...cssVars,
          minHeight: "100vh",
          background: colors.bg,
          fontFamily: "'Figtree', 'Source Sans 3', -apple-system, sans-serif",
          color: colors.text,
          display: "flex",
          transition: "background 0.25s, color 0.25s",
        } as React.CSSProperties}
      >
        <Sidebar />
        <main style={{ flex: 1, padding: "20px 28px", maxWidth: 1020, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
