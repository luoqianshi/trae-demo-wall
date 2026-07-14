export type ActionType =
  | "charge"
  | "normalAttack"
  | "defend"
  | "level2Attack"
  | "level2Defend"
  | "fireStyle"
  | "waterStyle"
  | "windStyle"
  | "bloomTechnique";

export interface ActionDefinition {
  id: ActionType;
  name: string;
  cost: number;
  level: number;
  isAttack: boolean;
  isSpecial: boolean;
  isInstantKill: boolean;
  isSelfBuff: boolean;
  description: string;
}

export const ACTIONS: Record<ActionType, ActionDefinition> = {
  charge: {
    id: "charge",
    name: "蓄",
    cost: -1,
    level: 0,
    isAttack: false,
    isSpecial: false,
    isInstantKill: false,
    isSelfBuff: false,
    description: "蓄力 +1",
  },
  normalAttack: {
    id: "normalAttack",
    name: "普攻",
    cost: 1,
    level: 1,
    isAttack: true,
    isSpecial: false,
    isInstantKill: false,
    isSelfBuff: false,
    description: "消耗 1 蓄，1 级攻击",
  },
  defend: {
    id: "defend",
    name: "防",
    cost: 0,
    level: 1,
    isAttack: false,
    isSpecial: false,
    isInstantKill: false,
    isSelfBuff: false,
    description: "不消耗蓄，1 级防御",
  },
  level2Attack: {
    id: "level2Attack",
    name: "二级攻击",
    cost: 3,
    level: 2,
    isAttack: true,
    isSpecial: false,
    isInstantKill: false,
    isSelfBuff: false,
    description: "消耗 3 蓄，2 级攻击",
  },
  level2Defend: {
    id: "level2Defend",
    name: "二级防御",
    cost: 1,
    level: 2,
    isAttack: false,
    isSpecial: false,
    isInstantKill: false,
    isSelfBuff: false,
    description: "消耗 1 蓄，2 级防御",
  },
  fireStyle: {
    id: "fireStyle",
    name: "火遁",
    cost: 2,
    level: 1,
    isAttack: true,
    isSpecial: true,
    isInstantKill: false,
    isSelfBuff: false,
    description: "消耗 2 蓄，克一级/蓄，被二级反弹",
  },
  waterStyle: {
    id: "waterStyle",
    name: "水遁",
    cost: 2,
    level: 1,
    isAttack: true,
    isSpecial: true,
    isInstantKill: false,
    isSelfBuff: false,
    description: "消耗 2 蓄，克一级/蓄，被二级反弹",
  },
  windStyle: {
    id: "windStyle",
    name: "风遁",
    cost: 8,
    level: 3,
    isAttack: true,
    isSpecial: true,
    isInstantKill: true,
    isSelfBuff: false,
    description: "消耗 8 蓄，秒杀对方（无视一切）",
  },
  bloomTechnique: {
    id: "bloomTechnique",
    name: "开花术",
    cost: 0,
    level: 0,
    isAttack: false,
    isSpecial: true,
    isInstantKill: false,
    isSelfBuff: true,
    description: "一局一次，HP≥3时分裂为2个2血分身",
  },
};

export const ACTION_ORDER: ActionType[] = [
  "charge",
  "normalAttack",
  "defend",
  "level2Attack",
  "level2Defend",
  "fireStyle",
  "waterStyle",
  "windStyle",
  "bloomTechnique",
];

export function isActionValid(action: ActionType, energy: number): boolean {
  const required = ACTIONS[action].cost;
  return required <= energy;
}

export function getEnergyDelta(action: ActionType): number {
  return -ACTIONS[action].cost;
}

export function getActionLevel(action: ActionType): number {
  return ACTIONS[action].level;
}

export function isAttack(action: ActionType): boolean {
  return ACTIONS[action].isAttack;
}

export function isSpecial(action: ActionType): boolean {
  return ACTIONS[action].isSpecial;
}

export function isInstantKill(action: ActionType): boolean {
  return ACTIONS[action].isInstantKill;
}

export function isSelfBuff(action: ActionType): boolean {
  return ACTIONS[action].isSelfBuff;
}