import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heart, Copy } from "lucide-react";

interface EnergyRingProps {
  energy: number;
  hp: number;
  maxHp: number;
  clones: number;
  label: string;
  color: "red" | "cyan";
  pulse?: boolean;
}

export function EnergyRing({ energy, hp, maxHp, clones, label, color, pulse }: EnergyRingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const maxVisible = Math.max(5, energy);
  const offset = circumference - (Math.min(energy, maxVisible) / maxVisible) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            stroke="currentColor" strokeWidth="6"
            fill="transparent" className="text-white/10"
          />
          <motion.circle
            cx="50" cy="50" r={radius}
            stroke="currentColor" strokeWidth="6"
            fill="transparent" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className={cn(
              color === "red" ? "text-[#ff3b3b]" : "text-[#00e5ff]",
              pulse && "drop-shadow-[0_0_8px_currentColor]",
            )}
          />
        </svg>
        <motion.div
          key={energy}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={cn(
            "relative z-10 text-4xl font-bold tabular-nums",
            color === "red" ? "text-[#ff3b3b]" : "text-[#00e5ff]",
          )}
        >
          {energy}
        </motion.div>
        {pulse && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.6, repeat: 1 }}
            className={cn(
              "absolute inset-0 rounded-full",
              color === "red" ? "bg-[#ff3b3b]/20" : "bg-[#00e5ff]/20",
            )}
          />
        )}
      </div>

      {/* HP Hearts */}
      <div className="flex gap-0.5">
        {Array.from({ length: maxHp }).map((_, i) => (
          <motion.div
            key={i}
            animate={i < hp ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                i < hp
                  ? color === "red"
                    ? "fill-[#ff3b3b] text-[#ff3b3b]"
                    : "fill-[#00e5ff] text-[#00e5ff]"
                  : "text-white/20",
              )}
            />
          </motion.div>
        ))}
      </div>

      {/* Clone indicator */}
      {clones > 1 && (
        <div className="flex items-center gap-1">
          <Copy className={cn("h-3 w-3", color === "red" ? "text-[#ff3b3b]" : "text-[#00e5ff]")} />
          <span className={cn("text-xs font-bold", color === "red" ? "text-[#ff3b3b]" : "text-[#00e5ff]")}>
            x{clones}
          </span>
        </div>
      )}

      <span className="text-sm font-medium tracking-widest text-[#f5f0e8]/70 uppercase">
        {label}
      </span>
    </div>
  );
}