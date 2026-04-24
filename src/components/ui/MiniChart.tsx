"use client";

import { useColors } from "@/lib/theme";

interface DataPoint {
  l: string;
  v: number;
}

interface MiniChartProps {
  data: DataPoint[];
  height?: number;
}

export function MiniChart({ data, height = 100 }: MiniChartProps) {
  const colors = useColors();
  const mx = Math.max(...data.map((d) => d.v), 1);
  const bw = 28;
  const gap = 6;
  const w = data.length * (bw + gap) + 30;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={w} height={height + 30}>
        {data.map((d, i) => {
          const bh = (d.v / mx) * (height - 8);
          const x = 24 + i * (bw + gap);
          const y = height - bh;
          const fill = d.v >= 5 ? colors.red : d.v >= 3 ? colors.orange : colors.teal;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh} rx={3} fill={fill} opacity={0.8} />
              <text x={x + bw / 2} y={height + 14} textAnchor="middle" fill={colors.textMuted} fontSize={8}>
                {d.l}
              </text>
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" fill={colors.text} fontSize={8} fontWeight="600">
                {d.v}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
