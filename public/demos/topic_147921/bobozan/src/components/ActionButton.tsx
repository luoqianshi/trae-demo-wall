import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ActionType, ACTIONS } from "@/logic/actions";

interface ActionButtonProps {
  action: ActionType;
  disabled?: boolean;
  onClick: (action: ActionType) => void;
  bloomUsed?: boolean;
  hp?: number;
}

const colorMap: Record<ActionType, string> = {
  charge: "from-amber-500/20 to-amber-700/10 border-amber-500/40 text-amber-300",
  normalAttack: "from-[#ff3b3b]/20 to-[#ff3b3b]/5 border-[#ff3b3b]/40 text-[#ff3b3b]",
  defend: "from-emerald-500/20 to-emerald-700/10 border-emerald-500/40 text-emerald-300",
  level2Attack: "from-[#ff3b3b]/30 to-[#ff3b3b]/10 border-[#ff3b3b]/60 text-[#ff3b3b]",
  level2Defend: "from-emerald-500/30 to-emerald-700/10 border-emerald-500/60 text-emerald-300",
  fireStyle: "from-orange-500/30 to-red-900/10 border-orange-500/60 text-orange-400",
  waterStyle: "from-blue-400/30 to-cyan-900/10 border-blue-400/60 text-blue-300",
  windStyle: "from-teal-400/30 to-teal-900/10 border-teal-400/60 text-teal-300",
  bloomTechnique: "from-pink-400/30 to-rose-900/10 border-pink-400/60 text-pink-300",
};

export function ActionButton({ action, disabled, onClick, bloomUsed, hp }: ActionButtonProps) {
  const def = ACTIONS[action];

  // 开花术特殊禁用逻辑
  let isDisabled = disabled;
  if (action === "bloomTechnique") {
    if (bloomUsed) isDisabled = true;
    if (hp !== undefined && hp < 3) isDisabled = true;
  }

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.04, y: -2 }}
      whileTap={isDisabled ? {} : { scale: 0.96 }}
      onClick={() => onClick(action)}
      disabled={isDisabled}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border bg-gradient-to-b px-3 py-3 shadow-lg transition-all",
        "backdrop-blur-sm",
        colorMap[action],
        isDisabled
          ? "cursor-not-allowed opacity-40 grayscale"
          : "hover:shadow-[0_0_20px_-5px_currentColor] hover:border-current",
      )}
    >
      <span className="text-base font-bold tracking-wider sm:text-lg">{def.name}</span>
      <span className="text-[10px] opacity-80">
        {action === "bloomTechnique" && bloomUsed
          ? "已使用"
          : action === "bloomTechnique" && hp !== undefined && hp < 3
            ? "HP不足"
            : def.description}
      </span>
    </motion.button>
  );
}