'use client';

import { MOTIONOS_DESIGN_TOKENS } from '@/types/motionos';

interface TrendPoint {
  label: string;
  value: number;
}

interface BioTrendsChartProps {
  title: string;
  data: TrendPoint[];
  color?: string;
  maxValue?: number;
  height?: number;
}

export function BioTrendsChart({
  title,
  data,
  color = MOTIONOS_DESIGN_TOKENS.primaryPurple,
  maxValue,
  height = 120,
}: BioTrendsChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.floor(280 / data.length) - 8);

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: MOTIONOS_DESIGN_TOKENS.bgCard,
        borderColor: 'rgba(124,58,237,0.15)',
      }}
    >
      <h4
        className="text-xs font-mono uppercase tracking-wider mb-4"
        style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}
      >
        {title}
      </h4>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((point) => {
          const barHeight = (point.value / max) * (height - 24);
          return (
            <div key={point.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] font-mono" style={{ color: MOTIONOS_DESIGN_TOKENS.textDim }}>
                {point.value}
              </span>
              <div
                className="rounded-t-md transition-all duration-500 w-full max-w-[40px] mx-auto"
                style={{
                  height: barHeight,
                  background: `linear-gradient(to top, ${color}80, ${color})`,
                  boxShadow: `0 0 8px ${color}30`,
                }}
              />
              <span className="text-[9px] uppercase" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
