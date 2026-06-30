import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Droplets, Wind, Camera, Mic, LineChart, AlertTriangle } from "lucide-react";
import PhoneShell from "@/components/PhoneShell";
import NavBar from "@/components/NavBar";
import ScrollArea from "@/components/ScrollArea";
import Sheet from "@/components/Sheet";
import MetricCard, { StageBadge, metricKeyOrder, metricLabelMap } from "@/components/MetricCard";
import { useAppStore } from "@/store/app";
import { getDashboard } from "@/services/api";
import { shedSummaries } from "@/mock/data";
import { statusColorVar, statusBgVar, levelBgVar, levelColorVar } from "@/lib/status";
import { speak } from "@/utils/speech";
import type { Dashboard, MetricKey } from "@/types";

const shedOrder = ["S001", "S003", "S002"];

export default function Home() {
  const navigate = useNavigate();
  const currentShedId = useAppStore((s) => s.currentShedId);
  const setCurrentShed = useAppStore((s) => s.setCurrentShed);
  const showToast = useAppStore((s) => s.showToast);
  const setActiveMetric = useAppStore((s) => s.setActiveMetric);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    const d = await getDashboard(currentShedId);
    setDashboard(d);
    setLoading(false);
  }, [currentShedId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    await load();
    showToast("数据已更新");
  }, [load, showToast]);

  const handleSwitchShed = (id: string) => {
    setCurrentShed(id);
    setSheetOpen(false);
  };

  // 左右滑动切棚
  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 60) return;
    const idx = shedOrder.indexOf(currentShedId);
    if (delta < 0 && idx < shedOrder.length - 1) {
      setCurrentShed(shedOrder[idx + 1]);
    } else if (delta > 0 && idx > 0) {
      setCurrentShed(shedOrder[idx - 1]);
    }
  };

  // 双击温度语音播报
  const lastTap = useRef(0);
  const handleTempTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && dashboard) {
      const t = dashboard.metrics.temperature.value;
      speak(`${dashboard.shedName}当前温度${t}度，状态${dashboard.metrics.temperature.label}`);
      showToast("🔊 正在播报温度");
    }
    lastTap.current = now;
  };

  const goChart = (key: MetricKey) => {
    setActiveMetric(key);
    navigate(`/chart/${key}`);
  };

  const isOffline = dashboard?.status === "offline";
  const isDanger = dashboard?.status === "danger";

  return (
    <PhoneShell showTabBar>
      <NavBar
        title={dashboard ? `${dashboard.shedName} · ${dashboard.mushroomType}` : "加载中…"}
        titleArrow
        onTitleClick={() => setSheetOpen(true)}
      />

      {/* 阶段标签行 */}
      {dashboard ? (
        <div className="flex shrink-0 items-center justify-center gap-2" style={{ padding: "12px 16px 0" }}>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1"
            aria-label="切换菇棚"
          >
            <StageBadge stage={dashboard.growthStage} status={dashboard.status} />
            <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
          <span
            className="inline-flex items-center"
            style={{
              height: 26,
              padding: "0 10px",
              borderRadius: "var(--radius-full)",
              fontSize: 13,
              background: "var(--color-bg-deep)",
              color: "var(--color-text-muted)",
            }}
          >
            第 {dashboard.stageDay} 天
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>更新于 {dashboard.updateTime.slice(11, 16)}</span>
        </div>
      ) : null}

      <ScrollArea onRefresh={handleRefresh} bottomPadding={84}>
        {loading ? (
          <HomeSkeleton />
        ) : !dashboard ? null : isOffline ? (
          <OfflineView dashboard={dashboard} />
        ) : (
          <div style={{ padding: 12 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {/* 温度大卡 */}
            <TemperatureBigCard dashboard={dashboard} isDanger={isDanger ?? false} onTap={handleTempTap} onGoChart={() => goChart("temperature")} />

            {/* 2x2 指标网格 */}
            <div className="grid grid-cols-2" style={{ gap: 10, marginBottom: 10, marginTop: 10 }}>
              {metricKeyOrder.map((key) => (
                <MetricCard
                  key={key}
                  label={metricLabelMap[key]}
                  metric={dashboard.metrics[key]}
                  onClick={() => goChart(key)}
                />
              ))}
            </div>

            {/* 告警横幅 */}
            {dashboard.alerts.map((alert, i) => (
              <AlertBanner
                key={i}
                level={alert.level}
                message={alert.message}
                suggestion={alert.suggestion}
                onAction={() => navigate("/alerts")}
              />
            ))}

            {/* 危险态：一键操作 */}
            {isDanger ? (
              <div className="grid grid-cols-2" style={{ gap: 10, marginBottom: 16, marginTop: 4 }}>
                <button
                  onClick={() => showToast("💨 风机已开启，将通风 30 分钟")}
                  className="flex items-center justify-center gap-1"
                  style={{
                    height: "var(--control-height)",
                    background: "var(--state-error)",
                    color: "#fff",
                    fontSize: "var(--text-body)",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    border: "none",
                  }}
                >
                  <Wind size={18} /> 一键通风
                </button>
                <button
                  onClick={() => showToast("💧 喷雾已开启，将增湿 15 分钟")}
                  className="flex items-center justify-center gap-1"
                  style={{
                    height: "var(--control-height)",
                    background: "var(--state-warning)",
                    color: "#fff",
                    fontSize: "var(--text-body)",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    border: "none",
                  }}
                >
                  <Droplets size={18} /> 一键喷雾
                </button>
              </div>
            ) : null}

            {/* 快捷入口 */}
            <div
              style={{
                background: "var(--color-bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: "var(--card-padding)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-around">
                <QuickAction icon={<Camera size={24} />} label="拍病害" onClick={() => navigate("/ai")} />
                <QuickAction icon={<Mic size={24} />} label="语音问" onClick={() => navigate("/ai")} color="var(--state-info)" />
                <QuickAction icon={<LineChart size={24} />} label="看曲线" onClick={() => goChart("temperature")} />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* 切棚弹层 */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="切换菇棚">
        <div style={{ padding: "8px 0" }}>
          {shedSummaries.map((s) => {
            const active = s.id === currentShedId;
            const color = statusColorVar[s.status];
            return (
              <button
                key={s.id}
                onClick={() => handleSwitchShed(s.id)}
                className="flex w-full items-center justify-between"
                style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-rule)", background: active ? "var(--color-primary-light)" : "transparent" }}
              >
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {s.name} · {s.mushroomType}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                    {s.status === "offline"
                      ? `离线 ${s.offlineDuration}`
                      : `${s.temp}°C · ${s.humidity}% · ${s.alertCount > 0 ? `${s.alertCount}个告警` : "正常"}`}
                  </span>
                </div>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: active ? `0 0 0 4px ${statusBgVar[s.status]}` : "none",
                  }}
                />
              </button>
            );
          })}
          <button
            onClick={() => {
              setSheetOpen(false);
              navigate("/multi-shed");
            }}
            className="flex w-full items-center justify-center"
            style={{ padding: "14px", fontSize: 14, color: "var(--color-primary)", fontWeight: 500 }}
          >
            多棚管理 ›
          </button>
        </div>
      </Sheet>
    </PhoneShell>
  );
}

function TemperatureBigCard({
  dashboard,
  isDanger,
  onTap,
  onGoChart,
}: {
  dashboard: Dashboard;
  isDanger: boolean;
  onTap: () => void;
  onGoChart: () => void;
}) {
  const m = dashboard.metrics.temperature;
  const color = statusColorVar[m.status];
  return (
    <div
      onClick={onTap}
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: isDanger ? "20px 16px 18px" : "var(--card-padding)",
        boxShadow: "var(--shadow-card)",
        border: isDanger ? `2px solid var(--state-error)` : "none",
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      {isDanger ? (
        <div className="flex flex-col items-center" onClick={onGoChart}>
          <span style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-muted)" }}>当前温度</span>
          <span
            style={{
              fontSize: "var(--text-display)",
              fontWeight: "var(--text-display-weight)",
              color,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
            }}
          >
            {m.value}°C
          </span>
          <span style={{ fontSize: "var(--text-body-secondary)", color, marginTop: 8, fontWeight: 500 }}>
            目标 {m.target} · {m.label}！
          </span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between" onClick={onGoChart}>
          <div>
            <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)", marginBottom: 4 }}>
              当前温度
            </div>
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  fontSize: "var(--text-display)",
                  fontWeight: "var(--text-display-weight)",
                  color,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: "var(--leading-tight)",
                }}
              >
                {m.value}
              </span>
              <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--text-h3-weight)", color }}>°C</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-secondary)", marginBottom: 2 }}>
              目标 {m.target}
            </div>
            <div style={{ fontSize: "var(--text-body-secondary)", color }}>{m.label}</div>
          </div>
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--color-text-placeholder)", marginTop: 8, textAlign: isDanger ? "center" : "left" }}>
        双击数字可语音播报 · 点击查看曲线
      </div>
    </div>
  );
}

