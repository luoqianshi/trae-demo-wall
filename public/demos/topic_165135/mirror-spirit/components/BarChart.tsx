interface BarChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  secondaryData?: number[];
  secondaryColor?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  labels,
  height = 160,
  color = "#0071e3",
  secondaryData,
  secondaryColor = "rgba(0,0,0,0.06)",
  showValues = false,
}: BarChartProps) {
  const maxValue = 100;
  const barGap = 8;
  const barWidth = 20;
  const paddingTop = showValues ? 24 : 8;
  const paddingBottom = labels ? 28 : 8;
  const chartHeight = height - paddingTop - paddingBottom;
  const totalWidth = data.length * (barWidth + barGap) - barGap + 32;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * chartHeight;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${totalWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`barGrad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`barGlow-${color.replace("#", "")}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line
          key={i}
          x1="16"
          y1={paddingTop + chartHeight * p}
          x2={totalWidth - 16}
          y2={paddingTop + chartHeight * p}
          stroke="rgba(0,0,0,0.05)"
          strokeDasharray="2 4"
        />
      ))}

      {secondaryData &&
        secondaryData.map((val, i) => {
          const barHeight = getBarHeight(val);
          const x = 16 + i * (barWidth + barGap);
          const y = paddingTop + chartHeight - barHeight;
          return (
            <rect
              key={`sec-${i}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={secondaryColor}
              rx="4"
              className="bar-grow"
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          );
        })}

      {data.map((val, i) => {
        const barHeight = getBarHeight(val);
        const x = 16 + i * (barWidth + barGap);
        const y = paddingTop + chartHeight - barHeight;
        return (
          <g key={i} className="bar-grow" style={{ animationDelay: `${i * 0.06 + 0.1}s` }}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={`url(#barGrad-${color.replace("#", "")})`}
              rx="4"
              filter={`url(#barGlow-${color.replace("#", "")})`}
            />
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fill="rgba(0,0,0,0.6)"
                fontSize="10"
                fontWeight="600"
              >
                {Math.round(val)}
              </text>
            )}
          </g>
        );
      })}

      {labels &&
        labels.map((label, i) => {
          const x = 16 + i * (barWidth + barGap) + barWidth / 2;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(0,0,0,0.4)"
              fontSize="10"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}
