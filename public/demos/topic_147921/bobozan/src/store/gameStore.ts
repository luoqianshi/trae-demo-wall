import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ActionType, getEnergyDelta, isActionValid, isSelfBuff, ACTION_ORDER } from "@/logic/actions";
import { getBotAction } from "@/logic/botAI";
import { CombatResult, resolveRound } from "@/logic/combat";
import * as wsClient from "@/online/wsClient";

export type GamePhase = "select" | "pvpPlayer2" | "reveal" | "result";
export type GameMode = "pve" | "pvp" | "online";
export type OnlinePhase = "lobby" | "waiting" | "playing" | "waitingAction" | "reveal" | "result";
export type BotDifficulty = 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16;

export interface LogEntry {
  round: number;
  playerAction: ActionType;
  aiAction: ActionType;
  playerEnergyBefore: number;
  aiEnergyBefore: number;
  playerHpBefore: number;
  aiHpBefore: number;
  result: CombatResult;
}

const INITIAL_HP = 3;

export interface GameState {
  round: number;
  playerEnergy: number;
  aiEnergy: number;
  playerHP: number;
  aiHP: number;
  playerClones: number;
  aiClones: number;
  playerBloomUsed: boolean;
  aiBloomUsed: boolean;
  playerAction: ActionType | null;
  aiAction: ActionType | null;
  player2Action: ActionType | null;
  playerActionHistory: number[];
  aiActionHistory: number[];
  phase: GamePhase;
  gameMode: GameMode;
  winner: "player" | "ai" | "draw" | null;
  log: LogEntry[];
  lastPlayerAction: ActionType | null;
  shake: boolean;
  mistEffect: boolean;

  // 联机模式
  onlinePhase: OnlinePhase;
  roomCode: string | null;
  onlineConnecting: boolean;
  opponentReady: boolean;

  // AI 难度
  botDifficulty: BotDifficulty;

  selectAction: (action: ActionType) => void;
  selectP2Action: (action: ActionType) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (d: BotDifficulty) => void;
  resetGame: () => void;

  // 联机模式操作
  onlineCreateRoom: () => void;
  onlineJoinRoom: (code: string) => void;
  onlineReplay: () => void;
  leaveOnline: () => void;
}

const initialState = {
  round: 1,
  playerEnergy: 0,
  aiEnergy: 0,
  playerHP: INITIAL_HP,
  aiHP: INITIAL_HP,
  playerClones: 1,
  aiClones: 1,
  playerBloomUsed: false,
  aiBloomUsed: false,
  playerAction: null as ActionType | null,
  aiAction: null as ActionType | null,
  player2Action: null as ActionType | null,
  playerActionHistory: [] as number[],
  aiActionHistory: [] as number[],
  phase: "select" as GamePhase,
  gameMode: "pve" as GameMode,
  winner: null as "player" | "ai" | "draw" | null,
  log: [] as LogEntry[],
  lastPlayerAction: null as ActionType | null,
  shake: false,
  mistEffect: false,
  onlinePhase: "lobby" as OnlinePhase,
  roomCode: null as string | null,
  onlineConnecting: false,
  opponentReady: false,
  botDifficulty: 4 as BotDifficulty,
};

