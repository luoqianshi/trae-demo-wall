import { useEffect, useState } from "react";
import { Battery, Wifi, RefreshCw, Link2, ChevronRight } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getDeviceDetail } from "@/services/api";
import { useAppStore } from "@/store/app";
import { fmtMD, relTime } from "@/lib/status";
import type { Device } from "@/types";

export default function DeviceDetail() {
  const showToast = useAppStore((s) => s.showToast);
  const [device, setDevice] = useState<Device | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() ?? "D001";
    getDeviceDetail(id).then(setDevice);
  }, []);

  if (!device) {
    return (
      <SubPageLayout title="设备详情">
        <div style={{ padding: 60, textAlign: "center", color: "var(--color-text-muted)" }}>加载中…</div>
      </SubPageLayout>
    );
  }

  const isOnline = device.status === "online";
  const lowBattery = device.battery <= 20;

  const handleOTA = () => {
    setUpgrading(true);
    showToast("OTA 升级中…");
    setTimeout(() => {
      setUpgrading(false);
      showToast("固件已升级到最新版本");
    }, 2500);
  };

  return (
    <SubPageLayout title="设备详情">
      <div style={{ padding: 12 }}>
        {/* 设备概览 */}
        <div
          className="animate-fade-in-up flex flex-col items-center"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: "24px 16px",
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 8 }}>🌡️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{device.name}</div>
          <div
            className="inline-flex items-center"
            style={{
              marginTop: 8,
              height: 26,
              padding: "0 12px",
              borderRadius: "var(--radius-full)",
              fontSize: 13,
              fontWeight: 500,
              background: isOnline ? "var(--state-success-light)" : "var(--color-bg-deep)",
              color: isOnline ? "var(--state-success)" : "var(--color-text-muted)",
            }}
          >
            ● {isOnline ? "在线" : "离线"}
          </div>
        </div>

        {/* 状态指标 */}
        <div className="grid grid-cols-2" style={{ gap: 10, marginBottom: 10 }}>
          <StatusCard
            icon={<Battery size={20} color={lowBattery ? "var(--state-error)" : "var(--state-success)"} />}
            label="电量"
            value={`${device.battery}%`}
            color={lowBattery ? "var(--state-error)" : "var(--state-success)"}
            hint={lowBattery ? "电量偏低，请及时充电" : "电量充足"}
          />
          <StatusCard
            icon={<Wifi size={20} color={isOnline ? "var(--state-success)" : "var(--color-text-muted)"} />}
            label="信号"
            value={`${device.signal}%`}
            color={isOnline ? "var(--state-success)" : "var(--color-text-muted)"}
            hint={isOnline ? "信号良好" : "无信号"}
          />
        </div>

        {/* 设备信息 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
            animationDelay: "60ms",
          }}
        >
          <InfoRow label="设备型号" value={device.model ?? "—"} />
          <InfoRow label="固件版本" value={device.firmware ?? "—"} />
          <InfoRow label="所属菇棚" value={device.shed} />
          <InfoRow label="最后更新" value={relTime(device.lastUpdate)} last />
        </div>

        {/* 操作 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            marginBottom: 10,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
            animationDelay: "120ms",
          }}
        >
          <button
            onClick={device.otaAvailable ? handleOTA : () => showToast("已是最新版本")}
            disabled={!device.otaAvailable || upgrading}
            className="flex w-full items-center justify-between"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-rule)", opacity: upgrading ? 0.6 : 1 }}
          >
            <span className="flex items-center gap-2" style={{ fontSize: 15, color: "var(--color-text-primary)" }}>
              <RefreshCw size={18} color="var(--color-primary)" className={upgrading ? "animate-spin-slow" : ""} />
              {upgrading ? "OTA 升级中…" : "OTA 固件升级"}
            </span>
            <span style={{ fontSize: 13, color: device.otaAvailable ? "var(--color-primary)" : "var(--color-text-muted)" }}>
              {device.otaAvailable ? "有新版本" : "最新"}
            </span>
          </button>
          <button
            onClick={() => showToast("设备绑定功能开发中")}
            className="flex w-full items-center justify-between"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-rule)" }}
          >
            <span className="flex items-center gap-2" style={{ fontSize: 15, color: "var(--color-text-primary)" }}>
              <Link2 size={18} color="var(--state-info)" /> 设备绑定
            </span>
            <ChevronRight size={16} color="var(--color-text-placeholder)" />
          </button>
          <button
            onClick={() => showToast("已发起解绑请求，请确认")}
            className="flex w-full items-center justify-between"
            style={{ padding: "14px 16px" }}
          >
            <span className="flex items-center gap-2" style={{ fontSize: 15, color: "var(--state-error)" }}>
              解绑设备
            </span>
            <ChevronRight size={16} color="var(--color-text-placeholder)" />
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col" style={{ background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", padding: 16, boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2">
        {icon}
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{hint}</span>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: last ? "none" : "1px solid var(--color-rule)" }}>
      <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
