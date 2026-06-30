import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getAlerts } from "@/services/api";
import { useAppStore } from "@/store/app";
import { levelBgVar, levelColorVar } from "@/lib/status";
import Empty from "@/components/Empty";
import type { AlertItem } from "@/types";

const tabs: { key: "pending" | "resolved" | "all"; label: string }[] = [
  { key: "pending", label: "未处理" },
  { key: "resolved", label: "已处理" },
  { key: "all", label: "全部" },
];

export default function AlertList() {
  const showToast = useAppStore((s) => s.showToast);
  const [active, setActive] = useState<"pending" | "resolved" | "all">("all");
  const [list, setList] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAlerts(active).then((l) => {
      setList(l);
      setLoading(false);
    });
  }, [active]);

  const handleMark = (id: string) => {
    setList((prev) => prev.map((a) => (a.alertId === id ? { ...a, status: "resolved" as const, resolvedAt: new Date().toISOString() } : a)));
    showToast("已标记为已处理");
  };

  return (
    <SubPageLayout title="告警记录">
      {/* Tab 筛选 */}
      <div className="flex shrink-0 items-center" style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-rule)" }}>
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className="relative flex-1"
              style={{
                height: 44,
                fontSize: 15,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                background: "none",
                border: "none",
              }}
            >
              {t.label}
              {isActive ? (
                <span
                  className="absolute"
                  style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 3, borderRadius: 2, background: "var(--color-primary)" }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div style={{ padding: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 110, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)", marginBottom: 10 }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <Empty icon="✅" title="一切正常，继续加油" desc="当前没有告警记录" />
        ) : (
          <div style={{ padding: 12 }}>
            {list.map((a, i) => (
              <AlertRow key={a.alertId ?? i} alert={a} onMark={() => a.alertId && handleMark(a.alertId)} />
            ))}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}

function AlertRow({ alert, onMark }: { alert: AlertItem; onMark: () => void }) {
  const isPending = alert.status === "pending";
  const bg = levelBgVar[alert.level];
  const color = levelColorVar[alert.level];
  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: 14,
        marginBottom: 10,
        boxShadow: "var(--shadow-card)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: "50%", background: bg, color, fontSize: 16, flexShrink: 0 }}
        >
          {alert.level === "danger" ? "🔥" : "⚠️"}
        </span>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>{alert.message}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
            {alert.timestamp} · {alert.shedName}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
            建议：{alert.suggestion}
          </div>

          {isPending ? (
            <button
              onClick={onMark}
              className="inline-flex items-center gap-1"
              style={{
                marginTop: 10,
                height: 32,
                padding: "0 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-primary)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
              }}
            >
              <Check size={14} /> 标记已处理
            </button>
          ) : (
            <div className="inline-flex items-center gap-1" style={{ marginTop: 10, fontSize: 12, color: "var(--state-success)" }}>
              <Check size={14} /> 已处理 · {alert.suggestion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
