'use client';

import { MOTIONOS_DESIGN_TOKENS } from '@/types/motionos';

interface RecoveryGaugeProps {
  value: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  icon?: React.ReactNode;
}

export function RecoveryGauge({
  value,
  label,
  sublabel,
  color = MOTIONOS_DESIGN_TOKENS.successGreen,
  size = 88,
  icon,
}: RecoveryGaugeProps) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(124,58,237,0.12)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: MOTIONOS_DESIGN_TOKENS.textPrimary }}>
            {value}
          </span>
          {sublabel && (
            <span className="text-[9px] uppercase tracking-wider" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: MOTIONOS_DESIGN_TOKENS.textDim }}>
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
}
