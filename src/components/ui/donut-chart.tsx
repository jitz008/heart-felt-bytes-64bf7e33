import React from 'react';

interface DonutChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  stroke?: string;
}

export default function DonutChart({
  value,
  size = 96,
  strokeWidth = 6,
  label,
  sublabel,
  stroke = 'hsl(var(--muted-foreground))',
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute flex flex-col items-center">
          {label && <span className="text-lg font-medium text-white/90 font-sans">{label}</span>}
          {sublabel && (
            <span className="text-[8px] uppercase tracking-[0.18em] text-white/35 font-medium">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
