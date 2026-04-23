"use client";

import { colors } from "@/lib/tokens";

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export function Select({ label, value, onChange, options }: SelectProps) {
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
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
