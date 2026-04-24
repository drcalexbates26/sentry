"use client";

import { useColors } from "@/lib/theme";

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows = 3,
  style,
}: InputProps) {
  const colors = useColors();
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 11px",
    background: colors.obsidianM,
    border: `1px solid ${colors.panelBorder}`,
    borderRadius: 6,
    color: colors.text,
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 10,
            color: colors.textMuted,
            marginBottom: 4,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ ...fieldStyle, resize: "vertical" as const }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={fieldStyle}
        />
      )}
    </div>
  );
}
