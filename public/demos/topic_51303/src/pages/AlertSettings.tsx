import { useEffect, useState } from "react";
import SubPageLayout from "@/components/SubPageLayout";
import { getUser, saveAlertSettings } from "@/services/api";
import { useAppStore } from "@/store/app";
import type { AlertSettings as AlertSettingsType } from "@/types";

export default function AlertSettings() {
  const showToast = useAppStore((s) => s.showToast);
  const setAlertSettings = useAppStore((s) => s.setAlertSettings);
  const [settings, setSettings] = useState<AlertSettingsType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUser().then((u) => setSettings(u.alertSettings));
  }, []);

  if (!settings) {
    return (
      <SubPageLayout title="告警设置">
        <div style={{ padding: 60, textAlign: "center", color: "var(--color-text-muted)" }}>加载中…</div>
      </SubPageLayout>
    );
  }

  const update = (patch: Partial<AlertSettingsType>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAlertSettings(settings);
      setAlertSettings(settings);
      showToast("已保存");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageLayout title="告警设置" right={
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ fontSize: 15, color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", padding: "0 4px" }}
      >
        {saving ? "保存中" : "✓ 保存"}
      </button>
    }>
      <div style={{ padding: 12 }}>
        {/* 温度告警 */}
        <Group title="温度告警">
          <ThresholdRow label="上限" value={settings.tempMax} unit="°C" onChange={(v) => update({ tempMax: v })} />
          <ThresholdRow label="下限" value={settings.tempMin} unit="°C" onChange={(v) => update({ tempMin: v })} last />
        </Group>

        {/* 湿度告警 */}
        <Group title="湿度告警">
          <ThresholdRow label="上限" value={settings.humidityMax} unit="%" onChange={(v) => update({ humidityMax: v })} />
          <ThresholdRow label="下限" value={settings.humidityMin} unit="%" onChange={(v) => update({ humidityMin: v })} last />
        </Group>

        {/* CO2 告警 */}
        <Group title="CO₂ 告警">
          <ThresholdRow label="上限" value={settings.co2Max} unit="ppm" step={100} onChange={(v) => update({ co2Max: v })} last />
        </Group>

        {/* 通知方式 */}
        <Group title="通知方式">
          <ToggleRow label="微信推送" checked={settings.notifyPush} onChange={(v) => update({ notifyPush: v })} />
          <ToggleRow label="短信通知" checked={settings.notifySMS} onChange={(v) => update({ notifySMS: v })} />
          <ToggleRow label="语音电话" checked={settings.notifyCall} onChange={(v) => update({ notifyCall: v })} last />
        </Group>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
          style={{
            height: "var(--control-height)",
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "none",
            marginTop: 16,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "保存中…" : "保存设置"}
        </button>
      </div>
    </SubPageLayout>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        marginBottom: 10,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 16px 6px", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>{title}</div>
      {children}
    </div>
  );
}

function ThresholdRow({
  label,
  value,
  unit,
  step = 1,
  onChange,
  last,
}: {
  label: string;
  value: number;
  unit: string;
  step?: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "12px 16px", borderTop: last ? "1px solid var(--color-rule)" : "1px solid var(--color-rule)" }}
    >
      <span style={{ fontSize: 15, color: "var(--color-text-primary)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="flex h-8 w-8 items-center justify-center"
          style={{ borderRadius: "50%", background: "var(--color-bg-deep)", color: "var(--color-text-secondary)", border: "none", fontSize: 18 }}
        >
          −
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", minWidth: 60, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {value} {unit}
        </span>
        <button
          onClick={() => onChange(value + step)}
          className="flex h-8 w-8 items-center justify-center"
          style={{ borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", border: "none", fontSize: 18 }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  last,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "14px 16px", borderTop: "1px solid var(--color-rule)" }}
    >
      <span style={{ fontSize: 15, color: "var(--color-text-primary)" }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative"
        style={{
          width: 44,
          height: 26,
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--color-primary)" : "var(--color-text-placeholder)",
          border: "none",
          transition: "background 200ms",
        }}
        aria-label={`${label} ${checked ? "已开启" : "已关闭"}`}
      >
        <span
          className="absolute top-0.5"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            left: checked ? 20 : 2,
            transition: "left 200ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}
