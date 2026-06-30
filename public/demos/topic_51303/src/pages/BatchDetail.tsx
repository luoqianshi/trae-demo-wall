import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getBatchDetail } from "@/services/api";
import type { BatchDetail } from "@/types";

export default function BatchDetail() {
  const [data, setData] = useState<BatchDetail | null>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() ?? "2026-A001";
    getBatchDetail(id).then(setData);
  }, []);

  if (!data) {
    return (
      <SubPageLayout title="批次详情">
        <div className="flex items-center justify-center" style={{ padding: 60, color: "var(--color-text-muted)" }}>加载中…</div>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout title="批次详情">
      <div style={{ padding: 12 }}>
        {/* 头部信息 */}
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
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
            批次 #{data.batchId}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {data.mushroomType} · {data.shedName} · {data.currentStage}第{data.stageDay}天
          </div>
        </div>

        {/* 生长时间轴 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
            animationDelay: "60ms",
          }}
        >
          <div style={{ fontSize: "var(--text-card-title)", fontWeight: 600, marginBottom: 16 }}>生长时间轴</div>
          <div className="relative" style={{ paddingLeft: 8 }}>
            {data.timeline.map((node, i) => {
              const isLast = i === data.timeline.length - 1;
              return (
                <div key={i} className="relative flex gap-4" style={{ paddingBottom: isLast ? 0 : 20 }}>
                  {/* 时间线 */}
                  <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: node.expected ? "var(--color-bg-deep)" : "var(--color-primary)",
                        border: node.expected ? "2px dashed var(--color-text-placeholder)" : "none",
                        zIndex: 1,
                      }}
                    />
                    {!isLast ? (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          background: node.expected
                            ? "repeating-linear-gradient(to bottom, var(--color-text-placeholder) 0 4px, transparent 4px 8px)"
                            : "var(--color-rule)",
                          marginTop: 2,
                        }}
                      />
                    ) : null}
                  </div>
                  {/* 内容 */}
                  <div style={{ flex: 1, marginTop: -2 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 600, color: node.expected ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
                        {node.date} {node.event}
                      </span>
                      {node.expected ? (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-deep)", color: "var(--color-text-muted)" }}>
                          预计
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
                      {node.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 环境记录 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
            animationDelay: "120ms",
          }}
        >
          <div style={{ fontSize: "var(--text-card-title)", fontWeight: 600, marginBottom: 4 }}>环境记录</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>近 7 天平均</div>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            <EnvStat label="平均温度" value={`${data.envAvg7d.temp}°C`} />
            <EnvStat label="平均湿度" value={`${data.envAvg7d.humidity}%`} />
            <EnvStat label="CO₂ 峰值" value={`${data.envAvg7d.co2Peak}`} />
            <EnvStat label="告警次数" value={`${data.alertCount}次`} color="var(--state-warning)" />
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}

function EnvStat({ label, value, color = "var(--color-text-primary)" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col" style={{ background: "var(--color-bg)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
      <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
