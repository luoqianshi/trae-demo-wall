// 材料预审本地规则引擎
// 第 3 轮：从 data/service-rules.json 读取规则，实现不依赖 AI 的本地规则预审。
// 第 4 轮：保留作为 AI 输入和失败兜底。DeepSeek V4 接入在 server/deepseek.ts。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { ReviewItem, ReviewResult } from '../shared/api-types';

// 预审结果条目与结果结构与前后端共享类型保持一致
export type { ReviewItem, ReviewResult };

// ====== 规则数据结构 ======
type ConditionField =
  | 'applicantType'
  | 'livingInGD'
  | 'ageAtLeast'
  | 'materialSelected';

interface RuleCondition {
  field: ConditionField;
  /** 默认 eq。ageAtLeast 一律按 gte 比较；materialSelected 一律按 contains 比较。 */
  op?: 'eq' | 'ne' | 'gte' | 'contains';
  value: string | number;
}

interface RuleMaterial {
  materialCode: string;
  materialName: string;
  required: boolean;
  conditions: RuleCondition[];
  plainText: string;
  riskNote?: string;
}

interface ConfirmQuestion {
  question: string;
  conditions: RuleCondition[];
}

interface ServiceRule {
  serviceCode: string;
  serviceName: string;
  description: string;
  disclaimer: string;
  requiredMaterials: RuleMaterial[];
  conditionalMaterials: RuleMaterial[];
  confirmQuestions: ConfirmQuestion[];
}

// ====== 预审输入结构（服务端专用） ======
export interface ReviewInput {
  serviceCode?: string;
  county?: string;
  applicantType?: 'self' | 'family';
  age?: number;
  livingInGD?: 'yes' | 'no';
  materials?: string[];
}

// ====== 规则加载（启动时一次性读入） ======
const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../data/service-rules.json');
const RULES: ServiceRule[] = JSON.parse(readFileSync(RULES_PATH, 'utf8'));

/**
 * 按 serviceCode 查找规则（供 index.ts 获取事项名称等信息）。
 */
export function findServiceRule(
  serviceCode?: string,
): ServiceRule | undefined {
  return RULES.find((r) => r.serviceCode === serviceCode);
}

// ====== 条件判断 ======
function evalCondition(cond: RuleCondition, input: ReviewInput): boolean {
  const { field, value } = cond;
  if (field === 'applicantType') {
    return input.applicantType === value;
  }
  if (field === 'livingInGD') {
    return input.livingInGD === value;
  }
  if (field === 'ageAtLeast') {
    const raw = input.age;
    const age =
      typeof raw === 'number' ? raw : raw === undefined ? NaN : Number(raw);
    return Number.isFinite(age) && age >= Number(value);
  }
  if (field === 'materialSelected') {
    return (input.materials ?? []).includes(String(value));
  }
  return false;
}

function evalAllConditions(
  conds: RuleCondition[],
  input: ReviewInput,
): boolean {
  if (conds.length === 0) return true;
  return conds.every((c) => evalCondition(c, input));
}

// ====== 预审主函数 ======
/**
 * 本地规则预审：不调用 DeepSeek，纯规则匹配。
 * - 用户已勾选且规则需要 → ready
 * - 规则需要但用户未勾选 → missing
 * - conditionalMaterials 仅在条件命中时参与判断
 * - confirmQuestions（条件命中）全部进入 uncertain
 */
export async function reviewMaterials(
  input: ReviewInput,
): Promise<ReviewResult> {
  const rule = RULES.find((r) => r.serviceCode === input.serviceCode);

  if (!rule) {
    return {
      ready: [],
      missing: [],
      uncertain: [],
      plainChecklist: [],
      riskNotes: ['未找到对应事项规则，请检查 serviceCode。'],
      disclaimer:
        '本结果由 CivicMate Demo 生成，仅供参考，不构成任何行政或法律意见。' +
        '正式办理请以办事机关要求为准。',
    };
  }

  const ready: ReviewItem[] = [];
  const missing: ReviewItem[] = [];
  const uncertain: ReviewItem[] = [];
  const plainChecklist: string[] = [];
  const riskNotes: string[] = [];
  const selected = new Set(input.materials ?? []);

  // 生效材料 = 必需材料 + 命中条件的条件材料
  const activeMaterials: RuleMaterial[] = [...rule.requiredMaterials];
  for (const cm of rule.conditionalMaterials) {
    if (evalAllConditions(cm.conditions, input)) {
      activeMaterials.push(cm);
    }
  }

  for (const m of activeMaterials) {
    if (selected.has(m.materialName)) {
      ready.push({ name: m.materialName, description: m.plainText });
      plainChecklist.push(`已具备：${m.plainText}`);
      if (m.riskNote) riskNotes.push(`${m.materialName}：${m.riskNote}`);
    } else {
      missing.push({ name: m.materialName, description: m.plainText });
      plainChecklist.push(`还需准备：${m.plainText}`);
    }
  }

  for (const q of rule.confirmQuestions) {
    if (evalAllConditions(q.conditions, input)) {
      uncertain.push({ name: q.question });
    }
  }

  if (missing.length > 0) {
    riskNotes.push('仍有缺失材料，建议补齐后再前往窗口办理。');
  }

  return {
    ready,
    missing,
    uncertain,
    plainChecklist,
    riskNotes,
    disclaimer: rule.disclaimer,
  };
}