export const useGameStore = create<GameState>()(
  devtools((set, get) => {
    const unsub = wsClient.onMessage((msg) => {
      const state = get();

      switch (msg.type) {
        case "room-created":
          set({ roomCode: msg.roomCode ?? null, onlineConnecting: false });
          break;

        case "game-start":
          set({ onlinePhase: "playing", phase: "select" });
          break;

        case "game-state":
          set({
            playerEnergy: msg.playerEnergy ?? 0,
            aiEnergy: msg.opponentEnergy ?? 0,
            playerHP: msg.playerHP ?? INITIAL_HP,
            aiHP: msg.opponentHP ?? INITIAL_HP,
            playerClones: msg.playerClones ?? 1,
            aiClones: msg.opponentClones ?? 1,
            playerBloomUsed: msg.playerBloomUsed ?? false,
            aiBloomUsed: msg.opponentBloomUsed ?? false,
            round: msg.round ?? 1,
          });
          break;

        case "opponent-selected":
          set({ opponentReady: true });
          break;

        case "round-result": {
          const playerAction = msg.playerAction ?? null;
          const aiAction = msg.opponentAction ?? null;
          const result = msg.result;
          const gameOver = msg.gameOver ?? false;

          const logEntry: LogEntry = {
            round: state.round,
            playerAction: playerAction!,
            aiAction: aiAction!,
            playerEnergyBefore: state.playerEnergy,
            aiEnergyBefore: state.aiEnergy,
            playerHpBefore: state.playerHP,
            aiHpBefore: state.aiHP,
            result: result
              ? {
                  playerDead: result.playerDead,
                  aiDead: result.opponentDead,
                  playerHpChange: result.playerHpChange,
                  aiHpChange: result.opponentHpChange,
                  playerHit: result.opponentDead,
                  aiHit: result.playerDead,
                  description: result.description,
                  mistEffect: result.mistEffect,
                  bloomActivated: result.bloomActivated ?? false,
                  playerCloneDied: result.playerCloneDied ?? false,
                  aiCloneDied: result.aiCloneDied ?? false,
                }
              : {
                  playerDead: false, aiDead: false,
                  playerHpChange: 0, aiHpChange: 0,
                  playerHit: false, aiHit: false,
                  description: "", mistEffect: false,
                  bloomActivated: false,
                  playerCloneDied: false, aiCloneDied: false,
                },
          };

          set({
            playerAction,
            aiAction,
            playerEnergy: msg.playerEnergy ?? state.playerEnergy,
            aiEnergy: msg.opponentEnergy ?? state.aiEnergy,
            playerHP: msg.playerHP ?? state.playerHP,
            aiHP: msg.opponentHP ?? state.aiHP,
            playerClones: msg.playerClones ?? state.playerClones,
            aiClones: msg.opponentClones ?? state.aiClones,
            playerBloomUsed: msg.playerBloomUsed ?? state.playerBloomUsed,
            aiBloomUsed: msg.opponentBloomUsed ?? state.aiBloomUsed,
            round: msg.round ?? state.round,
            log: [logEntry, ...state.log],
            onlinePhase: gameOver ? "result" : "reveal",
            phase: "reveal",
            winner: gameOver
              ? (msg.winner === "opponent" ? "ai" : (msg.winner ?? null)) as "player" | "ai" | "draw" | null
              : null,
            shake: result ? result.opponentDead || result.playerDead : false,
            mistEffect: result?.mistEffect ?? false,
            opponentReady: false,
          });

          if (!gameOver) {
            setTimeout(() => {
              set((prev) => ({
                playerAction: null,
                aiAction: null,
                onlinePhase: "playing",
                phase: "select",
                shake: false,
                mistEffect: false,
              }));
            }, 1600);
          } else {
            setTimeout(() => {
              set({ shake: false, mistEffect: false });
            }, 500);
          }
          break;
        }

        case "opponent-left":
          set({ onlinePhase: "result", winner: "player", phase: "result" });
          break;

        case "error":
          console.warn("[Online] 服务器错误:", msg.message);
          break;
      }
    });

    return {
      ...initialState,

      setGameMode: (mode: GameMode) => {
        if (mode === "online") {
          set({ ...initialState, gameMode: mode, onlinePhase: "lobby", botDifficulty: get().botDifficulty });
        } else {
          set({ ...initialState, gameMode: mode, botDifficulty: get().botDifficulty });
        }
      },

      setDifficulty: (d: BotDifficulty) => {
        set({ botDifficulty: d });
      },

      selectAction: (action: ActionType) => {
        const state = get();
        if (state.phase !== "select") return;
        if (!isActionValid(action, state.playerEnergy)) return;

        // 开花术额外检查
        if (isSelfBuff(action)) {
          if (state.playerBloomUsed) return;
          if (state.playerHP < 3) return;
        }

        if (state.gameMode === "online") {
          wsClient.sendAction(action);
          set({ onlinePhase: "waitingAction", opponentReady: false });
          return;
        }

        if (state.gameMode === "pvp") {
          set({ playerAction: action, phase: "pvpPlayer2" });
          return;
        }

        // PVE: minimax bot 出招
        const aiAction = getBotAction(
          state.aiEnergy, state.aiHP, state.aiClones, state.aiBloomUsed,
          state.playerEnergy, state.playerHP, state.playerClones, state.playerBloomUsed,
          state.botDifficulty,
        );
        executeRound(action, aiAction, state, set);
      },

      selectP2Action: (action: ActionType) => {
        const state = get();
        if (state.phase !== "pvpPlayer2") return;
        if (state.gameMode !== "pvp") return;
        if (!isActionValid(action, state.aiEnergy)) return;
        if (isSelfBuff(action)) {
          if (state.aiBloomUsed) return;
          if (state.aiHP < 3) return;
        }
        executePvPRound(action, state, set);
      },

      resetGame: () => {
        const state = get();
        set({ ...initialState, gameMode: state.gameMode });
      },

      onlineCreateRoom: async () => {
        set({ onlineConnecting: true });
        try {
          await wsClient.connect();
          wsClient.createRoom();
        } catch {
          set({ onlineConnecting: false });
        }
      },

      onlineJoinRoom: async (code: string) => {
        set({ onlineConnecting: true });
        try {
          await wsClient.connect();
          wsClient.joinRoom(code);
        } catch {
          set({ onlineConnecting: false });
        }
      },

      onlineReplay: () => {
        wsClient.replay();
        set({ ...initialState, gameMode: "online", onlinePhase: "playing", phase: "select" });
      },

      leaveOnline: () => {
        wsClient.disconnect();
        set({ ...initialState, gameMode: "pve" });
      },
    };
  })
);

