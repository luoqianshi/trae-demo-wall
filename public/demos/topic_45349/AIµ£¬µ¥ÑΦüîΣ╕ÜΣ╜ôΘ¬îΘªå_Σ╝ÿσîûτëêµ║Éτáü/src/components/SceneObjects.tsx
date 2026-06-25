import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkScene } from "@/types";
import { cn } from "@/lib/utils";

interface SceneObjectsProps {
  scene: WorkScene;
  sceneType: string;
  accent: string;
  className?: string;
  onInteract?: (label: string) => void;
}

interface Hotspot {
  x: string;
  y: string;
  label: string;
  detail: string;
  emoji: string;
}

const HOTSPOTS: Record<string, Hotspot[]> = {
  office: [
    { x: "22%", y: "68%", label: "双屏工作站", detail: "主屏写代码，副屏看文档，Tab 切到飞起", emoji: "🖥️" },
    { x: "55%", y: "62%", label: "续命咖啡", detail: "第三杯美式，杯底已经能养鱼了", emoji: "☕" },
    { x: "82%", y: "66%", label: "白板 Todo", detail: "列了 10 条，划掉 2 条，新增 5 条", emoji: "📝" },
  ],
  lab: [
    { x: "48%", y: "64%", label: "显微镜", detail: "载物台上的样本正在等待奇迹", emoji: "🔬" },
    { x: "38%", y: "54%", label: "试管架", detail: "蓝色液体咕嘟咕嘟，希望不是假的", emoji: "🧪" },
    { x: "18%", y: "46%", label: "服务器机柜", detail: "绿灯狂闪，数据还活着", emoji: "🖥️" },
  ],
  cafe: [
    { x: "15%", y: "52%", label: "咖啡机", detail: "蒸汽十足，正在萃取今日续命液", emoji: "☕" },
    { x: "38%", y: "60%", label: "笔记本电脑", detail: "MacBook + 咖啡厅 = 自由职业标配", emoji: "💻" },
    { x: "72%", y: "56%", label: "菜单黑板", detail: "今日特调：焦糖玛奇朵配 deadline", emoji: "🍰" },
  ],
  home: [
    { x: "42%", y: "56%", label: "人体工学椅", detail: "已经坐了 6 小时，腰说它还好", emoji: "🪑" },
    { x: "30%", y: "68%", label: "机械键盘", detail: "青轴哒哒哒，邻居已在投诉", emoji: "⌨️" },
    { x: "12%", y: "60%", label: "绿植", detail: "唯一不会催你进度的工作伙伴", emoji: "🪴" },
  ],
  meeting: [
    { x: "12%", y: "42%", label: "投影仪", detail: "PPT 第 38 页，大家开始眼神涣散", emoji: "📊" },
    { x: "50%", y: "52%", label: "会议桌", detail: "水杯围成一圈，决议一个没有", emoji: "🤝" },
    { x: "88%", y: "38%", label: "白板", detail: "写满了 TODO，散会后没人记得", emoji: "🖊️" },
  ],
  outdoor: [
    { x: "25%", y: "54%", label: "公园长椅", detail: "刚坐下 5 分钟，客户电话来了", emoji: "🌳" },
    { x: "60%", y: "58%", label: "手机", detail: "电量 15%，焦虑值 99%", emoji: "📱" },
    { x: "85%", y: "52%", label: "共享单车", detail: "扫了 3 辆都没电，第四辆终于有了", emoji: "🚲" },
  ],
  studio: [
    { x: "42%", y: "62%", label: "数位板", detail: "压感笔正在画第 27 版草图", emoji: "🎨" },
    { x: "12%", y: "44%", label: "情绪板", detail: "贴满了参考图，灵感 0%", emoji: "📌" },
    { x: "85%", y: "52%", label: "色卡", detail: "甲方说：logo 再放大一点", emoji: "🌈" },
  ],
  factory: [
    { x: "45%", y: "52%", label: "机械臂", detail: "24 小时不停，从不需要咖啡", emoji: "🦾" },
    { x: "20%", y: "56%", label: "传送带", detail: "零件源源不断，像永动的 KPI", emoji: "🏭" },
    { x: "75%", y: "46%", label: "控制面板", detail: "红灯绿灯一起闪，老师傅说正常", emoji: "🎛️" },
  ],
  hospital: [
    { x: "42%", y: "58%", label: "病床", detail: "刚查完房，被单叠成豆腐块", emoji: "🛏️" },
    { x: "22%", y: "52%", label: "输液架", detail: "一滴滴，时间仿佛也慢了下来", emoji: "💉" },
    { x: "18%", y: "36%", label: "监护仪", detail: "滴滴声是这里最稳的心跳", emoji: "📈" },
  ],
  classroom: [
    { x: "18%", y: "38%", label: "黑板", detail: "粉笔字还没擦完，下一班已在门口", emoji: "🖍️" },
    { x: "50%", y: "52%", label: "课桌", detail: "桌角刻着往届学生的涂鸦", emoji: "📚" },
    { x: "85%", y: "42%", label: "投影仪", detail: "灯泡 aging，但 PPT 还在播", emoji: "📽️" },
  ],
  courtroom: [
    { x: "50%", y: "38%", label: "法官席", detail: "法槌一敲，全场安静", emoji: "⚖️" },
    { x: "25%", y: "52%", label: "原告席", detail: "证据厚厚一摞，紧张到喝水", emoji: "📁" },
    { x: "75%", y: "52%", label: "被告席", detail: "律师正在小声叮嘱：别激动", emoji: "🛡️" },
  ],
  construction: [
    { x: "55%", y: "32%", label: "塔吊", detail: "慢慢转，把钢筋送到云端", emoji: "🏗️" },
    { x: "30%", y: "56%", label: "安全帽", detail: "黄色，脏了，但救过命", emoji: "⛑️" },
    { x: "75%", y: "54%", label: "蓝图", detail: "卷边了，但工人还看它干活", emoji: "📐" },
  ],
};

