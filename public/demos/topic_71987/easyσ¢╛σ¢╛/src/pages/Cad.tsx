import { useEffect, useRef, useState, useCallback } from "react";
import {
  PencilRuler,
  MousePointer2,
  Minus,
  Circle,
  Square,
  Hexagon,
  Ruler,
  Grid3x3,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  ChevronRight,
  Terminal,
  Layers,
  Copy,
  Check,
  Lightbulb,
  Eye,
  CornerDownLeft,
  XCircle,
} from "lucide-react";
import {
  useCadCanvas,
  drawShapes,
  useMousePosition,
  type CadShape,
} from "@/hooks/useCadCanvas";
import { useAutoCadCommand } from "@/hooks/useAutoCadCommand";
import { CAD_CASES } from "@/lib/mockData";

// 命令→工具映射
const QUICK_COMMANDS = [
  { cmd: "LINE", label: "直线", icon: Minus },
  { cmd: "CIRCLE", label: "圆", icon: Circle },
  { cmd: "RECTANG", label: "矩形", icon: Square },
  { cmd: "POLYGON", label: "多边形", icon: Hexagon },
  { cmd: "HATCH", label: "剖面线", icon: Grid3x3 },
  { cmd: "DIMLINEAR", label: "标注", icon: Ruler },
  { cmd: "ERASE", label: "擦除", icon: Eraser },
  { cmd: "MIRROR", label: "镜像", icon: MousePointer2 },
];

