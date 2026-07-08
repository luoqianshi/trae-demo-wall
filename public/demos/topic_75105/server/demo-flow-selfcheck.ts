// demo-flow-selfcheck: 演示闭环纯函数自检（第 7 轮）
// 不发真实网络请求，不依赖真实 API Key，不读取 .env。
// 验证：
//   1. 三个演示场景 serviceCode 都合法（存在于 data/service-rules.json）。
//   2. 三个演示场景 countyCode 都能在 data/guangdong-counties.json 找到。
//   3. 三个演示场景 materials 都来自 MATERIALS_WHITELIST。
//   4. computeReadiness 不出现"审核通过"字样。
//   5. buildChecklistText 包含免责声明与"不代表官方审核通过"提示。
//   6. buildChecklistText 不含 API Key / 模型名 / baseUrl / 内部调试信息。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { ReviewResult } from '../shared/api-types';
import {
  buildChecklistText,
  computeReadiness,
  DEMO_SCENARIOS,
  MATERIALS_WHITELIST,
} from '../shared/demo-flow';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../data/service-rules.json');
const COUNTIES_PATH = resolve(__dirname, '../data/guangdong-counties.json');

interface ServiceRule {
  serviceCode: string;
  serviceName: string;
}

interface CountyItem {
  countyCode: string;
  countyName: string;
  cityCode: string;
  cityName: string;
}

const RULES: ServiceRule[] = JSON.parse(readFileSync(RULES_PATH, 'utf8'));
const COUNTIES: CountyItem[] = JSON.parse(readFileSync(COUNTIES_PATH, 'utf8'));

const VALID_SERVICE_CODES = new Set(RULES.map((r) => r.serviceCode));
const VALID_COUNTY_CODES = new Set(COUNTIES.map((c) => c.countyCode));
const MATERIALS_SET = new Set(MATERIALS_WHITELIST);

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.error('  ✗ FAIL:', msg);
  }
}

/** 构造一个含 missing / uncertain / ready 的合成 review 结果，用于纯函数测试。 */
function makeSyntheticReview(): ReviewResult {
  return {
    ready: [
      { name: '身份证', description: '带身份证原件和复印件。' },
      { name: '户口本', description: '带户口本原件（首页加本人页）。' },
    ],
    missing: [{ name: '证件照', description: '准备近期免冠证件照。' }],
    uncertain: [{ name: '是否需要提供居住证明？' }],
    plainChecklist: ['已具备：身份证', '还需准备：证件照'],
    riskNotes: ['仍有缺失材料，建议补齐后再前往窗口办理。'],
    disclaimer:
      '本规则为 Demo 示例规则，仅用于材料准备参考，正式办理请以广东当地官方窗口要求为准。',
  };
}

console.log('\n[演示场景 serviceCode 合法性]');
for (const s of DEMO_SCENARIOS) {
  assert(
    VALID_SERVICE_CODES.has(s.serviceCode),
    `${s.id} serviceCode=${s.serviceCode} 存在于 service-rules.json`,
  );
}

console.log('\n[演示场景 countyCode 真实性]');
for (const s of DEMO_SCENARIOS) {
  assert(
    VALID_COUNTY_CODES.has(s.countyCode),
    `${s.id} countyCode=${s.countyCode} 存在于 guangdong-counties.json`,
  );
  // 同步验证 cityCode 与 countyCode 对应同一地级市
  const county = COUNTIES.find((c) => c.countyCode === s.countyCode);
  assert(
    !!county && county.cityCode === s.cityCode,
    `${s.id} cityCode=${s.cityCode} 与 countyCode 对应同一地级市`,
  );
}

console.log('\n[演示场景 materials 白名单]');
for (const s of DEMO_SCENARIOS) {
  for (const m of s.materials) {
    assert(MATERIALS_SET.has(m), `${s.id} material="${m}" 在白名单内`);
  }
  assert(
    s.materials.length > 0,
    `${s.id} 至少包含 1 个材料（避免空场景）`,
  );
}

console.log('\n[演示场景字段类型完整性]');
for (const s of DEMO_SCENARIOS) {
  assert(
    s.applicantType === 'self' || s.applicantType === 'family',
    `${s.id} applicantType 合法`,
  );
  assert(
    s.livingInGD === 'yes' || s.livingInGD === 'no',
    `${s.id} livingInGD 合法`,
  );
  assert(
    typeof s.age === 'number' && s.age > 0 && s.age < 150,
    `${s.id} age=${s.age} 为合理数值`,
  );
}

