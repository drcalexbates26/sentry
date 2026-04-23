"use client";

import { colors } from "@/lib/tokens";

interface SectionHeaderProps {
  children: React.ReactNode;
  sub?: string;
}

export function SectionHeader({ children, sub }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ color: colors.white, fontSize: 17, fontWeight: 700, margin: 0 }}>{children}</h2>
      {sub && <p style={{ color: colors.textMuted, fontSize: 11, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}
