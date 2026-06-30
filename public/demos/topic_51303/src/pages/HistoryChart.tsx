import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getChartData } from "@/services/api";
import { metricLabels, metricUnits } from "@/mock/data";
import type { MetricKey } from "@/types";

const ranges: { key: "24h" | "7d" | "30d"; label: string }[] = [
  { key: "24h", label: "24小时" },
  { key: "7d", label: "7天" },
  { key: "30d", label: "30天" },
];

export default function HistoryChart() {
  const { metric } = useParams<{ metric: MetricKey }>();
  const metricKey: MetricKey = (metric as MetricKey) ?? "temperature";
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    getChartData(metricKey, range).then(setData);
  }, [metricKey, range]);

  const stats = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg };
  }, [data]);

  const label = metricLabels[metricKey];
  const unit = metricUnits[metricKey];

  return (
    <SubPageLayout title={`${label}趋势`}>
      <div style={{ padding: 12 }}>
        {/* 当前值概览 */}
        <div
          className="animate-fade-in-up flex items-center justify-between"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</div>
            <div className="flex items-baseline gap-1" style={{ marginTop: 2 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}>
                {data.length > 0 ? data[data.length - 1].value : "—"}
              </span>
              <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{unit}</span>
            </div>
          </div>
          <TrendingUp size={28} style={{ color: "var(--color-primary)" }} />
        </div>

        {/* 时间维度切换 */}
        <div className="flex items-center" style={{ background: "var(--color-bg-deep)", borderRadius: "var(--radius-full)", padding: 3, marginBottom: 12 }}>
          {ranges.map((r) => {
            const isActive = range === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className="flex-1"
                style={{
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--color-bg-elevated)" : "transparent",
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: "none",
                  boxShadow: isActive ? "var(--shadow-card)" : "none",
                  transition: "all 200ms",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* 折线图 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <LineChart data={data} unit={unit} color="var(--color-primary)" />
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3" style={{ gap: 8 }}>
          <StatBox label="最高" value={`${stats.max.toFixed(1)} ${unit}`} color="var(--state-error)" />
          <StatBox label="最低" value={`${stats.min.toFixed(1)} ${unit}`} color="var(--state-info)" />
          <StatBox label="平均" value={`${stats.avg.toFixed(1)} ${unit}`} color="var(--state-success)" />
        </div>
      </div>
    </SubPageLayout>
  );
}

function LineChart({
  data,
  unit,
  color,
}: {
  data: { label: string; value: number }[];
  unit: string;
  color: string;
}) {
  const width = 320;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 28, left: 36 };

  if (data.length === 0) {
    return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 13 }}>加载中…</div>;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - min) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH} L ${points[0].x.toFixed(1)} ${padding.top + chartH} Z`;

  // Y 轴刻度
  const yTicks = [0, 0.5, 1].map((t) => {
    const val = min + range * t;
    const y = padding.top + chartH - t * chartH;
    return { val, y };
  });

  // X 轴标签（取首中尾）
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => points[i]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 网格线 + Y 轴标签 */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} y1={t.y} x2={width - padding.right} y2={t.y} stroke="var(--color-rule)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={padding.left - 6} y={t.y + 3} textAnchor="end" fontSize="9" fill="var(--color-text-muted)">
            {t.val.toFixed(0)}
          </text>
        </g>
      ))}

      {/* 区域填充 */}
      <path d={areaD} fill="url(#areaFill)" />

      {/* 折线 */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* 数据点（7d/30d 只画少量点避免拥挤） */}
      {data.length <= 8
        ? points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke={color} strokeWidth="2" />
            </g>
          ))
        : null}

      {/* X 轴标签 */}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={height - 8} textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"} fontSize="9" fill="var(--color-text-muted)">
          {p.label}
        </text>
      ))}

      <title>{`单位 ${unit}`}</title>
    </svg>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center" style={{ background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", padding: "12px 8px", boxShadow: "var(--shadow-card)" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
