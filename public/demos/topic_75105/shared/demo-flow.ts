// 第 7 轮：演示闭环纯函数（演示场景、准备度计算、复制清单文本构造）
// 供 src/App.tsx 与 server/demo-flow-selfcheck.ts 共同复用。
// 仅纯函数与常量，不含运行时副作用，不调用网络，不读取 .env。

import type { ReviewResult } from './api-types';

/**
 * 材料白名单（与 src/App.tsx 原 MATERIALS 列表保持一致）。
 * 演示场景的 materials 必须来自此白名单。
 */
export const MATERIALS_WHITELIST: readonly string[] = [
  '身份证',
  '户口本',
  '银行卡',
  '证件照',
  '居住证明',
  '医疗票据',
  '费用清单',
  '诊断证明',
  '代办人身份证',
  '授权委托书',
  '亲属关系证明',
];

/** 演示场景输入参数（点击后自动填充到 App 状态） */
export interface DemoScenarioInput {
  serviceCode: string;
  cityCode: string;
  countyCode: string;
  applicantType: 'self' | 'family';
  age: number;
  livingInGD: 'yes' | 'no';
  materials: string[];
}

/** 完整演示场景定义 */
export interface DemoScenario extends DemoScenarioInput {
  /** 演示场景标识 */
  id: string;
  /** 演示场景标题 */
  title: string;
  /** 演示场景描述 */
  desc: string;
}

/**
 * 三个一键演示场景。
 * countyCode 均来自 data/guangdong-counties.json 真实县级单位：
 * - 440104 广州市 越秀区
 * - 440305 深圳市 南山区
 * - 440402 珠海市 香洲区
 * materials 均来自 MATERIALS_WHITELIST。
 * serviceCode 均对应 data/service-rules.json 中已存在的事项。
 */
export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: 'demo-elderly',
    title: '演示：老年补贴申请（家属代办）',
    desc: '越秀区 · 72 岁 · 家属代办',
    serviceCode: 'elderly-subsidy',
    cityCode: '440100',
    countyCode: '440104',
    applicantType: 'family',
    age: 72,
    livingInGD: 'yes',
    materials: ['身份证', '户口本', '银行卡', '证件照', '代办人身份证'],
  },
  {
    id: 'demo-residence',
    title: '演示：居住证办理（本人办理）',
    desc: '南山区 · 35 岁 · 本人办理',
    serviceCode: 'residence-permit',
    cityCode: '440300',
    countyCode: '440305',
    applicantType: 'self',
    age: 35,
    livingInGD: 'yes',
    materials: ['身份证', '居住证明'],
  },
  {
    id: 'demo-medical',
    title: '演示：医保报销材料整理（本人办理）',
    desc: '香洲区 · 45 岁 · 本人办理',
    serviceCode: 'medical-reimburse',
    cityCode: '440400',
    countyCode: '440402',
    applicantType: 'self',
    age: 45,
    livingInGD: 'yes',
    materials: ['身份证', '银行卡', '医疗票据', '费用清单', '诊断证明'],
  },
];

/** 办事准备度摘要 */
export interface ReadinessSummary {
  ready: number;
  missing: number;
  uncertain: number;
  /** 主标签：材料基本齐备 / 仍有材料缺口 / 存在需人工确认项 */
  label: string;
  /** 简短补充说明 */
  hint: string;
}

/**
 * 计算办事准备度摘要。
 * 只基于 review.ready/missing/uncertain 计算。
 * 不出现"审核通过"字样。
 */
export function computeReadiness(review: ReviewResult): ReadinessSummary {
  const ready = review.ready.length;
  const missing = review.missing.length;
  const uncertain = review.uncertain.length;

  let label: string;
  let hint: string;

  if (missing > 0) {
    label = '仍有材料缺口';
    hint = `还有 ${missing} 项材料未准备，建议补齐后再前往窗口。`;
  } else if (uncertain > 0) {
    label = '存在需人工确认项';
    hint = `材料基本齐备，但有 ${uncertain} 项需现场或电话确认。`;
  } else {
    label = '材料基本齐备';
    hint = '当前已勾选材料覆盖规则要求，仍以窗口实际审核为准。';
  }

  return { ready, missing, uncertain, label, hint };
}

/** 复制清单文本构造输入 */
export interface ChecklistInput {
  serviceName: string;
  regionLabel: string;
  applicantLabel: string;
  review: ReviewResult;
}

/**
 * 构造可复制的纯文本清单。
 * 不包含 API Key、模型名、baseUrl 或内部调试信息。
 * 必须包含免责声明与"不代表官方审核通过"提示。
 */
export function buildChecklistText(input: ChecklistInput): string {
  const { serviceName, regionLabel, applicantLabel, review } = input;
  const lines: string[] = [];
  lines.push('CivicMate 办事材料清单');
  lines.push('========================');
  lines.push(`当前事项：${serviceName}`);
  lines.push(`当前地区：${regionLabel}`);
  lines.push(`办理人类型：${applicantLabel}`);
  lines.push('');
  lines.push('【已具备材料】');
  if (review.ready.length === 0) {
    lines.push('（暂无）');
  } else {
    review.ready.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}${it.description ? ` — ${it.description}` : ''}`);
    });
  }
  lines.push('');
  lines.push('【缺失材料】');
  if (review.missing.length === 0) {
    lines.push('（无缺失材料）');
  } else {
    review.missing.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}${it.description ? ` — ${it.description}` : ''}`);
    });
  }
  lines.push('');
  lines.push('【待确认事项】');
  if (review.uncertain.length === 0) {
    lines.push('（无需额外确认）');
  } else {
    review.uncertain.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}`);
    });
  }
  lines.push('');
  lines.push('【老人友好清单】');
  if (review.plainChecklist.length === 0) {
    lines.push('（暂无）');
  } else {
    review.plainChecklist.forEach((t, i) => {
      lines.push(`${i + 1}. ${t}`);
    });
  }
  lines.push('');
  lines.push('【风险提示】');
  if (review.riskNotes.length === 0) {
    lines.push('（暂无）');
  } else {
    review.riskNotes.forEach((t, i) => {
      lines.push(`${i + 1}. ${t}`);
    });
  }
  lines.push('');
  lines.push('【免责声明】');
  lines.push(review.disclaimer);
  lines.push('本清单由 CivicMate Demo 生成，仅供材料准备参考，不代表官方审核通过。');
  return lines.join('\n');
}
