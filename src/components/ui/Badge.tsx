"use client";

import { useColors } from "@/lib/theme";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className = "" }: BadgeProps) {
  const colors = useColors();
  const c = color || colors.teal;
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 5,
        background: c + "18",
        color: c,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
