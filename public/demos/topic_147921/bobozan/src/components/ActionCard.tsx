import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ActionType, ACTIONS } from "@/logic/actions";

interface ActionCardProps {
  action: ActionType | null;
  revealed: boolean;
  side: "player" | "ai";
}

// 每个动作的静态 SVG 图标（无动画，性能友好）
function ChargeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#cg)" />
      <circle cx="32" cy="32" r="10" fill="none" stroke="#fcd34d" strokeWidth="2" opacity="0.8" />
      <path d="M30 18 L26 34 L32 34 L28 46 L38 30 L32 30 Z" fill="#fde047" stroke="#facc15" strokeWidth="0.5" />
      {/* 小粒子 */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={32 + Math.cos(i * Math.PI / 2) * 20} cy={32 + Math.sin(i * Math.PI / 2) * 20} r="1.5" fill="#fcd34d" />
      ))}
    </svg>
  );
}

function NormalAttackIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <path d="M16 48 L40 24 L44 28 L20 52 Z" fill="url(#sg)" stroke="#7f1d1d" strokeWidth="0.5" />
      <path d="M40 24 L48 16 L44 28 Z" fill="#fee2e2" opacity="0.8" />
      <rect x="13" y="49" width="8" height="4" rx="1" fill="#78716c" transform="rotate(-45 17 51)" />
      <circle cx="14" cy="54" r="3" fill="#a8a29e" />
      <path d="M20 12 Q30 20 44 16" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function DefendIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <linearGradient id="dhg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M32 10 L50 16 L50 34 Q50 46 32 54 Q14 46 14 34 L14 16 Z" fill="url(#dhg)" stroke="#064e3b" strokeWidth="1.5" />
      <path d="M32 20 L32 44 M22 32 L42 32" stroke="#d1fae5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 10 L50 16 L50 34 Q50 46 32 54 Q14 46 14 34 L14 16 Z" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function Level2AttackIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <linearGradient id="l2ag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
      </defs>
      <path d="M12 52 L40 24 L46 30 L18 56 Z" fill="url(#l2ag)" stroke="#7f1d1d" strokeWidth="1" />
      <path d="M40 24 L50 14 L46 30 Z" fill="#fee2e2" />
      <rect x="8" y="52" width="10" height="5" rx="1" fill="#52525b" transform="rotate(-45 13 54)" />
      <circle cx="8" cy="58" r="3.5" fill="#71717a" />
      <circle cx="40" cy="24" r="8" fill="none" stroke="#f87171" strokeWidth="2" opacity="0.5" />
      <text x="32" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" opacity="0.7">II</text>
    </svg>
  );
}

function Level2DefendIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <linearGradient id="l2dg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path d="M32 8 L52 14 L52 36 Q52 48 32 56 Q12 48 12 36 L12 14 Z" fill="url(#l2dg)" stroke="#064e3b" strokeWidth="2" />
      <path d="M32 14 L46 18 L46 34 Q46 44 32 50 Q18 44 18 34 L18 18 Z" fill="none" stroke="#d1fae5" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="5" fill="#34d399" stroke="#a7f3d0" strokeWidth="1" />
      <text x="32" y="36" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#064e3b">II</text>
    </svg>
  );
}

function FireStyleIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <radialGradient id="fg" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#fb923c" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
      <path d="M32 10 C24 20 20 28 22 38 C24 48 30 54 32 56 C34 54 40 48 42 38 C44 28 40 20 32 10 Z" fill="url(#fg)" />
      <path d="M32 22 C28 28 27 34 29 40 C30 44 32 48 32 48 C32 48 34 44 35 40 C37 34 36 28 32 22 Z" fill="#fef9c3" opacity="0.8" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={26 + i * 6} cy={14 + i * 2} r="1.5" fill="#fbbf24" />
      ))}
    </svg>
  );
}

function WaterStyleIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <radialGradient id="wg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="30" r="18" fill="url(#wg)" />
      <ellipse cx="26" cy="22" rx="6" ry="3" fill="#e0f2fe" opacity="0.7" />
      <path d="M32 44 Q28 52 32 56 Q36 52 32 44 Z" fill="#7dd3fc" opacity="0.6" />
      <circle cx="32" cy="30" r="22" fill="none" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function WindStyleIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <linearGradient id="wng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <path d="M32 12 Q42 16 42 26 Q42 34 36 34 Q40 28 34 24 Q28 22 32 12 Z" fill="url(#wng)" opacity="0.9" />
      <path d="M52 32 Q48 42 38 42 Q30 42 30 36 Q36 40 40 34 Q42 28 52 32 Z" fill="url(#wng)" opacity="0.7" />
      <path d="M32 52 Q22 48 22 38 Q22 30 28 30 Q24 36 30 40 Q36 42 32 52 Z" fill="url(#wng)" opacity="0.9" />
      <path d="M12 32 Q16 22 26 22 Q34 22 34 28 Q28 24 24 30 Q22 36 12 32 Z" fill="url(#wng)" opacity="0.7" />
      <circle cx="32" cy="32" r="5" fill="#0d9488" />
      <circle cx="32" cy="32" r="3" fill="#ccfbf1" />
    </svg>
  );
}

function BloomIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="50%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#be185d" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="32" cy="20" rx="6" ry="12" fill="url(#bg)" opacity="0.85" transform={`rotate(${angle} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="6" fill="#facc15" />
      <circle cx="32" cy="32" r="4" fill="#fde047" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={16 + i * 16} cy={50} rx="2" ry="4" fill="#f9a8d4" opacity="0.6" />
      ))}
    </svg>
  );
}

const iconMap: Record<ActionType, React.ReactNode> = {
  charge: <ChargeIcon />,
  normalAttack: <NormalAttackIcon />,
  defend: <DefendIcon />,
  level2Attack: <Level2AttackIcon />,
  level2Defend: <Level2DefendIcon />,
  fireStyle: <FireStyleIcon />,
  waterStyle: <WaterStyleIcon />,
  windStyle: <WindStyleIcon />,
  bloomTechnique: <BloomIcon />,
};

// 卡片边框配色
const cardBg = (action: ActionType) => {
  if (ACTIONS[action].isInstantKill) return "from-teal-900/40 to-[#0d1414] border-teal-500/30";
  if (ACTIONS[action].isSelfBuff) return "from-pink-900/30 to-[#1a0d14] border-pink-500/30";
  if (action === "fireStyle") return "from-orange-900/30 to-[#1a1008] border-orange-500/30";
  if (action === "waterStyle") return "from-blue-900/30 to-[#0a1018] border-blue-500/30";
  if (ACTIONS[action].isAttack) return "from-red-900/20 to-[#141010] border-red-500/20";
  if (action === "charge") return "from-amber-900/20 to-[#141008] border-amber-500/20";
  return "from-emerald-900/20 to-[#081410] border-emerald-500/20";
};

// ============================================================
// 出招特效
// ============================================================
function CastEffect({ action, side }: { action: ActionType; side: "player" | "ai" }) {
  const dir = side === "player" ? 1 : -1;

  if (ACTIONS[action].isAttack && !ACTIONS[action].isInstantKill) {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.4, 1] }}
      >
        <motion.div
          className="absolute"
          initial={{ x: -40 * dir, rotate: -30 * dir, opacity: 0 }}
          animate={{ x: 40 * dir, rotate: 30 * dir, opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80">
            <path d="M10 40 Q40 10 70 40" fill="none" stroke={ACTIONS[action].isSpecial ? "#fb923c" : "#f87171"} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <path d="M15 40 Q40 15 65 40" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </motion.div>
      </motion.div>
    );
  }

  if (ACTIONS[action].isInstantKill) {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.3, 1] }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-teal-400"
            initial={{ width: 20, height: 20, opacity: 0.8 }}
            animate={{ width: 120, height: 120, opacity: 0 }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute text-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0] }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-teal-300" style={{ filter: "drop-shadow(0 0 8px #2dd4bf)" }}>⟳</span>
        </motion.div>
      </motion.div>
    );
  }

  if (ACTIONS[action].isSelfBuff) {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.4, 1] }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <motion.div
            key={angle}
            className="absolute h-2 w-1 rounded-full bg-pink-400"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 40,
              y: Math.sin((angle * Math.PI) / 180) * 40,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    );
  }

  if (action === "charge") {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6 }}
      >
        {[0, 90, 180, 270].map((angle) => (
          <motion.div
            key={angle}
            className="absolute h-1.5 w-1.5 rounded-full bg-amber-400"
            initial={{
              x: Math.cos((angle * Math.PI) / 180) * 30,
              y: Math.sin((angle * Math.PI) / 180) * 30,
              opacity: 1,
            }}
            animate={{ x: 0, y: 0, opacity: 0, scale: [1, 0.3] }}
            transition={{ duration: 0.5, ease: "easeIn" }}
          />
        ))}
        <motion.div
          className="absolute rounded-full bg-amber-400/30"
          initial={{ width: 30, height: 30, opacity: 0 }}
          animate={{ width: [30, 50, 30], height: [30, 50, 30], opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.6, times: [0, 0.3, 1] }}
    >
      <motion.div
        className="absolute rounded-full border-2 border-emerald-400"
        initial={{ width: 20, height: 20, opacity: 0.8 }}
        animate={{ width: 60, height: 60, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ============================================================
// 主组件
// ============================================================
export function ActionCard({ action, revealed, side }: ActionCardProps) {
  const sideColor = side === "player" ? "#ff3b3b" : "#00e5ff";

  return (
    <div className="relative h-36 w-24">
      {/* 施法特效 */}
      <AnimatePresence>
        {revealed && action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20"
          >
            <CastEffect action={action} side={side} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 卡片本身：用 opacity/scale 而非 rotateY，避免 3D 渲染 bug */}
      <motion.div
        className={cn(
          "relative h-full w-full rounded-2xl border-2 bg-gradient-to-b shadow-2xl overflow-hidden",
          action && revealed ? cardBg(action) : "border-white/10 bg-[#1a1a1a]",
        )}
        animate={{ opacity: 1, scale: 1 }}
        initial={false}
        key={revealed ? "front" : "back"}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          {!revealed ? (
            /* 背面：未揭牌 */
            <motion.div
              key="back"
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#141414]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-4xl font-black opacity-30" style={{ color: sideColor }}>
                ?
              </div>
              {/* 流光 */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, transparent 30%, ${sideColor}15 50%, transparent 70%)`,
                  animation: "shimmer 2s linear infinite",
                }}
              />
            </motion.div>
          ) : (
            /* 正面：已揭牌 */
            <motion.div
              key="front"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {action ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center">
                    {iconMap[action]}
                  </div>
                  <span className="text-center text-xs font-bold text-[#f5f0e8]">
                    {ACTIONS[action].name}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 text-[9px] font-bold",
                      ACTIONS[action].isInstantKill
                        ? "bg-teal-500/20 text-teal-300"
                        : ACTIONS[action].isSelfBuff
                          ? "bg-pink-500/20 text-pink-300"
                          : ACTIONS[action].isSpecial
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-white/10 text-[#f5f0e8]/60",
                    )}
                  >
                    {ACTIONS[action].isInstantKill
                      ? "秒杀"
                      : ACTIONS[action].isSelfBuff
                        ? "分身"
                        : ACTIONS[action].isSpecial
                          ? "特殊"
                          : `L${ACTIONS[action].level}`}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#f5f0e8]/40">等待中</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}