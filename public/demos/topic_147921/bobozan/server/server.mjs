/**
 * 蓄能对决 - WebSocket 联机服务器
 * 权威服务器：所有游戏逻辑在服务端运行，客户端仅发送动作和展示结果
 */
import { WebSocketServer } from "ws";

const PORT = 3001;
const INITIAL_HP = 3;
const INSTANT_KILL_DAMAGE = -99; // 风遁秒杀伤害：确保击杀2血分身

// ============================================================
// 游戏逻辑（内联）
// ============================================================

const ACTIONS = {
  charge: { cost: -1, level: 0, isAttack: false, isSpecial: false, isInstantKill: false, isSelfBuff: false },
  normalAttack: { cost: 1, level: 1, isAttack: true, isSpecial: false, isInstantKill: false, isSelfBuff: false },
  defend: { cost: 0, level: 1, isAttack: false, isSpecial: false, isInstantKill: false, isSelfBuff: false },
  level2Attack: { cost: 3, level: 2, isAttack: true, isSpecial: false, isInstantKill: false, isSelfBuff: false },
  level2Defend: { cost: 1, level: 2, isAttack: false, isSpecial: false, isInstantKill: false, isSelfBuff: false },
  fireStyle: { cost: 2, level: 1, isAttack: true, isSpecial: true, isInstantKill: false, isSelfBuff: false },
  waterStyle: { cost: 2, level: 1, isAttack: true, isSpecial: true, isInstantKill: false, isSelfBuff: false },
  windStyle: { cost: 8, level: 3, isAttack: true, isSpecial: true, isInstantKill: true, isSelfBuff: false },
  bloomTechnique: { cost: 0, level: 0, isAttack: false, isSpecial: true, isInstantKill: false, isSelfBuff: true },
};

function getEnergyDelta(action) { return -ACTIONS[action].cost; }
function isActionValid(action, energy) { return ACTIONS[action] && energy >= ACTIONS[action].cost; }

function resolveRound(pAction, oAction) {
  const base = { playerDead: false, opponentDead: false, playerHpChange: 0, opponentHpChange: 0, description: "", mistEffect: false, bloomActivated: false, playerCloneDied: false, aiCloneDied: false };

  const p = ACTIONS[pAction];
  const o = ACTIONS[oAction];

  if (p.isSelfBuff) base.bloomActivated = true;
  if (o.isSelfBuff) base.bloomActivated = true;

  // 风遁
  if (p.isInstantKill && o.isInstantKill) return { ...base, description: "风遁相互抵消！两道狂风消散于无形…" };
  if (p.isInstantKill) return { ...base, opponentDead: true, opponentHpChange: INSTANT_KILL_DAMAGE, description: "风遁秒杀！" };
  if (o.isInstantKill) return { ...base, playerDead: true, playerHpChange: INSTANT_KILL_DAMAGE, description: "对手风遁秒杀！" };

  // 水火雾化
  if ((pAction === "fireStyle" && oAction === "waterStyle") || (pAction === "waterStyle" && oAction === "fireStyle")) {
    return { ...base, playerHpChange: 1, opponentHpChange: 1, description: "水火交融，雾化！双方各 +1 HP", mistEffect: true };
  }

  // 火遁 vs 火遁 / 水遁 vs 水遁 → 抵消
  if ((pAction === "fireStyle" && oAction === "fireStyle") || (pAction === "waterStyle" && oAction === "waterStyle")) {
    return { ...base, description: "同属性遁术相互抵消！" };
  }

  // 开花术
  if (p.isSelfBuff && o.isSelfBuff) return { ...base, description: "双方使用开花术，各自分裂！" };
  if (p.isSelfBuff) {
    if (o.isAttack) return resolveNormal(pAction, oAction, base);
    return { ...base, description: "开花术发动，分裂为两个分身！" };
  }
  if (o.isSelfBuff) {
    if (p.isAttack) return resolveNormal(pAction, oAction, base);
    return { ...base, description: "对手发动开花术，分裂为两个分身！" };
  }

  if (p.isSpecial) return resolveSpecial(pAction, oAction, "player", base);
  if (o.isSpecial) return resolveSpecial(oAction, pAction, "opponent", base);

  return resolveNormal(pAction, oAction, base);
}

