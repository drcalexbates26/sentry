"use client";

import { colors } from "@/lib/tokens";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max = 100, color = colors.teal, height = 5 }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div
      style={{
        background: colors.obsidianM,
        borderRadius: 99,
        height,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}
