// 最小自检脚本：验证 mergeAiWithLocal 强制以本地规则为硬约束。
// 不引入测试框架，用断言 + process.exit。
// 运行：npm run selfcheck

import { mergeAiWithLocal } from './deepseek';
import type { ReviewResult } from '../shared/api-types';

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  \u2713 ${msg}`);
  } else {
    console.error(`  \u2717 ${msg}`);
    failures++;
  }
}

// ====== 伪造本地规则预审结果 ======
const localReview: ReviewResult = {
  ready: [
    { name: '身份证', description: '本人办理：带身份证原件和复印件。' },
    { name: '银行卡', description: '本人办理：带本人银行卡（用于发放补贴）。' },
  ],
  missing: [
    { name: '户口本', description: '带户口本原件（首页加本人页）。' },
    { name: '证件照', description: '准备近期免冠证件照。' },
  ],
  uncertain: [
    { name: '年龄是否符合当地补贴标准？', description: '需以当地窗口要求为准。' },
  ],
  plainChecklist: ['本地清单：带身份证原件和复印件。'],
  riskNotes: ['本地风险：仍有缺失材料，建议补齐后再前往窗口办理。'],
  disclaimer:
    '本规则为 Demo 示例规则，仅用于材料准备参考，正式办理请以广东当地官方窗口要求为准。',
};

// ====== 伪造 AI 结果：故意违反本地规则 ======
// 把"户口本"从 missing 放到 ready；清空 missing；试图改写 ready
const aiResult: ReviewResult = {
  ready: [
    { name: '户口本', description: 'AI 错误：户口本已具备。' },
    { name: '身份证', description: 'AI：身份证已登记。' },
  ],
  missing: [],
  uncertain: [
    { name: '年龄是否符合当地补贴标准？', description: 'AI 复述本地项。' }, // 与本地重复
    { name: '户籍地是否符合当地补贴要求？', description: 'AI 新增不确定项。' },
  ],
  plainChecklist: ['AI 清单：带齐材料去窗口办理。'],
  riskNotes: ['AI 风险：本结果仅供参考。'],
  disclaimer: 'AI 声明：本结果仅供材料准备参考，正式办理请以官方窗口要求为准。',
};

console.log('▶ mergeAiWithLocal 自检');
const merged = mergeAiWithLocal(aiResult, localReview);

console.log('  [本地 ready 不被 AI 改写]');
const mergedReadyNames = merged.ready.map((r) => r.name);
assert(mergedReadyNames.length === 2, 'ready 数量 = 本地 ready 数量 (2)');
assert(mergedReadyNames.includes('身份证'), 'ready 仍包含 身份证');
assert(mergedReadyNames.includes('银行卡'), 'ready 仍包含 银行卡');
assert(!mergedReadyNames.includes('户口本'), 'ready 不包含 户口本（AI 错误被拦截）');

console.log('  [本地 missing 不被 AI 改写，户口本仍在 missing]');
const mergedMissingNames = merged.missing.map((m) => m.name);
assert(mergedMissingNames.length === 2, 'missing 数量 = 本地 missing 数量 (2)');
assert(mergedMissingNames.includes('户口本'), 'missing 仍包含 户口本');
assert(mergedMissingNames.includes('证件照'), 'missing 仍包含 证件照');

console.log('  [uncertain 至少包含本地项，可追加 AI 新增（去重）]');
const mergedUncertainNames = merged.uncertain.map((u) => u.name);
assert(
  mergedUncertainNames.includes('年龄是否符合当地补贴标准？'),
  'uncertain 保留本地项',
);
assert(
  mergedUncertainNames.includes('户籍地是否符合当地补贴要求？'),
  'uncertain 追加 AI 新增项',
);
assert(
  merged.uncertain.length === 2,
  'uncertain 去重后数量 = 2（本地 1 + AI 新增 1）',
);

console.log('  [plainChecklist 优先 AI，非空时使用 AI]');
assert(merged.plainChecklist.length === 1, 'plainChecklist 使用 AI 版本');
assert(
  merged.plainChecklist[0] === 'AI 清单：带齐材料去窗口办理。',
  'plainChecklist 内容 = AI',
);

console.log('  [riskNotes 合并去重]');
assert(
  merged.riskNotes.length === 2,
  'riskNotes 合并后 = 2（本地 1 + AI 1）',
);
assert(
  merged.riskNotes.includes('本地风险：仍有缺失材料，建议补齐后再前往窗口办理。'),
  'riskNotes 保留本地',
);
assert(
  merged.riskNotes.includes('AI 风险：本结果仅供参考。'),
  'riskNotes 追加 AI',
);

console.log('  [disclaimer 保留官方窗口含义]');
assert(
  merged.disclaimer.includes('官方窗口'),
  'disclaimer 包含 "官方窗口"',
);

console.log('  [AI disclaimer 为空/过短时回退本地]');
const mergedEmptyDisclaimer = mergeAiWithLocal(
  { ...aiResult, disclaimer: '' },
  localReview,
);
assert(
  mergedEmptyDisclaimer.disclaimer.includes('官方窗口'),
  'AI disclaimer 为空 → 使用本地',
);
const mergedShortDisclaimer = mergeAiWithLocal(
  { ...aiResult, disclaimer: '仅供参考' },
  localReview,
);
assert(
  mergedShortDisclaimer.disclaimer === localReview.disclaimer,
  'AI disclaimer 过短且无官方关键词 → 使用本地',
);
const mergedNoOfficialDisclaimer = mergeAiWithLocal(
  { ...aiResult, disclaimer: '这是一个比较长的声明但是没有包含关键词的内容' },
  localReview,
);
assert(
  mergedNoOfficialDisclaimer.disclaimer === localReview.disclaimer,
  'AI disclaimer 无官方窗口关键词 → 使用本地',
);

console.log('  [AI plainChecklist 为空时回退本地]');
const mergedEmptyChecklist = mergeAiWithLocal(
  { ...aiResult, plainChecklist: [] },
  localReview,
);
assert(
  mergedEmptyChecklist.plainChecklist.length === 1,
  'AI plainChecklist 为空 → 使用本地',
);
assert(
  mergedEmptyChecklist.plainChecklist[0] === '本地清单：带身份证原件和复印件。',
  'plainChecklist 内容 = 本地',
);

console.log('  [riskNotes 重复时去重]');
const mergedDupRisk = mergeAiWithLocal(
  {
    ...aiResult,
    riskNotes: ['本地风险：仍有缺失材料，建议补齐后再前往窗口办理。', 'AI 新增风险'],
  },
  localReview,
);
assert(
  mergedDupRisk.riskNotes.length === 2,
  'riskNotes 重复项被去重（本地 1 + AI 新增 1）',
);

console.log('');
if (failures === 0) {
  console.log('\u2705 selfcheck 通过：mergeAiWithLocal 正确强制本地规则硬约束。');
  process.exit(0);
} else {
  console.error(`\u274c selfcheck 失败：${failures} 项断言未通过。`);
  process.exit(1);
}
