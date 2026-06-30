import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mic, ChevronRight, Loader2, MessageCircle, Volume2, X } from "lucide-react";
import PhoneShell from "@/components/PhoneShell";
import NavBar from "@/components/NavBar";
import ScrollArea from "@/components/ScrollArea";
import { useAppStore } from "@/store/app";
import { getAIHistory, getKnowledgeTags, diagnose, voiceAsk } from "@/services/api";
import { speak, isSpeechSupported } from "@/utils/speech";
import type { AIHistoryItem, VoiceQAResult } from "@/types";

export default function AIAssistant() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [diagnosing, setDiagnosing] = useState(false);
  const [recognized, setRecognized] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    getAIHistory().then(setHistory);
  }, []);

  const tags = getKnowledgeTags();

  const handleSnap = async () => {
    setDiagnosing(true);
    setRecognized("");
    // 模拟识别过程文字
    setTimeout(() => setRecognized("已识别：菌棒表面绿色霉层"), 1200);
    try {
      const result = await diagnose("mock-image");
      showToast("诊断完成");
      navigate(`/diagnosis/${result.diagnosisId}`);
    } finally {
      setDiagnosing(false);
    }
  };

  const openVoice = () => setVoiceOpen(true);

  return (
    <PhoneShell showTabBar>
      <NavBar title="AI 助手" right={
        <button aria-label="聊天记录" className="flex h-9 w-9 items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
          <MessageCircle size={20} />
        </button>
      } />

      <ScrollArea bottomPadding={84}>
        <div style={{ padding: 16 }}>
          {/* 拍病害卡 */}
          <button
            onClick={handleSnap}
            className="animate-fade-in-up flex w-full items-center gap-4 text-left transition active:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-elevated) 100%)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              marginBottom: 10,
              border: "1px solid var(--color-primary-light)",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 72, height: 72, minWidth: 72, borderRadius: "50%", background: "var(--color-primary)" }}
            >
              <Camera size={32} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "var(--text-h4)", fontWeight: "var(--text-h4-weight)", color: "var(--color-primary-dark)", marginBottom: 4 }}>
                拍病害
              </div>
              <div style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-secondary)" }}>
                对准菌棒拍照，AI 秒级诊断
              </div>
            </div>
          </button>

          {/* 语音问卡 */}
          <button
            onClick={openVoice}
            className="animate-fade-in-up flex w-full items-center gap-4 text-left transition active:opacity-90"
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              marginBottom: 10,
              border: "1px solid var(--color-rule)",
              animationDelay: "60ms",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 72, height: 72, minWidth: 72, borderRadius: "50%", background: "var(--state-info)" }}
            >
              <Mic size={32} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "var(--text-h4)", fontWeight: "var(--text-h4-weight)", color: "var(--state-info)", marginBottom: 4 }}>
                语音问
              </div>
              <div style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-secondary)" }}>
                按住说话，问什么答什么
              </div>
            </div>
          </button>

          {/* 知识库 */}
          <div
            className="animate-fade-in-up"
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: "var(--card-padding)",
              marginBottom: 10,
              border: "1px solid var(--color-rule)",
              animationDelay: "120ms",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: "var(--text-card-title)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                知识库
              </span>
              <button
                onClick={() => navigate("/classroom")}
                className="inline-flex items-center gap-0.5"
                style={{ fontSize: "var(--text-body-secondary)", color: "var(--color-text-muted)", background: "none", border: "none" }}
              >
                更多 <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center justify-center whitespace-nowrap"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-body-secondary)",
                    background: t.hot ? "var(--color-primary-light)" : "var(--color-bg-deep)",
                    color: t.hot ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* 最近记录 */}
          <div
            className="animate-fade-in-up"
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-rule)",
              overflow: "hidden",
              animationDelay: "180ms",
            }}
          >
            <div style={{ padding: "var(--card-padding) var(--card-padding) 8px" }}>
              <span style={{ fontSize: "var(--text-card-title)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                最近记录
              </span>
            </div>
            {history.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-muted)" }}>暂无记录</div>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => (h.kind === "diagnosis" ? navigate(`/diagnosis/D20260630001`) : setVoiceOpen(true))}
                  className="flex w-full items-center"
                  style={{ padding: "12px var(--card-padding)", borderTop: "1px solid var(--color-rule)" }}
                >
                  <span style={{ fontSize: 18, marginRight: 12, lineHeight: 1 }}>
                    {h.kind === "diagnosis" ? "📸" : "🎤"}
                  </span>
                  <div className="flex-1 text-left">
                    <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
                      {h.time}
                      {h.confidence ? ` · 置信度 ${h.confidence}%` : ""}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-text-placeholder)" }} />
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 诊断中全屏遮罩 */}
      {diagnosing ? (
        <DiagnosingOverlay recognized={recognized} />
      ) : null}

      {/* 语音问答弹层 */}
      {voiceOpen ? (
        <VoicePanel
          onClose={() => setVoiceOpen(false)}
          onResult={async (q) => {
            const r = await voiceAsk(q);
            return r;
          }}
          onSpeak={(text) => {
            speak(text);
            showToast("🔊 正在播报");
          }}
          speechSupported={isSpeechSupported()}
        />
      ) : null}
    </PhoneShell>
  );
}

