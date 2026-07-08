// identify-selfcheck: 不启动 HTTP 服务，直接调用 identify.ts 内部函数
// 验证 userLabel 在 skipped / normalizeAiItems / buildPassthroughItems / ensureUserLabels
// 以及含中文/空格文件名场景下的保留。不调用真实 DeepSeek API。
// 不打印文件内容、API Key、身份证号、银行卡号。

import 'dotenv/config';
import {
  buildPassthroughItems,
  ensureUserLabels,
  identifyMaterials,
  normalizeAiItems,
  parseUserLabels,
  type IdentifyFileInput,
  type IdentifyRequestInput,
} from './identify';

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

function makeFile(
  name: string,
  mime: string,
  size = 10,
): IdentifyFileInput {
  return {
    originalname: name,
    mimetype: mime,
    size,
    buffer: Buffer.from('identify-selfcheck-placeholder', 'utf-8'),
  };
}

function makeInput(
  files: IdentifyFileInput[],
  userLabels?: Record<string, string>,
  serviceCode = 'elderly-subsidy',
): IdentifyRequestInput {
  return { files, serviceCode, userLabels };
}

// ====== 1. parseUserLabels 解析鲁棒性 ======
console.log('\n[parseUserLabels 解析鲁棒性]');

{
  // 字符串 JSON（multipart/form-data text field 场景）
  const r = parseUserLabels('{"civicmate-test-id.png":"身份证"}');
  assert(r !== undefined, '字符串 JSON 解析返回非 undefined');
  assert(r?.['civicmate-test-id.png'] === '身份证', '字符串 JSON key/value 正确');
}

{
  // 已解析对象
  const r = parseUserLabels({ 'a.png': '户口本' });
  assert(r?.['a.png'] === '户口本', '已解析对象 key/value 正确');
}

{
  // 含中文文件名
  const r = parseUserLabels('{"身份证正面.png":"身份证"}');
  assert(r?.['身份证正面.png'] === '身份证', '中文文件名 key 正确匹配');
}

{
  // 含空格文件名
  const r = parseUserLabels('{"my id card.png":"身份证"}');
  assert(r?.['my id card.png'] === '身份证', '含空格文件名 key 正确匹配');
}

{
  // 无效 JSON → undefined（不抛异常）
  const r = parseUserLabels('not-a-json');
  assert(r === undefined, '无效 JSON 返回 undefined');
}

{
  // 空字符串 → undefined
  const r = parseUserLabels('   ');
  assert(r === undefined, '空白字符串返回 undefined');
}

{
  // null/undefined → undefined
  assert(parseUserLabels(null) === undefined, 'null 返回 undefined');
  assert(parseUserLabels(undefined) === undefined, 'undefined 返回 undefined');
}

{
  // 非字符串 value 被过滤
  const r = parseUserLabels({ 'a.png': 123, 'b.png': '银行卡' });
  assert(r?.['b.png'] === '银行卡', '非字符串 value 被过滤，字符串 value 保留');
  assert(r?.['a.png'] === undefined, '数字 value 不进入结果');
}

// ====== 2. normalizeAiItems 成功路径保留 userLabel ======
console.log('\n[normalizeAiItems 成功路径 userLabel 保留]');

{
  const input = makeInput(
    [makeFile('civicmate-test-id.png', 'image/png')],
    { 'civicmate-test-id.png': '身份证' },
  );
  const aiResp = {
    items: [
      {
        fileName: 'civicmate-test-id.png',
        suggestedMaterial: '身份证',
        confidence: 'medium',
        notes: '疑似身份证。',
      },
    ],
  };
  const items = normalizeAiItems(aiResp, input);
  assert(items.length === 1, 'normalizeAiItems 返回 1 个 item');
  assert(items[0].fileName === 'civicmate-test-id.png', 'fileName 正确');
  assert(items[0].userLabel === '身份证', 'userLabel 保留为"身份证"');
  assert(items[0].suggestedMaterial === '身份证', 'suggestedMaterial 正确');
  assert(items[0].confidence === 'medium', 'confidence 正确');
}

{
  // AI 返回中无该文件名，仍应保留 userLabel
  const input = makeInput(
    [makeFile('unknown.png', 'image/png')],
    { 'unknown.png': '户口本' },
  );
  const items = normalizeAiItems({ items: [] }, input);
  assert(items[0].userLabel === '户口本', 'AI 无该文件名时仍保留 userLabel');
}

// ====== 3. buildPassthroughItems 兜底路径保留 userLabel ======
console.log('\n[buildPassthroughItems 兜底路径 userLabel 保留]');

{
  const input = makeInput(
    [makeFile('civicmate-test-id.png', 'image/png')],
    { 'civicmate-test-id.png': '身份证' },
  );
  const items = buildPassthroughItems(input, 'AI 识别失败。');
  assert(items[0].userLabel === '身份证', 'fallback item.userLabel=身份证');
  assert(items[0].confidence === 'unknown', 'fallback confidence=unknown');
  assert(items[0].notes === 'AI 识别失败。', 'fallback notes 正确');
}

// ====== 4. ensureUserLabels 安全网 ======
console.log('\n[ensureUserLabels 安全网]');

