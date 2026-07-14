/**
 * WebSocket 联机客户端模块
 * 管理连接、房间、消息收发
 */
import { ActionType } from "@/logic/actions";

type MessageHandler = (msg: ServerMessage) => void;

export interface ServerMessage {
  type: string;
  roomCode?: string;
  playerAction?: ActionType;
  opponentAction?: ActionType;
  playerEnergy?: number;
  opponentEnergy?: number;
  playerHP?: number;
  opponentHP?: number;
  playerClones?: number;
  opponentClones?: number;
  playerBloomUsed?: boolean;
  opponentBloomUsed?: boolean;
  round?: number;
  result?: {
    playerDead: boolean;
    opponentDead: boolean;
    playerHpChange: number;
    opponentHpChange: number;
    description: string;
    mistEffect: boolean;
    bloomActivated: boolean;
    playerCloneDied: boolean;
    aiCloneDied: boolean;
  };
  gameOver?: boolean;
  winner?: "player" | "opponent" | "draw" | null;
  message?: string;
}

let ws: WebSocket | null = null;
let handlers: MessageHandler[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  return `${protocol}//${host}:3001`;
}

export function connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      console.log("[WS] 已连接");
      resolve();
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        handlers.forEach((h) => h(msg));
      } catch {
        console.error("[WS] 消息解析失败");
      }
    };

    ws.onerror = () => {
      console.error("[WS] 连接错误");
      reject(new Error("WebSocket 连接失败"));
    };

    ws.onclose = () => {
      console.log("[WS] 连接断开");
      ws = null;
    };
  });
}

export function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function send(msg: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function onMessage(handler: MessageHandler) {
  handlers.push(handler);
  return () => {
    handlers = handlers.filter((h) => h !== handler);
  };
}

export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export function createRoom() {
  send({ type: "create-room" });
}

export function joinRoom(code: string) {
  send({ type: "join-room", roomCode: code });
}

export function sendAction(action: ActionType) {
  send({ type: "action", action });
}

export function replay() {
  send({ type: "replay" });
}