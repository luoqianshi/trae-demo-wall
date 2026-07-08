// ai-status-selfcheck: AI 配置状态接口自检（第 6 轮收尾）
// 不发真实网络请求，不依赖真实 API Key。
// 临时设置/清除环境变量，验证 buildAiStatusResponse 的状态结构与敏感字段隔离。
// 不打印 API Key、请求头、完整响应原文。

import 'dotenv/config';
import { buildAiStatusResponse } from './ai-status';
import { ARK_DEFAULT_BASE_URL, ARK_DEFAULT_MODEL } from './doubao';

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

/** 递归收集对象所有键（小写） */
function collectKeys(obj: unknown, out = new Set<string>()): Set<string> {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out.add(k.toLowerCase());
      collectKeys(v, out);
    }
  }
  return out;
}

/** 敏感字段黑名单 */
const SENSITIVE_KEYS = [
  'apikey',
  'key',
  'secret',
  'authorization',
  'bearer',
  'api_key',
];

/** 递归收集对象所有字符串值 */
function collectStringValues(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === 'string') {
    out.push(obj);
  } else if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      collectStringValues(v, out);
    }
  }
  return out;
}

// ====== 1. 无 key 时 configured=false ======
console.log('\n[无 key 时 configured=false]');

{
  const savedDsKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.ARK_API_KEY;

  try {
    const r = buildAiStatusResponse();
    assert(r.ok === true, '响应 ok=true');
    assert(r.deepseek.configured === false, '无 DEEPSEEK_API_KEY 时 deepseek.configured=false');
    assert(r.ark.configured === false, '无 ARK_API_KEY 时 ark.configured=false');
    assert(typeof r.deepseek.model === 'string', 'deepseek.model 是字符串');
    assert(typeof r.ark.model === 'string', 'ark.model 是字符串');
    assert(typeof r.ark.baseUrl === 'string', 'ark.baseUrl 是字符串');
  } finally {
    if (savedDsKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDsKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 2. 有 key 时 configured=true ======
console.log('\n[有 key 时 configured=true]');

{
  const savedDsKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  process.env.DEEPSEEK_API_KEY = 'ai-status-selfcheck-deepseek-placeholder';
  process.env.ARK_API_KEY = 'ai-status-selfcheck-ark-placeholder';

  try {
    const r = buildAiStatusResponse();
    assert(r.deepseek.configured === true, '有 DEEPSEEK_API_KEY 时 deepseek.configured=true');
    assert(r.ark.configured === true, '有 ARK_API_KEY 时 ark.configured=true');
  } finally {
    if (savedDsKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDsKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 3. 默认 model/baseUrl ======
console.log('\n[默认 model/baseUrl]');

{
  const savedDsKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  const savedArkModel = process.env.ARK_MODEL;
  const savedArkBaseUrl = process.env.ARK_BASE_URL;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.ARK_API_KEY;
  delete process.env.ARK_MODEL;
  delete process.env.ARK_BASE_URL;

  try {
    const r = buildAiStatusResponse();
    assert(
      r.ark.model === ARK_DEFAULT_MODEL,
      `ark.model 默认 = ${ARK_DEFAULT_MODEL} (实际: ${r.ark.model})`,
    );
    assert(
      r.ark.baseUrl === ARK_DEFAULT_BASE_URL,
      `ark.baseUrl 默认 = ${ARK_DEFAULT_BASE_URL} (实际: ${r.ark.baseUrl})`,
    );
  } finally {
    if (savedDsKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDsKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
    if (savedArkModel !== undefined) process.env.ARK_MODEL = savedArkModel;
    else delete process.env.ARK_MODEL;
    if (savedArkBaseUrl !== undefined) process.env.ARK_BASE_URL = savedArkBaseUrl;
    else delete process.env.ARK_BASE_URL;
  }
}

// ====== 4. 响应字段只包含允许的字段 ======
console.log('\n[响应字段白名单]');

{
  const r = buildAiStatusResponse();
  const keys = collectKeys(r);
  const allowedKeys = new Set([
    'ok',
    'deepseek',
    'ark',
    'configured',
    'model',
    'baseurl',
  ]);
  const unexpected: string[] = [];
  for (const k of keys) {
    if (!allowedKeys.has(k)) unexpected.push(k);
  }
  assert(
    unexpected.length === 0,
    `响应不包含非白名单字段 (意外字段: ${unexpected.join(', ') || '无'})`,
  );
}

// ====== 5. 响应不含敏感字段名 ======
console.log('\n[响应不含敏感字段名]');

{
  const r = buildAiStatusResponse();
  const keys = collectKeys(r);
  const leaked: string[] = [];
  for (const sk of SENSITIVE_KEYS) {
    if (keys.has(sk)) leaked.push(sk);
  }
  assert(
    leaked.length === 0,
    `响应不含 apiKey/key/secret/authorization/bearer (泄露: ${leaked.join(', ') || '无'})`,
  );
}

// ====== 6. 响应字符串值不含 key 原始值 ======
console.log('\n[响应字符串值不含 key 原始值]');

{
  const testKey = 'ai-status-selfcheck-secret-marker-xyz';
  const savedDsKey = process.env.DEEPSEEK_API_KEY;
  const savedArkKey = process.env.ARK_API_KEY;
  process.env.DEEPSEEK_API_KEY = testKey;
  process.env.ARK_API_KEY = testKey;

  try {
    const r = buildAiStatusResponse();
    const strs = collectStringValues(r);
    const leaked = strs.filter((s) => s.includes(testKey));
    assert(
      leaked.length === 0,
      `响应字符串值不含 key 原始值 (泄露条目: ${leaked.length})`,
    );
  } finally {
    if (savedDsKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDsKey;
    else delete process.env.DEEPSEEK_API_KEY;
    if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
    else delete process.env.ARK_API_KEY;
  }
}

// ====== 7. 响应可序列化为 JSON（结构稳定） ======
console.log('\n[响应可序列化为 JSON]');

{
  const r = buildAiStatusResponse();
  let json: string;
  try {
    json = JSON.stringify(r);
    assert(true, 'buildAiStatusResponse 可 JSON.stringify');
  } catch (e) {
    json = '';
    assert(false, `JSON.stringify 失败: ${e instanceof Error ? e.message : String(e)}`);
  }
  assert(json.includes('"ok":true'), 'JSON 含 ok:true');
  assert(json.includes('"deepseek"'), 'JSON 含 deepseek');
  assert(json.includes('"ark"'), 'JSON 含 ark');
  assert(!json.includes('Bearer'), 'JSON 不含 Bearer');
  assert(!json.includes('Authorization'), 'JSON 不含 Authorization');
}

// ====== 汇总 ======
console.log('\n========== ai-status-selfcheck 汇总 ==========');
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  console.error('❌ ai-status-selfcheck 失败：AI 状态接口存在敏感字段泄露或结构问题。');
  process.exit(1);
} else {
  console.log('✅ ai-status-selfcheck 通过：AI 状态接口结构正确，未暴露 key。');
}
