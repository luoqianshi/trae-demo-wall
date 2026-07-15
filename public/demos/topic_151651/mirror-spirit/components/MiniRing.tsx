interface MiniRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
}

export default function MiniRing({
  value,
  size = 48,
  strokeWidth = 4,
  color = "#0071e3",
  bgColor = "rgba(0,0,0,0.06)",
  label,
}: MiniRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="mini-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 1px 3px ${color}40)` }}
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-bold text-gray-700 tabular-nums">{label}</span>
      )}
    </div>
  );
}
