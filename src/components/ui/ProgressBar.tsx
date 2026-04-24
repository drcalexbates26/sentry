"use client";

import { useColors } from "@/lib/theme";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max = 100, color, height = 5 }: ProgressBarProps) {
  const colors = useColors();
  const barColor = color || colors.teal;
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
          background: `linear-gradient(90deg, ${barColor}, ${barColor}DD)`,
          borderRadius: 99,
          transition: "width 0.4s ease",
          boxShadow: pct > 0 ? `0 0 6px ${barColor}33` : "none",
        }}
      />
    </div>
  );
}
