import { motion, AnimatePresence } from "framer-motion";
import { LogEntry } from "@/store/gameStore";
import { ACTIONS } from "@/logic/actions";

interface BattleLogProps {
  entries: LogEntry[];
}

export function BattleLog({ entries }: BattleLogProps) {
  return (
    <div className="flex h-48 flex-col rounded-2xl border border-white/10 bg-[#141414]/60 p-4 backdrop-blur-sm">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#f5f0e8]/50">
        战斗日志
      </h3>
      <div className="flex-1 overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#f5f0e8]/30">
              等待第一回合...
            </div>
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={`${entry.round}-${index}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 border-b border-white/5 pb-2 last:border-0"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-[#f5f0e8]/60">
                  <span>回合 {entry.round}</span>
                  <span className={entry.result.mistEffect ? "text-blue-300" : entry.result.playerDead || entry.result.aiDead ? "text-[#ff3b3b]" : "text-emerald-400"}>
                    {entry.result.description}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#ff3b3b]">
                    {ACTIONS[entry.playerAction].name}
                  </span>
                  <span className="text-[#f5f0e8]/30">VS</span>
                  <span className="font-medium text-[#00e5ff]">
                    {ACTIONS[entry.aiAction].name}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#f5f0e8]/40">
                  <span>HP: {entry.playerHpBefore}→{entry.playerHpBefore + entry.result.playerHpChange}</span>
                  <span>HP: {entry.aiHpBefore}→{entry.aiHpBefore + entry.result.aiHpChange}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}