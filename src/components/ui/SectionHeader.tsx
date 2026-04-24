"use client";

import { useColors } from "@/lib/theme";

interface SectionHeaderProps {
  children: React.ReactNode;
  sub?: string;
}

export function SectionHeader({ children, sub }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${colors.panelBorder}` }}>
      <h2 style={{ color: colors.white, fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
      {sub && <p style={{ color: colors.textMuted, fontSize: 11, margin: "5px 0 0", lineHeight: 1.4 }}>{sub}</p>}
    </div>
  );
}
