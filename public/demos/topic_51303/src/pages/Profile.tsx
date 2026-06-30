import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Bell,
  MessageSquare,
  GraduationCap,
  Phone,
  Share2,
  Plus,
} from "lucide-react";
import PhoneShell from "@/components/PhoneShell";
import NavBar from "@/components/NavBar";
import ScrollArea from "@/components/ScrollArea";
import { getUser } from "@/services/api";
import { useAppStore } from "@/store/app";
import { statusColorVar } from "@/lib/status";
import type { UserProfile } from "@/types";

export default function Profile() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  return (
    <PhoneShell showTabBar>
      <NavBar title="我的" />

      <ScrollArea bottomPadding={84}>
        <div style={{ padding: 12 }}>
          {/* 用户卡片 */}
          <button
            onClick={() => showToast("账号信息")}
            className="animate-fade-in-up flex w-full items-center"
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 10,
              boxShadow: "var(--shadow-card)",
              border: "none",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary-light)", fontSize: 30, flexShrink: 0 }}
            >
              👨
            </div>
            <div className="flex-1" style={{ marginLeft: 14, textAlign: "left" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {user?.name ?? "加载中…"}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
                {user?.phone} · {user?.planName}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--color-text-placeholder)" }} />
          </button>

          {/* 我的设备 */}
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
            <div className="flex items-center justify-between" style={{ padding: "14px 16px 8px" }}>
              <span style={{ fontSize: "var(--text-card-title)", fontWeight: 600 }}>我的设备</span>
              <button
                onClick={() => showToast("添加设备")}
                className="inline-flex items-center gap-0.5"
                style={{ fontSize: 13, color: "var(--color-primary)", background: "none", border: "none" }}
              >
                <Plus size={14} /> 添加
              </button>
            </div>
            {user?.devices.map((d) => {
              const isOnline = d.status === "online";
              const color = statusColorVar[isOnline ? "normal" : "offline"];
              return (
                <button
                  key={d.id}
                  onClick={() => navigate(`/device/${d.id}`)}
                  className="flex w-full items-center justify-between"
                  style={{ padding: "12px 16px", borderTop: "1px solid var(--color-rule)" }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 20 }}>🌡️</span>
                    <span style={{ fontSize: 15, color: "var(--color-text-primary)" }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 13, color: isOnline ? "var(--state-success)" : "var(--color-text-muted)" }}>
                      {isOnline ? "在线" : "离线 12h"}
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--color-text-placeholder)" }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 设置列表 */}
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
            <SettingsItem icon={<Bell size={18} color="var(--state-warning)" />} label="告警设置" onClick={() => navigate("/alert-settings")} />
            <SettingsItem icon={<MessageSquare size={18} color="var(--state-info)" />} label="客服帮助" onClick={() => showToast("客服会话已开启")} />
            <SettingsItem icon={<GraduationCap size={18} color="var(--color-primary)" />} label="农技课堂" onClick={() => navigate("/classroom")} />
            <SettingsItem icon={<Phone size={18} color="var(--state-error)" />} label="一键求助" onClick={() => showToast("正在拨打农技站 400-123-4567")} />
            <SettingsItem
              icon={<Share2 size={18} color="var(--color-text-secondary)" />}
              label="分享给朋友"
              onClick={() => showToast("已生成分享海报")}
              last
            />
          </div>

          {/* 版本号 */}
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", padding: "16px 0" }}>
            菇管家 v1.2.0
          </div>
        </div>
      </ScrollArea>
    </PhoneShell>
  );
}

function SettingsItem({
  icon,
  label,
  onClick,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center"
      style={{ padding: "14px 16px", borderTop: last ? "none" : "none", borderBottom: last ? "none" : "1px solid var(--color-rule)" }}
    >
      <span className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
        {icon}
      </span>
      <span className="flex-1" style={{ marginLeft: 12, textAlign: "left", fontSize: 15, color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <ChevronRight size={18} style={{ color: "var(--color-text-placeholder)" }} />
    </button>
  );
}