function resolveSpecial(special, other, side, base) {
  const o = ACTIONS[other];
  if (o.isAttack && o.level >= 2) {
    return { ...base, playerDead: side === "player", opponentDead: side === "opponent", playerHpChange: side === "player" ? -1 : 0, opponentHpChange: side === "opponent" ? -1 : 0, description: `${side === "player" ? "你" : "对手"}的遁术被二级攻击击破！` };
  }
  if (!o.isAttack && o.level >= 2) {
    return { ...base, playerDead: side === "player", opponentDead: side === "opponent", playerHpChange: side === "player" ? -1 : 0, opponentHpChange: side === "opponent" ? -1 : 0, description: `${side === "player" ? "你" : "对手"}的遁术被反弹！` };
  }
  return { ...base, playerDead: side === "opponent", opponentDead: side === "player", playerHpChange: side === "opponent" ? -1 : 0, opponentHpChange: side === "player" ? -1 : 0, description: `${side === "player" ? "你" : "对手"}的遁术命中！` };
}

function resolveNormal(pAction, oAction, base) {
  const pLevel = ACTIONS[pAction].level;
  const oLevel = ACTIONS[oAction].level;
  const pAttack = ACTIONS[pAction].isAttack;
  const oAttack = ACTIONS[oAction].isAttack;

  let pDead = false, oDead = false;
  if (oAttack && oLevel > pLevel) pDead = true;
  if (pAttack && pLevel > oLevel) oDead = true;
  if (pAttack && oAttack && pLevel === oLevel) { /* 同级攻击抵消 */ }

  let desc = "";
  if (pAttack && oAttack && pLevel === oLevel) desc = "同级攻击相互抵消！";
  else if (pDead && oDead) desc = "双方同归于尽";
  else if (pDead) desc = "你被击败";
  else if (oDead) desc = "对手被击败";
  else if (pAttack || oAttack) desc = "攻击被挡下或落空";
  else desc = "双方按兵不动";

  return { ...base, playerDead: pDead, opponentDead: oDead, playerHpChange: pDead ? -1 : 0, opponentHpChange: oDead ? -1 : 0, description: desc };
}

// ============================================================
// 房间管理
// ============================================================

function randomCode() { return String(Math.floor(1000 + Math.random() * 9000)); }

/** @type {Map<string, Room>} */
const rooms = new Map();
/** @type {Map<WebSocket, {roomCode: string, playerIndex: number}>} */
const connections = new Map();

function createRoom() {
  const code = randomCode();
  const room = {
    sockets: [null, null],
    playerEnergy: 0, opponentEnergy: 0,
    playerHP: INITIAL_HP, opponentHP: INITIAL_HP,
    playerClones: 1, opponentClones: 1,
    playerBloomUsed: false, opponentBloomUsed: false,
    round: 1, actions: [null, null],
    gameOver: false, code, winner: null,
  };
  rooms.set(code, room);
  return room;
}

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function sendBoth(room, msg) { room.sockets.forEach((ws) => { if (ws) send(ws, msg); }); }

function getRoomState(room, playerIndex) {
  const isP1 = playerIndex === 0;
  return {
    type: "game-state",
    playerEnergy: isP1 ? room.playerEnergy : room.opponentEnergy,
    opponentEnergy: isP1 ? room.opponentEnergy : room.playerEnergy,
    playerHP: isP1 ? room.playerHP : room.opponentHP,
    opponentHP: isP1 ? room.opponentHP : room.playerHP,
    playerClones: isP1 ? room.playerClones : room.opponentClones,
    opponentClones: isP1 ? room.opponentClones : room.playerClones,
    playerBloomUsed: isP1 ? room.playerBloomUsed : room.opponentBloomUsed,
    opponentBloomUsed: isP1 ? room.opponentBloomUsed : room.playerBloomUsed,
    round: room.round,
    gameOver: room.gameOver,
    winner: room.winner
      ? (room.winner === 0 ? "draw" : room.winner === (isP1 ? 1 : 2) ? "player" : "opponent")
      : null,
  };
}

