import type { Metric, MetricKey, MetricStatus } from "@/types";
import { statusColorVar, statusBgVar } from "@/lib/status";

interface MetricCardProps {
  label: string;
  metric: Metric;
  /** 大号显示（用于温度主卡之外的 2x2 网格） */
  size?: "grid";
  onClick?: () => void;
}

/** 2x2 网格中的指标卡片，状态即颜色 */
export default function MetricCard({ label, metric, onClick }: MetricCardProps) {
  const color = statusColorVar[metric.status];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start text-left transition active:opacity-80"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: "var(--card-padding)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--color-rule)",
        minHeight: 92,
      }}
    >
      <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>{label}</span>
      <div className="flex items-baseline gap-1" style={{ marginTop: 4 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color,
            lineHeight: 1.2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {metric.value}
        </span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--color-text-muted)" }}>{metric.unit}</span>
      </div>
      <span
        className="inline-flex items-center justify-center whitespace-nowrap"
        style={{
          marginTop: 6,
          background: statusBgVar[metric.status],
          color,
          fontSize: "var(--text-micro)",
          fontWeight: 500,
          padding: "1px 6px",
          borderRadius: "var(--radius-full)",
          lineHeight: "16px",
        }}
      >
        {metric.label}
      </span>
    </button>
  );
}

/** 状态徽章（生长阶段） */
export function StageBadge({ stage, status }: { stage: string; status: MetricStatus }) {
  const map: Record<string, { bg: string; color: string }> = {
    转色期: { bg: "var(--state-success-light)", color: "var(--state-success)" },
    菌丝期: { bg: "var(--state-info-light)", color: "var(--state-info)" },
    出菇期: { bg: "var(--state-warning-light)", color: "var(--state-warning)" },
    已采收: { bg: "var(--color-bg-deep)", color: "var(--color-text-muted)" },
  };
  const s = map[stage] ?? { bg: "var(--state-success-light)", color: "var(--state-success)" };
  // 危险态用红
  if (status === "danger") {
    s.bg = "var(--state-error)";
    s.color = "#fff";
  }
  return (
    <span
      className="inline-flex items-center justify-center whitespace-nowrap"
      style={{
        height: 26,
        padding: "0 10px",
        borderRadius: "var(--radius-full)",
        fontSize: 13,
        fontWeight: 500,
        background: s.bg,
        color: s.color,
      }}
    >
      {stage}
    </span>
  );
}

export const metricKeyOrder: MetricKey[] = ["humidity", "co2", "light", "soilTemp"];
export const metricLabelMap: Record<MetricKey, string> = {
  temperature: "当前温度",
  humidity: "湿度",
  co2: "CO₂",
  light: "光照",
  soilTemp: "土壤温",
};
