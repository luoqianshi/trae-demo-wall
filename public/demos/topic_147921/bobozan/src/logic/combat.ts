import { ActionType, getActionLevel, isAttack, isSpecial, isInstantKill, isSelfBuff } from "./actions";

// 风遁秒杀伤害：设为极大负数确保任意血量的分身都被击杀
const INSTANT_KILL_DAMAGE = -99;

export interface CombatResult {
  playerDead: boolean;
  aiDead: boolean;
  playerHpChange: number;
  aiHpChange: number;
  playerHit: boolean;
  aiHit: boolean;
  description: string;
  mistEffect: boolean;
  bloomActivated: boolean;
  playerCloneDied: boolean;
  aiCloneDied: boolean;
}

export function resolveRound(
  playerAction: ActionType,
  aiAction: ActionType,
): CombatResult {
  const base: CombatResult = {
    playerDead: false, aiDead: false,
    playerHpChange: 0, aiHpChange: 0,
    playerHit: false, aiHit: false,
    description: "", mistEffect: false,
    bloomActivated: false,
    playerCloneDied: false, aiCloneDied: false,
  };

  // 开花术处理（先于战斗结算）
  if (isSelfBuff(playerAction)) {
    base.bloomActivated = true;
  }
  if (isSelfBuff(aiAction)) {
    base.bloomActivated = true;
  }

  // 风遁处理（双方风遁则相互抵消，无伤害）
  const pWind = isInstantKill(playerAction);
  const aWind = isInstantKill(aiAction);

  if (pWind && aWind) {
    return { ...base, description: "风遁相互抵消！两道狂风消散于无形…" };
  }
  if (pWind) {
    return { ...base, aiDead: true, aiHpChange: INSTANT_KILL_DAMAGE, playerHit: true, description: "风遁秒杀！" };
  }
  if (aWind) {
    return { ...base, playerDead: true, playerHpChange: INSTANT_KILL_DAMAGE, aiHit: true, description: "对手风遁秒杀！" };
  }

  // 火遁 vs 水遁 → 雾化
  if (
    (playerAction === "fireStyle" && aiAction === "waterStyle") ||
    (playerAction === "waterStyle" && aiAction === "fireStyle")
  ) {
    return { ...base, playerHpChange: +1, aiHpChange: +1, description: "水火交融，雾化！双方各 +1 HP", mistEffect: true };
  }

  // 火遁 vs 火遁 / 水遁 vs 水遁 → 抵消
  if (
    (playerAction === "fireStyle" && aiAction === "fireStyle") ||
    (playerAction === "waterStyle" && aiAction === "waterStyle")
  ) {
    return { ...base, description: "同属性遁术相互抵消！" };
  }

  // 开花术 vs 任何 → 开花术生效（双方均无伤害，除非对方是攻击）
  if (isSelfBuff(playerAction) && isSelfBuff(aiAction)) {
    return { ...base, description: "双方使用开花术，各自分裂！" };
  }
  if (isSelfBuff(playerAction)) {
    // 玩家开花，对手可能攻击
    if (isAttack(aiAction)) {
      // 对手攻击仍然生效
      return resolveNormal(playerAction, aiAction, base);
    }
    return { ...base, description: "开花术发动，分裂为两个分身！" };
  }
  if (isSelfBuff(aiAction)) {
    if (isAttack(playerAction)) {
      return resolveNormal(playerAction, aiAction, base);
    }
    return { ...base, description: "对手发动开花术，分裂为两个分身！" };
  }

  // 处理特殊技能（火遁/水遁）
  const pSpecial = isSpecial(playerAction);
  const aSpecial = isSpecial(aiAction);

  if (pSpecial) {
    return resolveSpecialVsNormal(playerAction, aiAction, "player", base);
  }
  if (aSpecial) {
    return resolveSpecialVsNormal(aiAction, playerAction, "ai", base);
  }

  return resolveNormal(playerAction, aiAction, base);
}

function resolveSpecialVsNormal(
  specialAction: ActionType,
  otherAction: ActionType,
  specialSide: "player" | "ai",
  base: CombatResult,
): CombatResult {
  const otherLevel = getActionLevel(otherAction);
  const otherIsAttack = isAttack(otherAction);

  const playerDead = specialSide === "player";
  const aiDead = specialSide === "ai";

  if (otherIsAttack && otherLevel >= 2) {
    return { ...base, playerDead, aiDead, playerHpChange: playerDead ? -1 : 0, aiHpChange: aiDead ? -1 : 0, playerHit: aiDead, aiHit: playerDead, description: `${specialSide === "player" ? "你" : "对手"}的遁术被二级攻击击破！` };
  }

  if (!otherIsAttack && otherLevel >= 2) {
    return { ...base, playerDead, aiDead, playerHpChange: playerDead ? -1 : 0, aiHpChange: aiDead ? -1 : 0, playerHit: aiDead, aiHit: playerDead, description: `${specialSide === "player" ? "你" : "对手"}的遁术被反弹！` };
  }

  const otherSideDead = specialSide === "player" ? "ai" : "player";
  return { ...base, playerDead: otherSideDead === "player", aiDead: otherSideDead === "ai", playerHpChange: otherSideDead === "player" ? -1 : 0, aiHpChange: otherSideDead === "ai" ? -1 : 0, playerHit: otherSideDead === "ai", aiHit: otherSideDead === "player", description: `${specialSide === "player" ? "你" : "对手"}的遁术命中！` };
}

function resolveNormal(
  playerAction: ActionType,
  aiAction: ActionType,
  base: CombatResult,
): CombatResult {
  const pLevel = getActionLevel(playerAction);
  const aLevel = getActionLevel(aiAction);
  const pIsAttack = isAttack(playerAction);
  const aIsAttack = isAttack(aiAction);

  let playerDead = false;
  let aiDead = false;

  if (aIsAttack && aLevel > pLevel) playerDead = true;
  if (pIsAttack && pLevel > aLevel) aiDead = true;
  if (pIsAttack && aIsAttack && pLevel === aLevel) {
    // 同级攻击抵消，双方无伤
    playerDead = false;
    aiDead = false;
  }

  let desc = "";
  if (pIsAttack && aIsAttack && pLevel === aLevel) desc = "同级攻击相互抵消！";
  else if (playerDead && aiDead) desc = "双方同归于尽";
  else if (playerDead) desc = "你被击败";
  else if (aiDead) desc = "对手被击败";
  else if (pIsAttack || aIsAttack) desc = "攻击被挡下或落空";
  else desc = "双方按兵不动";

  return { ...base, playerDead, aiDead, playerHpChange: playerDead ? -1 : 0, aiHpChange: aiDead ? -1 : 0, playerHit: aiDead, aiHit: playerDead, description: desc };
}