export default function Cad() {
  const cad = useCadCanvas();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useMousePosition(canvasRef);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  const [currentCase, setCurrentCase] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [cmdInput, setCmdInput] = useState("");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const cas = CAD_CASES[currentCase];

  const ac = useAutoCadCommand({
    addShape: cad.addShape,
    removeShape: cad.removeShape,
    clear: cad.clear,
    undo: cad.undo,
    redo: cad.redo,
    shapes: cad.shapes,
  });

  // 渲染画布
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (
      canvas.width !== rect.width * devicePixelRatio ||
      canvas.height !== rect.height * devicePixelRatio
    ) {
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    drawShapes(ctx, cad.shapes, {
      width: rect.width,
      height: rect.height,
      grid: true,
      cursor: mousePos.screen,
      preview: ac.preview,
      crosshair: true,
      origin: { x: rect.width / 2, y: rect.height / 2 },
      scale: 1,
    });
  }, [cad.shapes, mousePos.screen, ac.preview]);

  useEffect(() => {
    render();
  }, [render]);

  // 自动聚焦命令行
  useEffect(() => {
    cmdInputRef.current?.focus();
  }, []);

  // 命令行历史滚动到底
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ac.logs]);

  // 画布点击 → 拾取点
  const onCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    // 屏幕 → WCS
    const wx = sx - rect.width / 2;
    const wy = rect.height / 2 - sy;
    ac.pickPoint({ x: wx, y: wy });
  };

  // 鼠标移动 → 更新预览
  useEffect(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = mousePos.screen.x;
    const sy = mousePos.screen.y;
    const wx = sx - rect.width / 2;
    const wy = rect.height / 2 - sy;
    ac.moveCursor({ x: wx, y: wy });
  }, [mousePos.screen, ac.moveCursor]);

  // 命令行提交
  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ac.submitInput(cmdInput);
    setCmdInput("");
  };

  // Esc 取消当前命令
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ac.cancel();
        setCmdInput("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ac]);

  // 切换案例
  const handleCaseChange = (idx: number) => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setAutoPlaying(false);
    setCurrentCase(idx);
    setActiveStep(-1);
    setCompletedSteps(new Set());
    ac.startCommand("CLEAR");
    // 清空命令行历史，重新开始
    setTimeout(() => {
      ac.startCommand("CLEAR");
    }, 0);
  };

  // 点击步骤：自动按 fullCommand 顺序执行
  const handleStepClick = (idx: number) => {
    if (autoPlaying) return;
    setActiveStep(idx);
    runStep(idx);
  };

  // 执行单个步骤（解析 fullCommand 中的多段输入）
  const runStep = (idx: number) => {
    const step = cas.steps[idx];
    if (!step?.fullCommand) return;
    // 解析 fullCommand：按 ↵ 分段，去掉说明文字（→ 后的内容）
    const segments = step.fullCommand
      .split("↵")
      .map((s) => s.split("→")[0].trim())
      .filter((s) => s.length > 0);

    let delay = 200;
    segments.forEach((seg) => {
      setTimeout(() => {
        // 把"鼠标点击画布中心"等说明性输入转换为坐标
        const input = normalizeStepInput(seg, idx);
        ac.submitInput(input);
      }, delay);
      delay += 400;
    });

    setTimeout(() => {
      setCompletedSteps((s) => new Set([...s, idx]));
    }, delay + 100);
  };

  // 自动播放：依次执行所有步骤
  const handleAutoPlay = () => {
    if (autoPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      setAutoPlaying(false);
      return;
    }
    setAutoPlaying(true);
    ac.startCommand("CLEAR");
    let delay = 800;
    cas.steps.forEach((_, idx) => {
      playTimerRef.current = window.setTimeout(() => {
        setActiveStep(idx);
        runStep(idx);
      }, delay);
      delay += 2500;
    });
    playTimerRef.current = window.setTimeout(() => {
      setAutoPlaying(false);
    }, delay);
  };

  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1d1d1f]">
      {/* 顶部标题栏 - AutoCAD 风格深色 */}
      <div className="px-4 lg:px-6 py-2.5 border-b border-[#2c2c2e] bg-[#252527] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <PencilRuler className="w-4 h-4 text-apple-500" />
            AutoCAD 演示画板
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#3a3a3c] text-gray-400 font-mono">
            模型空间
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={cad.undo}
            disabled={!cad.canUndo}
            className="p-1.5 rounded-md text-gray-300 hover:bg-[#3a3a3c] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="撤销 (U)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cad.redo}
            disabled={!cad.canRedo}
            className="p-1.5 rounded-md text-gray-300 hover:bg-[#3a3a3c] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="重做 (REDO)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#3a3a3c] mx-1" />
          <button
            onClick={() => ac.startCommand("CLEAR")}
            className="p-1.5 rounded-md text-gray-300 hover:bg-apple-500/20 hover:text-apple-400 transition-colors"
            title="清空画布"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ribbon 工具栏 - AutoCAD 风格 */}
      <div className="px-3 py-1.5 border-b border-[#2c2c2e] bg-[#2a2a2c] flex items-center gap-0.5 overflow-x-auto">
        {QUICK_COMMANDS.map((q) => {
          const isActive = ac.state?.name === q.cmd;
          return (
            <button
              key={q.cmd}
              onClick={() => ac.startCommand(q.cmd)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-apple-500 text-white"
                  : "text-gray-300 hover:bg-[#3a3a3c] hover:text-white"
              }`}
              title={`${q.cmd} 命令`}
            >
              <q.icon className="w-3.5 h-3.5" />
              <span>{q.label}</span>
              <span className={`text-[9px] font-mono ${isActive ? "text-white/60" : "text-gray-500"}`}>
                {q.cmd}
              </span>
            </button>
          );
        })}
      </div>

      {/* 主体三栏 */}
      <div className="flex-1 grid lg:grid-cols-[240px_1fr_280px] overflow-hidden">
        {/* 左侧：案例列表 */}
        <aside className="hidden lg:flex flex-col border-r border-[#2c2c2e] bg-[#252527] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#2c2c2e]">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              教学案例
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {CAD_CASES.map((c, i) => (
              <button
                key={c.id}
                onClick={() => handleCaseChange(i)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  currentCase === i
                    ? "bg-apple-500/15 border-apple-500/40"
                    : "bg-[#2a2a2c] border-[#3a3a3c] hover:border-[#4a4a4c]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500 font-mono">
                    CASE {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      c.difficulty === "入门"
                        ? "bg-apple-500/20 text-apple-400"
                        : c.difficulty === "进阶"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {c.difficulty}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${
                    currentCase === i ? "text-apple-400" : "text-gray-200"
                  }`}
                >
                  {c.title}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                  {c.description}
                </div>
              </button>
            ))}
          </div>

          {/* 图层信息 */}
          <div className="p-3 border-t border-[#2c2c2e]">
            <div className="text-[10px] font-semibold text-gray-400 mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              图层
            </div>
            <div className="space-y-1">
              {[
                { name: "粗实线", color: "#FFFFFF" },
                { name: "细实线", color: "#00CED1" },
                { name: "中心线", color: "#FF3B30" },
                { name: "尺寸线", color: "#00AAFF" },
                { name: "剖面线", color: "#FFAA00" },
              ].map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-[10px]">
                  <div
                    className="w-3 h-3 rounded-sm border border-[#3a3a3c]"
                    style={{ background: l.color }}
                  />
                  <span className="text-gray-400">{l.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 中间：画布 + 命令行 */}
        <div className="relative flex flex-col overflow-hidden">
          {/* 画布 */}
          <div className="flex-1 relative" ref={containerRef}>
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            />

            {/* 坐标显示 - AutoCAD 风格左下角 */}
            <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur border border-[#3a3a3c] rounded text-[11px] font-mono text-gray-300">
              <span className="text-apple-400">X:</span> {mousePos.wcs.x.toFixed(1)}{"  "}
              <span className="text-apple-400">Y:</span> {mousePos.wcs.y.toFixed(1)}
            </div>

            {/* 当前命令状态 - 顶部居中 */}
            {ac.state && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-apple-500/90 backdrop-blur rounded-md text-xs text-white font-medium shadow-lg flex items-center gap-2">
                <span className="font-mono">{ac.state.name}</span>
                <span className="text-white/70">|</span>
                <span>{ac.state.prompt}</span>
              </div>
            )}

            {/* 提示：无命令时显示帮助 */}
            {!ac.state && (
              <div className="absolute top-2 right-2 px-2.5 py-1.5 bg-black/70 backdrop-blur border border-[#3a3a3c] rounded text-[10px] text-gray-400 font-mono">
                点击画布拾取点 · 输入坐标如 <span className="text-apple-400">30,20</span> ·{" "}
                <span className="text-amber-400">ESC</span> 取消
              </div>
            )}
          </div>

          {/* 命令行 - AutoCAD 经典多行窗口 */}
          <div className="h-44 border-t border-[#2c2c2e] bg-[#1d1d1f] flex flex-col">
            <div className="flex items-center justify-between px-3 py-1 border-b border-[#2c2c2e]">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <Terminal className="w-3 h-3" />
                命令行历史
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>当前命令:</span>
                <span className="font-mono text-apple-400">
                  {ac.state?.name || "（无）"}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
              {ac.logs.map((entry, i) => (
                <div
                  key={i}
                  className={
                    entry.type === "input"
                      ? "text-gray-200"
                      : entry.type === "prompt"
                      ? "text-apple-400"
                      : entry.type === "error"
                      ? "text-red-400"
                      : entry.type === "success"
                      ? "text-green-400"
                      : "text-gray-500"
                  }
                >
                  {entry.type === "input" ? "› " : entry.type === "prompt" ? "" : "  "}
                  {entry.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <form
              onSubmit={handleCmdSubmit}
              className="flex items-center gap-2 px-3 py-1.5 border-t border-[#2c2c2e] bg-[#252527]"
            >
              <span className="text-apple-400 font-mono text-sm">命令:</span>
              <input
                ref={cmdInputRef}
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder={
                  ac.state
                    ? ac.state.prompt + "（输入坐标/数值/选项后回车）"
                    : "输入命令名（LINE / CIRCLE / RECTANG / POLYGON ...）"
                }
                className="flex-1 bg-transparent text-sm font-mono text-gray-100 focus:outline-none placeholder-gray-600"
              />
              <CornerDownLeft className="w-3.5 h-3.5 text-gray-500" />
              {ac.state && (
                <button
                  type="button"
                  onClick={() => {
                    ac.cancel();
                    setCmdInput("");
                  }}
                  className="p-1 rounded text-red-400 hover:bg-red-500/20"
                  title="ESC 取消"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* 右侧：分步演示 */}
        <aside className="hidden lg:flex flex-col border-l border-[#2c2c2e] bg-[#252527] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#2c2c2e] flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                分步演示
              </h3>
              <p className="text-[11px] text-gray-300 mt-0.5">{cas.title}</p>
            </div>
            <button
              onClick={handleAutoPlay}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                autoPlaying
                  ? "bg-apple-500/20 text-apple-400"
                  : "bg-apple-500 text-white hover:bg-apple-600"
              }`}
            >
              {autoPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  停止
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  播放
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {cas.steps.map((step, i) => {
              const isActive = activeStep === i;
              const isDone = completedSteps.has(i);
              return (
                <div
                  key={i}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? "bg-apple-500/15 border-apple-500/40"
                      : isDone
                      ? "bg-[#2a2a2c] border-[#3a3a3c]"
                      : "bg-[#2a2a2c] border-[#3a3a3c] hover:border-[#4a4a4c] cursor-pointer"
                  }`}
                >
                  <button
                    onClick={() => handleStepClick(i)}
                    disabled={autoPlaying}
                    className="w-full text-left disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isDone
                            ? "bg-apple-500 text-white"
                            : isActive
                            ? "bg-amber-500 text-white animate-pulse"
                            : "bg-[#3a3a3c] text-gray-400"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <span className="text-[10px] font-medium">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[11px] font-mono text-apple-400">
                            {step.command}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                          <span className="text-[9px] text-gray-500">点击自动执行</span>
                        </div>
                        <div className="text-xs text-gray-300">{step.description}</div>
                      </div>
                    </div>
                  </button>

                  {/* 完整命令 */}
                  {step.fullCommand && (
                    <div className="mt-2 ml-7">
                      <div className="flex items-center gap-1 mb-1">
                        <Terminal className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] text-gray-500 font-medium">命令行输入</span>
                      </div>
                      <div className="group relative bg-black rounded p-2 pr-7 overflow-x-auto border border-[#3a3a3c]">
                        <code className="font-mono text-[11px] text-green-400 whitespace-pre-wrap break-all">
                          {step.fullCommand}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCmd(step.fullCommand!);
                          }}
                          className="absolute top-1 right-1 p-1 rounded bg-[#2a2a2c] hover:bg-[#3a3a3c] text-gray-400 hover:text-white transition-colors"
                          title="复制命令"
                        >
                          {copiedCmd === step.fullCommand ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 操作提示 */}
                  {step.tip && (
                    <div className="mt-1.5 ml-7 flex items-start gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-1.5">
                      <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-400" />
                      <span className="leading-relaxed">{step.tip}</span>
                    </div>
                  )}

                  {/* 预期效果 */}
                  {step.expected && (
                    <div className="mt-1 ml-7 flex items-start gap-1.5 text-[11px] text-gray-400">
                      <Eye className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-500" />
                      <span className="leading-relaxed">
                        <span className="text-gray-500">效果：</span>
                        {step.expected}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

// 把步骤说明性输入转换为可执行命令
function normalizeStepInput(seg: string, stepIdx: number): string {
  const s = seg.trim();
  // 中文说明 → 模拟点击画布中心（用 0,0 表示）
  if (s.includes("鼠标点击") || s.includes("点击") || s.includes("框选")) {
    if (s.includes("中心") || s.includes("同一中心")) return "0,0";
    // 默认点击原点附近
    return "0,0";
  }
  // "图形:ANSI31" 之类的伪参数，跳过
  if (s.includes(":") && !s.match(/^[-+]?[\d.]+,/)) {
    return "";
  }
  // "双击" / "点击" 等纯动作 → 跳过
  if (s.startsWith("双击") || s.startsWith("状态列")) return "";
  return s;
}
