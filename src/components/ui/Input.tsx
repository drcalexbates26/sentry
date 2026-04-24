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
    padding: "8px 12px",
    background: colors.obsidianM,
    border: `1px solid ${colors.panelBorder}`,
    borderRadius: 7,
    color: colors.text,
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.teal + "66";
    e.target.style.boxShadow = `0 0 0 2px ${colors.teal}15`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.panelBorder;
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 10,
            color: colors.textMuted,
            marginBottom: 5,
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
          onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
          onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
          style={{ ...fieldStyle, resize: "vertical" as const }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLInputElement>}
          onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLInputElement>}
          style={fieldStyle}
        />
      )}
    </div>
  );
}
