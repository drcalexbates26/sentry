"use client";

import { colors } from "@/lib/tokens";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = colors.teal, className = "" }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: 99,
        background: color + "20",
        color: color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}
