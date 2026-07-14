/**
 * 策略机器人 — 纯前端 minimax 搜索
 * 深度 6 搜索 + 精确启发式 + Map 缓存 + 战术覆盖
 */
import { ActionType, ACTIONS, ACTION_ORDER, isSelfBuff } from "./actions";
import { resolveRound, type CombatResult } from "./combat";

const MAX_CLONES = 2;
const DEFAULT_DEPTH = 4;

// 状态键: "hp,energy,clones,bloom"
type StateKey = string;

function mk(hp: number, energy: number, clones: number, bloom: boolean): StateKey {
  return `${hp},${energy},${clones},${bloom ? 1 : 0}`;
}

function totalHp(key: StateKey): number {
  const hp = Number(key[0]);
  const clones = Number(key[4]);
  if (clones > 1) return hp + (clones - 1) * 2;
  return hp;
}

function getValidActs(energy: number, hp: number, bloomUsed: boolean): ActionType[] {
  return ACTION_ORDER.filter((a) => {
    if (ACTIONS[a].cost > energy) return false;
    if (isSelfBuff(a) && (bloomUsed || hp < 3)) return false;
    return true;
  });
}

// ============ 启发式剪枝 ============

/** 剪枝掉明显无意义的动作，缩小搜索空间 */
function pruneActions(
  actions: ActionType[],
  myEnergy: number, myHp: number, myClones: number, myBloom: boolean,
  oppEnergy: number, oppHp: number, oppClones: number, oppBloom: boolean,
): ActionType[] {
  let pruned = [...actions];

  // 对方0蓄 → 不可能出任何攻击 → 不防
  if (oppEnergy === 0) {
    pruned = pruned.filter(a => a !== "defend" && a !== "level2Defend");
  }
  // 对方0-1蓄 → 不可能出二级攻击 → 不二级防
  if (oppEnergy <= 1) {
    pruned = pruned.filter(a => a !== "level2Defend");
  }
  // 对方有2+分身且HP>1 → 风遁杀不死
  if (oppClones > 1 && oppHp > 1) {
    pruned = pruned.filter(a => a !== "windStyle");
  }
  // 对方高蓄+我无保护 → 必须防/风遁对放
  if (oppEnergy >= 8 && myClones <= 1 && !myBloom) {
    const keep = new Set(["windStyle", "defend", "level2Defend", "bloomTechnique"]);
    pruned = pruned.filter(a => keep.has(a));
  }
  // 我有风遁+对方无保护 → 直接秒
  if (myEnergy >= 8 && pruned.includes("windStyle") && (oppClones <= 1 || oppHp <= 1)) {
    return ["windStyle"];
  }
  // 对方1血+无分身 → 斩杀线
  if (oppHp <= 1 && oppClones <= 1) {
    const keep = new Set(["normalAttack", "level2Attack", "fireStyle", "waterStyle", "windStyle", "charge"]);
    pruned = pruned.filter(a => keep.has(a));
  }

  return pruned.length > 0 ? pruned : actions;
}

// ============ 启发式评估 ============