function executeRound(room) {
  const [p1Action, p2Action] = room.actions;

  // 开花术前置
  let p1Bloom = room.playerBloomUsed, p2Bloom = room.opponentBloomUsed;
  let p1Clones = room.playerClones, p2Clones = room.opponentClones;
  let p1HP = room.playerHP, p2HP = room.opponentHP;

  if (ACTIONS[p1Action].isSelfBuff && !p1Bloom && p1HP >= 3) { p1Bloom = true; p1Clones = 2; p1HP = 2; }
  if (ACTIONS[p2Action].isSelfBuff && !p2Bloom && p2HP >= 3) { p2Bloom = true; p2Clones = 2; p2HP = 2; }

  room.playerEnergy = Math.max(0, room.playerEnergy + getEnergyDelta(p1Action));
  room.opponentEnergy = Math.max(0, room.opponentEnergy + getEnergyDelta(p2Action));

  const result = resolveRound(p1Action, p2Action);

  p1HP += result.playerHpChange;
  p2HP += result.opponentHpChange;

  // 分身死亡处理
  if (result.playerHpChange < 0 && p1HP <= 0 && p1Clones > 1) {
    p1Clones--; p1HP = 2; room.playerEnergy = 0;
    result.playerCloneDied = true; result.playerDead = false; result.playerHpChange = -1;
  }
  if (result.opponentHpChange < 0 && p2HP <= 0 && p2Clones > 1) {
    p2Clones--; p2HP = 2; room.opponentEnergy = 0;
    result.aiCloneDied = true; result.opponentDead = false; result.opponentHpChange = -1;
  }

  room.playerHP = p1HP; room.opponentHP = p2HP;
  room.playerClones = p1Clones; room.opponentClones = p2Clones;
  room.playerBloomUsed = p1Bloom; room.opponentBloomUsed = p2Bloom;

  if (p1HP <= 0 && p2HP <= 0) { room.gameOver = true; room.winner = 0; room.playerHP = 0; room.opponentHP = 0; }
  else if (p1HP <= 0) { room.gameOver = true; room.winner = 2; room.playerHP = 0; }
  else if (p2HP <= 0) { room.gameOver = true; room.winner = 1; room.opponentHP = 0; }

  room.sockets.forEach((ws, idx) => {
    if (!ws) return;
    const isP1 = idx === 0;
    send(ws, {
      type: "round-result",
      playerAction: isP1 ? p1Action : p2Action,
      opponentAction: isP1 ? p2Action : p1Action,
      playerEnergy: isP1 ? room.playerEnergy : room.opponentEnergy,
      opponentEnergy: isP1 ? room.opponentEnergy : room.playerEnergy,
      playerHP: isP1 ? room.playerHP : room.opponentHP,
      opponentHP: isP1 ? room.opponentHP : room.playerHP,
      playerClones: isP1 ? room.playerClones : room.opponentClones,
      opponentClones: isP1 ? room.opponentClones : room.playerClones,
      playerBloomUsed: isP1 ? room.playerBloomUsed : room.opponentBloomUsed,
      opponentBloomUsed: isP1 ? room.opponentBloomUsed : room.playerBloomUsed,
      result: {
        playerDead: isP1 ? result.playerDead : result.opponentDead,
        opponentDead: isP1 ? result.opponentDead : result.playerDead,
        playerHpChange: isP1 ? result.playerHpChange : result.opponentHpChange,
        opponentHpChange: isP1 ? result.opponentHpChange : result.playerHpChange,
        description: result.description,
        mistEffect: result.mistEffect,
        bloomActivated: result.bloomActivated,
        playerCloneDied: isP1 ? result.playerCloneDied : result.aiCloneDied,
        aiCloneDied: isP1 ? result.aiCloneDied : result.playerCloneDied,
      },
      round: room.round, gameOver: room.gameOver,
      winner: room.winner
        ? (room.winner === 0 ? "draw" : room.winner === (isP1 ? 1 : 2) ? "player" : "opponent")
        : null,
    });
  });

  room.actions = [null, null];
  if (!room.gameOver) room.round++;
}

// ============================================================
// WebSocket 服务器
// ============================================================

const HOST = "0.0.0.0";
const wss = new WebSocketServer({ host: HOST, port: PORT });
console.log(`⚔️  蓄能对决联机服务器启动: ws://${HOST}:${PORT}`);

