import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/PhoneShell";
import NavBar from "@/components/NavBar";
import ScrollArea from "@/components/ScrollArea";
import Empty from "@/components/Empty";
import { getBatches } from "@/services/api";
import { useAppStore } from "@/store/app";
import type { Batch, GrowthStage } from "@/types";

const stages: (GrowthStage | "全部")[] = ["全部", "菌丝期", "转色期", "出菇期", "已采收"];

const stageStyle: Record<string, { bg: string; color: string }> = {
  菌丝期: { bg: "var(--state-info-light)", color: "var(--state-info)" },
  转色期: { bg: "var(--state-success-light)", color: "var(--state-success)" },
  出菇期: { bg: "var(--state-warning-light)", color: "var(--state-warning)" },
  已采收: { bg: "var(--color-bg-deep)", color: "var(--color-text-muted)" },
};

export default function Archive() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const [active, setActive] = useState<GrowthStage | "全部">("全部");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBatches(active).then((list) => {
      setBatches(list);
      setLoading(false);
    });
  }, [active]);

  return (
    <PhoneShell showTabBar>
      <NavBar
        title="种植档案"
        showSearch
        onSearch={() => showToast("搜索功能开发中")}
      />

      {/* 阶段筛选 */}
      <div
        className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto"
        style={{ padding: "12px 16px", background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-rule)" }}
      >
        {stages.map((s) => {
          const isActive = active === s;
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap"
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-caption)",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--color-primary)" : "var(--color-bg-deep)",
                color: isActive ? "#fff" : "var(--color-text-secondary)",
                height: 28,
                border: "none",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <ScrollArea bottomPadding={84}>
        {loading ? (
          <div style={{ padding: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 140, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)", marginBottom: 12 }} />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <Empty icon="📋" title="还没有种植记录" desc="点击下方按钮添加第一个批次" action={
            <button
              onClick={() => showToast("添加批次功能开发中")}
              style={{
                height: 44,
                padding: "0 24px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-primary)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                border: "none",
              }}
            >
              + 添加批次
            </button>
          } />
        ) : (
          <div className="flex flex-col gap-3" style={{ padding: "12px" }}>
            {batches.map((b, i) => (
              <BatchCard key={b.batchId} batch={b} delay={i * 80} onClick={() => navigate(`/batch/${b.batchId}`)} />
            ))}
          </div>
        )}
      </ScrollArea>
    </PhoneShell>
  );
}

function BatchCard({ batch, onClick, delay }: { batch: Batch; onClick: () => void; delay: number }) {
  const stage = stageStyle[batch.currentStage];
  const isHarvested = batch.status === "harvested";
  return (
    <button
      onClick={onClick}
      className="animate-fade-in-up flex flex-col text-left transition active:opacity-90"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: "var(--card-padding)",
        boxShadow: "var(--shadow-card)",
        opacity: isHarvested ? 0.7 : 1,
        border: "none",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col" style={{ minWidth: 0 }}>
          <h2 className="truncate" style={{ fontSize: "var(--text-card-title)", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: "var(--leading-snug)" }}>
            批次 #{batch.batchId}
          </h2>
          <span className="truncate" style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)", marginTop: 2 }}>
            {batch.mushroomType} · {batch.shedName}
          </span>
        </div>
        <span
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap"
          style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "var(--text-caption)", fontWeight: 600, background: stage.bg, color: stage.color, height: 22 }}
        >
          {batch.currentStage}
        </span>
      </div>

      {/* 指标行 */}
      <div
        className="flex items-stretch"
        style={{ gap: 8, marginTop: 12, background: "var(--color-bg)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}
      >
        <Metric3
          label="进棚"
          value={batch.startDate.slice(5)}
          color="var(--color-text-primary)"
        />
        <Divider />
        <Metric3
          label={isHarvested ? "天数" : "天数"}
          value={isHarvested ? `${batch.stageDay}天` : `第${batch.stageDay}天`}
          color={isHarvested ? "var(--color-text-muted)" : stage.color}
        />
        <Divider />
        <Metric3
          label={isHarvested ? "采收" : "预计采收"}
          value={isHarvested ? `${batch.yield}斤` : batch.expectedHarvest.slice(5)}
          color={isHarvested ? "var(--color-text-muted)" : "var(--color-text-primary)"}
        />
      </div>

      {/* 底部 */}
      <div className="flex items-center" style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid var(--color-rule)" }}>
        {isHarvested && batch.unitCost ? (
          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
            已完结 · 单斤成本 {batch.unitCost} 元 · 产量 {batch.yield} 斤
          </span>
        ) : (
          <span className="truncate" style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
            最近操作：{batch.lastAction}
          </span>
        )}
      </div>
    </button>
  );
}

function Metric3({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span style={{ fontSize: "var(--text-micro)", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: "var(--text-body-secondary)", fontWeight: 600, color, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: "var(--color-rule)" }} />;
}
