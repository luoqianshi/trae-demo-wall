/**
 * 离线预生成脚本 v2 - 三维题库 (主题 × 本领 × 难度)
 *
 * 功能：按 8主题 × 4本领 × 3难度 × 5题 = 480 道 的矩阵生成
 * 特性：断点续传、指数退避限流、逐条校验
 * 用法：npm run pregen
 *       npm run pregen -- --theme=地铁    # 只生成某个主题
 *       npm run pregen -- --skill=看懂心情 # 只生成某个本领
 *       npm run pregen -- --dry-run      # 只检查进度，不生成
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================
// 配置
// ============================================================

const THEMES = ['地铁', '恐龙', '乐高', '海洋', '太空', '汽车', '动物', '公园'];
const SKILLS = ['看懂心情', '轮流玩', '看懂表情和动作', '遇到不开心的时候'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SCENARIOS_PER_COMBO = 5;

const DIFFICULTY_LABELS = {
  easy: '轻松（情景直接，社交线索明显，人物只做一个动作）',
  medium: '中等（情景稍复杂，人物有情绪变化，需要观察表情）',
  hard: '挑战（情景复杂，人物多，需要读懂微妙的语气和表情）',
};

const THEME_ICONS = {
  '地铁': '🚇',
  '恐龙': '🦕',
  '乐高': '🧱',
  '海洋': '🌊',
  '太空': '🚀',
  '汽车': '🚗',
  '动物': '🐾',
  '公园': '🌳',
};

const MAX_RETRIES = 3;
const TIMEOUT_MS = 45000;
const BASE_DELAY_MS = 800;
const MAX_DELAY_MS = 15000;

// ============================================================
// 环境变量加载
// ============================================================

function loadEnv() {
  try {
    const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    try {
      const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env.local');
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // 静默忽略
    }
  }
}

// ============================================================
// 参数解析
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { theme: null, skill: null, difficulty: null, dryRun: false };
  for (const arg of args) {
    if (arg.startsWith('--theme=')) opts.theme = arg.slice(8);
    else if (arg.startsWith('--skill=')) opts.skill = arg.slice(8);
    else if (arg.startsWith('--difficulty=')) opts.difficulty = arg.slice(13);
    else if (arg === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

// ============================================================
// ARK API 调用
// ============================================================

async function callArk(interest, skill, difficulty) {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error('请设置 ARK_API_KEY 环境变量');
  }

  const model = process.env.ARK_MODEL || 'doubao-seed-2-0-mini-260428';
  const difficultyDesc = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.medium;
  const expectedIcon = THEME_ICONS[interest] || '🎯';

  const systemPrompt = `你是一位专门为孤独症谱系（阿斯伯格）儿童设计社交训练的特教老师，精通"社交故事（Social Stories）"方法。
你的任务是：为一个约7–8岁、痴迷于某个特定兴趣的孩子，生成一道社交情景练习题。

【输出格式】严格只输出 JSON。输出的 JSON 必须包含以下 7 个字段，一个都不能少：

{
  "scene": "2-3句话，描述与孩子兴趣相关的具体情景，要有其他人物，有明确的社交线索。",
  "question": "这时候你会怎么做？",
  "sceneIcon": "${expectedIcon}",
  "options": [
    {"text": "选项A的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": true,"feedback": "温暖鼓励的反馈，2-3句口语"},
    {"text": "选项B的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": false,"feedback": "温暖鼓励的反馈"},
    {"text": "选项C的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": false,"feedback": "温暖鼓励的反馈"}
  ],
  "skillTag": "${skill}",
  "socialRule": "8-18个字的完整句子，以句号结尾。",
  "parentTip": "一句话，告诉家长在家怎么练这个技能。"
}

【严格要求】
- sceneIcon 必须是 ${expectedIcon}（与主题「${interest}」对应）
- skillTag 必须是「${skill}」
- options 必须是长度为 3 的对象数组，每个对象有 text/icon/isRecommended/feedback 四个字段
- 恰好有 1 个 isRecommended=true
- icon 是单个 emoji
- 所有字段必须同时存在
- 只输出一个 JSON 对象，不要任何额外文字

只输出 JSON。`;

  const userPrompt = `孩子的特殊兴趣：${interest}
训练本领：${skill}
难度：${difficultyDesc}

请生成一道高质量的社交情景练习题。
注意：场景必须围绕「${interest}」展开，人物和事件都要与${interest}相关。
反馈必须温暖、具体、指向一个可操作的小动作。
只输出 JSON。`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
        ],
        store: false,
        max_output_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error(`API请求失败: ${status}`);
    }

    const data = await response.json();

    let text = '';
    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text) {
              text += c.text;
            }
          }
        }
      }
    }

    if (!text) {
      throw new Error('API 返回内容为空');
    }

    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw err;
  }
}

// ============================================================
// JSON 解析
// ============================================================

function extractJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ============================================================
// 完整性与主题一致性校验
// ============================================================

function validateScenario(scenario, theme, skill) {
  const errors = [];

  const requiredFields = ['scene', 'question', 'sceneIcon', 'options', 'skillTag', 'socialRule', 'parentTip'];
  for (const field of requiredFields) {
    if (!scenario[field]) {
      errors.push(`缺少字段: ${field}`);
    }
  }

  if (scenario.scene && scenario.scene.length < 10) {
    errors.push('scene 太短');
  }

  // sceneIcon 必须匹配主题
  const expectedIcon = THEME_ICONS[theme];
  if (expectedIcon && scenario.sceneIcon !== expectedIcon) {
    errors.push(`sceneIcon 不匹配: 期望 ${expectedIcon}, 实际 ${scenario.sceneIcon}`);
  }

  // skillTag 必须匹配
  if (scenario.skillTag !== skill) {
    errors.push(`skillTag 不匹配: 期望 ${skill}, 实际 ${scenario.skillTag}`);
  }

  if (!Array.isArray(scenario.options) || scenario.options.length !== 3) {
    errors.push('options 必须是长度为 3 的数组');
  } else {
    for (let i = 0; i < scenario.options.length; i++) {
      const opt = scenario.options[i];
      if (!opt.text) errors.push(`选项 ${i + 1} 缺少 text`);
      if (!opt.icon) errors.push(`选项 ${i + 1} 缺少 icon`);
      if (typeof opt.isRecommended !== 'boolean') errors.push(`选项 ${i + 1} isRecommended 必须是布尔值`);
      if (!opt.feedback) errors.push(`选项 ${i + 1} 缺少 feedback`);
    }
    const recommendedCount = scenario.options.filter(o => o.isRecommended === true).length;
    if (recommendedCount !== 1) {
      errors.push(`isRecommended=true 的选项数量应为 1，实际为 ${recommendedCount}`);
    }
  }

  if (scenario.socialRule) {
    if (!scenario.socialRule.endsWith('。') && !scenario.socialRule.endsWith('.')) {
      errors.push('socialRule 必须以句号结尾');
    }
    if (scenario.socialRule.length < 8 || scenario.socialRule.length > 30) {
      errors.push(`socialRule 长度应在 8-30 之间，当前为 ${scenario.socialRule.length}`);
    }
  }

  // 主题一致性：场景描述中必须包含主题相关关键词
  if (scenario.scene && theme) {
    const sceneLower = scenario.scene.toLowerCase();
    const themeLower = theme.toLowerCase();
    // 用 sceneIcon 已经校验过了，这里再加一道文字校验
    if (!sceneLower.includes(themeLower) && theme !== '公园') {
      // 公园可能用"游乐场""公园"等词，放宽一点
      const altNames = {
        '公园': ['公园', '游乐场', '游乐园', '广场', '草坪'],
        '动物': ['动物', '小猫', '小狗', '兔子', '熊猫', '老虎', '狮子'],
        '汽车': ['汽车', '小车', '车子', '赛车', '公交车', '卡车'],
      };
      const alts = altNames[theme] || [];
      const hasAlt = alts.some(a => sceneLower.includes(a.toLowerCase()));
      if (!hasAlt) {
        errors.push(`场景描述与主题「${theme}」不一致`);
      }
    }
  }

  return errors;
}

// ============================================================
// 退避延时
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBackoffDelay(retryCount) {
  const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_DELAY_MS);
}

// ============================================================
// 数据读写
// ============================================================

function getDataPath() {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'scenarios.json');
}

function loadExistingData() {
  const path = getDataPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveData(data) {
  const outputDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf-8');
}

// 初始化三维数据结构
function initDataStructure() {
  const data = {
    version: new Date().toISOString().slice(0, 10),
    themes: THEMES,
    skills: SKILLS,
    difficulties: DIFFICULTIES,
    scenariosPerCombo: SCENARIOS_PER_COMBO,
    totalScenarios: 0,
    data: {},
  };

  for (const theme of THEMES) {
    data.data[theme] = {};
    for (const skill of SKILLS) {
      data.data[theme][skill] = {};
      for (const diff of DIFFICULTIES) {
        data.data[theme][skill][diff] = [];
      }
    }
  }

  return data;
}

// 合并已有数据到新结构
function mergeExistingData(newData, existing) {
  if (!existing || !existing.data) return newData;

  let total = 0;
  for (const theme of THEMES) {
    for (const skill of SKILLS) {
      for (const diff of DIFFICULTIES) {
        const arr = existing.data?.[theme]?.[skill]?.[diff];
        if (Array.isArray(arr)) {
          // 只保留有效条目
          const valid = arr.filter(s => s && s.scene && s.scene.length > 10);
          newData.data[theme][skill][diff] = valid.slice(0, SCENARIOS_PER_COMBO);
        }
        total += newData.data[theme][skill][diff].length;
      }
    }
  }
  newData.totalScenarios = total;
  return newData;
}

function countProgress(data) {
  let total = 0;
  let done = 0;
  const breakdown = {};

  for (const theme of THEMES) {
    breakdown[theme] = 0;
    for (const skill of SKILLS) {
      for (const diff of DIFFICULTIES) {
        total += SCENARIOS_PER_COMBO;
        const count = data.data[theme]?.[skill]?.[diff]?.length || 0;
        done += count;
        breakdown[theme] += count;
      }
    }
  }

  return { total, done, percent: ((done / total) * 100).toFixed(1), breakdown };
}

// ============================================================
// 生成单个组合
// ============================================================

async function generateCombo(theme, skill, difficulty, existingScenarios, data) {
  const needed = SCENARIOS_PER_COMBO - existingScenarios.length;
  if (needed <= 0) return { generated: 0, failed: 0 };

  const currentList = [...existingScenarios];
  let generated = 0;
  let failed = 0;
  let rateLimitRetry = 0;

  for (let i = 0; i < needed; i++) {
    const idx = currentList.length;
    process.stdout.write(`    题 ${idx + 1}/${SCENARIOS_PER_COMBO}... `);

    let success = false;

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const raw = await callArk(theme, skill, difficulty);
        const parsed = extractJSON(raw);

        if (!parsed) {
          if (retry < MAX_RETRIES) {
            process.stdout.write('JSON失败,重');
            await sleep(getBackoffDelay(retry));
            continue;
          }
          throw new Error('JSON 解析失败');
        }

        const errors = validateScenario(parsed, theme, skill);
        if (errors.length > 0) {
          if (retry < MAX_RETRIES) {
            process.stdout.write('校验失败,重');
            await sleep(getBackoffDelay(retry));
            continue;
          }
          throw new Error(`校验失败: ${errors[0]}`);
        }

        // 去重：和当前列表对比场景描述
        const isDuplicate = currentList.some(s => s.scene === parsed.scene);
        if (isDuplicate) {
          if (retry < MAX_RETRIES) {
            process.stdout.write('重复,重');
            await sleep(getBackoffDelay(retry));
            continue;
          }
          throw new Error('与已有题目重复');
        }

        currentList.push(parsed);
        generated++;
        success = true;
        rateLimitRetry = 0;
        console.log('✅');
        break;

      } catch (err) {
        if (err.message === 'RATE_LIMITED') {
          rateLimitRetry++;
          const delay = getBackoffDelay(rateLimitRetry + 2);
          process.stdout.write(`限流(${rateLimitRetry}),等${(delay/1000).toFixed(0)}s `);
          await sleep(delay);
          i--; // 重试这道题
          break;
        }

        if (retry < MAX_RETRIES) {
          process.stdout.write(`${err.message.slice(0, 8)},重`);
          await sleep(getBackoffDelay(retry));
          continue;
        }
        console.log(`❌ ${err.message.slice(0, 20)}`);
        failed++;
        break;
      }
    }

    // 保存进度（每生成一道存一次，防止中断丢失）
    if (success) {
      data.data[theme][skill][difficulty] = currentList;
      data.totalScenarios = Object.values(data.data).reduce((sum, t) =>
        sum + Object.values(t).reduce((s2, sk) =>
          s2 + Object.values(sk).reduce((s3, arr) => s3 + arr.length, 0), 0), 0);
      saveData(data);
    }

    // 题间延时，避免限流
    if (i < needed - 1 && success) {
      await sleep(BASE_DELAY_MS);
    }
  }

  return { generated, failed };
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  const opts = parseArgs();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  星钥 StarKey - 三维题库预生成 v2');
  console.log('═══════════════════════════════════════════════════════\n');

  loadEnv();

  if (!process.env.ARK_API_KEY && !opts.dryRun) {
    console.error('❌ 错误：请在 .env.local 中设置 ARK_API_KEY');
    process.exit(1);
  }

  const filterThemes = opts.theme ? [opts.theme] : THEMES;
  const filterSkills = opts.skill ? [opts.skill] : SKILLS;
  const filterDiffs = opts.difficulty ? [opts.difficulty] : DIFFICULTIES;

  // 校验过滤器
  for (const t of filterThemes) {
    if (!THEMES.includes(t)) {
      console.error(`❌ 未知主题: ${t}`);
      console.error(`   可用: ${THEMES.join('、')}`);
      process.exit(1);
    }
  }
  for (const s of filterSkills) {
    if (!SKILLS.includes(s)) {
      console.error(`❌ 未知本领: ${s}`);
      console.error(`   可用: ${SKILLS.join('、')}`);
      process.exit(1);
    }
  }
  for (const d of filterDiffs) {
    if (!DIFFICULTIES.includes(d)) {
      console.error(`❌ 未知难度: ${d}`);
      console.error(`   可用: ${DIFFICULTIES.join('、')}`);
      process.exit(1);
    }
  }

  console.log(`📦 主题: ${filterThemes.join('、')}`);
  console.log(`🎯 本领: ${filterSkills.join('、')}`);
  console.log(`📊 难度: ${filterDiffs.join('、')}`);
  console.log(`📝 每组合: ${SCENARIOS_PER_COMBO} 题`);
  console.log(`🎯 目标: ${filterThemes.length * filterSkills.length * filterDiffs.length * SCENARIOS_PER_COMBO} 题\n`);

  // 加载已有数据
  let data = initDataStructure();
  const existing = loadExistingData();
  if (existing) {
    data = mergeExistingData(data, existing);
    console.log(`📂 已加载现有数据: ${data.totalScenarios} 题`);
  }

  const progress = countProgress(data);
  console.log(`📈 总体进度: ${progress.done}/${progress.total} (${progress.percent}%)\n`);

  if (opts.dryRun) {
    console.log('🏁 dry-run 模式，不生成新题。\n');
    for (const theme of filterThemes) {
      const count = progress.breakdown[theme] || 0;
      const total = filterSkills.length * filterDiffs.length * SCENARIOS_PER_COMBO;
      console.log(`  ${THEME_ICONS[theme] || '📦'} ${theme}: ${count}/${total}`);
    }
    console.log();
    return;
  }

  console.log('───────────────────────────────────────────────────────\n');

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const theme of filterThemes) {
    console.log(`${THEME_ICONS[theme] || '📦'} 主题「${theme}」`);

    for (const skill of filterSkills) {
      console.log(`  🎯 本领「${skill}」`);

      for (const diff of filterDiffs) {
        const current = data.data[theme][skill][diff] || [];
        const needed = SCENARIOS_PER_COMBO - current.length;

        if (needed <= 0) {
          console.log(`    ${diff}: ${current.length}/${SCENARIOS_PER_COMBO} ✅`);
          continue;
        }

        console.log(`    📊 ${diff}: ${current.length}/${SCENARIOS_PER_COMBO}（需生成 ${needed} 道）`);

        const result = await generateCombo(theme, skill, diff, current, data);
        totalGenerated += result.generated;
        totalFailed += result.failed;

        if (result.failed > 0) {
          console.log(`      ↳ 新增 ${result.generated} 道, 失败 ${result.failed} 道`);
        }
      }

      // 本领间稍作停顿
      await sleep(500);
    }

    // 主题间停顿
    await sleep(1000);
    console.log();
  }

  // ============================================================
  // 最终汇总
  // ============================================================

  const finalProgress = countProgress(data);

  console.log('───────────────────────────────────────────────────────');
  console.log('  📊 生成汇总');
  console.log('───────────────────────────────────────────────────────');
  console.log(`  总进度: ${finalProgress.done}/${finalProgress.total} (${finalProgress.percent}%)`);
  console.log(`  本次新增: ${totalGenerated} 道`);
  console.log(`  本次失败: ${totalFailed} 道`);
  console.log();

  for (const theme of filterThemes) {
    const count = finalProgress.breakdown[theme] || 0;
    const total = filterSkills.length * filterDiffs.length * SCENARIOS_PER_COMBO;
    const icon = count >= total ? '✅' : count > 0 ? '⚠️' : '❌';
    console.log(`  ${icon} ${theme}: ${count}/${total}`);
  }

  console.log(`\n  💾 已保存: app/data/scenarios.json`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (totalFailed > 0) {
    console.log(`💡 有 ${totalFailed} 道生成失败，可再次运行脚本补生成（会自动跳过已完成的）。\n`);
  }
}

main().catch(err => {
  console.error('\n❌ 脚本执行失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});