function DiagnosingOverlay({ recognized }: { recognized: string }) {
  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-black/60" style={{ backdropFilter: "blur(4px)" }}>
      <div className="flex flex-col items-center rounded-2xl bg-white px-10 py-8 text-center shadow-2xl">
        <Loader2 size={48} className="animate-spin-slow" style={{ color: "var(--color-primary)" }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 16 }}>
          AI 诊断中
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>
          {recognized ? recognized : "正在识别..."}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-placeholder)", marginTop: 6 }}>
          预计 3 秒完成
        </div>
      </div>
    </div>
  );
}

function VoicePanel({
  onClose,
  onResult,
  onSpeak,
  speechSupported,
}: {
  onClose: () => void;
  onResult: (q: string) => Promise<VoiceQAResult>;
  onSpeak: (text: string) => void;
  speechSupported: boolean;
}) {
  const [pressing, setPressing] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<VoiceQAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    setPressing(true);
    setQuestion("");
    setResult(null);
    // 模拟录音 1.6s 后自动生成问题
    pressTimer.current = setTimeout(() => {
      setQuestion("菌棒出水了怎么办");
    }, 1600);
  };

  const endPress = async () => {
    setPressing(false);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!question) {
      // 短按，给默认问题
      setQuestion("菌棒出水了怎么办");
    }
  };

  const ask = async (q: string) => {
    setLoading(true);
    try {
      const r = await onResult(q);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (question && !result) ask(question);
  }, [question]);

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[var(--color-bg)]">
      {/* 头部 */}
      <div className="flex items-center justify-between" style={{ height: 44, padding: "0 16px", borderBottom: "1px solid var(--color-rule)", background: "var(--color-bg-elevated)" }}>
        <span style={{ fontSize: "var(--text-page-title)", fontWeight: 600 }}>语音问答</span>
        <button onClick={onClose} aria-label="关闭" className="flex h-9 w-9 items-center justify-center">
          <X size={20} color="var(--color-text-secondary)" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto" style={{ padding: 16 }}>
        {/* 问题气泡 */}
        {question ? (
          <div className="flex justify-end" style={{ marginBottom: 12 }}>
            <div
              style={{
                maxWidth: "80%",
                background: "var(--color-primary)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "14px 14px 4px 14px",
                fontSize: 15,
              }}
            >
              {question}？
            </div>
          </div>
        ) : null}

        {/* 回答气泡 */}
        {loading ? (
          <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            <Loader2 size={16} className="animate-spin-slow" /> AI 正在思考…
          </div>
        ) : result ? (
          <div className="flex" style={{ marginBottom: 12 }}>
            <div
              style={{
                maxWidth: "85%",
                background: "var(--color-bg-elevated)",
                padding: "12px 14px",
                borderRadius: "14px 14px 14px 4px",
                fontSize: 15,
                lineHeight: 1.65,
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-rule)",
              }}
            >
              🤖 {result.answer}
              <button
                onClick={() => onSpeak(result.answer)}
                className="mt-3 inline-flex items-center gap-1"
                style={{ fontSize: 13, color: "var(--state-info)", background: "var(--state-info-light)", padding: "6px 12px", borderRadius: "var(--radius-full)", border: "none" }}
              >
                <Volume2 size={14} /> 点击听语音
              </button>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>
                来源：{result.source}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 底部录音按钮 */}
      <div className="flex flex-col items-center" style={{ padding: "16px 0 28px", borderTop: "1px solid var(--color-rule)", background: "var(--color-bg-elevated)" }}>
        <button
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          className={`flex items-center justify-center ${pressing ? "animate-pulse-ring" : ""}`}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: pressing ? "var(--state-error)" : "var(--state-info)",
            border: "none",
            touchAction: "none",
          }}
          aria-label="按住说话"
        >
          <Mic size={30} color="#fff" />
        </button>
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 10 }}>
          {pressing ? "松开发送" : "按住说话"}
        </div>
        {!speechSupported ? (
          <div style={{ fontSize: 11, color: "var(--color-text-placeholder)", marginTop: 4 }}>
            当前浏览器不支持语音识别，已为你模拟
          </div>
        ) : null}
      </div>
    </div>
  );
}
