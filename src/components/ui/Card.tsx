"use client";

import { useColors } from "@/lib/theme";

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, onClick, style, className = "" }: CardProps) {
  const colors = useColors();
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: colors.panel,
        border: `1px solid ${colors.panelBorder}`,
        borderRadius: 10,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
        ...(onClick ? { ":hover": {} } : {}),
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = colors.teal + "44";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${colors.teal}08`;
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = (style?.borderColor as string) || (style?.border ? "" : colors.panelBorder);
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      } : undefined}
    >
      {children}
    </div>
  );
}
