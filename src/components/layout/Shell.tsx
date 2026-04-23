"use client";

import { colors } from "@/lib/tokens";
import { Sidebar } from "./Sidebar";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.obsidian,
        fontFamily: "'Figtree', 'Source Sans 3', -apple-system, sans-serif",
        color: colors.text,
        display: "flex",
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, padding: "20px 28px", maxWidth: 1020, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
