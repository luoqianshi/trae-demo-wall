import { useEffect, useState } from "react";
import { BrainCircuit, ScanLine } from "@/lib/icons";

interface LoadingOverlayProps {
  onComplete: () => void;
  duration?: number;
}

const STEPS = [
  "初始化神经网络模型...",
  "解析用户兴趣向量...",
  "匹配性格特征图谱...",
  "计算职业适配矩阵...",
  "生成个性化推荐结果...",
  "优化推荐排序...",
];

export default function LoadingOverlay({ onComplete, duration = 2800 }: LoadingOverlayProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = duration / STEPS.length;
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, stepInterval);

    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 100));
    }, duration / 50);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-space-900/95 backdrop-blur-xl">
      {/* 扫描线 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 h-32 animate-scan-line bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* 中心动画 */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* 外环 */}
            <div className="h-32 w-32 animate-spin-slow rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan" />
            {/* 中环 */}
            <div
              className="absolute inset-2 animate-spin-slow rounded-full border-2 border-neon-magenta/20 border-b-neon-magenta"
              style={{ animationDirection: "reverse", animationDuration: "10s" }}
            />
            {/* 内核 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="h-12 w-12 animate-pulse-glow text-neon-cyan" />
            </div>
            {/* 扫描点 */}
            <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-neon-cyan shadow-neon-cyan" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-center font-display text-2xl font-bold text-ink-100">
          AI 正在分析你的<span className="gradient-text">未来画像</span>
        </h2>
        <p className="mt-2 text-center font-mono text-xs text-ink-300">
          NEURAL NETWORK ANALYSIS IN PROGRESS
        </p>

        {/* 进度条 */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-neon-cyan">
              <ScanLine className="h-3 w-3 animate-pulse" />
              {STEPS[step]}
            </span>
            <span className="text-ink-300">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 步骤列表 */}
        <div className="mt-6 space-y-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 font-mono text-xs transition-all duration-300 ${
                i < step
                  ? "text-neon-cyan/60"
                  : i === step
                    ? "text-ink-100"
                    : "text-ink-400/40"
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-current" />
              {s}
              {i < step && <span className="ml-auto text-neon-cyan/60">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