wss.on("connection", (ws) => {
  console.log("新连接");

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { send(ws, { type: "error", message: "无效消息格式" }); return; }

    switch (msg.type) {
      case "create-room": {
        const room = createRoom();
        room.sockets[0] = ws;
        connections.set(ws, { roomCode: room.code, playerIndex: 0 });
        send(ws, { type: "room-created", roomCode: room.code });
        console.log(`房间 ${room.code} 已创建`);
        break;
      }
      case "join-room": {
        const room = rooms.get(msg.roomCode);
        if (!room) { send(ws, { type: "error", message: "房间不存在" }); return; }
        if (room.sockets[1]) { send(ws, { type: "error", message: "房间已满" }); return; }
        room.sockets[1] = ws;
        connections.set(ws, { roomCode: room.code, playerIndex: 1 });
        send(room.sockets[0], { type: "game-start", roomCode: room.code });
        send(room.sockets[1], { type: "game-start", roomCode: room.code });
        send(room.sockets[0], getRoomState(room, 0));
        send(room.sockets[1], getRoomState(room, 1));
        console.log(`房间 ${room.code} 已满，游戏开始`);
        break;
      }
      case "action": {
        const conn = connections.get(ws);
        if (!conn) { send(ws, { type: "error", message: "未加入房间" }); return; }
        const room = rooms.get(conn.roomCode);
        if (!room) { send(ws, { type: "error", message: "房间已解散" }); return; }
        if (room.gameOver) { send(ws, { type: "error", message: "游戏已结束" }); return; }

        const energy = conn.playerIndex === 0 ? room.playerEnergy : room.opponentEnergy;
        const hp = conn.playerIndex === 0 ? room.playerHP : room.opponentHP;
        const bloomUsed = conn.playerIndex === 0 ? room.playerBloomUsed : room.opponentBloomUsed;

        if (!isActionValid(msg.action, energy)) { send(ws, { type: "error", message: "能量不足或无效动作" }); return; }
        if (ACTIONS[msg.action].isSelfBuff) {
          if (bloomUsed) { send(ws, { type: "error", message: "开花术已使用" }); return; }
          if (hp < 3) { send(ws, { type: "error", message: "HP不足" }); return; }
        }
        if (room.actions[conn.playerIndex] !== null) { send(ws, { type: "error", message: "已选择动作" }); return; }

        room.actions[conn.playerIndex] = msg.action;
        const otherIdx = conn.playerIndex === 0 ? 1 : 0;
        if (room.sockets[otherIdx]) send(room.sockets[otherIdx], { type: "opponent-selected" });

        if (room.actions[0] && room.actions[1]) executeRound(room);
        break;
      }
      case "replay": {
        const conn = connections.get(ws);
        if (!conn) return;
        const room = rooms.get(conn.roomCode);
        if (!room) return;
        if (!room.gameOver) { send(ws, { type: "error", message: "游戏未结束" }); return; }
        room.playerEnergy = 0; room.opponentEnergy = 0;
        room.playerHP = INITIAL_HP; room.opponentHP = INITIAL_HP;
        room.playerClones = 1; room.opponentClones = 1;
        room.playerBloomUsed = false; room.opponentBloomUsed = false;
        room.round = 1; room.actions = [null, null];
        room.gameOver = false; room.winner = null;
        sendBoth(room, { type: "game-start", roomCode: room.code });
        send(room.sockets[0], getRoomState(room, 0));
        send(room.sockets[1], getRoomState(room, 1));
        console.log(`房间 ${room.code} 再战`);
        break;
      }
      default:
        send(ws, { type: "error", message: "未知消息类型" });
    }
  });

  ws.on("close", () => {
    const conn = connections.get(ws);
    if (conn) {
      const room = rooms.get(conn.roomCode);
      if (room) {
        const other = room.sockets[conn.playerIndex === 0 ? 1 : 0];
        if (other) send(other, { type: "opponent-left" });
        rooms.delete(conn.roomCode);
        console.log(`房间 ${conn.roomCode} 已解散`);
      }
      connections.delete(ws);
    }
    console.log("连接断开");
  });

  ws.on("error", (err) => { console.error("WebSocket error:", err.message); });
});