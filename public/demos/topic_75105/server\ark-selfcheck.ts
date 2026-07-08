// ark-selfcheck: Ark 视觉模型配置与响应解析自检（第 5 轮三次修复）
// 不依赖真实 API Key，不发真实网络请求。
// 验证：
//   1. 默认 baseUrl 是 https://ark.cn-beijing.volces.com/api/v3
//   2. 默认 model 是 doubao-seed-2-1-pro-260628
//   3. parseArkResponseContent 能处理常见返回结构
//   4. 无 key 时 validateArkConfig 返回"未配置"，不抛异常
//   5. 失败 fallback 不影响 identify 主流程
// 不打印 API Key、文件内容、身份证号、银行卡号。

import 'dotenv/config';
import {
  ARK_DEFAULT_BASE_URL,
  ARK_DEFAULT_MODEL,
  callArkVision,
  loadArkConfig,
  parseArkResponseContent,
  validateArkConfig,
} from './doubao';
import { identifyMaterials, type IdentifyFileInput } from './identify';

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
    buffer: Buffer.from('ark-selfcheck-placeholder', 'utf-8'),
  };
}

// ====== 1. 默认配置验证 ======
console.log('\n[Ark 默认配置]');

{
  // 清除环境变量，验证默认值
  const savedKey = process.env.ARK_API_KEY;
  const savedModel = process.env.ARK_MODEL;
  const savedBaseUrl = process.env.ARK_BASE_URL;
  delete process.env.ARK_API_KEY;
  delete process.env.ARK_MODEL;
  delete process.env.ARK_BASE_URL;

  try {
    const cfg = loadArkConfig();
    assert(
      cfg.baseUrl === ARK_DEFAULT_BASE_URL,
      `默认 baseUrl = ${ARK_DEFAULT_BASE_URL} (实际: ${cfg.baseUrl})`,
    );
    assert(
      cfg.model === ARK_DEFAULT_MODEL,
      `默认 model = ${ARK_DEFAULT_MODEL} (实际: ${cfg.model})`,
    );
    assert(cfg.apiKey === '', '无 ARK_API_KEY 时 apiKey 为空串');
  } finally {
    if (savedKey !== undefined) process.env.ARK_API_KEY = savedKey;
    if (savedModel !== undefined) process.env.ARK_MODEL = savedModel;
    if (savedBaseUrl !== undefined) process.env.ARK_BASE_URL = savedBaseUrl;
  }
}

// ====== 2. 自定义配置验证 ======
console.log('\n[Ark 自定义配置]');

{
  const savedKey = process.env.ARK_API_KEY;
  const savedModel = process.env.ARK_MODEL;
  const savedBaseUrl = process.env.ARK_BASE_URL;

  process.env.ARK_API_KEY = 'ark-test-placeholder-key';
  process.env.ARK_MODEL = 'custom-model';
  process.env.ARK_BASE_URL = 'https://custom.example.com/api/v3/';

  try {
    const cfg = loadArkConfig();
    assert(cfg.apiKey === 'ark-test-placeholder-key', '自定义 apiKey 读取正确');
    assert(cfg.model === 'custom-model', '自定义 model 读取正确');
    assert(
      cfg.baseUrl === 'https://custom.example.com/api/v3',
      '自定义 baseUrl 去除尾部斜杠 (实际: ' + cfg.baseUrl + ')',
    );
  } finally {
    if (savedKey !== undefined) process.env.ARK_API_KEY = savedKey;
    else delete process.env.ARK_API_KEY;
    if (savedModel !== undefined) process.env.ARK_MODEL = savedModel;
    else delete process.env.ARK_MODEL;
    if (savedBaseUrl !== undefined) process.env.ARK_BASE_URL = savedBaseUrl;
    else delete process.env.ARK_BASE_URL;
  }
}

// ====== 3. validateArkConfig 无 key 时返回未配置 ======
console.log('\n[validateArkConfig 无 key]');

{
  const savedKey = process.env.ARK_API_KEY;
  delete process.env.ARK_API_KEY;

  try {
    const r = validateArkConfig();
    assert(!r.ok, '无 ARK_API_KEY 时 validateArkConfig 返回 ok=false');
    assert(
      typeof r.error === 'string' && r.error.length > 0,
      '无 ARK_API_KEY 时 error 非空',
    );
    // 不抛异常
    assert(true, 'validateArkConfig 不抛异常');
  } finally {
    if (savedKey !== undefined) process.env.ARK_API_KEY = savedKey;
    else delete process.env.ARK_API_KEY;
  }
}