console.log('\n[computeReadiness 不出现"审核通过"字样]');
{
  const review = makeSyntheticReview();
  const summary = computeReadiness(review);
  const allText = `${summary.label} ${summary.hint}`;
  assert(
    !allText.includes('审核通过'),
    '准备度摘要不包含"审核通过"字样',
  );
  assert(
    summary.ready === 2 && summary.missing === 1 && summary.uncertain === 1,
    `数量统计正确（ready=2, missing=1, uncertain=1）`,
  );
  assert(
    summary.label === '仍有材料缺口',
    `missing>0 时 label="仍有材料缺口"（实际: ${summary.label}）`,
  );
}
{
  const review: ReviewResult = {
    ready: [{ name: '身份证' }],
    missing: [],
    uncertain: [{ name: '需现场确认' }],
    plainChecklist: [],
    riskNotes: [],
    disclaimer: 'demo',
  };
  const summary = computeReadiness(review);
  assert(
    summary.label === '存在需人工确认项',
    `missing=0, uncertain>0 时 label="存在需人工确认项"（实际: ${summary.label}）`,
  );
}
{
  const review: ReviewResult = {
    ready: [{ name: '身份证' }],
    missing: [],
    uncertain: [],
    plainChecklist: [],
    riskNotes: [],
    disclaimer: 'demo',
  };
  const summary = computeReadiness(review);
  assert(
    summary.label === '材料基本齐备',
    `missing=0, uncertain=0 时 label="材料基本齐备"（实际: ${summary.label}）`,
  );
  assert(
    !summary.hint.includes('审核通过'),
    '"材料基本齐备" hint 不包含"审核通过"',
  );
}

console.log('\n[buildChecklistText 包含免责声明]');
{
  const review = makeSyntheticReview();
  const text = buildChecklistText({
    serviceName: '老年补贴申请材料预审',
    regionLabel: '广东省 / 广州市 / 越秀区',
    applicantLabel: '家属代办',
    review,
  });
  assert(text.includes('免责声明'), '清单文本包含"免责声明"段');
  assert(
    text.includes('不代表官方审核通过'),
    '清单文本包含"不代表官方审核通过"提示',
  );
  assert(text.includes('当前事项'), '清单文本包含"当前事项"');
  assert(text.includes('当前地区'), '清单文本包含"当前地区"');
  assert(text.includes('办理人类型'), '清单文本包含"办理人类型"');
  assert(text.includes('已具备材料'), '清单文本包含"已具备材料"段');
  assert(text.includes('缺失材料'), '清单文本包含"缺失材料"段');
  assert(text.includes('待确认事项'), '清单文本包含"待确认事项"段');
  assert(text.includes('老人友好清单'), '清单文本包含"老人友好清单"段');
  assert(text.includes('风险提示'), '清单文本包含"风险提示"段');
}

console.log('\n[buildChecklistText 不含敏感信息]');
{
  const review = makeSyntheticReview();
  const text = buildChecklistText({
    serviceName: '老年补贴申请材料预审',
    regionLabel: '广东省 / 广州市 / 越秀区',
    applicantLabel: '家属代办',
    review,
  });
  const lower = text.toLowerCase();
  assert(!lower.includes('apikey'), '清单文本不含 "apikey"');
  assert(!lower.includes('api_key'), '清单文本不含 "api_key"');
  assert(!lower.includes('bearer'), '清单文本不含 "bearer"');
  assert(!lower.includes('authorization'), '清单文本不含 "authorization"');
  assert(
    !lower.includes('deepseek-api-key'),
    '清单文本不含 "deepseek-api-key"',
  );
  assert(!lower.includes('ark-api-key'), '清单文本不含 "ark-api-key"');
  assert(
    !text.includes('doubao-seed-2-1-pro'),
    '清单文本不含模型名 "doubao-seed-2-1-pro"',
  );
  assert(
    !text.includes('ark.cn-beijing.volces.com'),
    '清单文本不含 baseUrl "ark.cn-beijing.volces.com"',
  );
}

console.log('\n[buildChecklistText 空材料场景仍含免责声明]');
{
  const review: ReviewResult = {
    ready: [],
    missing: [],
    uncertain: [],
    plainChecklist: [],
    riskNotes: [],
    disclaimer: 'demo 免责声明',
  };
  const text = buildChecklistText({
    serviceName: '测试事项',
    regionLabel: '广东省 / 测试市 / 测试区',
    applicantLabel: '本人办理',
    review,
  });
  assert(text.includes('免责声明'), '空场景仍包含"免责声明"段');
  assert(text.includes('（暂无）'), '空 ready 段显示"（暂无）"');
  assert(
    text.includes('不代表官方审核通过'),
    '空场景仍包含"不代表官方审核通过"提示',
  );
}

console.log('\n[演示场景数量为 3]');
assert(
  DEMO_SCENARIOS.length === 3,
  `DEMO_SCENARIOS 数量=3（实际: ${DEMO_SCENARIOS.length}）`,
);

console.log('\n[演示场景 id 唯一]');
const ids = DEMO_SCENARIOS.map((s) => s.id);
assert(new Set(ids).size === ids.length, '演示场景 id 不重复');

console.log('\n========== demo-flow-selfcheck 汇总 ==========');
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  console.error('❌ demo-flow-selfcheck 失败：演示场景或纯函数校验未通过。');
  process.exit(1);
}
console.log('✅ demo-flow-selfcheck 通过：演示场景合法、纯函数校验正确。');