export default function SceneObjects({ scene, sceneType, accent, className, onInteract }: SceneObjectsProps) {
  const [active, setActive] = useState<number | null>(null);
  const [pulses, setPulses] = useState<{ id: number; x: string; y: string }[]>([]);
  const [showHint, setShowHint] = useState(true);
  const hotspots = HOTSPOTS[sceneType] || HOTSPOTS.office;

  const handleHotspot = useCallback(
    (i: number, x: string, y: string) => {
      setActive(active === i ? null : i);
      onInteract?.(hotspots[i].label);
      const id = Date.now();
      setPulses((p) => [...p, { id, x, y }]);
      setTimeout(() => setPulses((p) => p.filter((item) => item.id !== id)), 700);
    },
    [active, hotspots, onInteract]
  );

  // 按 ESC 关闭弹窗；3 秒后自动收起探索提示
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    const hintTimer = setTimeout(() => setShowHint(false), 3500);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hintTimer);
    };
  }, []);

  return (
    <div className={cn("pointer-events-auto absolute inset-0", className)}>
      {/* 卡通化的职业道具 SVG，放在场景前景；自身不拦截点击，让热点按钮优先响应 */}
      <div className="pointer-events-none absolute inset-0">
        <CartoonProps type={sceneType} accent={accent} scene={scene} />
      </div>

      {/* 探索提示 */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute left-1/2 top-[20%] z-20 -translate-x-1/2"
          >
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] backdrop-blur-md"
              style={{ borderColor: `${accent}30`, backgroundColor: "rgba(0,0,0,0.45)", color: accent }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: accent }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              </span>
              点击场景里的闪光图标，发现工作细节
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击波纹 */}
      <AnimatePresence>
        {pulses.map((p) => (
          <motion.span
            key={p.id}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute z-30 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ left: p.x, top: p.y, borderColor: accent, backgroundColor: `${accent}08` }}
          />
        ))}
      </AnimatePresence>

      {/* 可交互热点 */}
      {hotspots.map((spot, i) => (
        <motion.button
          key={i}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: spot.x, top: spot.y }}
          onClick={() => handleHotspot(i, spot.x, spot.y)}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={spot.label}
        >
          {/* 呼吸光环 */}
          <span
            className="absolute -inset-2 rounded-full opacity-50 animate-ping"
            style={{ backgroundColor: `${accent}35` }}
          />
          <span
            className="absolute -inset-1 rounded-full opacity-30 animate-pulse"
            style={{ backgroundColor: `${accent}25` }}
          />
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-full border text-lg shadow-lg backdrop-blur-md transition-all duration-200 group-hover:shadow-xl"
            style={{ borderColor: `${accent}55`, backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            {spot.emoji}
          </span>
          <span className="absolute -bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[10px] text-white/80 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
            {spot.label}
          </span>
        </motion.button>
      ))}

      {/* 详情弹窗（放在顶部中央，避免与底部叙事卡片重叠） */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-1/2 top-[14%] z-50 w-[min(320px,90vw)] -translate-x-1/2 rounded-2xl border p-4 text-left shadow-2xl backdrop-blur-xl"
            style={{ borderColor: `${accent}35`, backgroundColor: "rgba(8,12,28,0.95)" }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">{hotspots[active].emoji}</span>
              <span className="font-display text-sm font-bold text-white/90">{hotspots[active].label}</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">{hotspots[active].detail}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-white/30">按 ESC 或再次点击关闭</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   CartoonProps: 每个场景的卡通化核心道具 + 人物
   ================================================================ */

function CartoonProps({ type, accent, scene }: { type: string; accent: string; scene: WorkScene }) {
  void scene;
  switch (type) {
    case "office":
      return <OfficeProps accent={accent} />;
    case "lab":
      return <LabProps accent={accent} />;
    case "cafe":
      return <CafeProps accent={accent} />;
    case "home":
      return <HomeProps accent={accent} />;
    case "meeting":
      return <MeetingProps accent={accent} />;
    case "outdoor":
      return <OutdoorProps accent={accent} />;
    case "studio":
      return <StudioProps accent={accent} />;
    case "factory":
      return <FactoryProps accent={accent} />;
    case "hospital":
      return <HospitalProps accent={accent} />;
    case "classroom":
      return <ClassroomProps accent={accent} />;
    case "courtroom":
      return <CourtroomProps accent={accent} />;
    case "construction":
      return <ConstructionProps accent={accent} />;
    default:
      return <OfficeProps accent={accent} />;
  }
}

/* ---------- 通用小工人 ---------- */
function TinyWorker({ x, y, color, anim = "type", scale = 1 }: { x: number | string; y: number | string; color: string; anim?: "type" | "stand" | "walk" | "sit"; scale?: number | string }) {
  const nx = typeof x === "string" ? parseFloat(x) : x;
  const ny = typeof y === "string" ? parseFloat(y) : y;
  const ns = typeof scale === "string" ? parseFloat(scale) : scale;
  return (
    <g transform={`translate(${nx},${ny}) scale(${ns})`}>
      {/* 头 */}
      <circle cx="0" cy="-18" r="6" fill={color} opacity="0.7" />
      {/* 身体 */}
      <rect x="-5" y="-12" width="10" height="14" rx="3" fill={color} opacity="0.55" />
      {/* 手臂动画 */}
      {anim === "type" && (
        <>
          <rect x="-12" y="-10" width="6" height="4" rx="2" fill={color} opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" values="-10 0 -8;10 0 -8;-10 0 -8" dur="0.6s" repeatCount="indefinite" />
          </rect>
          <rect x="6" y="-10" width="6" height="4" rx="2" fill={color} opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" values="10 0 -8;-10 0 -8;10 0 -8" dur="0.6s" repeatCount="indefinite" />
          </rect>
        </>
      )}
      {anim === "walk" && (
        <>
          <rect x="-4" y="2" width="3" height="10" rx="1.5" fill={color} opacity="0.45">
            <animateTransform attributeName="transform" type="rotate" values="-20 0 2;20 0 2;-20 0 2" dur="0.8s" repeatCount="indefinite" />
          </rect>
          <rect x="1" y="2" width="3" height="10" rx="1.5" fill={color} opacity="0.45">
            <animateTransform attributeName="transform" type="rotate" values="20 0 2;-20 0 2;20 0 2" dur="0.8s" repeatCount="indefinite" />
          </rect>
        </>
      )}
      {anim === "sit" && (
        <>
          <rect x="-10" y="-8" width="6" height="4" rx="2" fill={color} opacity="0.45" />
          <rect x="4" y="-8" width="6" height="4" rx="2" fill={color} opacity="0.45" />
          <rect x="-4" y="2" width="8" height="8" rx="3" fill={color} opacity="0.45" />
        </>
      )}
      {anim === "stand" && (
        <>
          <rect x="-4" y="2" width="3" height="10" rx="1.5" fill={color} opacity="0.45" />
          <rect x="1" y="2" width="3" height="10" rx="1.5" fill={color} opacity="0.45" />
        </>
      )}
    </g>
  );
}

/* ---------- 办公室 ---------- */
function OfficeProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* 背景工位隔板 */}
      <rect x="20" y="40" width="360" height="100" rx="4" fill="rgba(255,255,255,0.03)" />
      <line x1="140" y1="40" x2="140" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="260" y1="40" x2="260" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {/* 主办公桌 */}
      <rect x="50" y="95" width="300" height="14" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="60" y="109" width="10" height="55" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="330" y="109" width="10" height="55" rx="2" fill="rgba(255,255,255,0.06)" />

      {/* 主显示器 */}
      <rect x="110" y="55" width="85" height="55" rx="4" fill="rgba(20,28,45,0.6)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="115" y="60" width="75" height="45" rx="2" fill="url(#screenGlow)" />
      <rect x="120" y="66" width="35" height="4" rx="1" fill="rgba(255,255,255,0.4)" />
      <rect x="120" y="75" width="55" height="3" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="120" y="83" width="45" height="3" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="148" y="110" width="10" height="8" rx="1" fill="rgba(255,255,255,0.1)" />

      {/* 副屏 */}
      <rect x="205" y="65" width="55" height="40" rx="3" fill="rgba(20,28,45,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="210" y="70" width="45" height="30" rx="2" fill="url(#screenGlow)" opacity="0.6" />
      <rect x="215" y="75" width="30" height="2.5" rx="1" fill="rgba(255,255,255,0.2)" />

      {/* 键盘 + 鼠标 */}
      <rect x="125" y="120" width="65" height="12" rx="2" fill="rgba(255,255,255,0.08)" />
      <ellipse cx="205" cy="125" rx="6" ry="4" fill="rgba(255,255,255,0.08)" />

      {/* 咖啡杯 */}
      <rect x="280" y="98" width="16" height="20" rx="3" fill="rgba(255,255,255,0.12)" />
      <path d="M296 104 Q303 104 303 111 Q303 118 296 118" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <circle cx="288" cy="92" r="3" fill="rgba(255,255,255,0.25)">
        <animate attributeName="cy" values="92;82" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="1.4s" repeatCount="indefinite" />
      </circle>

      {/* 台灯 */}
      <path d="M335 102 L345 78 L365 70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="370" cy="66" rx="12" ry="7" fill="rgba(255,220,150,0.2)" />
      <polygon points="358,102 380,102 385,95 353,95" fill="rgba(255,255,255,0.04)" />

      {/* 打工人 1（主位） */}
      <TinyWorker x="155" y="95" color={accent} anim="type" scale="1.1" />
      {/* 打工人 2（远处） */}
      <TinyWorker x="75" y="90" color="#94a3b8" anim="stand" scale="0.9" />
      {/* 打工人 3（走动） */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="320 0;290 0;320 0" dur="6s" repeatCount="indefinite" />
        <TinyWorker x="0" y="95" color="#94a3b8" anim="walk" scale="0.85" />
      </g>
    </svg>
  );
}

/* ---------- 实验室 ---------- */
function LabProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 实验台 */}
      <rect x="30" y="100" width="340" height="14" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="40" y="114" width="12" height="55" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="348" y="114" width="12" height="55" rx="2" fill="rgba(255,255,255,0.06)" />

      {/* 显微镜 */}
      <rect x="70" y="82" width="10" height="18" rx="1" fill="rgba(255,255,255,0.12)" />
      <rect x="64" y="78" width="22" height="7" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="74" y="55" width="2" height="23" fill="rgba(255,255,255,0.1)" />
      <circle cx="75" cy="50" r="7" fill="rgba(100,200,255,0.2)" />
      {/* 扫描线 */}
      <line x1="55" y1="50" x2="95" y2="50" stroke={accent} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 2">
        <animate attributeName="y1" values="45;55;45" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y2" values="45;55;45" dur="2s" repeatCount="indefinite" />
      </line>

      {/* 试管架 */}
      <rect x="125" y="85" width="50" height="15" rx="2" fill="rgba(255,255,255,0.08)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={130 + i * 12} y="62" width="7" height="28" rx="3.5" fill={`rgba(${i % 2 === 0 ? "100,200,255" : "100,255,150"},0.25)`} stroke="rgba(255,255,255,0.12)" />
          <circle cx={133.5 + i * 12} cy="58" r="2.5" fill="rgba(255,255,255,0.35)">
            <animate attributeName="cy" values={`58;${48 + i}`} dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
          </circle>
          <rect x={131 + i * 12} y="68" width="5" height="18" rx="2" fill={`rgba(${i % 2 === 0 ? "100,200,255" : "100,255,150"},0.35)`}>
            <animate attributeName="height" values="18;16;18" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            <animate attributeName="y" values="68;70;68" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
          </rect>
        </g>
      ))}

      {/* 记录本 */}
      <rect x="195" y="108" width="40" height="12" rx="1" fill="rgba(255,255,255,0.07)" />
      <line x1="200" y1="112" x2="230" y2="112" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="200" y1="116" x2="225" y2="116" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* 烧杯 */}
      <path d="M255 100 L255 70 Q255 68 257 68 L277 68 Q279 68 279 70 L279 100 Q279 105 267 105 Q255 105 255 100" fill="rgba(255,200,100,0.15)" stroke="rgba(255,255,255,0.12)" />
      <rect x="260" y="80" width="14" height="18" fill="rgba(255,150,50,0.3)">
        <animate attributeName="height" values="18;15;18" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y" values="80;83;80" dur="2s" repeatCount="indefinite" />
      </rect>

      {/* 服务器机柜 */}
      <rect x="320" y="45" width="55" height="75" rx="3" fill="rgba(30,40,60,0.5)" stroke="rgba(255,255,255,0.1)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="325" y={52 + i * 12} width="45" height="8" rx="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="360" cy={56 + i * 12} r="2" fill={accent} opacity="0.6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur={`${0.8 + i * 0.15}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* 研究员 */}
      <TinyWorker x="160" y="100" color={accent} anim="type" scale="1.05" />
      <TinyWorker x="310" y="100" color="#94a3b8" anim="stand" scale="0.9" />
    </svg>
  );
}

