"use client";

import { useColors } from "@/lib/theme";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
}

export function Select({ label, value, onChange, options }: SelectProps) {
  const colors = useColors();
  return (
    <div style={{ marginBottom: 12 }}>
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "7px 11px",
          background: colors.obsidianM,
          border: `1px solid ${colors.panelBorder}`,
          borderRadius: 6,
          color: colors.text,
          fontSize: 12,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        <option value="">Select...</option>
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}