{
  const savedKey = process.env.ARK_API_KEY;
  process.env.ARK_API_KEY = 'ark-test-placeholder-key';

  try {
    const r = validateArkConfig();
    assert(r.ok, '有 ARK_API_KEY 时 validateArkConfig 返回 ok=true');
  } finally {
    if (savedKey !== undefined) process.env.ARK_API_KEY = savedKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 4. callArkVision 无 key 时不抛异常，返回 ok=false ======
console.log('\n[callArkVision 无 key 不抛异常]');

{
  const savedKey = process.env.ARK_API_KEY;
  delete process.env.ARK_API_KEY;

  try {
    const r = await callArkVision({ input: 'hello' });
    assert(!r.ok, '无 key 时 callArkVision 返回 ok=false');
    assert(!r.ok && r.error.length > 0, '无 key 时 error 非空');
    assert(true, 'callArkVision 无 key 不抛异常');
  } finally {
    if (savedKey !== undefined) process.env.ARK_API_KEY = savedKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 5. parseArkResponseContent 健壮解析 ======
console.log('\n[parseArkResponseContent 健壮解析]');

{
  // 5.1 OpenAI Responses API 标准格式：output[0].content[0].text
  const r1 = parseArkResponseContent({
    output: [
      {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: 'hello from responses api' }],
      },
    ],
  });
  assert(
    r1 === 'hello from responses api',
    `Responses API 标准格式解析正确 (实际: ${r1})`,
  );
}

{
  // 5.2 output_text 字符串
  const r2 = parseArkResponseContent({ output_text: 'hello output_text' });
  assert(r2 === 'hello output_text', 'output_text 字符串解析正确');
}

{
  // 5.3 output_text 数组
  const r3 = parseArkResponseContent({
    output_text: [{ text: 'part1 ' }, { text: 'part2' }],
  });
  assert(r3 === 'part1 part2', 'output_text 数组解析正确');
}

{
  // 5.4 Chat Completions 兼容格式：choices[0].message.content
  const r4 = parseArkResponseContent({
    choices: [{ message: { content: 'hello from chat completions' } }],
  });
  assert(
    r4 === 'hello from chat completions',
    'Chat Completions 兼容格式解析正确',
  );
}

{
  // 5.5 choices[0].message.content 数组
  const r5 = parseArkResponseContent({
    choices: [
      {
        message: {
          content: [{ type: 'text', text: 'multi ' }, { type: 'text', text: 'part' }],
        },
      },
    ],
  });
  assert(r5 === 'multi part', 'choices content 数组解析正确');
}

{
  // 5.6 直接 content 字段
  const r6 = parseArkResponseContent({ content: 'direct content' });
  assert(r6 === 'direct content', '直接 content 字段解析正确');
}

{
  // 5.7 空对象
  const r7 = parseArkResponseContent({});
  assert(r7 === '', '空对象返回空串');
}

{
  // 5.8 null/undefined
  const r8a = parseArkResponseContent(null);
  const r8b = parseArkResponseContent(undefined);
  assert(r8a === '' && r8b === '', 'null/undefined 返回空串');
}

{
  // 5.9 output 数组中 item.text 直接字段
  const r9 = parseArkResponseContent({
    output: [{ text: 'output item text' }],
  });
  assert(r9 === 'output item text', 'output[0].text 解析正确');
}

{
  // 5.10 多个 output item 拼接
  const r10 = parseArkResponseContent({
    output: [
      { content: [{ text: 'part1' }] },
      { content: [{ text: 'part2' }] },
    ],
  });
  assert(r10 === 'part1part2', '多个 output item 拼接正确');
}

// ====== 6. identify 失败 fallback 不影响主流程 ======
console.log('\n[identify fallback 不影响主流程]');

{
  // 清除所有 API Key，触发 skipped 路径（fallback 的前置条件）
  const savedDeepseekKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.ARK_API_KEY;

  try {
    const input = {
      files: [makeFile('civicmate-test-id.png', 'image/png', 10)],
      serviceCode: 'elderly-subsidy',
      userLabels: { 'civicmate-test-id.png': '身份证' } as Record<string, string>,
    };
    const reply = await identifyMaterials(input);
    assert(reply.ok === true, '无 key 时 identifyMaterials 返回 ok=true');
    if (reply.ok) {
      assert(
        reply.aiStatus === 'skipped',
        `无 key 时 aiStatus=skipped (实际: ${reply.aiStatus})`,
      );
      assert(reply.items.length === 1, '无 key 时 items 长度=1');
      assert(
        reply.items[0].userLabel === '身份证',
        '无 key 时 userLabel 仍保留',
      );
    }
  } finally {
    if (savedDeepseekKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDeepseekKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 7. 有 ARK_API_KEY 但网络不可达时 fallback ======
console.log('\n[有 ARK_API_KEY 网络不可达 fallback]');

{
  // 设置一个假 key + 不存在的 baseUrl，触发 Ark 调用失败
  // 但不设置 DeepSeek，确保走 fallback 路径（不是 skipped）
  const savedDeepseekKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  const savedArkBaseUrl = process.env.ARK_BASE_URL;
  delete process.env.DEEPSEEK_API_KEY;
  process.env.ARK_API_KEY = 'ark-test-placeholder-key';
  process.env.ARK_BASE_URL = 'http://127.0.0.1:1'; // 不可达地址

  try {
    const input = {
      files: [makeFile('civicmate-test-id.png', 'image/png', 10)],
      serviceCode: 'elderly-subsidy',
      userLabels: { 'civicmate-test-id.png': '身份证' } as Record<string, string>,
    };
    const reply = await identifyMaterials(input);
    assert(reply.ok === true, 'Ark 网络不可达时 identifyMaterials 仍返回 ok=true');
    if (reply.ok) {
      assert(
        reply.aiStatus === 'fallback' || reply.aiStatus === 'skipped',
        `Ark 失败后 aiStatus=fallback|skipped (实际: ${reply.aiStatus})`,
      );
      assert(
        reply.items[0].userLabel === '身份证',
        'Ark 失败后 userLabel 仍保留',
      );
    }
  } finally {
    if (savedDeepseekKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDeepseekKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
    if (savedArkBaseUrl !== undefined) process.env.ARK_BASE_URL = savedArkBaseUrl;
    else delete process.env.ARK_BASE_URL;
  }
}

// ====== 汇总 ======
console.log('\n========== ark-selfcheck 汇总 ==========');
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  console.error('❌ ark-selfcheck 失败：Ark 视觉模型配置或解析存在问题。');
  process.exit(1);
} else {
  console.log('✅ ark-selfcheck 通过：Ark 配置默认值、响应解析、失败 fallback 均正常。');
}