{
  // item 缺失 userLabel，ensureUserLabels 应补齐
  const input = makeInput(
    [makeFile('a.png', 'image/png')],
    { 'a.png': '身份证' },
  );
  const items = [{ fileName: 'a.png', confidence: 'high' as const }];
  const ensured = ensureUserLabels(items, input);
  assert(
    ensured[0].userLabel === '身份证',
    'item 缺失 userLabel 时 ensureUserLabels 补齐',
  );
}

{
  // item 已有 userLabel 且一致，不变
  const input = makeInput(
    [makeFile('a.png', 'image/png')],
    { 'a.png': '身份证' },
  );
  const items = [
    { fileName: 'a.png', userLabel: '身份证', confidence: 'high' as const },
  ];
  const ensured = ensureUserLabels(items, input);
  assert(ensured[0].userLabel === '身份证', 'item 已有 userLabel 时不被改写');
}

{
  // 无 userLabels 时 ensureUserLabels 原样返回
  const input = makeInput([makeFile('a.png', 'image/png')]);
  const items = [{ fileName: 'a.png', confidence: 'high' as const }];
  const ensured = ensureUserLabels(items, input);
  assert(
    ensured[0].userLabel === undefined,
    '无 userLabels 时 ensureUserLabels 不强加 userLabel',
  );
}

{
  // 文件名不匹配时不强加
  const input = makeInput(
    [makeFile('a.png', 'image/png')],
    { 'other.png': '身份证' },
  );
  const items = [{ fileName: 'a.png', confidence: 'high' as const }];
  const ensured = ensureUserLabels(items, input);
  assert(
    ensured[0].userLabel === undefined,
    '文件名不匹配时 ensureUserLabels 不强加 userLabel',
  );
}

// ====== 5. identifyMaterials skipped 路径（无 API Key）保留 userLabel ======
console.log('\n[identifyMaterials skipped 路径 userLabel 保留]');

async function testSkippedPath() {
  // 临时清除 API Key，触发 skipped 路径
  // 必须同时清除 ARK 环境变量，否则 validateArkConfig 仍可能基于残留值判断
  const savedKey = process.env.DEEPSEEK_API_KEY;
  const savedModel = process.env.DEEPSEEK_MODEL;
  const savedArkKey = process.env.ARK_API_KEY;
  const savedArkModel = process.env.ARK_MODEL;
  const savedArkBaseUrl = process.env.ARK_BASE_URL;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_MODEL;
  delete process.env.ARK_API_KEY;
  delete process.env.ARK_MODEL;
  delete process.env.ARK_BASE_URL;

  try {
    // PNG + userLabels
    const pngInput = makeInput(
      [makeFile('civicmate-test-id.png', 'image/png', 10)],
      { 'civicmate-test-id.png': '身份证' },
    );
    const pngReply = await identifyMaterials(pngInput);
    assert(pngReply.ok === true, 'PNG skipped 响应 ok=true');
    if (pngReply.ok) {
      assert(pngReply.aiStatus === 'skipped', 'PNG aiStatus=skipped');
      assert(
        pngReply.items.length === 1,
        'PNG skipped items 长度=1',
      );
      assert(
        pngReply.items[0].fileName === 'civicmate-test-id.png',
        'PNG fileName 正确',
      );
      assert(
        pngReply.items[0].userLabel === '身份证',
        `PNG skipped item.userLabel=身份证 (实际: ${pngReply.items[0].userLabel})`,
      );
    }

    // PDF + userLabels
    const pdfInput = makeInput(
      [makeFile('civicmate-test-residence.pdf', 'application/pdf', 10)],
      { 'civicmate-test-residence.pdf': '居住证明' },
    );
    const pdfReply = await identifyMaterials(pdfInput);
    assert(pdfReply.ok === true, 'PDF skipped 响应 ok=true');
    if (pdfReply.ok) {
      assert(
        pdfReply.items[0].userLabel === '居住证明',
        `PDF skipped item.userLabel=居住证明 (实际: ${pdfReply.items[0].userLabel})`,
      );
    }

    // 中文文件名
    const cnInput = makeInput(
      [makeFile('身份证正面.png', 'image/png', 10)],
      { '身份证正面.png': '身份证' },
    );
    const cnReply = await identifyMaterials(cnInput);
    if (cnReply.ok) {
      assert(
        cnReply.items[0].userLabel === '身份证',
        '中文文件名 skipped userLabel 保留',
      );
    }

    // 含空格文件名
    const spInput = makeInput(
      [makeFile('my id card.png', 'image/png', 10)],
      { 'my id card.png': '身份证' },
    );
    const spReply = await identifyMaterials(spInput);
    if (spReply.ok) {
      assert(
        spReply.items[0].userLabel === '身份证',
        '含空格文件名 skipped userLabel 保留',
      );
    }
  } finally {
    // 恢复环境变量
    if (savedKey !== undefined) process.env.DEEPSEEK_API_KEY = savedKey;
    if (savedModel !== undefined) process.env.DEEPSEEK_MODEL = savedModel;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    if (savedArkModel !== undefined) process.env.ARK_MODEL = savedArkModel;
    if (savedArkBaseUrl !== undefined) process.env.ARK_BASE_URL = savedArkBaseUrl;
  }
}

await testSkippedPath();

// ====== 汇总 ======
console.log('\n========== identify-selfcheck 汇总 ==========');
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  console.error('❌ identify-selfcheck 失败：userLabel 保留存在问题。');
  process.exit(1);
} else {
  console.log('✅ identify-selfcheck 通过：userLabel 在所有路径均正确保留。');
}
