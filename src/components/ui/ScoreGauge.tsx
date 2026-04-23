"use client";

import { colors } from "@/lib/tokens";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export function ScoreGauge({ score, label, size = 110 }: ScoreGaugeProps) {
  const cl = score >= 80 ? colors.green : score >= 60 ? colors.yellow : score >= 40 ? colors.orange : colors.red;
  const r = (size - 14) / 2;
  const ci = 2 * Math.PI * r;
  const off = ci - (score / 100) * ci;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.obsidianM} strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={cl}
          strokeWidth="6"
          strokeDasharray={ci}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s" }}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill={cl} fontSize={size / 5} fontWeight="700">
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill={colors.textMuted} fontSize={size / 14}>
          /100
        </text>
      </svg>
      {label && <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{label}</div>}
    </div>
  );
}