/* ---------- 咖啡厅 ---------- */
function CafeProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 吧台 */}
      <rect x="30" y="80" width="110" height="70" rx="4" fill="rgba(120,90,70,0.35)" stroke="rgba(255,255,255,0.08)" />
      <rect x="40" y="90" width="90" height="45" rx="2" fill="rgba(255,255,255,0.04)" />

      {/* 咖啡机 */}
      <rect x="50" y="55" width="55" height="55" rx="5" fill="rgba(80,60,50,0.5)" stroke="rgba(255,255,255,0.1)" />
      <rect x="60" y="65" width="35" height="22" rx="3" fill="rgba(255,255,255,0.08)" />
      <circle cx="77" cy="102" r="7" fill="rgba(255,255,255,0.1)" />
      <rect x="70" y="92" width="14" height="10" rx="3" fill="rgba(120,80,50,0.4)" />
      {/* 蒸汽 */}
      <path d="M74 88 Q78 80 74 72" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="d" values="M74 88 Q78 80 74 72;M74 86 Q70 78 74 70;M74 88 Q78 80 74 72" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </path>

      {/* 咖啡师 */}
      <TinyWorker x="95" y="80" color="#d4a373" anim="stand" scale="0.95" />

      {/* 小圆桌 */}
      <ellipse cx="175" cy="125" rx="50" ry="14" fill="rgba(255,255,255,0.07)" />
      <rect x="170" y="125" width="10" height="40" fill="rgba(255,255,255,0.05)" />

      {/* 笔记本 */}
      <rect x="150" y="112" width="40" height="10" rx="1" fill="rgba(255,255,255,0.06)" transform="rotate(-5 170 117)" />
      {/* 咖啡杯 */}
      <rect x="200" y="108" width="16" height="14" rx="3" fill="rgba(255,255,255,0.12)" />
      <circle cx="208" cy="102" r="2.5" fill="rgba(255,255,255,0.25)">
        <animate attributeName="cy" values="102;92" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* 自由职业者 */}
      <TinyWorker x="165" y="112" color={accent} anim="type" scale="1.05" />

      {/* 菜单黑板 */}
      <rect x="280" y="50" width="75" height="85" rx="4" fill="rgba(30,25,20,0.6)" stroke="rgba(255,255,255,0.1)" />
      <line x1="292" y1="72" x2="343" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <line x1="292" y1="84" x2="330" y2="84" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <line x1="292" y1="96" x2="338" y2="96" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <line x1="292" y1="108" x2="322" y2="108" stroke={accent} strokeWidth="2" strokeOpacity="0.4" />
    </svg>
  );
}

