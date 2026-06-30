import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getSheds } from "@/services/api";
import { statusColorVar, statusBgVar } from "@/lib/status";
import type { ShedSummary } from "@/types";

export default function MultiShed() {
  const navigate = useNavigate();
  const [sheds, setSheds] = useState<ShedSummary[]>([]);

  useEffect(() => {
    getSheds().then(setSheds);
  }, []);

  const total = sheds.length;
  const normal = sheds.filter((s) => s.status === "normal").length;
  const abnormal = sheds.filter((s) => s.status !== "normal" && s.status !== "offline").length;
  const offline = sheds.filter((s) => s.status === "offline").length;

  return (
    <SubPageLayout title="多棚管理">
      <div style={{ padding: 12 }}>
        {/* 概览统计 */}
        <div className="animate-fade-in-up grid grid-cols-3" style={{ gap: 8, marginBottom: 12 }}>
          <StatCard value={total} label="总棚数" color="var(--color-text-primary)" />
          <StatCard value={normal} label="正常" color="var(--state-success)" />
          <StatCard value={abnormal + offline} label="异常" color="var(--state-error)" />
        </div>

        {/* 棚列表 */}
        {sheds.map((s, i) => {
          const color = statusColorVar[s.status];
          return (
            <button
              key={s.id}
              onClick={() => navigate("/home")}
              className="animate-fade-in-up flex w-full items-center justify-between"
              style={{
                background: "var(--color-bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 10,
                boxShadow: "var(--shadow-card)",
                border: `1px solid var(--color-rule)`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 0 4px ${statusBgVar[s.status]}`,
                    flexShrink: 0,
                  }}
                />
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {s.name} · {s.mushroomType}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                    {s.status === "offline"
                      ? `离线 ${s.offlineDuration}`
                      : `${s.temp}°C · ${s.humidity}% · ${s.alertCount > 0 ? `${s.alertCount}个告警` : "正常"}`}
                  </span>
                </div>
              </div>
              <span
                className="inline-flex items-center"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "2px 10px",
                  borderRadius: "var(--radius-full)",
                  background: statusBgVar[s.status],
                  color,
                }}
              >
                {s.status === "normal" ? "正常" : s.status === "warning" ? "异常" : s.status === "danger" ? "异常" : "离线"}
              </span>
              <ChevronRight size={16} style={{ color: "var(--color-text-placeholder)", marginLeft: 8 }} />
            </button>
          );
        })}
      </div>
    </SubPageLayout>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center" style={{ background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", padding: "16px 8px", boxShadow: "var(--shadow-card)" }}>
      <span style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{label}</span>
    </div>
  );
}
