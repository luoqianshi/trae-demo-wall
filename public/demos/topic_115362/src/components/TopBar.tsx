import { useEffect, useState } from "react";
import { Boxes, Sparkles, Code2, Eye, Pencil, Trash2, Cpu, Wifi } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";

export default function TopBar() {
  const { setAiOpen, setGeneratedOpen, previewMode, setPreviewMode, controls, clearControls } = useBuilderStore();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-5 bg-ink-950/80 backdrop-blur-xl border-b border-cyan-glow/15 relative z-20">
      {/* 顶部扫描线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/3 data-flow-bar" />
      </div>

      {/* Logo + 状态 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-glow via-cyan-500 to-cyan-700 flex items-center justify-center shadow-glow-sm">
            <Boxes className="w-5 h-5 text-ink-950" />
            <div className="absolute inset-0 rounded-lg border border-cyan-glow/50 animate-pulse" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-[15px] text-white tracking-wider glow-text">
              砌码<span className="text-cyan-glow"> CodeBricks</span>
            </span>
            <span className="text-[9px] text-ink-600 font-mono mt-1 tracking-[0.2em] uppercase">
              Low-Code R&D Platform · v1.0
            </span>
          </div>
        </div>

        {/* HUD 状态指示 */}
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-ink-700/50">
          <StatusDot color="text-emerald-code" label="SYS" />
          <StatusDot color="text-cyan-glow" label="ONLINE" />
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-600">
            <Cpu className="w-3 h-3" />
            <span>{controls.length} FLD</span>
          </div>
        </div>
      </div>

      {/* 操作区 */}
      <div className="flex items-center gap-2">
        {/* 系统时间 */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 h-9 mr-1 rounded-lg bg-ink-900/60 border border-ink-700/40">
          <Wifi className="w-3 h-3 text-cyan-glow" />
          <span className="font-mono text-[11px] text-cyan-glow tracking-wider">{time}</span>
        </div>

        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-ink-600 text-ink-500 hover:text-cyan-glow hover:border-cyan-glow/50 transition-colors text-sm"
        >
          {previewMode ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="font-mono text-xs">{previewMode ? "EDIT" : "PREVIEW"}</span>
        </button>

        <button
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-amber-accent/40 text-amber-accent hover:bg-amber-accent/10 transition-colors text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-mono text-xs">AI</span>
        </button>

        {controls.length > 0 && (
          <button
            onClick={clearControls}
            title="清空画布"
            className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-ink-600 text-ink-500 hover:text-red-400 hover:border-red-400/50 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setGeneratedOpen(true)}
          className="relative flex items-center gap-1.5 px-4 h-9 rounded-lg bg-cyan-glow text-ink-950 font-bold text-sm hover:shadow-glow transition-all overflow-hidden group"
        >
          <Code2 className="w-4 h-4" />
          <span className="font-mono">GENERATE</span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </button>
      </div>
    </header>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`blink-dot w-1.5 h-1.5 rounded-full bg-current ${color}`} />
      <span className="font-mono text-[9px] text-ink-600 tracking-wider">{label}</span>
    </div>
  );
}
