"use client";

import { colors } from "@/lib/tokens";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        cursor: "pointer",
        fontSize: 12,
        color: colors.text,
        padding: "4px 0",
        lineHeight: 1.5,
      }}
    >
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: `2px solid ${checked ? colors.teal : colors.panelBorder}`,
          background: checked ? colors.teal : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
          cursor: "pointer",
        }}
      >
        {checked && (
          <span style={{ color: colors.obsidian, fontSize: 10, fontWeight: 800 }}>
            ✓
          </span>
        )}
      </div>
      <span>{label}</span>
    </label>
  );
}