/* ---------- 居家办公 ---------- */
function HomeProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 书桌 */}
      <rect x="70" y="100" width="260" height="14" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="80" y="114" width="10" height="55" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="310" y="114" width="10" height="55" rx="2" fill="rgba(255,255,255,0.06)" />

      {/* 显示器 */}
      <rect x="150" y="55" width="90" height="58" rx="4" fill="rgba(40,50,70,0.55)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="190" y="113" width="10" height="8" rx="1" fill="rgba(255,255,255,0.1)" />
      <rect x="158" y="62" width="74" height="5" rx="1" fill={accent} opacity="0.4" />
      <rect x="158" y="73" width="45" height="3.5" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="158" y="82" width="58" height="3.5" rx="1" fill="rgba(255,255,255,0.16)" />

      {/* 键盘 */}
      <rect x="165" y="125" width="70" height="12" rx="2" fill="rgba(255,255,255,0.08)" />
      {/* 鼠标 */}
      <ellipse cx="255" cy="130" rx="7" ry="5" fill="rgba(255,255,255,0.08)" />

      {/* 咖啡 */}
      <rect x="265" y="102" width="16" height="18" rx="3" fill="rgba(255,255,255,0.12)" />
      <circle cx="273" cy="95" r="3" fill="rgba(255,255,255,0.25)">
        <animate attributeName="cy" values="95;85" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* 绿植 */}
      <rect x="90" y="105" width="18" height="20" rx="4" fill="rgba(120,80,40,0.35)" />
      <ellipse cx="99" cy="98" rx="14" ry="17" fill="rgba(80,180,80,0.25)">
        <animate attributeName="ry" values="17;18;17" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* 猫 */}
      <g transform="translate(325,128)">
        <ellipse cx="0" cy="0" rx="20" ry="14" fill="rgba(255,200,100,0.25)" />
        <circle cx="-8" cy="-16" r="10" fill="rgba(255,200,100,0.25)" />
        <path d="M-16 -22 L-12 -12 L-20 -12 Z" fill="rgba(255,200,100,0.25)" />
        <path d="M0 -22 L-4 -12 L4 -12 Z" fill="rgba(255,200,100,0.25)" />
        <ellipse cx="5" cy="5" rx="4" ry="10" fill="rgba(255,200,100,0.25)">
          <animate attributeName="ry" values="10;12;10" dur="1.2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="-5" cy="5" rx="4" ry="10" fill="rgba(255,200,100,0.25)">
          <animate attributeName="ry" values="10;12;10" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
        </ellipse>
      </g>

      {/* 你 */}
      <TinyWorker x="195" y="100" color={accent} anim="type" scale="1.1" />
    </svg>
  );
}

