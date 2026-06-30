import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Volume2, MessageSquare, ShieldAlert, Pill, Stethoscope, ShieldCheck, ChevronLeft } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { diagnose } from "@/services/api";
import { useAppStore } from "@/store/app";
import { speak } from "@/utils/speech";
import type { DiagnosisResult } from "@/types";

export default function DiagnosisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    diagnose("").then((r) => setData(r));
  }, []);

  const handleSpeak = () => {
    if (!data) return;
    const text = `诊断为${data.diseaseName}，置信度${Math.round(data.confidence * 100)}%。${data.symptoms}治疗方案：${data.treatment.immediate.join("；")}。用药：${data.treatment.medication.name}，${data.treatment.medication.dosage}，${data.treatment.medication.method}，${data.treatment.medication.duration}。`;
    speak(text);
    showToast("🔊 正在播报诊断结果");
  };

  if (!data) {
    return (
      <SubPageLayout title="诊断结果">
        <div className="flex items-center justify-center" style={{ padding: 60 }}>
          <div className="animate-pulse" style={{ color: "var(--color-text-muted)" }}>加载中…</div>
        </div>
      </SubPageLayout>
    );
  }

  const confidencePct = Math.round(data.confidence * 100);
  const sevColor =
    data.severity === "high" ? "var(--state-error)" : data.severity === "medium" ? "var(--state-warning)" : "var(--state-success)";

  return (
    <SubPageLayout title="诊断结果" right={
      <button aria-label="更多" className="flex h-9 w-9 items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        ⋮
      </button>
    }>
      <div style={{ padding: 12 }}>
        {/* 诊断图片 */}
        <div
          className="animate-fade-in-up"
          style={{
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: 10,
            height: 180,
            background: "linear-gradient(135deg, #2d4a2b 0%, #4a6741 100%)",
            position: "relative",
          }}
        >
          <div className="flex h-full flex-col items-center justify-center text-center" style={{ color: "#fff" }}>
            <div style={{ fontSize: 64, marginBottom: 4 }}>🍄</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>菌棒样本照片</div>
          </div>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            诊断图片
          </div>
        </div>

        {/* 病名 + 置信度 */}
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
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: sevColor }}>{data.diseaseName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{data.diseaseEn}</span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: confidencePct >= 85 ? "var(--state-success-light)" : "var(--state-warning-light)",
                color: confidencePct >= 85 ? "var(--state-success)" : "var(--state-warning)",
                fontWeight: 500,
              }}
            >
              置信度 {confidencePct}%
            </span>
          </div>
        </div>

        {/* 症状描述 */}
        <Section icon={<ShieldAlert size={18} color="var(--state-warning)" />} title="症状描述" delay={120}>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>{data.symptoms}</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, marginTop: 8 }}>
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>病因：</span>
            {data.cause}
          </p>
        </Section>

        {/* 治疗方案 */}
        <Section icon={<Stethoscope size={18} color="var(--state-error)" />} title="治疗方案" delay={180}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>1. 紧急处理</div>
            {data.treatment.immediate.map((t, i) => (
              <div key={i} style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7, paddingLeft: 12 }}>
                • {t}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>
              2. 用药建议 <Pill size={14} color="var(--state-error)" />
            </div>
            <div
              style={{
                background: "var(--state-error-light)",
                borderRadius: "var(--radius-sm)",
                padding: 12,
                fontSize: 14,
                color: "var(--color-text-secondary)",
                lineHeight: 1.7,
              }}
            >
              <div><strong style={{ color: "var(--state-error)" }}>{data.treatment.medication.name}</strong> {data.treatment.medication.dosage}</div>
              <div style={{ marginTop: 4 }}>用法：{data.treatment.medication.method}</div>
              <div>疗程：{data.treatment.medication.duration}</div>
            </div>
          </div>
        </Section>

        {/* 预防措施 */}
        <Section icon={<ShieldCheck size={18} color="var(--state-success)" />} title="预防措施" delay={240}>
          {data.treatment.prevention.map((p, i) => (
            <div key={i} style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, paddingLeft: 12 }}>
              • {p}
            </div>
          ))}
        </Section>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2" style={{ gap: 10, marginTop: 12 }}>
          <button
            onClick={handleSpeak}
            className="flex items-center justify-center gap-1"
            style={{
              height: "var(--control-height)",
              background: "var(--state-info)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              border: "none",
            }}
          >
            <Volume2 size={18} /> 语音播报
          </button>
          <button
            onClick={() => showToast("已转接农技专家，请稍候")}
            className="flex items-center justify-center gap-1"
            style={{
              height: "var(--control-height)",
              background: "var(--color-primary)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              border: "none",
            }}
          >
            <MessageSquare size={18} /> 问专家
          </button>
        </div>

        {/* 免责声明 */}
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 16, lineHeight: 1.6, textAlign: "center" }}>
          免责声明：诊断结果仅供参考，严重时请联系当地农技人员现场确认。
        </div>
      </div>
    </SubPageLayout>
  );
}

function Section({
  icon,
  title,
  children,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        marginBottom: 10,
        boxShadow: "var(--shadow-card)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: "var(--text-card-title)", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