function executePvPRound(
  player2Action: ActionType,
  state: GameState,
  setter: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
) {
  const playerAction = state.playerAction!;
  executeRound(playerAction, player2Action, state, setter);
}

function executeRound(
  playerAction: ActionType,
  aiAction: ActionType,
  state: GameState,
  setter: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
) {
  const playerEnergyBefore = state.playerEnergy;
  const aiEnergyBefore = state.aiEnergy;
  const playerHpBefore = state.playerHP;
  const aiHpBefore = state.aiHP;

  // 开花术前置处理
  let playerBloomUsed = state.playerBloomUsed;
  let aiBloomUsed = state.aiBloomUsed;
  let playerClones = state.playerClones;
  let aiClones = state.aiClones;

  if (isSelfBuff(playerAction) && !playerBloomUsed && playerHpBefore >= 3) {
    playerBloomUsed = true;
    playerClones = 2;
  }
  if (isSelfBuff(aiAction) && !aiBloomUsed && aiHpBefore >= 3) {
    aiBloomUsed = true;
    aiClones = 2;
  }

  const result = resolveRound(playerAction, aiAction);

  // 开花后 HP 修正
  let playerHP = playerHpBefore;
  let aiHP = aiHpBefore;
  if (isSelfBuff(playerAction) && !state.playerBloomUsed && playerHpBefore >= 3) {
    playerHP = 2;
  }
  if (isSelfBuff(aiAction) && !state.aiBloomUsed && aiHpBefore >= 3) {
    aiHP = 2;
  }

  // 更新能量
  const nextPlayerEnergy = Math.max(0, state.playerEnergy + getEnergyDelta(playerAction));
  const nextAiEnergy = Math.max(0, state.aiEnergy + getEnergyDelta(aiAction));

  // 更新 HP
  let nextPlayerHP = playerHP + result.playerHpChange;
  let nextAiHP = aiHP + result.aiHpChange;

  const logEntry: LogEntry = {
    round: state.round,
    playerAction,
    aiAction,
    playerEnergyBefore,
    aiEnergyBefore,
    playerHpBefore,
    aiHpBefore,
    result: { ...result },
  };

  let winner: "player" | "ai" | "draw" | null = null;
  let phase: GamePhase = "reveal";
  let nextPlayerEnergyFinal = nextPlayerEnergy;
  let nextAiEnergyFinal = nextAiEnergy;

  // 分身死亡处理
  if (result.playerHpChange < 0) {
    if (nextPlayerHP <= 0 && playerClones > 1) {
      // 一个分身死亡，丢弃所有蓄，使用新分身
      playerClones--;
      nextPlayerHP = 2;
      nextPlayerEnergyFinal = 0;
      logEntry.result.playerCloneDied = true;
      logEntry.result.playerDead = false;
      logEntry.result.playerHpChange = -1;
    }
  }

  if (result.aiHpChange < 0) {
    if (nextAiHP <= 0 && aiClones > 1) {
      aiClones--;
      nextAiHP = 2;
      nextAiEnergyFinal = 0;
      logEntry.result.aiCloneDied = true;
      logEntry.result.aiDead = false;
      logEntry.result.aiHpChange = -1;
    }
  }

  // 判断胜负
  if (nextPlayerHP <= 0 && nextAiHP <= 0) {
    winner = "draw";
    phase = "result";
    nextPlayerHP = 0;
    nextAiHP = 0;
  } else if (nextPlayerHP <= 0) {
    winner = "ai";
    phase = "result";
    nextPlayerHP = 0;
  } else if (nextAiHP <= 0) {
    winner = "player";
    phase = "result";
    nextAiHP = 0;
  }

  setter({
    playerAction,
    aiAction,
    playerEnergy: nextPlayerEnergyFinal,
    aiEnergy: nextAiEnergyFinal,
    playerHP: nextPlayerHP,
    aiHP: nextAiHP,
    playerClones,
    aiClones,
    playerBloomUsed,
    aiBloomUsed,
    log: [logEntry, ...state.log],
    phase,
    winner,
    shake: result.playerHit || result.aiHit || result.playerCloneDied || result.aiCloneDied,
    mistEffect: result.mistEffect,
    lastPlayerAction: playerAction,
    player2Action: null,
    playerActionHistory: [...state.playerActionHistory, ACTION_ORDER.indexOf(playerAction)].slice(-3),
    aiActionHistory: [...state.aiActionHistory, ACTION_ORDER.indexOf(aiAction)].slice(-3),
  });

  if (phase === "reveal") {
    setTimeout(() => {
      setter((prev) => ({
        round: prev.round + 1,
        playerAction: null,
        aiAction: null,
        player2Action: null,
        phase: "select",
        shake: false,
        mistEffect: false,
      }));
    }, 1600);
  } else {
    setTimeout(() => {
      setter({ shake: false, mistEffect: false });
    }, 500);
  }
}