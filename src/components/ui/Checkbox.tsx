"use client";

import { useColors } from "@/lib/theme";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const colors = useColors();
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        cursor: "pointer",
        fontSize: 12,
        color: colors.text,
        padding: "5px 0",
        lineHeight: 1.5,
      }}
    >
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${checked ? colors.teal : colors.panelBorder}`,
          background: checked ? colors.teal : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
          cursor: "pointer",
          transition: "all 0.12s ease",
          boxShadow: checked ? `0 0 0 2px ${colors.teal}22` : "none",
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke={colors.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span>{label}</span>
    </label>
  );
}
