// live-ai-smoke: 真实 AI 联调冒烟测试（第 6 轮）
// 默认不执行真实联网调用，除非设置环境变量 LIVE_AI_SMOKE=1。
// 用法：
//   npm run live-ai-smoke                      # 跳过，以 0 退出
//   $env:LIVE_AI_SMOKE="1"; npm run live-ai-smoke  # 真实联网调用
//
// 安全要求：
// - 不输出请求头、Authorization、API Key、完整响应原文
// - 只输出：调用是否成功、HTTP 状态或错误摘要、模型名、响应文本前 80 字非敏感摘要
// - 使用无敏感模拟文本，不读取/上传真实材料
// - 失败时输出错误摘要，不阻断脚本（各步骤独立）

import 'dotenv/config';
import { callDeepSeek, loadDeepSeekConfig, validateDeepSeekConfig } from './deepseek';
import { callArkVision, loadArkConfig, validateArkConfig } from './doubao';

/** 截取前 N 字符作为非敏感摘要（去除换行，避免泄露长文本） */
function summarize(text: string, max = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max) + '…';
}

/** 单步结果 */
interface StepResult {
  name: string;
  ok: boolean;
  model?: string;
  summary: string;
}

function printResult(r: StepResult): void {
  const tag = r.ok ? '✓' : '✗';
  const modelLine = r.model ? ` [model=${r.model}]` : '';
  console.log(`  ${tag} ${r.name}${modelLine} — ${r.summary}`);
}

// ====== 主入口 ======
const enabled = process.env.LIVE_AI_SMOKE?.trim() === '1';

if (!enabled) {
  console.log('========== live-ai-smoke ==========');
  console.log('LIVE_AI_SMOKE 未设置为 1，跳过真实联网调用。');
  console.log('如需执行真实联调，请运行：');
  console.log('  PowerShell: $env:LIVE_AI_SMOKE="1"; npm run live-ai-smoke');
  console.log('默认跳过以保护安全和避免意外计费，以 0 退出。');
  console.log('====================================');
  process.exit(0);
}

console.log('========== live-ai-smoke（真实联网） ==========');
console.log('注意：仅输出调用结果摘要，不输出 API Key / 请求头 / 完整响应。\n');

const results: StepResult[] = [];

// ====== 1. DeepSeek 文本预审通路 ======
console.log('[1/2] DeepSeek 文本预审通路');
{
  const valid = validateDeepSeekConfig();
  if (!valid.ok) {
    results.push({
      name: 'DeepSeek 配置检查',
      ok: false,
      summary: '未配置 DEEPSEEK_API_KEY，跳过',
    });
    printResult(results[results.length - 1]);
  } else {
    const cfg = loadDeepSeekConfig();
    // 无敏感模拟政务材料文本
    const mockUserPrompt = `请基于以下模拟输入返回严格 JSON（仅用于联调测试，非真实材料）：
事项：老年补贴申请
地区：广东省广州市天河区
办理人：本人办理
年龄：70
已登记材料：身份证、银行卡
请输出 ready/missing/uncertain/plainChecklist/riskNotes/disclaimer。`;

    const dsRes = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content:
            '你是 CivicMate 办事材料准备助手（联调测试）。输出严格 JSON，不要 Markdown。',
        },
        { role: 'user', content: mockUserPrompt },
      ],
      temperature: 0.2,
    });

    if (dsRes.ok) {
      results.push({
        name: 'DeepSeek 调用',
        ok: true,
        model: dsRes.data.model,
        summary: `成功。摘要：${summarize(dsRes.data.content)}`,
      });
    } else {
      results.push({
        name: 'DeepSeek 调用',
        ok: false,
        model: cfg.model,
        summary: `失败：${summarize(dsRes.error, 120)}`,
      });
    }
    printResult(results[results.length - 1]);
  }
}

// ====== 2. Ark Responses API 通路（纯文本 input: "hello"） ======
console.log('\n[2/2] Ark Responses API 通路（纯文本 hello）');
{
  const valid = validateArkConfig();
  if (!valid.ok) {
    results.push({
      name: 'Ark 配置检查',
      ok: false,
      summary: '未配置 ARK_API_KEY，跳过',
    });
    printResult(results[results.length - 1]);
  } else {
    const cfg = loadArkConfig();
    const arkRes = await callArkVision({
      input: 'hello',
    });

    if (arkRes.ok) {
      results.push({
        name: 'Ark 调用',
        ok: true,
        model: arkRes.data.model,
        summary: `成功。摘要：${summarize(arkRes.data.content)}`,
      });
    } else {
      results.push({
        name: 'Ark 调用',
        ok: false,
        model: cfg.model,
        summary: `失败：${summarize(arkRes.error, 120)}`,
      });
    }
    printResult(results[results.length - 1]);
  }
}

// ====== 汇总 ======
console.log('\n========== live-ai-smoke 汇总 ==========');
const okCount = results.filter((r) => r.ok).length;
const failCount = results.length - okCount;
console.log(`通过: ${okCount}, 失败: ${failCount}`);
for (const r of results) {
  printResult(r);
}
console.log('说明：未输出 API Key、请求头、完整响应原文。');
console.log('图片视觉识别可选步骤未包含在本脚本（避免生成真实材料图片）。');
console.log('==========================================');

// 真实联调脚本：即使部分失败也以 0 退出，避免阻断 CI/演示
process.exit(0);
