"use client";

import { colors } from "@/lib/tokens";

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, onClick, style, className = "" }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: colors.panel,
        border: `1px solid ${colors.panelBorder}`,
        borderRadius: 9,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
