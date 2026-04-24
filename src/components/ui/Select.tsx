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
            marginBottom: 5,
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
          padding: "8px 12px",
          background: colors.obsidianM,
          border: `1px solid ${colors.panelBorder}`,
          borderRadius: 7,
          color: colors.text,
          fontSize: 12,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${encodeURIComponent(colors.textDim)}' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: 30,
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
