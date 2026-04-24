"use client";

import { useColors } from "@/lib/theme";
import { useTheme } from "@/lib/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { fontSize: 10, padding: "5px 12px", borderRadius: 6 },
  md: { fontSize: 12, padding: "8px 18px", borderRadius: 8 },
  lg: { fontSize: 14, padding: "12px 24px", borderRadius: 8 },
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
  const colors = useColors();
  const { mode } = useTheme();

  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
      color: mode === "dark" ? "#080C12" : "#FFFFFF",
      fontWeight: 700,
      boxShadow: `0 1px 3px ${colors.teal}22`,
    },
    secondary: {
      background: colors.panelLight,
      color: colors.text,
      border: `1px solid ${colors.panelBorder}`,
    },
    danger: {
      background: `linear-gradient(135deg, ${colors.red}, #C53030)`,
      color: "#fff",
      fontWeight: 700,
    },
    ghost: {
      background: "transparent",
      color: colors.teal,
    },
    outline: {
      background: "transparent",
      color: colors.teal,
      border: `1px solid ${colors.teal}40`,
    },
  };

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
        transition: "all 0.15s ease",
        opacity: disabled ? 0.35 : 1,
        letterSpacing: "0.01em",
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
