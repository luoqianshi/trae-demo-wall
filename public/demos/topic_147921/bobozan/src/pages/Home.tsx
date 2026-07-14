import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { RotateCcw, Users, Bot, Wifi, BookOpen, X } from "lucide-react";
import { EnergyRing } from "@/components/EnergyRing";
import { ActionButton } from "@/components/ActionButton";
import { ActionCard } from "@/components/ActionCard";
import { BattleLog } from "@/components/BattleLog";
import { ResultModal } from "@/components/ResultModal";
import { OnlineLobby } from "@/components/OnlineLobby";
import { ShakeWrapper } from "@/components/ShakeWrapper";
import { ACTION_ORDER, isActionValid } from "@/logic/actions";
import { useGameStore, type BotDifficulty } from "@/store/gameStore";

const INITIAL_HP = 3;

export default function Home() {
  const [showRules, setShowRules] = useState(false);
  const {
    round,
    playerEnergy,
    aiEnergy,
    playerHP,
    aiHP,
    playerClones,
    aiClones,
    playerBloomUsed,
    aiBloomUsed,
    playerAction,
    aiAction,
    phase,
    gameMode,
    onlinePhase,
    roomCode,
    onlineConnecting,
    opponentReady,
    winner,
    log,
    shake,
    mistEffect,
    selectAction,
    selectP2Action,
    setGameMode,
    setDifficulty,
    resetGame,
    onlineCreateRoom,
    onlineJoinRoom,
    onlineReplay,
    leaveOnline,
    botDifficulty,
  } = useGameStore();

  const revealed = phase === "reveal" || phase === "result";
  const isPvPPlayer2 = phase === "pvpPlayer2";
  const isOnlineLobby = gameMode === "online" && (onlinePhase === "lobby" || onlinePhase === "waiting");
  const isOnlineWaiting = gameMode === "online" && onlinePhase === "waitingAction";
  const isOnlineResult = gameMode === "online" && onlinePhase === "result";

  return (
    <ShakeWrapper shake={shake}>
      <div className="relative flex min-h-screen flex-col items-center px-4 py-6">
        {/* Header */}
        <header className="mb-4 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#f5f0e8]">
              蓄能对决
            </h1>
            <p className="text-xs text-[#f5f0e8]/50">
              预判 · 蓄力 · 一击必杀
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Selector */}
            <div className="flex rounded-xl border border-white/10 bg-[#141414]/60 p-1 backdrop-blur-sm">
              <button
                onClick={() => {
                  if (gameMode === "online") leaveOnline();
                  setGameMode("pve");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  gameMode === "pve"
                    ? "bg-[#ff3b3b]/20 text-[#ff3b3b]"
                    : "text-[#f5f0e8]/50 hover:text-[#f5f0e8]"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                PVE
              </button>
              <button
                onClick={() => {
                  if (gameMode === "online") leaveOnline();
                  setGameMode("pvp");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  gameMode === "pvp"
                    ? "bg-[#00e5ff]/20 text-[#00e5ff]"
                    : "text-[#f5f0e8]/50 hover:text-[#f5f0e8]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                PVP
              </button>
              <button
                onClick={() => setGameMode("online")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  gameMode === "online"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-[#f5f0e8]/50 hover:text-[#f5f0e8]"
                }`}
              >
                <Wifi className="h-3.5 w-3.5" />
                联机
              </button>
            </div>

            {/* Rules Button */}
            <button
              onClick={() => setShowRules(true)}
              className="rounded-xl border border-white/10 bg-[#141414]/60 p-3 text-[#f5f0e8]/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-[#f5f0e8]"
              title="游戏说明"
            >
              <BookOpen className="h-5 w-5" />
            </button>

            {/* PVE 难度选择 */}
            {gameMode === "pve" && (
              <select
                value={botDifficulty}
                onChange={(e) => setDifficulty(Number(e.target.value) as BotDifficulty)}
                className="rounded-xl border border-white/10 bg-[#141414]/60 px-3 py-2 text-xs font-bold text-[#f5f0e8] backdrop-blur-sm outline-none transition-colors hover:bg-white/10"
              >
                <option value={2}>简单</option>
                <option value={4}>中等</option>
                <option value={6}>困难</option>
              </select>
            )}

            {gameMode !== "online" && (
              <>
                <div className="rounded-xl border border-white/10 bg-[#141414]/60 px-4 py-2 text-center backdrop-blur-sm">
                  <div className="text-xs text-[#f5f0e8]/50">回合</div>
                  <div className="text-xl font-bold text-[#f5f0e8]">{round}</div>
                </div>
                <button
                  onClick={resetGame}
                  className="rounded-xl border border-white/10 bg-[#141414]/60 p-3 text-[#f5f0e8]/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-[#f5f0e8]"
                  title="重新开始"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Online Lobby */}
        {isOnlineLobby && (
          <div className="flex flex-1 items-center justify-center">
            <OnlineLobby
              connecting={onlineConnecting}
              roomCode={roomCode}
              onCreateRoom={onlineCreateRoom}
              onJoinRoom={onlineJoinRoom}
              onBack={leaveOnline}
            />
          </div>
        )}

        {/* Online Game UI */}
        {gameMode === "online" && !isOnlineLobby && (
          <>
            {/* PvP Player 2 Selection Overlay */}
            <AnimatePresence>
              {isPvPPlayer2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="text-center"
                  >
                    <h2 className="mb-2 font-display text-3xl text-[#00e5ff]">
                      玩家2 选择动作
                    </h2>
                    <p className="mb-6 text-sm text-[#f5f0e8]/50">
                      玩家1 已选择，请玩家2 选择
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {ACTION_ORDER.map((action) => (
                        <ActionButton
                          key={action}
                          action={action}
                          disabled={!isActionValid(action, aiEnergy)}
                          onClick={selectP2Action}
                          bloomUsed={aiBloomUsed}
                          hp={aiHP}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mist Effect Overlay */}
            <AnimatePresence>
              {mistEffect && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="pointer-events-none fixed inset-0 z-30 bg-gradient-to-br from-blue-400/20 via-cyan-300/10 to-purple-400/20"
                />
              )}
            </AnimatePresence>

            {/* Online Status Bar */}
            <div className="mb-4 flex w-full max-w-3xl items-center justify-between rounded-xl border border-white/10 bg-[#141414]/40 px-4 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isOnlineWaiting ? "bg-amber-400" : "bg-emerald-400"}`} />
                <span className="text-xs text-[#f5f0e8]/60">
                  {isOnlineWaiting ? "等待对手..." : "回合 " + round}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {roomCode && (
                  <span className="font-mono text-xs text-[#f5f0e8]/40">
                    房间 {roomCode}
                  </span>
                )}
                {opponentReady && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-xs text-emerald-400"
                  >
                    对手已就绪
                  </motion.span>
                )}
                <button
                  onClick={leaveOnline}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-[#f5f0e8]/40 transition-colors hover:bg-white/5 hover:text-[#f5f0e8]/70"
                >
                  退出
                </button>
              </div>
            </div>

            <main className="flex w-full max-w-3xl flex-1 flex-col gap-6">
              {/* Battle Stage */}
              <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-[#141414]/40 p-6 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <EnergyRing
                    energy={playerEnergy}
                    hp={playerHP}
                    maxHp={INITIAL_HP}
                    clones={playerClones}
                    label="你"
                    color="red"
                    pulse={playerEnergy >= 3}
                  />
                  <ActionCard
                    action={playerAction}
                    revealed={revealed}
                    side="player"
                  />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="font-display text-3xl text-[#f5f0e8]/30">VS</span>
                  {isOnlineWaiting && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-xs text-amber-400"
                    >
                      等待中
                    </motion.span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <EnergyRing
                    energy={aiEnergy}
                    hp={aiHP}
                    maxHp={INITIAL_HP}
                    clones={aiClones}
                    label="对手"
                    color="cyan"
                    pulse={aiEnergy >= 3}
                  />
                  <ActionCard
                    action={aiAction}
                    revealed={revealed}
                    side="ai"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {ACTION_ORDER.map((action) => (
                  <ActionButton
                    key={action}
                    action={action}
                    disabled={
                      phase !== "select" || isOnlineWaiting || !isActionValid(action, playerEnergy)
                    }
                    onClick={selectAction}
                    bloomUsed={playerBloomUsed}
                    hp={playerHP}
                  />
                ))}
              </div>

              {/* Log */}
              <BattleLog entries={log} />
            </main>
          </>
        )}

        {/* Non-Online Content */}
        {gameMode !== "online" && (
          <>
            {/* PvP Player 2 Selection Overlay */}
            <AnimatePresence>
              {isPvPPlayer2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="text-center"
                  >
                    <h2 className="mb-2 font-display text-3xl text-[#00e5ff]">
                      玩家2 选择动作
                    </h2>
                    <p className="mb-6 text-sm text-[#f5f0e8]/50">
                      玩家1 已选择，请玩家2 选择
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {ACTION_ORDER.map((action) => (
                        <ActionButton
                          key={action}
                          action={action}
                          disabled={!isActionValid(action, aiEnergy)}
                          onClick={selectP2Action}
                          bloomUsed={aiBloomUsed}
                          hp={aiHP}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mist Effect Overlay */}
            <AnimatePresence>
              {mistEffect && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="pointer-events-none fixed inset-0 z-30 bg-gradient-to-br from-blue-400/20 via-cyan-300/10 to-purple-400/20"
                />
              )}
            </AnimatePresence>

            <main className="flex w-full max-w-3xl flex-1 flex-col gap-6">
              {/* Battle Stage */}
              <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-[#141414]/40 p-6 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <EnergyRing
                    energy={playerEnergy}
                    hp={playerHP}
                    maxHp={INITIAL_HP}
                    label={gameMode === "pvp" ? "玩家1" : "玩家"}
                    color="red"
                    pulse={playerEnergy >= 3}
                    clones={playerClones}
                  />
                  <ActionCard
                    action={playerAction}
                    revealed={revealed}
                    side="player"
                  />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="font-display text-3xl text-[#f5f0e8]/30">VS</span>
                  {phase === "select" && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-xs text-[#f5f0e8]/40"
                    >
                      {gameMode === "pvp" ? "玩家1 行动" : "等待行动"}
                    </motion.span>
                  )}
                  {phase === "pvpPlayer2" && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-xs text-[#00e5ff]"
                    >
                      玩家2 行动中
                    </motion.span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <EnergyRing
                    energy={aiEnergy}
                    hp={aiHP}
                    maxHp={INITIAL_HP}
                    label={gameMode === "pvp" ? "玩家2" : "AI"}
                    color="cyan"
                    pulse={aiEnergy >= 3}
                    clones={aiClones}
                  />
                  <ActionCard
                    action={aiAction}
                    revealed={revealed}
                    side="ai"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {ACTION_ORDER.map((action) => (
                  <ActionButton
                    key={action}
                    action={action}
                    disabled={
                      phase !== "select" || !isActionValid(action, playerEnergy)
                    }
                    onClick={selectAction}
                    bloomUsed={playerBloomUsed}
                    hp={playerHP}
                  />
                ))}
              </div>

              {/* Log */}
              <BattleLog entries={log} />
            </main>
          </>
        )}

        {/* Footer hint */}
        <footer className="mt-6 text-center text-xs text-[#f5f0e8]/30">
          高级攻击打败低级攻防 · 火水交融雾化回血 · 3HP制
        </footer>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRules(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl"
              >
                <button
                  onClick={() => setShowRules(false)}
                  className="absolute right-4 top-4 text-[#f5f0e8]/40 transition-colors hover:text-[#f5f0e8]"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="mb-4 font-display text-2xl font-bold text-[#f5f0e8]">游戏说明</h2>
                <div className="space-y-4 text-sm text-[#f5f0e8]/80">
                  <section>
                    <h3 className="mb-1.5 font-bold text-[#ff3b3b]">基础规则</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
                      <li>双方初始 3 HP，HP 归零即败</li>
                      <li>每回合双方同时选择一个动作，结算后进入下一回合</li>
                      <li>高级攻击打败低级攻防，同等级攻击对撞双方同归于尽</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-1.5 font-bold text-amber-300">基础动作</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
                      <li><span className="text-amber-300">蓄</span> — 获得 1 蓄力（0级）</li>
                      <li><span className="text-[#ff3b3b]">普攻</span> — 消耗 1 蓄，1 级攻击</li>
                      <li><span className="text-emerald-300">防</span> — 不消耗，1 级防御</li>
                      <li><span className="text-[#ff3b3b]">二级攻击</span> — 消耗 3 蓄，2 级攻击</li>
                      <li><span className="text-emerald-300">二级防御</span> — 消耗 1 蓄，2 级防御</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-1.5 font-bold text-orange-400">特殊技能（遁术）</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
                      <li><span className="text-orange-400">火遁</span> / <span className="text-blue-300">水遁</span> — 消耗 2 蓄，克一级攻防与蓄</li>
                      <li>被二级攻击击破，被二级防御反弹</li>
                      <li><span className="text-cyan-300">火遁 vs 水遁 → 雾化</span>，双方各 +1 HP</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-1.5 font-bold text-teal-300">风遁（终极技能）</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
                      <li>消耗 8 蓄，秒杀对方（无视一切防御与遁术）</li>
                      <li>双方同时风遁则相互抵消，无伤害</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-1.5 font-bold text-pink-300">开花术（分身）</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
                      <li>一局只能使用一次，需 HP ≥ 3</li>
                      <li>将自己分裂为两个 2 HP 的分身</li>
                      <li>风遁仅可秒掉一个分身</li>
                      <li>一个分身死亡时，丢弃所有蓄力（本轮加的蓄不算），使用新分身继续战斗</li>
                    </ul>
                  </section>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="mt-6 w-full rounded-xl bg-[#ff3b3b]/20 py-2.5 text-sm font-bold text-[#ff3b3b] transition-colors hover:bg-[#ff3b3b]/30"
                >
                  开始游戏
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Modal */}
        {winner && (
          <ResultModal
            winner={winner}
            gameMode={gameMode === "online" ? "pvp" : gameMode}
            onReset={isOnlineResult ? onlineReplay : resetGame}
          />
        )}
      </div>
    </ShakeWrapper>
  );
}