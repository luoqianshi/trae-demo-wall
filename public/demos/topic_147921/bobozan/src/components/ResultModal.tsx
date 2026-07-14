import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Skull, Scale } from "lucide-react";

interface ResultModalProps {
  winner: "player" | "ai" | "draw";
  gameMode: "pve" | "pvp";
  onReset: () => void;
}

export function ResultModal({ winner, gameMode, onReset }: ResultModalProps) {
  const opponentName = gameMode === "pvp" ? "玩家2" : "AI";

  const config = {
    player: {
      icon: <Trophy className="h-12 w-12 text-[#ff3b3b]" />,
      title: "胜利",
      subtitle: gameMode === "pvp" ? "玩家1 获胜！" : `你击败了 ${opponentName}`,
      color: "text-[#ff3b3b]",
      border: "border-[#ff3b3b]/40",
      glow: "shadow-[#ff3b3b]/20",
    },
    ai: {
      icon: <Skull className="h-12 w-12 text-[#00e5ff]" />,
      title: "失败",
      subtitle: gameMode === "pvp" ? "玩家2 获胜！" : `你被 ${opponentName} 击败了`,
      color: "text-[#00e5ff]",
      border: "border-[#00e5ff]/40",
      glow: "shadow-[#00e5ff]/20",
    },
    draw: {
      icon: <Scale className="h-12 w-12 text-amber-300" />,
      title: "平局",
      subtitle: "双方同归于尽",
      color: "text-amber-300",
      border: "border-amber-300/40",
      glow: "shadow-amber-300/20",
    },
  }[winner];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={cn(
          "w-full max-w-sm rounded-3xl border bg-[#141414] p-8 text-center shadow-2xl",
          config.border,
          config.glow,
        )}
      >
        <div className="mb-4 flex justify-center">{config.icon}</div>
        <h2 className={cn("mb-2 text-4xl font-black", config.color)}>
          {config.title}
        </h2>
        <p className="mb-8 text-[#f5f0e8]/70">{config.subtitle}</p>
        <button
          onClick={onReset}
          className={cn(
            "w-full rounded-xl px-6 py-3 font-bold text-white transition-all hover:opacity-90",
            winner === "player" && "bg-[#ff3b3b]",
            winner === "ai" && "bg-[#00e5ff] text-black",
            winner === "draw" && "bg-amber-500",
          )}
        >
          再来一局
        </button>
      </motion.div>
    </motion.div>
  );
}