"use client";

import { colors } from "@/lib/tokens";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: colors.teal, color: colors.obsidian },
  secondary: { background: colors.panelLight, color: colors.text, border: `1px solid ${colors.panelBorder}` },
  danger: { background: colors.red, color: "#fff" },
  ghost: { background: "transparent", color: colors.teal },
  outline: { background: "transparent", color: colors.teal, border: `1px solid ${colors.teal}40` },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { fontSize: 10, padding: "4px 11px" },
  md: { fontSize: 12, padding: "7px 16px" },
  lg: { fontSize: 14, padding: "12px 22px" },
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  style,
}: ButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        fontWeight: 600,
        fontFamily: "inherit",
        transition: "all 0.12s",
        opacity: disabled ? 0.35 : 1,
        borderRadius: 7,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