/* ---------- 会议室 ---------- */
function MeetingProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[8%] left-[3%] h-[40%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 会议桌 */}
      <ellipse cx="200" cy="120" rx="150" ry="30" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.1)" />

      {/* 椅子 + 人 */}
      {[
        { x: 90, anim: "sit" as const, color: accent },
        { x: 150, anim: "sit" as const, color: "#94a3b8" },
        { x: 250, anim: "sit" as const, color: "#94a3b8" },
        { x: 310, anim: "sit" as const, color: "#94a3b8" },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x}, 120)`}>
          <rect x="-12" y="-25" width="24" height="35" rx="5" fill="rgba(255,255,255,0.05)" />
          <TinyWorker x={0} y={-5} color={c.color} anim={c.anim} scale={0.95} />
        </g>
      ))}

      {/* 投影仪 */}
      <rect x="30" y="55" width="55" height="35" rx="3" fill="rgba(40,50,70,0.5)" stroke="rgba(255,255,255,0.1)" />
      <circle cx="57" cy="72" r="9" fill="rgba(255,255,255,0.1)" />
      <path d="M85 72 L130 95" stroke={accent} strokeWidth="2" strokeOpacity="0.35" strokeDasharray="4 2">
        <animate attributeName="stroke-dashoffset" values="0;12" dur="1s" repeatCount="indefinite" />
      </path>

      {/* 投影画面 */}
      <ellipse cx="170" cy="112" rx="35" ry="12" fill="rgba(255,255,255,0.05)" />
      <rect x="150" y="106" width="20" height="5" rx="1" fill={accent} opacity="0.3" />
      <rect x="150" y="113" width="35" height="3" rx="1" fill="rgba(255,255,255,0.15)" />

      {/* 白板 */}
      <rect x="300" y="40" width="80" height="65" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <rect x="310" y="52" width="28" height="8" rx="1" fill="rgba(255,100,100,0.25)" />
      <rect x="310" y="65" width="45" height="5" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="310" y="76" width="35" height="5" rx="1" fill={accent} opacity="0.3" />

      {/* 水杯 */}
      <rect x="180" y="110" width="8" height="12" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="220" y="110" width="8" height="12" rx="1" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

/* ---------- 户外 ---------- */
function OutdoorProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[44%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 地面 */}
      <rect x="0" y="140" width="400" height="40" fill="rgba(255,255,255,0.03)" />

      {/* 长椅 */}
      <rect x="60" y="125" width="110" height="12" rx="3" fill="rgba(120,80,40,0.35)" />
      <rect x="75" y="137" width="8" height="30" fill="rgba(120,80,40,0.28)" />
      <rect x="147" y="137" width="8" height="30" fill="rgba(120,80,40,0.28)" />

      {/* 公文包 */}
      <rect x="110" y="108" width="34" height="22" rx="4" fill="rgba(100,70,40,0.35)" />
      <path d="M122 108 L122 100 Q122 98 124 98 L130 98 Q132 98 132 100 L132 108" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

      {/* 人坐长椅 */}
      <TinyWorker x="95" y="125" color={accent} anim="sit" scale="1.05" />

      {/* 手机 */}
      <rect x="200" y="125" width="18" height="30" rx="3" fill="rgba(30,30,40,0.55)" stroke="rgba(255,255,255,0.12)" />
      <rect x="205" y="132" width="8" height="14" rx="1" fill="rgba(255,255,255,0.18)" />
      <circle cx="208" cy="128" r="1.5" fill="rgba(255,255,255,0.2)" />

      {/* 单车 */}
      <g transform="translate(300, 135)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle cx="45" cy="0" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <path d="M0 0 L20 -18 L35 -18 L45 0 M20 -18 L15 -32 L25 -32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* 树 */}
      <rect x="35" y="95" width="10" height="55" rx="3" fill="rgba(80,50,30,0.35)" />
      <circle cx="40" cy="80" r="32" fill="rgba(80,180,80,0.18)">
        <animate attributeName="r" values="32;33;32" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* 走路的人 */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="350 0;370 0;350 0" dur="8s" repeatCount="indefinite" />
        <TinyWorker x="0" y="140" color="#94a3b8" anim="walk" scale="0.9" />
      </g>
    </svg>
  );
}

/* ---------- 工作室 ---------- */
function StudioProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 画板/数位板 */}
      <rect x="100" y="65" width="110" height="75" rx="5" fill="rgba(40,40,50,0.5)" stroke="rgba(255,255,255,0.1)" transform="rotate(-5 155 102)" />
      <rect x="115" y="80" width="80" height="50" rx="3" fill="rgba(255,255,255,0.05)" transform="rotate(-5 155 102)" />
      <path d="M120 90 Q145 110 165 85 Q180 120 200 95" fill="none" stroke={accent} strokeWidth="2.5" strokeOpacity="0.45" transform="rotate(-5 155 102)" />

      {/* 画笔 */}
      <rect x="230" y="100" width="7" height="45" rx="3" fill="rgba(255,255,255,0.12)" transform="rotate(15 233 122)" />

      {/* 色板 */}
      <ellipse cx="300" cy="120" rx="30" ry="14" fill="rgba(255,255,255,0.07)" />
      {["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", accent].map((c, i) => (
        <circle key={i} cx={285 + i * 8} cy="120" r="5" fill={c} opacity="0.55" />
      ))}

      {/* 相机 */}
      <rect x="45" y="105" width="40" height="28" rx="5" fill="rgba(40,40,50,0.5)" stroke="rgba(255,255,255,0.1)" />
      <circle cx="65" cy="119" r="9" fill="rgba(255,255,255,0.1)" />
      <circle cx="65" cy="119" r="5" fill="rgba(100,200,255,0.25)" />

      {/* 情绪板 */}
      <rect x="35" y="45" width="75" height="55" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <rect x="42" y="52" width="20" height="15" rx="1" fill="rgba(255,100,100,0.2)" />
      <rect x="66" y="55" width="20" height="12" rx="1" fill="rgba(100,200,255,0.2)" />
      <rect x="48" y="72" width="25" height="18" rx="1" fill={accent} opacity="0.2" />

      {/* 设计师 */}
      <TinyWorker x="155" y="70" color={accent} anim="stand" scale="1.05" />
    </svg>
  );
}

/* ---------- 工厂 ---------- */
function FactoryProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 传送带 */}
      <rect x="25" y="115" width="350" height="16" rx="3" fill="rgba(80,80,90,0.45)" />
      <line x1="25" y1="123" x2="375" y2="123" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="10 5">
        <animate attributeName="stroke-dashoffset" values="0;30" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* 箱子 */}
      {[40, 110, 180, 250, 320].map((x, i) => (
        <g key={i}>
          <animateTransform attributeName="transform" type="translate" values={`0 0;-40 0;0 0`} dur={`${2 + i * 0.15}s`} repeatCount="indefinite" />
          <rect x={x} y="88" width="34" height="30" rx="2" fill={`rgba(${150 + i * 20},${120 + i * 15},${100 + i * 25},0.3)`} stroke="rgba(255,255,255,0.08)" />
        </g>
      ))}

      {/* 机械臂 */}
      <rect x="310" y="50" width="10" height="65" rx="3" fill="rgba(255,180,50,0.3)" />
      <rect x="304" y="44" width="22" height="10" rx="3" fill="rgba(255,180,50,0.35)" />
      <line x1="315" y1="50" x2="275" y2="85" stroke="rgba(255,180,50,0.3)" strokeWidth="6" strokeLinecap="round">
        <animate attributeName="x2" values="275;265;275" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y2" values="85;95;85" dur="2s" repeatCount="indefinite" />
      </line>
      <circle cx="270" cy="90" r="6" fill="rgba(255,180,50,0.4)" />

      {/* 警示灯 */}
      <circle cx="60" cy="55" r="7" fill="rgba(255,80,50,0.45)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.7s" repeatCount="indefinite" />
      </circle>

      {/* 工人 */}
      <TinyWorker x="90" y="115" color={accent} anim="stand" scale="1.05" />
      <TinyWorker x="220" y="115" color="#94a3b8" anim="walk" scale="0.95" />

      {/* 控制面板 */}
      <rect x="340" y="55" width="55" height="60" rx="3" fill="rgba(30,40,60,0.5)" stroke="rgba(255,255,255,0.1)" />
      <rect x="348" y="65" width="20" height="8" rx="1" fill={accent} opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="348" y="78" width="20" height="8" rx="1" fill="rgba(255,80,50,0.4)">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ---------- 医院 ---------- */
function HospitalProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 病床 */}
      <rect x="100" y="100" width="150" height="18" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" />
      <rect x="115" y="86" width="35" height="22" rx="10" fill="rgba(255,255,255,0.1)" />
      <rect x="155" y="95" width="80" height="15" rx="3" fill="rgba(100,180,255,0.15)" />

      {/* 输液架 */}
      <rect x="55" y="45" width="4" height="95" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="45" y="45" width="24" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="78" y="78" width="14" height="22" rx="3" fill="rgba(200,230,255,0.2)" />
      <circle cx="85" cy="103" r="2" fill="rgba(200,230,255,0.5)">
        <animate attributeName="cy" values="103;125" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* 监护仪 */}
      <rect x="280" y="70" width="70" height="48" rx="4" fill="rgba(30,40,60,0.55)" stroke="rgba(255,255,255,0.1)" />
      <path d="M288 94 L298 94 L303 78 L310 100 L320 88 L330 94 L342 94" fill="none" stroke="#00ff88" strokeWidth="2" strokeOpacity="0.5">
        <animate attributeName="d" values="M288 94 L298 94 L303 78 L310 100 L320 88 L330 94 L342 94;M288 94 L298 94 L303 100 L310 78 L320 94 L330 84 L342 94;M288 94 L298 94 L303 78 L310 100 L320 88 L330 94 L342 94" dur="1s" repeatCount="indefinite" />
      </path>
      <text x="292" y="85" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">HR 72</text>

      {/* 药盘 */}
      <rect x="295" y="125" width="35" height="10" rx="2" fill="rgba(255,255,255,0.07)" />
      <circle cx="305" cy="130" r="3" fill="rgba(255,100,100,0.35)" />
      <circle cx="315" cy="130" r="3" fill="rgba(100,200,255,0.35)" />
      <circle cx="325" cy="130" r="3" fill="rgba(255,200,100,0.35)" />

      {/* 护士 */}
      <TinyWorker x="245" y="100" color={accent} anim="stand" scale="1.05" />
    </svg>
  );
}

/* ---------- 教室 ---------- */
function ClassroomProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 黑板 */}
      <rect x="25" y="40" width="130" height="80" rx="4" fill="rgba(30,50,30,0.55)" stroke="rgba(255,255,255,0.1)" />
      <text x="40" y="68" fill="rgba(255,255,255,0.3)" fontSize="12" fontFamily="monospace">E=mc²</text>
      <line x1="40" y1="85" x2="130" y2="85" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <line x1="40" y1="98" x2="115" y2="98" stroke={accent} strokeWidth="2" strokeOpacity="0.4" />

      {/* 讲台 */}
      <rect x="60" y="125" width="60" height="28" rx="3" fill="rgba(120,80,40,0.3)" />
      <rect x="70" y="118" width="40" height="10" rx="2" fill="rgba(120,80,40,0.25)" />

      {/* 老师 */}
      <TinyWorker x="90" y="125" color={accent} anim="stand" scale="1.05" />

      {/* 课桌 */}
      {[170, 245, 320].map((x, i) => (
        <g key={i}>
          <rect x={x} y="118" width="60" height="12" rx="2" fill="rgba(255,255,255,0.07)" />
          <rect x={x + 8} y="130" width="6" height="28" fill="rgba(255,255,255,0.04)" />
          <rect x={x + 46} y="130" width="6" height="28" fill="rgba(255,255,255,0.04)" />
          {/* 学生 */}
          <TinyWorker x={x + 30} y="118" color="#94a3b8" anim="sit" scale="0.85" />
        </g>
      ))}

      {/* 书本 */}
      <rect x="180" y="110" width="20" height="9" rx="1" fill="rgba(255,100,100,0.2)" />
      <rect x="260" y="110" width="18" height="9" rx="1" fill="rgba(100,200,255,0.2)" />

      {/* 苹果 */}
      <circle cx="105" cy="115" r="7" fill="rgba(255,80,80,0.3)" />

      {/* 投影仪 */}
      <rect x="300" y="45" width="55" height="35" rx="3" fill="rgba(40,50,70,0.45)" stroke="rgba(255,255,255,0.1)" />
      <circle cx="327" cy="62" r="8" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

/* ---------- 法庭 ---------- */
function CourtroomProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[42%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 法官席 */}
      <rect x="130" y="55" width="140" height="55" rx="4" fill="rgba(120,80,40,0.3)" stroke="rgba(255,255,255,0.08)" />
      <rect x="150" y="75" width="100" height="10" rx="2" fill="rgba(255,255,255,0.06)" />

      {/* 法槌 */}
      <g transform="translate(245, 65) rotate(-20)">
        <rect x="0" y="0" width="8" height="22" rx="2" fill="rgba(120,80,40,0.45)" />
        <rect x="-5" y="-6" width="22" height="9" rx="2" fill="rgba(120,80,40,0.5)" />
        <animateTransform attributeName="transform" type="rotate" values="-20 4 22;-5 4 22;-20 4 22" dur="3s" repeatCount="indefinite" />
      </g>

      {/* 法官 */}
      <TinyWorker x="200" y="55" color={accent} anim="stand" scale="1.1" />

      {/* 原告/被告桌 */}
      <rect x="35" y="120" width="90" height="18" rx="3" fill="rgba(120,80,40,0.18)" />
      <rect x="275" y="120" width="90" height="18" rx="3" fill="rgba(120,80,40,0.18)" />

      {/* 律师 */}
      <TinyWorker x="80" y="120" color="#94a3b8" anim="sit" scale="0.95" />
      <TinyWorker x="320" y="120" color="#94a3b8" anim="sit" scale="0.95" />

      {/* 天平 */}
      <rect x="360" y="50" width="3" height="60" rx="1" fill="rgba(255,200,100,0.25)" />
      <line x1="335" y1="62" x2="388" y2="62" stroke="rgba(255,200,100,0.25)" strokeWidth="2" />
      <path d="M335 62 L330 78 M340 62 L345 78" stroke="rgba(255,200,100,0.25)" strokeWidth="2" />
      <path d="M388 62 L383 78 M393 62 L398 78" stroke="rgba(255,200,100,0.25)" strokeWidth="2" />
      <circle cx="361.5" cy="50" r="6" fill="rgba(255,200,100,0.18)" />

      {/* 文件 */}
      <rect x="50" y="112" width="25" height="10" rx="1" fill="rgba(255,255,255,0.06)" />
      <rect x="295" y="112" width="25" height="10" rx="1" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

/* ---------- 建筑工地 ---------- */
function ConstructionProps({ accent }: { accent: string }) {
  return (
    <svg className="absolute bottom-[6%] left-[3%] h-[44%] w-[94%]" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet">
      {/* 塔吊 */}
      <rect x="190" y="25" width="8" height="140" rx="3" fill="rgba(255,180,50,0.3)" />
      <rect x="120" y="25" width="160" height="8" rx="3" fill="rgba(255,180,50,0.3)" />
      <line x1="278" y1="33" x2="278" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="270" y="85" width="20" height="15" rx="2" fill="rgba(255,180,50,0.25)">
        <animateTransform attributeName="transform" type="translate" values="0 0;-50 0;0 0" dur="5s" repeatCount="indefinite" />
      </rect>

      {/* 钢梁 */}
      <rect x="30" y="130" width="130" height="10" rx="2" fill="rgba(80,80,90,0.35)" />
      <rect x="240" y="130" width="130" height="10" rx="2" fill="rgba(80,80,90,0.35)" />
      <rect x="95" y="105" width="8" height="30" rx="2" fill="rgba(80,80,90,0.35)" />
      <rect x="300" y="105" width="8" height="30" rx="2" fill="rgba(80,80,90,0.35)" />

      {/* 安全帽 */}
      <ellipse cx="70" cy="160" rx="22" ry="12" fill="rgba(255,220,50,0.28)" />
      <rect x="52" y="153" width="36" height="6" rx="2" fill="rgba(255,220,50,0.22)" />

      {/* 蓝图 */}
      <rect x="300" y="155" width="45" height="25" rx="2" fill="rgba(100,150,220,0.25)" transform="rotate(5 322 167)" />
      <line x1="308" y1="162" x2="338" y2="162" stroke="rgba(255,255,255,0.18)" strokeWidth="1" transform="rotate(5 322 167)" />
      <line x1="308" y1="170" x2="332" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="1" transform="rotate(5 322 167)" />

      {/* 砖块堆 */}
      <rect x="140" y="165" width="25" height="15" rx="2" fill="rgba(180,80,40,0.28)" />
      <rect x="167" y="165" width="25" height="15" rx="2" fill="rgba(180,80,40,0.22)" />
      <rect x="154" y="150" width="25" height="15" rx="2" fill="rgba(180,80,40,0.25)" />

      {/* 工人 */}
      <TinyWorker x="220" y="130" color={accent} anim="stand" scale="1.05" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;30 0;0 0" dur="6s" repeatCount="indefinite" />
        <TinyWorker x="120" y="130" color="#94a3b8" anim="walk" scale="0.95" />
      </g>
    </svg>
  );
}