function evaluate(ai: StateKey, opp: StateKey): number {
  const aiTotal = totalHp(ai);
  const oppTotal = totalHp(opp);
  if (aiTotal === 0) return 0.0;
  if (oppTotal === 0) return 1.0;

  const aiEnergy = Number(ai[2]);
  const oppEnergy = Number(opp[2]);
  const aiHp = Number(ai[0]);
  const oppHp = Number(opp[0]);
  const aiClones = Number(ai[4]);
  const oppClones = Number(opp[4]);
  const aiBloom = ai[6] === "1";
  const oppBloom = opp[6] === "1";

  let score = 0.5;

  // 1. HP 差（最优先级，活着才能赢）
  score += (aiTotal - oppTotal) * 0.22;

  // 2. 惩罚对方高能量：如果对方已经有很多能量，我必须主动进攻
  if (oppEnergy >= 5 && oppEnergy > aiEnergy + 2) {
    // 对方高能量威胁 → 减分，逼着我进攻
    score -= 0.12;
  }
  // 3. 我已经有高能量，但不出招 → 惩罚"继续蓄"
  if (aiEnergy >= 6 && oppEnergy < 5) {
    // 已经能出大招了还蓄 → 对手没威胁不如早点出手
    score -= 0.05;
  }
  // 能量差权重降低，不再盲目蓄
  score += (aiEnergy - oppEnergy) * 0.02;

  // 4. 风遁秒杀威胁（最致命）
  const aiWind = aiEnergy >= 8;
  const oppWind = oppEnergy >= 8;
  const aiProtected = aiClones > 1 || (!aiBloom && aiHp >= 3);
  const oppProtected = oppClones > 1 || (!oppBloom && oppHp >= 3);

  if (aiWind && !oppProtected) score += 0.45;
  if (oppWind && !aiProtected) score -= 0.45;

  // 5. 如果对方有风遁，但我还能开花 → 加分
  if (oppWind && !aiProtected && !aiBloom && aiHp >= 3) {
    score += 0.10;
  }

  // 6. 开花术可用性：开局没开花有+HP就是优势
  if (!aiBloom && aiHp >= 3) score += 0.08;
  if (!oppBloom && oppHp >= 3) score -= 0.06;

  // 7. 分身优势（多一条命就是优势）
  if (aiClones > oppClones) score += 0.08;
  if (oppClones > aiClones) score -= 0.08;

  // 8. 低血对方：积极斩杀
  if (oppHp <= 2 && oppClones <= 1) {
    score += 0.15 * (3 - oppHp);
  }

  return Math.max(0.0, Math.min(1.0, score));
}

// ============ 模拟一步 ============

function simulateStep(
  aiKey: StateKey, oppKey: StateKey, aiAct: ActionType, oppAct: ActionType,
): [StateKey, StateKey] {
  let aiHp = Number(aiKey[0]);
  let aiEnergy = Number(aiKey[2]);
  let aiClones = Number(aiKey[4]);
  let aiBloom = aiKey[6] === "1";
  let oppHp = Number(oppKey[0]);
  let oppEnergy = Number(oppKey[2]);
  let oppClones = Number(oppKey[4]);
  let oppBloom = oppKey[6] === "1";

  if (isSelfBuff(aiAct) && !aiBloom && aiHp >= 3) {
    aiBloom = true;
    aiClones = MAX_CLONES;
    aiHp = 2;
  }
  if (isSelfBuff(oppAct) && !oppBloom && oppHp >= 3) {
    oppBloom = true;
    oppClones = MAX_CLONES;
    oppHp = 2;
  }

  aiEnergy = Math.max(0, aiEnergy - ACTIONS[aiAct].cost);
  oppEnergy = Math.max(0, oppEnergy - ACTIONS[oppAct].cost);

  const result: CombatResult = resolveRound(aiAct, oppAct);
  aiHp += result.playerHpChange;
  oppHp += result.aiHpChange;

  if (aiHp <= 0 && aiClones > 1) {
    aiClones--;
    aiHp = 2;
    aiEnergy = 0;
  } else if (aiHp < 0) aiHp = 0;
  if (oppHp <= 0 && oppClones > 1) {
    oppClones--;
    oppHp = 2;
    oppEnergy = 0;
  } else if (oppHp < 0) oppHp = 0;

  return [mk(aiHp, aiEnergy, aiClones, aiBloom), mk(oppHp, oppEnergy, oppClones, oppBloom)];
}

// ============ Minimax 搜索 ============

const _cache = new Map<string, number>();

