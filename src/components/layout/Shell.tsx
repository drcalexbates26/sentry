"use client";

import { useMemo } from "react";
import { useStore } from "@/store";
import { ThemeContext, darkColors, lightColors } from "@/lib/theme";
import { Sidebar } from "./Sidebar";
import { AlertsBanner } from "@/components/ui/AlertsBanner";

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

  return (
    <ThemeContext.Provider value={themeValue}>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          fontFamily: "'Figtree', 'Source Sans 3', -apple-system, sans-serif",
          color: colors.text,
          display: "flex",
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, padding: "20px 28px", maxWidth: 1040, overflow: "auto" }}>
          <AlertsBanner />
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
