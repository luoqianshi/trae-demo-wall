import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ICONS } from "@/lib/icons";
import { getCareerById } from "@/data/careers";
import { useAppStore } from "@/store/useAppStore";
import type { WorkScene } from "@/types";
import { SceneBackground, inferSceneType } from "@/components/SceneBackground";
import SceneObjects from "@/components/SceneObjects";
import { cn } from "@/lib/utils";

/* ================================================================
   Constants
   ================================================================ */

const accentMap = {
  cyan: { hex: "#00f0ff", soft: "rgba(0,240,255,0.12)", text: "text-neon-cyan", border: "border-neon-cyan/40", bg: "bg-neon-cyan/10" },
  magenta: { hex: "#ff2e88", soft: "rgba(255,46,136,0.12)", text: "text-neon-magenta", border: "border-neon-magenta/40", bg: "bg-neon-magenta/10" },
  gold: { hex: "#ffb800", soft: "rgba(255,184,0,0.12)", text: "text-neon-gold", border: "border-neon-gold/40", bg: "bg-neon-gold/10" },
  green: { hex: "#39ff14", soft: "rgba(57,255,20,0.12)", text: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10" },
};

const moodColorMap: Record<string, string> = {
  focus: "#00f0ff",
  social: "#ffb800",
  stress: "#ff2e88",
  relax: "#39ff14",
  creative: "#a855f7",
  tired: "#94a3b8",
};

const moodLabel: Record<string, string> = {
  focus: "专注",
  social: "交流",
  stress: "压力",
  relax: "放松",
  creative: "创作",
  tired: "疲惫",
};

const ambientSounds: Record<string, string> = {
  office: "键盘敲击声 · 打印机运转 · 同事低声讨论",
  lab: "仪器蜂鸣 · 风扇转动 · 电流声",
  cafe: "咖啡机蒸汽 · 轻音乐 · 杯碟碰撞",
  home: "钟表滴答 · 窗外车流 · 冰箱低鸣",
  meeting: "投影仪风扇 · 白板笔书写 · 翻页声",
  outdoor: "鸟鸣 · 树叶沙沙 · 远处车流",
  studio: "铅笔沙沙 · 轻音乐 · 窗外风声",
  factory: "机器轰鸣 · 传送带运转 · 金属碰撞",
  hospital: "监护仪滴滴 · 空调声 · 脚步声",
  classroom: "粉笔书写 · 翻书声 · 学生低语",
  courtroom: "木质回响 · 翻页声 · 空调低鸣",
  construction: "塔吊运转 · 钢筋碰撞 · 对讲机声音",
};

type SceneDecisionOption = {
  text: string;
  moodChange: number;
  feedback: string;
  icon: string;
};

type SceneDecision = {
  question: string;
  context?: string;
  options: SceneDecisionOption[];
};

type DecisionLog = {
  sceneTitle: string;
  choice: string;
  feedback: string;
  moodChange: number;
};

/* ================================================================
   Animated Character
   ================================================================ */

function AnimatedCharacter({
  career,
  accent,
  mood,
  isActive,
  scale = 1,
}: {
  career: NonNullable<ReturnType<typeof getCareerById>>;
  accent: string;
  mood: string;
  isActive: boolean;
  scale?: number;
}) {
  const bodyColor = career.avatar?.costume || "#6366f1";
  const hairColor = "#1e1b4b";
  const skinColor = "#f5d0b0";

  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={isActive ? { y: [0, -4, 0] } : { y: 0 }}
      transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
    >
      <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {/* Body glow */}
        <ellipse cx="40" cy="88" rx="22" ry="6" fill={accent} opacity="0.15">
          <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
        </ellipse>

        {/* Legs */}
        <rect x="28" y="62" width="10" height="22" rx="3" fill="#1e293b" />
        <rect x="42" y="62" width="10" height="22" rx="3" fill="#1e293b" />

        {/* Body */}
        <rect x="24" y="36" width="32" height="30" rx="10" fill={bodyColor} />

        {/* Arms */}
        <motion.rect
          x="10" y="38" width="12" height="8" rx="4" fill={bodyColor}
          animate={mood === "focus" ? { rotate: [0, -5, 0] } : { rotate: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "16px 42px" }}
        />
        <motion.rect
          x="58" y="38" width="12" height="8" rx="4" fill={bodyColor}
          animate={mood === "focus" ? { rotate: [0, 5, 0] } : { rotate: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "64px 42px" }}
        />

        {/* Collar */}
        <polygon points="34,36 40,44 46,36" fill="rgba(255,255,255,0.2)" />

        {/* Head */}
        <circle cx="40" cy="22" r="14" fill={skinColor} />

        {/* Hair */}
        <path d="M26 22 Q26 8 40 8 Q54 8 54 22 Q54 14 40 14 Q26 14 26 22" fill={hairColor} />
        <rect x="26" y="14" width="28" height="4" rx="2" fill={hairColor} />

        {/* Eyes */}
        <motion.g
          animate={mood === "tired" ? { scaleY: [1, 0.3, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <circle cx="34" cy="22" r="2.5" fill="#1e1b4b" />
          <circle cx="46" cy="22" r="2.5" fill="#1e1b4b" />
        </motion.g>

        {/* Mouth */}
        {mood === "social" ? (
          <path d="M34 28 Q40 33 46 28" stroke="#1e1b4b" strokeWidth="1.5" fill="none" />
        ) : mood === "stress" ? (
          <path d="M34 29 Q40 26 46 29" stroke="#1e1b4b" strokeWidth="1.5" fill="none" />
        ) : (
          <line x1="36" y1="28" x2="44" y2="28" stroke="#1e1b4b" strokeWidth="1.5" />
        )}
      </svg>

      {/* Name tag */}
      <motion.div
        className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-sm"
        style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {career.name} · 你
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   Prologue Overlay
   ================================================================ */

function Prologue({
  career,
  accent,
  onStart,
}: {
  career: NonNullable<ReturnType<typeof getCareerById>>;
  accent: typeof accentMap[keyof typeof accentMap];
  onStart: () => void;
}) {
  const [step, setStep] = useState(0);
  const scenes = career.workScenes;
  const firstScene = scenes?.[0];

  const lines = useMemo(
    () => [
      { text: `${career.openingLine || "新的一天开始了。"}`, delay: 0 },
      { text: `今天你是${career.name}`, delay: 800 },
      { text: firstScene ? `${firstScene.time} · ${firstScene.location}` : "", delay: 1600 },
      { text: "准备好了吗？", delay: 2400 },
    ],
    [career, firstScene]
  );

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setStep(i + 1), line.delay + 600)
    );
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020510]">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${accent.soft}, transparent 60%)` }}
      />

      <div className="relative z-10 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl backdrop-blur-sm"
            style={{ backgroundColor: `${accent.hex}15`, border: `1px solid ${accent.hex}30` }}
          >
            {(() => {
              const Icon = ICONS[career.icon] || ICONS.Compass;
              return <Icon className="h-12 w-12" style={{ color: accent.hex }} />;
            })()}
          </div>
        </motion.div>

        {/* Cinematic text */}
        <div className="space-y-4">
          {lines.map((line, i) => (
            <AnimatePresence key={i}>
              {step > i && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    i === 1 ? "font-display text-2xl font-bold tracking-wide" : "text-lg text-white/70",
                    i === 3 ? "mt-6 text-xl font-semibold" : ""
                  )}
                  style={i === 1 ? { color: accent.hex } : {}}
                >
                  {line.text}
                </motion.p>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Start button */}
        <AnimatePresence>
          {step >= 4 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={onStart}
              aria-label="开始体验"
              className="mt-10 rounded-full px-8 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accent.hex,
                color: "#020510",
                boxShadow: `0 0 30px ${accent.hex}40`,
              }}
            >
              开始体验一天
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================
   Epilogue Overlay
   ================================================================ */

function Epilogue({
  career,
  accent,
  moodLevel,
  completedScenes,
  impactScore,
  decisionHistory,
  onRestart,
  onBack,
}: {
  career: NonNullable<ReturnType<typeof getCareerById>>;
  accent: typeof accentMap[keyof typeof accentMap];
  moodLevel: number;
  completedScenes: number;
  impactScore: number;
  decisionHistory: DecisionLog[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020510]/95 backdrop-blur-sm"
        >
          <div className="relative z-10 max-w-lg px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <ICONS.Sparkles className="mx-auto h-16 w-16" style={{ color: accent.hex }} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 font-display text-3xl font-bold text-white"
            >
              一天结束了
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-3 text-lg text-white/60"
            >
              你作为{career.name}度过了充实的一天
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-display text-2xl font-bold" style={{ color: accent.hex }}>
                  {completedScenes}
                </div>
                <div className="mt-1 text-xs text-white/40">场景完成</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-display text-2xl font-bold" style={{ color: accent.hex }}>
                  {moodLevel}%
                </div>
                <div className="mt-1 text-xs text-white/40">心流指数</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-display text-2xl font-bold" style={{ color: accent.hex }}>
                  {impactScore}
                </div>
                <div className="mt-1 text-xs text-white/40">决策评分</div>
              </div>
            </motion.div>

            {decisionHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
              >
                <div className="mb-3 flex items-center gap-2">
                  <ICONS.FileCheck className="h-4 w-4" style={{ color: accent.hex }} />
                  <span className="font-display text-sm font-bold text-white/85">关键选择记录</span>
                </div>
                <div className="space-y-2">
                  {decisionHistory.slice(-3).map((log, i) => (
                    <div key={`${log.sceneTitle}-${i}`} className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="font-mono text-[10px] text-white/35">{log.sceneTitle}</p>
                      <p className="mt-1 text-xs text-white/75">你的选择：{log.choice}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{log.feedback}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <button
                onClick={onRestart}
                className="rounded-full px-8 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: accent.hex, color: "#020510" }}
              >
                再体验一次
              </button>
              <button
                onClick={onBack}
                className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:text-white"
              >
                返回职业列表
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================
   Main Experience Page
   ================================================================ */

export default function Experience() {
  const { careerId } = useParams<{ careerId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAppStore();
  void userProfile; // 保留 store 订阅以在画像变化时触发重渲染

  const career = useMemo(() => getCareerById(careerId || ""), [careerId]);
  const accent = useMemo(
    () => accentMap[career?.accentColor as keyof typeof accentMap] || accentMap.cyan,
    [career]
  );
  const scenes = useMemo(() => career?.workScenes || [], [career]);

  const [showIntro, setShowIntro] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1);
  const [moodLevel, setMoodLevel] = useState(75);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionResult, setDecisionResult] = useState<string | null>(null);
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [impactScore, setImpactScore] = useState(70);
  const [decisionHistory, setDecisionHistory] = useState<DecisionLog[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const decisionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardLockRef = useRef(false);

  // Track completed scenes (actual viewed count)
  const [completedScenes, setCompletedScenes] = useState(0);

  // Track mouse for parallax (RAF throttle to avoid re-rendering every frame)
  const mouseRafRef = useRef<number | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
      if (mouseRafRef.current) return;
      mouseRafRef.current = requestAnimationFrame(() => {
        setMousePos(latestMouseRef.current);
        mouseRafRef.current = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseRafRef.current) cancelAnimationFrame(mouseRafRef.current);
    };
  }, []);

  // Redirect if no career found
  useEffect(() => {
    if (!career) {
      navigate("/results");
    }
  }, [career, navigate]);

  // Cleanup decision timer on unmount
  useEffect(() => {
    return () => {
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current);
      }
    };
  }, []);

  // Route leave confirmation (prevent accidental navigation during experience)
  useEffect(() => {
    const isActive = currentSceneIndex >= 0 && !showEpilogue;
    if (!isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentSceneIndex, showEpilogue]);

  const currentScene: WorkScene | undefined = scenes[currentSceneIndex];
  const isLastScene = currentSceneIndex >= scenes.length - 1;
  const totalScenes = scenes.length;

  /* ---------- Scene Decisions ---------- */
  const sceneDecisions = useMemo<Record<string, SceneDecision>>(() => {
    const decisions: Record<string, SceneDecision> = {};

    const buildQuestion = (scene: WorkScene) => `在「${scene.title}」这个真实片段里，你作为${career?.name || "体验者"}需要做一个选择：`;

    const presets: Record<string, Omit<SceneDecision, "question">> = {
      focus: {
        context: "专业工作最考验专注力与优先级判断。",
        options: [
          { text: "先锁定最重要的问题，分 25 分钟冲刺", moodChange: 4, feedback: "你把复杂任务切成了可执行的小块，心流感明显提升。", icon: "Target" },
          { text: "快速扫一遍所有信息，再决定顺序", moodChange: 1, feedback: "你获得了全局视角，但也牺牲了一点深度专注。", icon: "Eye" },
          { text: "被消息牵着走，哪里亮了点哪里", moodChange: -5, feedback: "你处理了很多琐碎信息，却没有真正推进关键目标。", icon: "MessageCircle" },
        ],
      },
      social: {
        context: "职业不是单打独斗，沟通方式会影响团队信任。",
        options: [
          { text: "先倾听对方，再提出你的判断", moodChange: 4, feedback: "你没有急着证明自己，而是先建立了信任，沟通效率更高。", icon: "HeartHandshake" },
          { text: "直接给出解决方案，节省时间", moodChange: 1, feedback: "方案有效，但对方可能还没完全表达真实需求。", icon: "Lightbulb" },
          { text: "尽量少参与，避免增加麻烦", moodChange: -4, feedback: "你短期避开了沟通压力，但也错过了建立影响力的机会。", icon: "EyeOff" },
        ],
      },
      stress: {
        context: "压力场景最能看出一个职业是否适合你。",
        options: [
          { text: "重新拆分任务，先交付最有价值的部分", moodChange: 5, feedback: "你没有硬扛，而是把压力转化成了清晰的交付策略。", icon: "ListChecks" },
          { text: "加班硬冲，先把所有东西做完", moodChange: -4, feedback: "你完成了更多任务，但精力下降，后续质量风险变高。", icon: "Flame" },
          { text: "主动同步风险，争取资源支持", moodChange: 3, feedback: "你把问题暴露在可控范围内，团队可以更早介入。", icon: "MessageSquare" },
        ],
      },
      relax: {
        context: "休息不是偷懒，而是维持长期职业状态的能力。",
        options: [
          { text: "短暂离开屏幕，让大脑换气", moodChange: 4, feedback: "你恢复了注意力，下午更容易进入状态。", icon: "Sun" },
          { text: "和同事交换行业见闻", moodChange: 2, feedback: "轻松交流带来了新信息，也让工作更有连接感。", icon: "Coffee" },
          { text: "继续工作，早点把进度推完", moodChange: -2, feedback: "短期进度增加了，但疲劳感也在积累。", icon: "Briefcase" },
        ],
      },
      creative: {
        context: "创意职业的关键，是把灵感变成可被讨论的东西。",
        options: [
          { text: "立刻做一个低保真原型或草图", moodChange: 5, feedback: "你把抽象灵感变成了可见成果，后续沟通更顺畅。", icon: "PenTool" },
          { text: "先记录关键词，继续当前任务", moodChange: 1, feedback: "你保护了当前进度，但灵感细节可能会流失。", icon: "BookOpen" },
          { text: "推翻原计划，完全跟着灵感走", moodChange: -3, feedback: "探索很兴奋，但也让原本的目标变得失控。", icon: "Sparkles" },
        ],
      },
      tired: {
        context: "疲惫时的选择，决定你是可持续成长还是反复透支。",
        options: [
          { text: "暂停 5 分钟，补水并重新安排节奏", moodChange: 4, feedback: "你没有否认疲惫，而是用小恢复换来了更稳的表现。", icon: "RefreshCw" },
          { text: "换成低脑力任务，保持推进", moodChange: 2, feedback: "你避开了高难度判断，把低精力时段也利用起来。", icon: "Clock" },
          { text: "继续硬撑，今天必须赢", moodChange: -5, feedback: "意志力很强，但职业生涯是长跑，透支不是长期方案。", icon: "Zap" },
        ],
      },
    };

    scenes.forEach((s, index) => {
      const mood = s.mood as keyof typeof presets;
      const base = presets[mood] || presets.focus;
      decisions[s.id] = {
        question: buildQuestion(s),
        context: base.context,
        options: base.options,
      };

      if (career?.challenge && index === scenes.length - 1) {
        decisions[s.id] = {
          question: career.challenge.title,
          context: career.challenge.desc,
          options: career.challenge.options.map((opt) => ({
            text: opt.text,
            moodChange: opt.correct ? 8 : -6,
            feedback: opt.feedback,
            icon: opt.correct ? "CheckCircle" : "AlertTriangle",
          })),
        };
      }
    });

    return decisions;
  }, [career, scenes]);

  /* ---------- Handlers ---------- */
  const handleDecision = useCallback(
    (option: SceneDecisionOption) => {
      setMoodLevel((prev) => Math.max(10, Math.min(100, prev + option.moodChange)));
      setImpactScore((prev) => Math.max(0, Math.min(100, prev + option.moodChange * 2)));
      setDecisionResult(option.feedback);
      if (currentScene) {
        setDecisionHistory((prev) => [
          ...prev.filter((item) => item.sceneTitle !== currentScene.title),
          {
            sceneTitle: currentScene.title,
            choice: option.text,
            feedback: option.feedback,
            moodChange: option.moodChange,
          },
        ]);
      }
      // 清理之前的 timer
      if (decisionTimerRef.current) clearTimeout(decisionTimerRef.current);
      decisionTimerRef.current = setTimeout(() => {
        setShowDecision(false);
        setDecisionResult(null);
        decisionTimerRef.current = null;
      }, 3000);
    },
    [currentScene]
  );

  const goToScene = useCallback(
    (index: number) => {
      if (index < 0 || index >= scenes.length) return;
      setCurrentSceneIndex(index);
      setShowDecision(false);
      setDecisionResult(null);
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current);
        decisionTimerRef.current = null;
      }
    },
    [scenes.length]
  );

  const startExperience = useCallback(() => {
    setShowIntro(false);
    goToScene(0);
  }, [goToScene]);

  const nextScene = useCallback(() => {
    // 标记当前场景为已完成
    if (currentSceneIndex >= 0 && currentSceneIndex < scenes.length) {
      setCompletedScenes((prev) => Math.max(prev, currentSceneIndex + 1));
    }
    if (isLastScene) {
      setShowEpilogue(true);
      return;
    }
    goToScene(currentSceneIndex + 1);
  }, [currentSceneIndex, isLastScene, goToScene, scenes.length]);

  const prevScene = useCallback(() => {
    goToScene(currentSceneIndex - 1);
  }, [currentSceneIndex, goToScene]);

  // Keyboard navigation: Space / Enter / RightArrow → next scene (with debounce)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntro || showEpilogue || showDecision || decisionResult) return;
      if (e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
      if (keyboardLockRef.current) return;

      if ([" ", "Enter", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        keyboardLockRef.current = true;
        nextScene();
        setTimeout(() => { keyboardLockRef.current = false; }, 300);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        keyboardLockRef.current = true;
        prevScene();
        setTimeout(() => { keyboardLockRef.current = false; }, 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro, showEpilogue, showDecision, decisionResult, nextScene, prevScene]);

  if (!career || scenes.length === 0) {
    return null;
  }

  /* ---------- Prologue ---------- */
  if (showIntro) {
    return <Prologue career={career} accent={accent} onStart={startExperience} />;
  }

  /* ---------- Epilogue ---------- */
  if (showEpilogue) {
    return (
      <Epilogue
        career={career}
        accent={accent}
        moodLevel={moodLevel}
        completedScenes={completedScenes}
        impactScore={impactScore}
        decisionHistory={decisionHistory}
        onRestart={() => {
          setShowEpilogue(false);
          setShowIntro(true);
          setCurrentSceneIndex(-1);
          setMoodLevel(75);
          setImpactScore(70);
          setDecisionHistory([]);
          setShowDecision(false);
          setDecisionResult(null);
          setCompletedScenes(0);
          if (decisionTimerRef.current) {
            clearTimeout(decisionTimerRef.current);
            decisionTimerRef.current = null;
          }
        }}
        onBack={() => navigate("/results")}
      />
    );
  }

  /* ---------- Current Scene Data ---------- */
  const sceneDecision = currentScene ? sceneDecisions[currentScene.id] : null;
  const sceneMood = currentScene?.mood || "focus";
  const sceneType = currentScene ? inferSceneType(currentScene) : "office";
  const ambientSound = ambientSounds[sceneType] || "";

  // 避免 highlight 与 desc 尾部重复造成“重复一句话”的观感（普通计算，不能放 hook）
  const renderHighlight = (() => {
    if (!currentScene?.highlight) return null;
    const desc = currentScene.desc || "";
    const hl = currentScene.highlight;
    if (desc.includes(hl) || hl.includes(desc.slice(-Math.min(desc.length, 20)))) return null;
    return hl;
  })();

  /* ---------- Main Experience ---------- */
  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-[#020510]">
      {/* ===== IMMERSIVE SCENE (FULL SCREEN) ===== */}
      <AnimatePresence mode="wait">
        {currentScene && (
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <SceneBackground
              scene={currentScene}
              accent={accent.hex}
              timeOfDay={currentScene.time}
              mousePosition={mousePos}
              moodLevel={moodLevel}
              className="h-full w-full"
            />
            <SceneObjects
              scene={currentScene}
              sceneType={sceneType}
              accent={accent.hex}
              className="z-[15]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TOP HUD ===== */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed left-0 right-0 top-0 z-30 border-b border-white/[0.04] bg-gradient-to-b from-black/60 to-transparent backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Back + Career */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/results")}
              className="rounded-lg border border-white/10 p-2 text-white/50 transition-all hover:border-white/30 hover:text-white/80"
            >
              <ICONS.ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="font-display text-sm font-bold text-white/90">{career.name}</p>
              <p className="font-mono text-[10px] text-white/30">{career.enName}</p>
            </div>
          </div>

          {/* Center: Time */}
          <div className="text-center">
            <p className="font-mono text-lg font-bold tracking-wider" style={{ color: accent.hex }}>
              {currentScene?.time || "---"}
            </p>
            <p className="font-mono text-[10px] text-white/30">
              {currentSceneIndex + 1} / {totalScenes}
            </p>
          </div>

          {/* Right: Mood */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-xs text-white/40">心流</p>
              <p className="font-mono text-sm font-bold" style={{ color: moodColorMap[sceneMood] }}>
                {moodLevel}%
              </p>
            </div>
            <div className="h-8 w-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="w-full rounded-full"
                style={{ backgroundColor: moodColorMap[sceneMood] }}
                animate={{ height: `${moodLevel}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== CHARACTER IN SCENE (centered, lower portion) ===== */}
      <motion.div
        key={`char-${currentScene?.id}`}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute bottom-[36%] left-1/2 z-10 -translate-x-1/2 sm:bottom-[34%]"
      >
        <AnimatedCharacter
          career={career}
          accent={accent.hex}
          mood={sceneMood}
          isActive={!showDecision}
        />
      </motion.div>

      {/* ===== PROFESSIONAL MISSION PANEL ===== */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45 }}
        className="fixed left-4 top-20 z-30 hidden w-72 rounded-2xl border border-white/[0.06] bg-black/30 p-4 backdrop-blur-xl lg:block"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ICONS.Target className="h-4 w-4" style={{ color: accent.hex }} />
            <span className="font-display text-sm font-bold text-white/85">当前任务</span>
          </div>
          <span className="font-mono text-[10px] text-white/35">{currentSceneIndex + 1}/{totalScenes}</span>
        </div>
        <p className="text-sm leading-relaxed text-white/60">
          在 <span style={{ color: accent.hex }}>{currentScene?.location}</span> 完成「{currentScene?.title}」，观察这个职业真实的节奏、压力和成就感。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="font-display text-lg font-bold" style={{ color: accent.hex }}>{impactScore}</div>
            <div className="font-mono text-[10px] text-white/35">决策评分</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="font-display text-lg font-bold" style={{ color: moodColorMap[sceneMood] }}>{moodLabel[sceneMood]}</div>
            <div className="font-mono text-[10px] text-white/35">场景氛围</div>
          </div>
        </div>
        {career.gears && career.gears.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-3">
            <div className="mb-2 font-mono text-[10px] text-white/30">今日装备</div>
            <div className="flex flex-wrap gap-1.5">
              {career.gears.slice(0, 4).map((gear) => {
                const GearIcon = ICONS[gear.icon] || ICONS.Circle;
                return (
                  <span key={gear.name} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55">
                    <GearIcon className="h-3 w-3" />
                    {gear.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== AMBIENT SOUND + KEYBOARD HINT (top-right) ===== */}
      <div className="fixed right-4 top-20 z-30 flex flex-col items-end gap-2 sm:right-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-black/30 px-3 py-1.5 backdrop-blur-md"
        >
          <ICONS.Volume2 className="h-3 w-3 text-white/30" />
          <span className="max-w-[180px] truncate font-mono text-[10px] text-white/30 sm:max-w-[240px]">{ambientSound}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="pointer-events-none flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-black/20 px-2.5 py-1 text-[10px] text-white/30 backdrop-blur-sm"
        >
          <span className="rounded border border-white/10 bg-white/5 px-1 py-0.5">Space</span>
          <span className="text-white/20">/</span>
          <span className="rounded border border-white/10 bg-white/5 px-1 py-0.5">Enter</span>
          <span className="text-white/20">/</span>
          <span className="rounded border border-white/10 bg-white/5 px-1 py-0.5">→</span>
        </motion.div>
      </div>

      {/* ===== SCENE NARRATIVE (floating card, above controls) ===== */}
      <motion.div
        key={`nar-${currentScene?.id}`}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed bottom-20 left-0 right-0 z-20 px-4 sm:bottom-24"
      >
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/[0.06] bg-[#020510]/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          {/* Scene meta */}
          <div className="mb-2 flex items-center justify-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[10px]"
              style={{ backgroundColor: `${moodColorMap[sceneMood]}18`, color: moodColorMap[sceneMood] }}
            >
              {moodLabel[sceneMood]}
            </span>
            <span className="font-mono text-[10px] text-white/30">{currentScene?.location}</span>
          </div>

          {/* Title */}
          <h2 className="text-center font-display text-lg font-bold text-white/90 sm:text-xl">
            {currentScene?.title}
          </h2>

          {/* Description */}
          <motion.p
            key={`desc-${currentScene?.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-center text-sm leading-relaxed text-white/60 sm:text-base"
          >
            {currentScene?.desc}
          </motion.p>

          {/* Highlight tag (only when not duplicate) */}
          <AnimatePresence>
            {renderHighlight && (
              <motion.div
                key={`hl-${currentScene?.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-3 flex justify-center"
              >
                <span
                  className="rounded-full border px-3 py-1 text-xs italic"
                  style={{ borderColor: `${accent.hex}30`, color: accent.hex, backgroundColor: `${accent.hex}10` }}
                >
                  {renderHighlight}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decision result */}
          <AnimatePresence>
            {decisionResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <ICONS.MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: accent.hex }} />
                  <p className="text-xs text-white/70 sm:text-sm">{decisionResult}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ===== DECISION PANEL ===== */}
      <AnimatePresence>
        {showDecision && sceneDecision && !decisionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 24, opacity: 0 }}
              className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1f]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <div className="mb-2 flex items-center gap-2">
                <ICONS.BrainCircuit className="h-4 w-4" style={{ color: accent.hex }} />
                <span className="font-mono text-[10px] text-white/30">交互决策</span>
              </div>
              <h3 className="mb-2 text-base font-semibold text-white/90 sm:text-lg">{sceneDecision.question}</h3>
              {sceneDecision.context && (
                <p className="mb-5 text-sm leading-relaxed text-white/50">{sceneDecision.context}</p>
              )}

              <div className="space-y-2.5">
                {sceneDecision.options.map((opt, i) => {
                  const IconComp = ICONS[opt.icon] || ICONS.Circle;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      onClick={() => handleDecision(opt)}
                      aria-label={`选择: ${opt.text}`}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-white/[0.06]"
                        style={{ backgroundColor: `${accent.hex}12` }}
                      >
                        <IconComp className="h-4 w-4" style={{ color: accent.hex }} />
                      </div>
                      <span className="text-sm text-white/80">{opt.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM CONTROL BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-4 pt-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Scene indicator dots */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/40 px-3 py-2 backdrop-blur-md">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToScene(i)}
                aria-label={`切换到场景 ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentSceneIndex ? "w-6" : "w-1.5",
                  i < currentSceneIndex ? "bg-white/30" : i === currentSceneIndex ? "bg-white/80" : "bg-white/15"
                )}
                style={i === currentSceneIndex ? { backgroundColor: accent.hex } : {}}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Decision trigger */}
            {sceneDecision && !showDecision && !decisionResult && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setShowDecision(true)}
                aria-label="做出选择"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition-all hover:scale-105 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                style={{
                  backgroundColor: accent.hex,
                  color: "#020510",
                  boxShadow: `0 0 20px ${accent.hex}40`,
                }}
              >
                <ICONS.Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">做出选择</span>
                <span className="sm:hidden">选择</span>
              </motion.button>
            )}

            {/* Next scene */}
            <motion.button
              onClick={nextScene}
              aria-label={isLastScene ? "结束一天" : "下一个场景"}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/50 px-3 py-2 text-xs text-white/70 backdrop-blur-md transition-all hover:border-white/20 hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden sm:inline">{isLastScene ? "结束一天" : "下一个场景"}</span>
              <span className="sm:hidden">{isLastScene ? "结束" : "下一"}</span>
              <ICONS.ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Scene Type Inference (imported from SceneBackground)
   ================================================================ */