function gameValue(aiKey: StateKey, oppKey: StateKey, depth: number): number {
  const cacheKey = `${aiKey}|${oppKey}|${depth}`;
  const cached = _cache.get(cacheKey);
  if (cached !== undefined) return cached;

  if (totalHp(aiKey) === 0) {
    _cache.set(cacheKey, 0.0);
    return 0.0;
  }
  if (totalHp(oppKey) === 0) {
    _cache.set(cacheKey, 1.0);
    return 1.0;
  }
  if (depth === 0) {
    const h = evaluate(aiKey, oppKey);
    _cache.set(cacheKey, h);
    return h;
  }

  const aiEnergy = Number(aiKey[2]);
  const aiHp = Number(aiKey[0]);
  const aiClones = Number(aiKey[4]);
  const aiBloom = aiKey[6] === "1";
  const oppEnergy = Number(oppKey[2]);
  const oppHp = Number(oppKey[0]);
  const oppClones = Number(oppKey[4]);
  const oppBloom = oppKey[6] === "1";

  const aiActs = pruneActions(
    getValidActs(aiEnergy, aiHp, aiBloom),
    aiEnergy, aiHp, aiClones, aiBloom,
    oppEnergy, oppHp, oppClones, oppBloom,
  );
  const oppActs = pruneActions(
    getValidActs(oppEnergy, oppHp, oppBloom),
    oppEnergy, oppHp, oppClones, oppBloom,
    aiEnergy, aiHp, aiClones, aiBloom,
  );
  if (aiActs.length === 0 || oppActs.length === 0) {
    const h = evaluate(aiKey, oppKey);
    _cache.set(cacheKey, h);
    return h;
  }

  let bestVal = -1.0;
  for (const a of aiActs) {
    let worstForA = 1.0;
    for (const o of oppActs) {
      const [newAi, newOpp] = simulateStep(aiKey, oppKey, a, o);
      const val = gameValue(newAi, newOpp, depth - 1);
      if (val < worstForA) worstForA = val;
    }
    if (worstForA > bestVal) bestVal = worstForA;
  }

  _cache.set(cacheKey, bestVal);
  return bestVal;
}

// ============ 主接口 ============

export function getBotAction(
  myEnergy: number, myHp: number, myClones: number, myBloom: boolean,
  oppEnergy: number, oppHp: number, oppClones: number, oppBloom: boolean,
  depth: number = DEFAULT_DEPTH,
): ActionType {
  const valid = getValidActs(myEnergy, myHp, myBloom);
  if (valid.length === 0) return "charge";

  // ---- 战术覆盖（硬规则，不依赖搜索） ----

  // 1. 风遁秒杀
  if (myEnergy >= 8 && valid.includes("windStyle")) {
    if (oppEnergy < 8 || oppClones <= 1) return "windStyle";
  }

  // 2. 防风遁
  if (oppEnergy >= 8 && myClones <= 1 && !myBloom) {
    if (myEnergy >= 8 && valid.includes("windStyle")) return "windStyle";
    if (valid.includes("level2Defend")) return "level2Defend";
    if (valid.includes("defend")) return "defend";
  }

  // 3. 斩杀线
  if (oppHp <= 1 && oppClones <= 1) {
    if (myEnergy >= 3 && valid.includes("level2Attack")) return "level2Attack";
    if (myEnergy >= 1 && valid.includes("normalAttack")) return "normalAttack";
    if (myEnergy >= 2 && valid.includes("fireStyle")) return "fireStyle";
  }

  // 4. 开花术（对手无风遁威胁时）
  if (oppEnergy < 8 && valid.includes("bloomTechnique")) {
    return "bloomTechnique";
  }

  // ---- Minimax 搜索 ----
  const aiKey = mk(myHp, myEnergy, myClones, myBloom);
  const oppKey = mk(oppHp, oppEnergy, oppClones, oppBloom);

  const actions = pruneActions(
    getValidActs(myEnergy, myHp, myBloom),
    myEnergy, myHp, myClones, myBloom,
    oppEnergy, oppHp, oppClones, oppBloom,
  );
  const oppActs = pruneActions(
    getValidActs(oppEnergy, oppHp, oppBloom),
    oppEnergy, oppHp, oppClones, oppBloom,
    myEnergy, myHp, myClones, myBloom,
  );

  if (oppActs.length === 0) {
    return actions[Math.floor(Math.random() * actions.length)];
  }

  let bestActions: ActionType[] = [];
  let bestValue = -1.0;

  for (const a of actions) {
    let worstForA = 1.0;
    for (const o of oppActs) {
      const [newAi, newOpp] = simulateStep(aiKey, oppKey, a, o);
      const val = gameValue(newAi, newOpp, depth - 1);
      if (val < worstForA) worstForA = val;
    }
    if (worstForA > bestValue + 1e-9) {
      bestValue = worstForA;
      bestActions = [a];
    } else if (Math.abs(worstForA - bestValue) < 1e-9) {
      bestActions.push(a);
    }
  }

  return bestActions[Math.floor(Math.random() * bestActions.length)];
}

export function clearCache(): void {
  _cache.clear();
}

export function getCacheSize(): number {
  return _cache.size;
}