function AlertBanner({
  level,
  message,
  suggestion,
  onAction,
}: {
  level: "warning" | "danger";
  message: string;
  suggestion: string;
  onAction: () => void;
}) {
  const isDanger = level === "danger";
  return (
    <div
      style={{
        background: levelBgVar[level],
        borderRadius: "var(--radius-md)",
        padding: "var(--card-padding)",
        marginBottom: 10,
      }}
    >
      <div className="flex items-start gap-3">
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, paddingTop: 1 }}>
          {isDanger ? "🔥" : "⚠️"}
        </span>
        <div className="flex-1">
          <div style={{ fontSize: "var(--text-card-title)", fontWeight: 600, color: levelColorVar[level], marginBottom: 4 }}>
            {message}
          </div>
          <div style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-secondary)", marginBottom: 10 }}>
            {suggestion}
          </div>
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center"
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: "var(--radius-full)",
              background: levelColorVar[level],
              color: "#fff",
              fontSize: "var(--text-body)",
              fontWeight: 500,
              border: "none",
            }}
          >
            去处理
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  color = "var(--color-primary)",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1"
      style={{ minWidth: 44, minHeight: 44, padding: "8px 12px", background: "none", border: "none" }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-secondary)" }}>{label}</span>
    </button>
  );
}

function OfflineView({ dashboard }: { dashboard: Dashboard }) {
  return (
    <div style={{ padding: 12 }}>
      <div
        className="flex flex-col items-center"
        style={{
          background: "var(--color-bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "32px 16px",
          marginBottom: 10,
          border: "1px solid var(--color-rule)",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>🔌</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>
          设备已离线
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>最后在线：{dashboard.lastOnline}</div>
      </div>

      <div
        style={{
          background: "var(--color-bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "var(--card-padding)",
          marginBottom: 10,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ fontSize: "var(--text-card-title)", fontWeight: 600, marginBottom: 12 }}>
          缓存数据（{dashboard.offlineDuration}前）
        </div>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          <CacheItem label="温度" value={`${dashboard.metrics.temperature.value}°C`} />
          <CacheItem label="湿度" value={`${dashboard.metrics.humidity.value}%`} />
        </div>
      </div>

      <div
        style={{
          background: "var(--state-warning-light)",
          borderRadius: "var(--radius-md)",
          padding: "var(--card-padding)",
        }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} style={{ color: "var(--state-warning)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            可能原因：设备没电 / 网络信号差 / 设备被移动。请检查设备太阳能板是否被遮挡。
          </div>
        </div>
      </div>
    </div>
  );
}

function CacheItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col" style={{ background: "var(--color-bg)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
      <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-muted)", marginTop: 2 }}>{value}</span>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div style={{ padding: 12 }}>
      <div className="animate-pulse" style={{ height: 110, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)", marginBottom: 10 }} />
      <div className="grid grid-cols-2" style={{ gap: 10, marginBottom: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse" style={{ height: 92, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)" }} />
        ))}
      </div>
      <div className="animate-pulse" style={{ height: 60, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)" }} />
    </div>
  );
}
