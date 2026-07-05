import { useEffect, useState } from 'react';

interface ProgressRingProps {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

export default function ProgressRing({
  segments,
  size = 160,
  thickness = 10,
  centerLabel,
  centerSub,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4; // 段间间隙角度
  const gapLen = (gap / 360) * circumference;

  // 每段按 value（0-1）占比绘制
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 底环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(26,24,20,0.08)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const portion = s.value / total;
          const len = portion * (circumference - gapLen * segments.length);
          const dashArray = `${mounted ? len : 0} ${circumference}`;
          const dashOffset = -(offset + i * gapLen);
          offset += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <div className="font-display text-2xl text-ink leading-none">{centerLabel}</div>
          )}
          {centerSub && (
            <div className="text-[10px] text-ink-mute mt-1 tracking-widest">{centerSub}</div>
          )}
        </div>
      )}
    </div>
  );
}
