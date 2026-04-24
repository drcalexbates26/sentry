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
        padding: "2px 9px",
        borderRadius: 99,
        background: c + "20",
        color: c,
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
